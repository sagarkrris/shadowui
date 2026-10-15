import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(new URL("../pages/practice.js", import.meta.url), "utf8");

test("app shell surfaces AI configuration health without blocking local tools", () => {
  assert.match(indexSource, /\/api\/models/);
  assert.match(indexSource, /aiHealth/);
  assert.match(indexSource, /AI practice is currently unavailable/);
  assert.match(indexSource, /You can still use the Scenario Bank, Java Digest, DSA, Canvas, and Design Lab/);
  assert.match(indexSource, /role="status"/);
});
