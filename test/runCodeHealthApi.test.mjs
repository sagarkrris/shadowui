import assert from "node:assert/strict";
import test from "node:test";

import handler from "../pages/api/run-code/health.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("GET /api/run-code/health returns code runner health", async () => {
  const res = createResponse();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.headers["X-Request-Id"]);
  assert.equal(typeof res.body.provider, "string");
  assert.equal(typeof res.body.configured, "boolean");
  assert.equal(typeof res.body.runnable, "boolean");
  assert.equal(res.body.status, "upcoming");
  assert.equal(res.body.runnable, false);
  assert.ok(Array.isArray(res.body.supportedLanguages));
  assert.ok(res.body.requestId);
});

test("/api/run-code/health rejects unsupported methods", async () => {
  const res = createResponse();

  await handler({ method: "POST" }, res);

  assert.equal(res.statusCode, 405);
  assert.match(res.body.error, /Method not allowed/i);
});
