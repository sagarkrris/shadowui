import { authenticateUser, consumeVerificationToken, createOpaqueToken, createPasswordResetToken, createSession, createUser, createVerificationToken, destroySession, getUserBySession, recordAudit, resetPassword, revokeAllSessions, rotateCsrfToken, verifyCsrfToken } from "../../lib/serverPersistence.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { deliverAuthEmail } from "../../lib/authDelivery.mjs";
import { recordMetric, reportServerError } from "../../lib/observability.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";

const COOKIE = "interviewiq_session";
const CSRF_COOKIE = "interviewiq_csrf";
const cookieOptions = "Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600";

function readCookie(req, name) {
  return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === name)?.[1] || "";
}

function validCredentials(body = {}, requireName = false) {
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const namesValid = !requireName || (firstName.length >= 1 && firstName.length <= 80 && lastName.length >= 1 && lastName.length <= 80);
  return namesValid && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && password.length >= 12 && password.length <= 128 ? { firstName, lastName, email, password } : null;
}

function csrfFromRequest(req) { return String(req.headers["x-csrf-token"] || ""); }
function csrfCookie(req) { return readCookie(req, CSRF_COOKIE); }
async function validCsrf(req) { return csrfFromRequest(req) && csrfFromRequest(req) === csrfCookie(req) && (await verifyCsrfToken(readCookie(req, COOKIE), csrfFromRequest(req)).catch(() => false) || !readCookie(req, COOKIE)); }
async function csrfDiagnostics(req) {
  const requestToken = csrfFromRequest(req);
  const cookieToken = csrfCookie(req);
  const sessionToken = readCookie(req, COOKIE);
  return {
    requestTokenPresent: Boolean(requestToken),
    cookieTokenPresent: Boolean(cookieToken),
    sessionPresent: Boolean(sessionToken),
    tokenMatchesCookie: Boolean(requestToken && cookieToken && requestToken === cookieToken),
    sessionTokenValid: Boolean(sessionToken && requestToken && await verifyCsrfToken(sessionToken, requestToken).catch(() => false)),
  };
}

async function sendAuthEmail({ type, user, token, req }) {
  try {
    const delivery = await deliverAuthEmail({ type, email: user.email, firstName: user.firstName, userId: user.id, token });
    recordMetric(delivery.delivered ? "auth.email_sent" : "auth.email_delivery_unavailable", { type, emailDomain: user.email.split("@")[1] });
    if (!delivery.delivered) await recordAudit({ type: "email_delivery_failed", userId: user.id, email: user.email, ip: getClientAddress(req), providerError: delivery.configured ? "not_delivered" : "not_configured" });
    return delivery;
  } catch (error) {
    recordMetric("auth.email_delivery_failed", { type, emailDomain: user.email.split("@")[1] });
    await recordAudit({ type: "email_delivery_failed", userId: user.id, email: user.email, ip: getClientAddress(req), providerError: error.message });
    return { delivered: false, configured: true, provider: "resend", error: true, errorCode: error.code || "provider_error" };
  }
}

