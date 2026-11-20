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

test("uses the local limit when the Redis counter or expiry is unavailable", async () => {
  const invalidResponses = [
    [{ error: "command failed" }, { result: 1 }],
    [{ result: 1 }, { error: "command failed" }],
    [{ result: 1 }, { result: 0 }],
    [{ result: "1" }, { result: 1 }],
    null,
  ];
  for (const [index, response] of invalidResponses.entries()) {
    const options = {
      limit: 1,
      now: 120_000,
      env: { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "token" },
      fetchImpl: async () => ({ ok: true, json: async () => response }),
    };
    const key = `redis-degraded-${index}`;
    const first = await checkDistributedRateLimit(key, options);
    assert.equal(first.distributed, false);
    assert.equal(first.degraded, true);
    assert.equal(first.ok, true);
    assert.equal((await checkDistributedRateLimit(key, options)).ok, false);
  }
});
