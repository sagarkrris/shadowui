import { deleteUser, exportUserData, getUserBySession } from "../../lib/serverPersistence.mjs";
import { requireCsrf, sessionTokenFromRequest } from "../../lib/apiAuth.mjs";

export default async function handler(req, res) {
  const user = await getUserBySession(sessionTokenFromRequest(req));
  if (!user) return res.status(401).json({ error: "Authentication required." });
  if (req.method !== "GET" && !(await requireCsrf(req))) return res.status(403).json({ error: "CSRF validation failed." });
  try {
    if (req.method === "GET" && req.query.action === "export") return res.status(200).json(await exportUserData(user.id));
    if (req.method === "DELETE") { await deleteUser(user.id); res.setHeader("Set-Cookie", "interviewiq_session=; Path=/; Max-Age=0"); return res.status(200).json({ ok: true }); }
    return res.status(405).json({ error: "Method not allowed." });
  } catch { return res.status(503).json({ error: "Account operation unavailable." }); }
}
