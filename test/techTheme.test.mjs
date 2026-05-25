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

  assert.equal(theme.accent, "#22c55e");
  assert.equal(theme.accentStrong, "#fb7185");
  assert.equal(theme.accentText, "#bbf7d0");
  assert.equal(theme.surface, "#10130f");
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

  assert.equal(theme.glass.panel, "rgba(27,18,8,.68)");
  assert.equal(theme.glass.panelStrong, "rgba(27,18,8,.86)");
  assert.equal(theme.glass.tint, "rgba(248,152,32,.18)");
  assert.equal(theme.glass.shine, "rgba(255,183,74,.26)");
  assert.match(theme.glass.shadow, /rgba\(0,0,0/);
});
