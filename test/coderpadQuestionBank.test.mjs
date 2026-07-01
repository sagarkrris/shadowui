import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCoderPadQuestion, getCoderPadConfig } from "../lib/coderpadQuestionBank.mjs";

test("normalizes a CoderPad question without exposing owner contact data", () => {
  const question = normalizeCoderPadQuestion({ id: 42, title: "LRU Cache", description: "Implement it", language: "java", owner_email: "private@example.com" });
  assert.deepEqual(question, { id: "coderpad:42", title: "LRU Cache", prompt: "Implement it", language: "java", provider: "coderpad" });
});

test("requires a server-only CoderPad token", () => {
  assert.equal(getCoderPadConfig({}).configured, false);
  assert.equal(getCoderPadConfig({ CODERPAD_API_TOKEN: "token" }).configured, true);
});
