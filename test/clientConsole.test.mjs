import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");

test("handled client voice failures do not log as console errors", () => {
  assert.doesNotMatch(indexSource, /console\.error/);
});

