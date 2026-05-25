import assert from "node:assert/strict";
import test from "node:test";

import {
  SYSTEM_PROMPT,
  buildSystemPrompt,
} from "../lib/chatPrompt.mjs";

test("chat system prompt requires part-wise answers for readability", () => {
  assert.match(SYSTEM_PROMPT, /part-wise/i);
  assert.match(SYSTEM_PROMPT, /Part 1/i);
  assert.match(SYSTEM_PROMPT, /Part 2/i);
  assert.match(SYSTEM_PROMPT, /Part 3/i);
});

test("chat system prompt keeps candidate profile context", () => {
  const prompt = buildSystemPrompt({
    name: "Sagar",
    position: "Senior Software Engineer",
    experience: "8 years",
    stack: "Java, React, SQL",
  });

  assert.match(prompt, /Candidate name: Sagar/);
  assert.match(prompt, /Target position: Senior Software Engineer/);
  assert.match(prompt, /Tech stack: Java, React, SQL/);
  assert.match(prompt, /part-wise/i);
});
