import { authenticateUser, createSession, createUser, destroySession, getUserBySession } from "../../lib/serverPersistence.mjs";
import { checkRateLimit, getClientAddress } from "../../lib/requestSecurity.mjs";

const COOKIE = "interviewiq_session";
const cookieOptions = "Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600";

function readCookie(req, name) {
  return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === name)?.[1] || "";
}

function validCredentials(body = {}) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && password.length >= 12 && password.length <= 128 ? { email, password } : null;
}

export default async function handler(req, res) {
  const action = String(req.query.action || "me");
  const limit = checkRateLimit(`auth:${getClientAddress(req)}`, { limit: 10 });
  res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
  if (!limit.ok) return res.status(429).json({ error: "Too many authentication requests. Try again later." });
  try {
    if (action === "me" && req.method === "GET") return res.status(200).json({ user: await getUserBySession(readCookie(req, COOKIE)) });
    if (action === "logout" && req.method === "POST") {
      await destroySession(readCookie(req, COOKIE));
      res.setHeader("Set-Cookie", `${COOKIE}=; ${cookieOptions}; Max-Age=0`);
      return res.status(200).json({ ok: true });
    }
    if ((action === "register" || action === "login") && req.method === "POST") {
      const credentials = validCredentials(req.body);
      if (!credentials) return res.status(400).json({ error: "Use a valid email and a password of at least 12 characters." });
      const user = action === "register" ? await createUser(credentials) : await authenticateUser(credentials);
      if (!user) return res.status(401).json({ error: "Invalid email or password." });
      const token = await createSession(user.id);
      res.setHeader("Set-Cookie", `${COOKIE}=${token}; ${cookieOptions}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
      return res.status(action === "register" ? 201 : 200).json({ user });
    }
    return res.status(405).json({ error: "Unsupported auth operation." });
  } catch (error) {
    if (error.code === "EMAIL_EXISTS") return res.status(409).json({ error: error.message });
    return res.status(503).json({ error: "Account service is not configured or temporarily unavailable." });
  }
}
