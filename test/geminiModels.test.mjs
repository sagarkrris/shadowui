import assert from "node:assert/strict";
import test from "node:test";

import { getGeminiModelCandidates } from "../lib/geminiModels.mjs";

test("discovers supported free-tier-friendly Gemini flash models", async () => {
  const models = await getGeminiModelCandidates("key", {
    fetchImpl: async () => ({
      async json() {
        return {
          models: [
            { name: "models/gemini-1.5-pro", supportedGenerationMethods: ["generateContent"] },
            { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
            { name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] },
          ],
        };
      },
    }),
  });

  assert.equal(models[0], "gemini-2.0-flash");
  assert.equal(models.includes("gemini-1.5-pro"), false);
  assert.ok(models.includes("gemini-2.5-flash"));
});

test("uses fallback Gemini models when discovery fails", async () => {
  const models = await getGeminiModelCandidates("key", {
    fetchImpl: async () => {
      throw new Error("network");
    },
  });

  assert.ok(models.includes("gemini-2.5-flash"));
  assert.equal(models.some((model) => model.includes("pro")), false);
});
