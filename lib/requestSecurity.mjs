const buckets = new Map();
const MAX_BUCKETS = 5000;

export const CHAT_LIMITS = Object.freeze({
  maxMessages: 40,
  maxMessageChars: 12000,
  maxTotalChars: 60000,
  requestsPerMinute: 30,
});

function trimBuckets(now) {
  for (const [key, bucket] of buckets) if (now - bucket.startedAt > 60_000) buckets.delete(key);
  while (buckets.size > MAX_BUCKETS) buckets.delete(buckets.keys().next().value);
}

export function getClientAddress(req) {
  const platformAddress = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return platformAddress || req.socket?.remoteAddress || "unknown";
}

export function checkRateLimit(key, { limit = CHAT_LIMITS.requestsPerMinute, now = Date.now() } = {}) {
  trimBuckets(now);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    buckets.set(key, { startedAt: now, count: 1 });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfter: 60 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((60_000 - (now - bucket.startedAt)) / 1000)) };
  return { ok: true, remaining: Math.max(0, limit - bucket.count), retryAfter: 60 };
}

export function validateChatRequest(body = {}) {
  const messages = body.messages;
  if (!Array.isArray(messages) || !messages.length) return { ok: false, status: 400, error: "At least one chat message is required." };
  if (messages.length > CHAT_LIMITS.maxMessages) return { ok: false, status: 413, error: `Keep chat history under ${CHAT_LIMITS.maxMessages} messages.` };
  let total = 0;
  for (const message of messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string" || !message.content.trim()) return { ok: false, status: 400, error: "Each message must have a role and non-empty content." };
    if (message.content.length > CHAT_LIMITS.maxMessageChars) return { ok: false, status: 413, error: `Each message must be under ${CHAT_LIMITS.maxMessageChars} characters.` };
    total += message.content.length;
  }
  if (total > CHAT_LIMITS.maxTotalChars) return { ok: false, status: 413, error: `Chat history is too large. Keep it under ${CHAT_LIMITS.maxTotalChars} characters.` };
  return { ok: true };
}

export function resetRateLimits() { buckets.clear(); }
