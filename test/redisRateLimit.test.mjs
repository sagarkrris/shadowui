import assert from "node:assert/strict";
import test from "node:test";
import { checkDistributedRateLimit } from "../lib/redisRateLimit.mjs";

test("uses Upstash pipeline results for distributed rate limits", async () => {
  const calls = [];
  const result = await checkDistributedRateLimit("user", {
    limit: 2,
    now: 60_000,
    env: { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "token" },
    fetchImpl: async (url, options) => { calls.push({ url, options }); return { ok: true, async json() { return [{ result: 2 }, { result: 1 }]; } }; },
  });
  assert.equal(result.ok, true);
  assert.equal(result.distributed, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].options.headers.Authorization, /Bearer token/);
});
