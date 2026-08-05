import assert from "node:assert/strict";
import test from "node:test";

import handler from "../pages/api/run-code/index.js";

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

test("POST /api/run-code returns upcoming feature status", async () => {
  const res = createResponse();

  await handler({
    method: "POST",
    body: {
      language: "java",
      code: "class Main { public static void main(String[] args) { System.out.println(1); } }",
      stdin: "",
    },
  }, res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.runnerUnavailable, true);
  assert.match(res.body.error, /upcoming/i);
  assert.ok(res.body.requestId);
  assert.equal(res.headers["X-Request-Id"], res.body.requestId);
});
