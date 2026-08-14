import { getUserBySession, verifyCsrfToken } from "./serverPersistence.mjs";

function sessionToken(req) {
  return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === "interviewiq_session")?.[1] || "";
}

export async function requireConfiguredUser(req) {
  const required = process.env.REQUIRE_AUTH === "1" || (process.env.NODE_ENV === "production" && process.env.REQUIRE_AUTH !== "0");
  if (!required) return { user: null, required: false };
  const user = await getUserBySession(sessionToken(req));
  return { user: user?.emailVerified ? user : null, required };
}

export async function requireCsrf(req) {
  const sessionToken = sessionTokenFromRequest(req);
  const csrfToken = String(req.headers["x-csrf-token"] || "");
  return verifyCsrfToken(sessionToken, csrfToken);
}

export function sessionTokenFromRequest(req) { return sessionToken(req); }
