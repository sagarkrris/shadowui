import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/welcome/CareerToolkit.js", import.meta.url), "utf8");

test("interview tracker form uses shared validation and exposes validation messages", () => {
  assert.match(source, /validateInterviewDraft/);
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-invalid/);
  assert.ok(source.includes("maxLength={80}"));
  assert.ok(source.includes("maxLength={100}"));
  assert.ok(source.includes("maxLength={400}"));
});
