import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_TECH_THEME,
  getTechTheme,
} from "../lib/techTheme.mjs";

test("returns the Java theme when Java is the selected stack", () => {
  const theme = getTechTheme("Java, Spring Boot, PostgreSQL");

  assert.equal(theme.key, "java");
  assert.equal(theme.icon, "ti-brand-java");
  assert.equal(theme.accent, "#f89820");
});

test("returns the Python theme when Python is the selected stack", () => {
  const theme = getTechTheme("Python, Django, PostgreSQL");

  assert.equal(theme.key, "python");
  assert.equal(theme.icon, "ti-brand-python");
  assert.equal(theme.accent, "#3776ab");
});

test("uses the first strong tech match for multi-stack input", () => {
  const theme = getTechTheme("React, Node.js, Python");

  assert.equal(theme.key, "react");
  assert.equal(theme.icon, "ti-brand-react");
});

test("falls back to the default theme when no known stack is detected", () => {
  const theme = getTechTheme("Legacy internal tools");

  assert.deepEqual(theme, DEFAULT_TECH_THEME);
});

test("uses a non-blue default landing theme", () => {
  const theme = getTechTheme("");

  assert.equal(theme.accent, "#22c55e");
  assert.equal(theme.accentStrong, "#fb7185");
  assert.equal(theme.accentText, "#bbf7d0");
  assert.equal(theme.surface, "#10130f");
});
