import { getUserBySession } from "./serverPersistence.mjs";

function sessionToken(req) {
  return String(req.headers.cookie || "").split(";").map((item) => item.trim().split("=")).find(([key]) => key === "interviewiq_session")?.[1] || "";
}

export async function requireConfiguredUser(req) {
  if (process.env.REQUIRE_AUTH !== "1") return { user: null, required: false };
  const user = await getUserBySession(sessionToken(req));
  return { user, required: true };
}
