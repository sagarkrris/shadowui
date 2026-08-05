import { checkRateLimit as checkLocalRateLimit } from "./requestSecurity.mjs";

const windowSeconds = 60;

function redisConfigured(env = process.env) {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export async function checkDistributedRateLimit(key, { limit = 30, now = Date.now(), fetchImpl = fetch, env = process.env } = {}) {
  if (!redisConfigured(env)) return { ...checkLocalRateLimit(key, { limit, now }), distributed: false };
  const windowId = Math.floor(now / 60_000);
  const redisKey = `interviewiq:ratelimit:${key}:${windowId}`;
  try {
    const response = await fetchImpl(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", redisKey], ["EXPIRE", redisKey, windowSeconds]]),
    });
    if (!response.ok) throw new Error(`Upstash responded with ${response.status}`);
    const result = await response.json();
    const count = Number(result?.[0]?.result || 0);
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter: windowSeconds - Math.floor((now / 1000) % windowSeconds), distributed: true };
  } catch {
    return { ...checkLocalRateLimit(key, { limit, now }), distributed: false, degraded: true };
  }
}

export function isRedisRateLimitConfigured(env = process.env) { return redisConfigured(env); }
