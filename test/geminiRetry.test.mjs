import assert from "node:assert/strict";
import test from "node:test";

import {
  getGeminiErrorStatus,
  isUnavailableGeminiModelError,
  isTransientGeminiError,
  withGeminiModelFallback,
  withGeminiRetry,
} from "../lib/geminiRetry.mjs";

test("classifies Gemini fetch and network failures as transient", () => {
  assert.equal(isTransientGeminiError(new Error("Error fetching from https://generativelanguage.googleapis.com")), true);
  assert.equal(isTransientGeminiError({ code: "ECONNRESET" }), true);
  assert.equal(isTransientGeminiError({ status: 503 }), true);
  assert.equal(isTransientGeminiError({ status: 401 }), false);
});

test("classifies unsupported Gemini model errors as fallbackable", () => {
  assert.equal(isUnavailableGeminiModelError({ status: 404, message: "models/gemini-x is not found" }), true);
  assert.equal(isUnavailableGeminiModelError({ status: 400, message: "model is not supported for generateContent" }), true);
  assert.equal(isUnavailableGeminiModelError({ status: 400, message: "bad prompt" }), false);
});

test("retries transient Gemini failures before returning", async () => {
  let attempts = 0;

  const result = await withGeminiRetry(
    async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("Error fetching from https://generativelanguage.googleapis.com");
      return "ok";
    },
    { retries: 1, delayMs: 0 },
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 2);
});

test("does not retry the same Gemini model after rate limits", async () => {
  let attempts = 0;

  await assert.rejects(
    withGeminiRetry(
      async () => {
        attempts += 1;
        throw { status: 429, message: "quota exceeded" };
      },
      { retries: 2, delayMs: 0 },
    ),
  );

  assert.equal(attempts, 1);
});

test("maps upstream Gemini failures to a gateway status", () => {
  assert.equal(getGeminiErrorStatus({ status: 429 }), 429);
  assert.equal(getGeminiErrorStatus(new Error("Error fetching from https://generativelanguage.googleapis.com")), 502);
});

test("falls back to the next Gemini model after retryable failures", async () => {
  const attempts = [];

  const { modelName, result } = await withGeminiModelFallback(
    ["gemini-a", "gemini-b"],
    async (candidate) => {
      attempts.push(candidate);
      if (candidate === "gemini-a") throw { status: 429, message: "quota exceeded for this model" };
      return "reply";
    },
    { retries: 0, onFallback: () => {} },
  );

  assert.equal(modelName, "gemini-b");
  assert.equal(result, "reply");
  assert.deepEqual(attempts, ["gemini-a", "gemini-b"]);
});
