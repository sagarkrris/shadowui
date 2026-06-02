import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDsaChallengeGenerationPrompt,
  parseGeneratedDsaChallenges,
} from "../lib/dsaChallengeGeneration.mjs";

test("builds a constrained prompt for generated DSA interview challenges", () => {
  const prompt = buildDsaChallengeGenerationPrompt({
    stack: "Java, Spring Boot",
    count: 9,
  });

  assert.match(prompt, /JSON/i);
  assert.match(prompt, /mcq/i);
  assert.match(prompt, /coding/i);
  assert.match(prompt, /quantitative/i);
  assert.match(prompt, /Java, Spring Boot/);
  assert.match(prompt, /9/);
});

test("parses and sanitizes generated DSA challenges from fenced JSON", () => {
  const parsed = parseGeneratedDsaChallenges(`
\`\`\`json
{
  "challenges": [
    {
      "type": "mcq",
      "title": "Hash Map Signal",
      "difficulty": "Medium",
      "prompt": "Which clue points to hashing?",
      "choices": [
        { "id": "a", "text": "Need fast lookup of previous values" },
        { "id": "b", "text": "Need recursion over children" },
        { "id": "c", "text": "Need sorted halves only" },
        { "id": "d", "text": "Need LIFO matching only" }
      ],
      "correctChoiceId": "a",
      "explanation": "Hashing is the right signal when remembering previous facts beats searching again.",
      "trick": "The trap is confusing lookup with sorting.",
      "tricky": true,
      "tags": ["Hashing", "MCQ"]
    },
    {
      "type": "coding",
      "title": "Two Pointer Guard",
      "difficulty": "Medium",
      "prompt": "What should you guard before coding?",
      "codeSnippet": "function solve(nums) { return nums; }",
      "choices": ["Invariant and sorted precondition", "Syntax only", "No edge cases", "Ignore complexity"],
      "correctChoiceId": "a",
      "explanation": "Two pointer code is safe when the invariant proves a pointer can move.",
      "trick": "Skipping the precondition makes the code look right but fail.",
      "tricky": true
    }
  ]
}
\`\`\`
  `, { source: "generated" });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].id, "generated-mcq-1");
  assert.equal(parsed[0].source, "generated");
  assert.equal(parsed[0].choices.length, 4);
  assert.deepEqual(parsed[1].choices.map((choice) => choice.id), ["a", "b", "c", "d"]);
  assert.match(parsed[1].codeSnippet, /function solve/);
});

test("rejects malformed generated challenge payloads", () => {
  assert.deepEqual(parseGeneratedDsaChallenges("not json"), []);
  assert.deepEqual(parseGeneratedDsaChallenges(JSON.stringify({ challenges: [] })), []);
  assert.deepEqual(parseGeneratedDsaChallenges(JSON.stringify({
    challenges: [
      {
        type: "mcq",
        title: "Bad",
        prompt: "Missing choices",
        choices: ["Only one"],
        correctChoiceId: "a",
        explanation: "Too short",
      },
    ],
  })), []);
});
