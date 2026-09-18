export const EDITORIAL_REQUESTS = [
  { id: "11111111-1111-4111-8111-111111111111", title: "Why can a timeout still charge a customer?", details: "Investigate idempotency and uncertain outcomes.", votes: 0, voted: false, origin: "Editorial suggestion" },
  { id: "22222222-2222-4222-8222-222222222222", title: "Which database isolation anomaly am I seeing?", details: "Follow two transactions through a conflicting update.", votes: 0, voted: false, origin: "Editorial suggestion" },
];
export function validateReaderSubmission(body) {
  const kind = body?.kind;
  if (!["request", "correction"].includes(kind)) throw new Error("Choose a request or correction.");
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  if (title.length < 8 || title.length > 160 || details.length < 20 || details.length > 2000) throw new Error("Use an 8–160 character title and 20–2,000 character description.");
  const path = typeof body.path === "string" ? body.path.trim() : "";
  if (kind === "correction" && (path.length > 300 || !/^\/[a-zA-Z0-9/_-]*(?:#[a-zA-Z0-9_-]+)?$/.test(path))) throw new Error("Use a local page path, such as /java/hashmap-internals.");
  return { kind, title, details, path: kind === "correction" ? path : "" };
}
export function validVoteId(value) { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function sameOriginJson(req) {
  try { return new URL(req.headers.origin).host === req.headers.host && String(req.headers["content-type"] || "").split(";")[0] === "application/json"; } catch { return false; }
}
export function digestSignup(body) {
  if (body?.consent !== true) throw new Error("Explicit subscription consent is required.");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  return { email, consent: true, consentVersion: "weekly-digest-v1", frequency: "weekly" };
}
