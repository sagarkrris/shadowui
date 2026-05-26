import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../pages/api/analyze-screen.js", import.meta.url), "utf8");

test("screen analysis prompt requires part-wise answers for readability", () => {
  assert.match(source, /part-wise/i);
  assert.match(source, /Part 1: Problem Understanding/i);
  assert.match(source, /Part 2: Approach/i);
  assert.match(source, /Part 3: Solution/i);
  assert.match(source, /Part 4: Complexity \/ Trade-offs \/ Risks/i);
  assert.match(source, /Part 5: Interview Tips \/ Follow-up/i);
});
