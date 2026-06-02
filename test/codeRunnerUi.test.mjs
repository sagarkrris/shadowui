import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/CodeRunner.js", import.meta.url), "utf8");

test("code runner UI presents execution as an upcoming feature", () => {
  assert.match(source, /Upcoming Feature/);
  assert.match(source, /CODE_RUNNER_FEATURE_STATE\.summary/);
  assert.doesNotMatch(source, /fetch\("\/api\/run-code"/);
  assert.doesNotMatch(source, /fetch\("\/api\/run-code\/health"/);
});

test("code runner UI disables live runs while upcoming", () => {
  assert.match(source, /disabled=\{true\}/);
  assert.match(source, /Coming Soon/);
  assert.match(source, /aria-disabled="true"/);
});
