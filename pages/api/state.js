import { getUserBySession, loadUserState, saveUserState } from "../../lib/serverPersistence.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { requireCsrf, sessionTokenFromRequest } from "../../lib/apiAuth.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  const user = await getUserBySession(sessionTokenFromRequest(req));
  if (!user) return res.status(401).json({ error: "Authentication required." });
  const limit = await checkDistributedRateLimit(`state:${user.id}:${getClientAddress(req)}`, { limit: 60 });
  if (!limit.ok) return res.status(429).json({ error: "Too many state requests." });
  try {
    if (req.method === "GET") return res.status(200).json({ ...(await loadUserState(user.id, true)), userId: user.id });
    if (req.method === "PUT") {
      if (!(await requireCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      // A different tab can replace the browser's session cookie while a save is queued.
      if (req.body?.userId !== user.id) return res.status(409).json({ error: "The signed-in account changed. Reload before syncing." });
      const state = req.body?.state;
      if (!state || typeof state !== "object" || JSON.stringify(state).length > 2_000_000) return res.status(413).json({ error: "State payload is invalid or too large." });
      const result = await saveUserState(user.id, state, req.body.revision);
      if (result.conflict) return res.status(409).json({ error: "State changed on another device. Choose which copy to keep." });
      return res.status(200).json({ ok: true, ...result });
    }
    return res.status(405).json({ error: "Method not allowed." });
  } catch {
    return res.status(503).json({ error: "State persistence is not configured." });
  }
}

export default withApiObservability("/api/state", handler);