async function handler(req, res) {
  const action = String(req.query.action || "me");
  const logger = createRequestLogger({ route: "/api/auth", requestId: req.requestId });
  const limit = await checkDistributedRateLimit(`auth:${getClientAddress(req)}`, { limit: 10 });
  res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
  if (!limit.ok) { recordMetric("auth.rate_limited", { route: "/api/auth" }); return res.status(429).json({ error: "Too many authentication requests. Try again later." }); }
  try {
    if (action === "me" && req.method === "GET") return res.status(200).json({ user: await getUserBySession(readCookie(req, COOKIE)) });
    if (action === "csrf" && req.method === "GET") {
      const existingToken = csrfCookie(req);
      const sessionToken = readCookie(req, COOKIE);
      if (existingToken && sessionToken && await verifyCsrfToken(sessionToken, existingToken).catch(() => false)) {
        res.setHeader("Cache-Control", "no-store, max-age=0");
        return res.status(200).json({ csrfToken: existingToken });
      }
      const token = createOpaqueToken();
      if (sessionToken) {
        const rotated = await rotateCsrfToken(sessionToken, token);
        if (!rotated) {
          logger.error("auth.csrf_rotation_failed", { action, sessionPresent: true });
          return res.status(503).json({ error: "Security session refresh failed. Please sign in again." });
        }
      }
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.setHeader("Set-Cookie", `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
      return res.status(200).json({ csrfToken: token });
    }
    if (action === "logout" && req.method === "POST") {
      if (!(await validCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      await destroySession(readCookie(req, COOKIE));
      res.setHeader("Set-Cookie", `${COOKIE}=; ${cookieOptions}; Max-Age=0`);
      return res.status(200).json({ ok: true });
    }
    if ((action === "register" || action === "login") && req.method === "POST") {
      const credentials = validCredentials(req.body, action === "register");
      if (!credentials) return res.status(400).json({ error: action === "register" ? "Enter your first name, last name, a valid email, and a password of at least 12 characters." : "Use a valid email and a password of at least 12 characters." });
      const user = action === "register" ? await createUser(credentials) : await authenticateUser(credentials);
      if (!user) { await recordAudit({ type: "login_failed", email: credentials.email, ip: getClientAddress(req) }); recordMetric("auth.login_failed", { emailDomain: credentials.email.split("@")[1] }); return res.status(401).json({ error: "Invalid email or password." }); }
      const session = await createSession(user.id);
      res.setHeader("Set-Cookie", [`${COOKIE}=${session.token}; ${cookieOptions}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`, `${CSRF_COOKIE}=${session.csrfToken}; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`]);
      let emailDelivery;
      if (action === "register") {
        const verificationToken = await createVerificationToken(user.id);
        emailDelivery = await sendAuthEmail({ type: "verify-email", user, token: verificationToken, req });
      }
      await recordAudit({ type: action === "register" ? "register" : "login", userId: user.id, email: user.email, ip: getClientAddress(req) });
      return res.status(action === "register" ? 201 : 200).json({ user, emailVerificationRequired: !user.emailVerified, ...(emailDelivery ? { emailDelivery } : {}) });
    }
    if (action === "verify" && (req.method === "POST" || req.method === "GET")) {
      const user = await consumeVerificationToken(req.method === "GET" ? req.query?.token : req.body?.token);
      if (!user) return req.method === "GET" ? res.status(400).send("Verification link is invalid or expired.") : res.status(400).json({ error: "Verification link is invalid or expired." });
      await recordAudit({ type: "email_verified", userId: user.id, email: user.email, ip: getClientAddress(req) });
      return req.method === "GET" ? res.status(200).send("Email verified. You can return to InterviewIQ and sign in.") : res.status(200).json({ ok: true });
    }
    if (action === "forgot" && req.method === "POST") {
      if (!(await validCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      const token = await createPasswordResetToken(req.body?.email);
      if (token) {
        const email = String(req.body?.email || "").trim().toLowerCase();
        const user = { id: null, email };
        const emailDelivery = await sendAuthEmail({ type: "password-reset", user, token, req });
        const deliveryMeta = { action, authEvent: "email_delivery", delivered: Boolean(emailDelivery.delivered), configured: Boolean(emailDelivery.configured), provider: emailDelivery.provider || "unknown", providerErrorCode: emailDelivery.errorCode || null, resendConfigured: Boolean(process.env.RESEND_API_KEY), webhookConfigured: Boolean(process.env.EMAIL_WEBHOOK_URL) };
        req.observabilityMeta = deliveryMeta;
        logger.info("auth.email_delivery", deliveryMeta);
      }
      return res.status(200).json({ ok: true, message: "If the account exists, reset instructions will be sent." });
    }
    if (action === "reset" && req.method === "POST") {
      if (!(await validCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      const credentials = validCredentials({ email: "reset@example.com", password: req.body?.password });
      if (!credentials) return res.status(400).json({ error: "Password must be at least 12 characters." });
      const user = await resetPassword(req.body?.token, credentials.password);
      if (!user) return res.status(400).json({ error: "Reset link is invalid or expired." });
      await recordAudit({ type: "password_reset", userId: user.id, email: user.email, ip: getClientAddress(req) });
      recordMetric("auth.password_reset", { emailDomain: user.email.split("@")[1] });
      return res.status(200).json({ ok: true });
    }
    if (action === "resend-verification" && req.method === "POST") {
      if (!(await validCsrf(req))) {
        const diagnostics = await csrfDiagnostics(req);
        req.observabilityMeta = { action, authEvent: "csrf_rejected", ...diagnostics };
        logger.error("auth.csrf_rejected", { action, ...diagnostics });
        return res.status(403).json({ error: "CSRF validation failed." });
      }
      const user = await getUserBySession(readCookie(req, COOKIE));
      if (!user) return res.status(401).json({ error: "Authentication required." });
      if (user.emailVerified) return res.status(400).json({ error: "Email is already verified." });
      const token = await createVerificationToken(user.id);
      const emailDelivery = await sendAuthEmail({ type: "verify-email", user, token, req });
      const deliveryMeta = { action, authEvent: "email_delivery", delivered: Boolean(emailDelivery.delivered), configured: Boolean(emailDelivery.configured), provider: emailDelivery.provider || "unknown", providerErrorCode: emailDelivery.errorCode || null, resendConfigured: Boolean(process.env.RESEND_API_KEY), webhookConfigured: Boolean(process.env.EMAIL_WEBHOOK_URL) };
      req.observabilityMeta = deliveryMeta;
      logger.info("auth.email_delivery", deliveryMeta);
      recordMetric("auth.verification_resent", { emailDomain: user.email.split("@")[1] });
      return res.status(200).json({ ok: true, emailDelivery });
    }
    if (action === "revoke" && req.method === "POST") {
      if (!(await validCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      const user = await getUserBySession(readCookie(req, COOKIE)); if (!user) return res.status(401).json({ error: "Authentication required." });
      await revokeAllSessions(user.id); await recordAudit({ type: "sessions_revoked", userId: user.id, email: user.email, ip: getClientAddress(req) });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Unsupported auth operation." });
  } catch (error) {
    reportServerError(error, { route: "/api/auth", action });
    if (error.code === "EMAIL_EXISTS") return res.status(409).json({ error: error.message });
    return res.status(503).json({ error: "Account service is not configured or temporarily unavailable." });
  }
}

export default withApiObservability("/api/auth", handler);
