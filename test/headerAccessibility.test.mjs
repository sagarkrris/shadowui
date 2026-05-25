import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");

[
  "Home",
  "Topics",
  "Company Prep",
  "Agentic UI Course",
  "Analyze Screen",
  "Voice",
  "Clear",
  "Edit Profile",
  "Info",
].forEach((label) => {
  test(`top bar icon button exposes ${label} to assistive technology`, () => {
    assert.match(indexSource, new RegExp(`aria-label="${label}"`));
  });
});

