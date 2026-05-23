import assert from "node:assert/strict";
import test from "node:test";

import {
  createRequestLogger,
  sanitizeLogMeta,
} from "../lib/serverLogger.mjs";

function captureSink() {
  const events = [];
  return {
    events,
    log(event) {
      events.push({ level: "log", event });
    },
    warn(event) {
      events.push({ level: "warn", event });
    },
    error(event) {
      events.push({ level: "error", event });
    },
  };
}

test("redacts sensitive values from structured log metadata", () => {
  assert.deepEqual(
    sanitizeLogMeta({
      apiKey: "secret",
      imageBase64: "abc",
      messages: ["hello"],
      safe: "ok",
      nested: { token: "secret", count: 1 },
    }),
    {
      apiKey: "[redacted]",
      imageBase64: "[redacted]",
      messages: "[redacted]",
      safe: "ok",
      nested: { token: "[redacted]", count: 1 },
    },
  );
});

test("writes request-scoped events with elapsed time", () => {
  const sink = captureSink();
  let now = 1000;
  const logger = createRequestLogger({
    route: "/api/chat",
    requestId: "req_1",
    sink,
    now: () => now,
  });

  now = 1240;
  logger.info("request.done", { status: 200, messageCount: 2 });

  assert.equal(sink.events.length, 1);
  assert.equal(sink.events[0].level, "log");
  assert.deepEqual(sink.events[0].event, {
    level: "info",
    route: "/api/chat",
    requestId: "req_1",
    event: "request.done",
    elapsedMs: 240,
    status: 200,
    messageCount: 2,
  });
});
