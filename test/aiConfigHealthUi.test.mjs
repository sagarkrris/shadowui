import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");

test("app shell surfaces AI configuration health without blocking local tools", () => {
  assert.match(indexSource, /\/api\/models/);
  assert.match(indexSource, /aiHealth/);
  assert.match(indexSource, /GEMINI_API_KEY/);
  assert.match(indexSource, /role="status"/);
});
