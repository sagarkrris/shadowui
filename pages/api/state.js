import { getUserBySession, loadUserState, saveUserState } from "../../lib/serverPersistence.mjs";
import { checkRateLimit, getClientAddress } from "../../lib/requestSecurity.mjs";

function sessionToken(req) { return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === "interviewiq_session")?.[1] || ""; }

export default async function handler(req, res) {
  const user = await getUserBySession(sessionToken(req));
  if (!user) return res.status(401).json({ error: "Authentication required." });
  const limit = checkRateLimit(`state:${user.id}:${getClientAddress(req)}`, { limit: 60 });
  if (!limit.ok) return res.status(429).json({ error: "Too many state requests." });
  try {
    if (req.method === "GET") return res.status(200).json({ state: await loadUserState(user.id) });
    if (req.method === "PUT") {
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
