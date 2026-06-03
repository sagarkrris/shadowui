import assert from "node:assert/strict";
import test from "node:test";

import {
  getRequiredGeminiApiKey,
  getSafeConfigErrorPayload,
  runGeminiRouteOperation,
} from "../lib/aiGateway.mjs";

test("AI gateway returns a safe config error when Gemini key is missing", () => {
  assert.throws(
    () => getRequiredGeminiApiKey({}),
    (error) => {
      assert.equal(error.status, 500);
      assert.equal(error.code, "GEMINI_API_KEY_MISSING");
      assert.equal(getSafeConfigErrorPayload(error).error, "GEMINI_API_KEY not configured");
      return true;
    },
  );
});

test("AI gateway resolves model candidates and executes fallback operation", async () => {
  const calls = [];
  const result = await runGeminiRouteOperation({
    env: { GEMINI_API_KEY: "key" },
    getModelCandidates: async (apiKey, options) => {
      calls.push(["models", apiKey, options.vision]);
      return ["gemini-test"];
    },
    runWithFallback: async (models, operation) => {
      calls.push(["fallback", models]);
      return {
        modelName: models[0],
        result: await operation(models[0], { apiKey: "key" }),
      };
    },
    operation: async (modelName, context) => ({ modelName, apiKey: context.apiKey }),
  });

  assert.deepEqual(result, {
    apiKey: "key",
    modelCandidates: ["gemini-test"],
    modelName: "gemini-test",
    result: { modelName: "gemini-test", apiKey: "key" },
  });
  assert.deepEqual(calls, [
    ["models", "key", false],
    ["fallback", ["gemini-test"]],
  ]);
});

test("AI gateway reports no supported models before route-specific operation runs", async () => {
  await assert.rejects(
    runGeminiRouteOperation({
      env: { GEMINI_API_KEY: "key" },
      getModelCandidates: async () => [],
      operation: async () => {
        throw new Error("should not run");
      },
    }),
    /No supported Gemini models found/,
  );
});
