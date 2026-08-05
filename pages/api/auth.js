import { authenticateUser, consumeVerificationToken, createOpaqueToken, createPasswordResetToken, createSession, createUser, createVerificationToken, destroySession, getUserBySession, recordAudit, resetPassword, revokeAllSessions, verifyCsrfToken } from "../../lib/serverPersistence.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { deliverAuthEmail } from "../../lib/authDelivery.mjs";
import { recordMetric, reportServerError } from "../../lib/observability.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

const COOKIE = "interviewiq_session";
const CSRF_COOKIE = "interviewiq_csrf";
const cookieOptions = "Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600";

function readCookie(req, name) {
  return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === name)?.[1] || "";
}

function validCredentials(body = {}) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && password.length >= 12 && password.length <= 128 ? { email, password } : null;
}

function csrfFromRequest(req) { return String(req.headers["x-csrf-token"] || ""); }
function csrfCookie(req) { return readCookie(req, CSRF_COOKIE); }
async function validCsrf(req) { return csrfFromRequest(req) && csrfFromRequest(req) === csrfCookie(req) && (await verifyCsrfToken(readCookie(req, COOKIE), csrfFromRequest(req)).catch(() => false) || !readCookie(req, COOKIE)); }

async function sendAuthEmail({ type, user, token, req }) {
  try {
    const delivery = await deliverAuthEmail({ type, email: user.email, userId: user.id, token });
    recordMetric(delivery.delivered ? "auth.email_sent" : "auth.email_delivery_unavailable", { type, emailDomain: user.email.split("@")[1] });
    if (!delivery.delivered) await recordAudit({ type: "email_delivery_failed", userId: user.id, email: user.email, ip: getClientAddress(req), providerError: delivery.configured ? "not_delivered" : "not_configured" });
    return delivery;
  } catch (error) {
    recordMetric("auth.email_delivery_failed", { type, emailDomain: user.email.split("@")[1] });
    await recordAudit({ type: "email_delivery_failed", userId: user.id, email: user.email, ip: getClientAddress(req), providerError: error.message });
    return { delivered: false, configured: true, provider: "resend", error: true };
  }
}

async function handler(req, res) {
  const action = String(req.query.action || "me");
  const limit = await checkDistributedRateLimit(`auth:${getClientAddress(req)}`, { limit: 10 });
  res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
  if (!limit.ok) { recordMetric("auth.rate_limited", { route: "/api/auth" }); return res.status(429).json({ error: "Too many authentication requests. Try again later." }); }
  try {
    if (action === "me" && req.method === "GET") return res.status(200).json({ user: await getUserBySession(readCookie(req, COOKIE)) });
    if (action === "csrf" && req.method === "GET") {
      const token = createOpaqueToken();
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
      const credentials = validCredentials(req.body);
      if (!credentials) return res.status(400).json({ error: "Use a valid email and a password of at least 12 characters." });
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
        await sendAuthEmail({ type: "password-reset", user, token, req });
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
      if (!(await validCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      const user = await getUserBySession(readCookie(req, COOKIE));
      if (!user) return res.status(401).json({ error: "Authentication required." });
      if (user.emailVerified) return res.status(400).json({ error: "Email is already verified." });
      const token = await createVerificationToken(user.id);
      const emailDelivery = await sendAuthEmail({ type: "verify-email", user, token, req });
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
