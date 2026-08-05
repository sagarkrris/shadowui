import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit, resetRateLimits, validateChatRequest } from "../lib/requestSecurity.mjs";

test("chat request validation bounds history and message size", () => {
  assert.equal(validateChatRequest({ messages: [] }).ok, false);
  assert.equal(validateChatRequest({ messages: [{ role: "user", content: "hello" }] }).ok, true);
  assert.equal(validateChatRequest({ messages: [{ role: "system", content: "hello" }] }).ok, false);
  assert.equal(validateChatRequest({ messages: [{ role: "user", content: "x".repeat(12001) }] }).status, 413);
});

test("rate limiting returns retry metadata", () => {
  resetRateLimits();
  assert.equal(checkRateLimit("test", { limit: 1, now: 1000 }).ok, true);
  const limited = checkRateLimit("test", { limit: 1, now: 1001 });
  assert.equal(limited.ok, false);
  assert.ok(limited.retryAfter > 0);
});
