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
  assert.equal(theme.accent, "#b56b2c");
});

test("returns the Python theme when Python is the selected stack", () => {
  const theme = getTechTheme("Python, Django, PostgreSQL");

  assert.equal(theme.key, "python");
  assert.equal(theme.icon, "ti-brand-python");
  assert.equal(theme.accent, "#2f6f9f");
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

test("treats generic SQL as database prep instead of PostgreSQL-specific prep", () => {
  const theme = getTechTheme("SQL");

  assert.equal(theme.key, "sql");
  assert.equal(theme.label, "SQL");
  assert.equal(theme.icon, "ti-database");
});

test("keeps PostgreSQL specific when the stack names Postgres", () => {
  assert.equal(getTechTheme("PostgreSQL").key, "postgresql");
  assert.equal(getTechTheme("Postgres").key, "postgresql");
});

test("detects SAP, Ruby, and Rust as first-class stack themes", () => {
  assert.equal(getTechTheme("SAP ABAP, S/4HANA").key, "sap");
  assert.equal(getTechTheme("Ruby on Rails").key, "ruby");
  assert.equal(getTechTheme("Rust backend services").key, "rust");
});

test("uses a non-blue default landing theme", () => {
  const theme = getTechTheme("");

  assert.equal(theme.accent, "#2f6f73");
  assert.equal(theme.accentStrong, "#b78b4b");
  assert.equal(theme.accentText, "#d9e6e3");
  assert.equal(theme.surface, "#151b24");
});

test("uses varied corporate palettes across stack themes", () => {
  const java = getTechTheme("Java");
  const react = getTechTheme("React");
  const sap = getTechTheme("SAP");

  assert.notEqual(java.surface, react.surface);
  assert.notEqual(java.accent, react.accent);
  assert.notEqual(react.accent, sap.accent);
  assert.match(java.surface, /^#1/);
  assert.match(react.surface, /^#0|^#1/);
});

test("provides stack-specific background artwork for known themes", () => {
  const java = getTechTheme("Java, Spring Boot");
  const python = getTechTheme("Python, Django");

  assert.deepEqual(java.background.glyphs, ["Java", "Spring Boot", "JVM"]);
  assert.deepEqual(python.background.glyphs, ["Python", "Django", "FastAPI"]);
  assert.notDeepEqual(java.background.glyphs, python.background.glyphs);
  assert.match(java.background.image, /linear-gradient/);
  assert.match(python.background.image, /linear-gradient/);
});

test("provides glossy glass tokens derived from the selected stack", () => {
  const theme = getTechTheme("Java, Spring Boot");

  assert.equal(theme.glass.panel, "rgba(29,26,23,.74)");
  assert.equal(theme.glass.panelStrong, "rgba(29,26,23,.90)");
  assert.equal(theme.glass.tint, "rgba(181,107,44,.12)");
  assert.equal(theme.glass.shine, "rgba(224,161,92,.16)");
  assert.match(theme.glass.shadow, /rgba\(2,6,23/);
});
