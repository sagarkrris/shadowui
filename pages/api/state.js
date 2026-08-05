import { getUserBySession, loadUserState, saveUserState } from "../../lib/serverPersistence.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { requireCsrf } from "../../lib/apiAuth.mjs";

function sessionToken(req) { return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === "interviewiq_session")?.[1] || ""; }

export default async function handler(req, res) {
  const user = await getUserBySession(sessionToken(req));
  if (!user) return res.status(401).json({ error: "Authentication required." });
  const limit = await checkDistributedRateLimit(`state:${user.id}:${getClientAddress(req)}`, { limit: 60 });
  if (!limit.ok) return res.status(429).json({ error: "Too many state requests." });
  try {
    if (req.method === "GET") return res.status(200).json({ state: await loadUserState(user.id) });
    if (req.method === "PUT") {
      if (!(await requireCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
      const state = req.body?.state;
      if (!state || typeof state !== "object" || JSON.stringify(state).length > 2_000_000) return res.status(413).json({ error: "State payload is invalid or too large." });
      const result = await saveUserState(user.id, state);
      return res.status(200).json({ ok: true, ...result });
    }
    return res.status(405).json({ error: "Method not allowed." });
  } catch {
    return res.status(503).json({ error: "State persistence is not configured." });
  }
}
