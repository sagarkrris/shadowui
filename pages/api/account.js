import { deleteUser, exportUserData, getUserBySession, recordAudit } from "../../lib/serverPersistence.mjs";
import { requireCsrf, sessionTokenFromRequest } from "../../lib/apiAuth.mjs";
import { recordMetric, reportServerError } from "../../lib/observability.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";
import { deliverAuthEmail } from "../../lib/authDelivery.mjs";

async function handler(req, res) {
  const user = await getUserBySession(sessionTokenFromRequest(req));
  if (!user) return res.status(401).json({ error: "Authentication required." });
  if (req.method !== "GET" && !(await requireCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
  try {
    if (req.method === "GET" && req.query.action === "export") {
      const payload = await exportUserData(user.id);
      const exportedAt = new Date().toISOString();
      await recordAudit({ type: "account_exported", userId: user.id, email: user.email });
      recordMetric("account.exported", { userId: user.id });
      res.setHeader("Content-Disposition", 'attachment; filename="interviewiq-account-export.json"');
      return res.status(200).json({ exportVersion: 1, exportedAt, ...payload });
    }
    if (req.method === "DELETE") {
      await recordAudit({ type: "account_deletion_requested", userId: user.id, email: user.email });
      await deleteUser(user.id);
      const remaining = await getUserBySession(sessionTokenFromRequest(req));
      if (remaining) return res.status(503).json({ error: "Account deletion could not be verified. Please contact support." });
      let emailDelivery;
      try {
        emailDelivery = await deliverAuthEmail({ type: "account-deleted", email: user.email, userId: user.id });
      } catch (error) {
        emailDelivery = { delivered: false, configured: true, provider: "resend", error: true, errorCode: error.code || "provider_error" };
        await recordAudit({ type: "account_deletion_email_failed", email: user.email, providerError: error.code || error.message }).catch((auditError) => reportServerError(auditError, { route: "/api/account", action: "delete-email-audit" }));
      }
      req.observabilityMeta = { action: "delete", authEvent: "account_deleted", deletionVerified: true, delivered: Boolean(emailDelivery.delivered), configured: Boolean(emailDelivery.configured), provider: emailDelivery.provider || "unknown", providerErrorCode: emailDelivery.errorCode || null };
      recordMetric("account.deleted", { userId: user.id });
      res.setHeader("Set-Cookie", ["interviewiq_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0", "interviewiq_csrf=; Path=/; SameSite=Lax; Max-Age=0"]);
      return res.status(200).json({ ok: true, deletionVerified: true, emailDelivery });
    }
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) { reportServerError(error, { route: "/api/account", action: req.query.action || req.method }); return res.status(503).json({ error: "Account operation unavailable." }); }
}

export default withApiObservability("/api/account", handler);
