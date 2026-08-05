import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_TECH_THEME,
  getTechTheme,
  getWorkspaceTheme,
} from "../lib/techTheme.mjs";

test("returns the Java theme when Java is the selected stack", () => {
  const theme = getTechTheme("Java, Spring Boot, PostgreSQL");

  assert.equal(theme.key, "java");
  assert.equal(theme.icon, "ti-brand-java");
  assert.equal(theme.accent, "#9a6a2f");
  assert.equal(theme.accentStrong, "#c89a5a");
});

test("builds a readable light workspace theme without losing stack accents", () => {
  const theme = getWorkspaceTheme(getTechTheme("Java"), "chat", "light");

  assert.equal(theme.surface, "#f4f7fb");
  assert.equal(theme.appearance, "light");
  assert.equal(theme.accent, "#5b6f8f");
  assert.equal(theme.accentText, "#17324d");
  assert.equal(theme.glass.panelStrong, "rgba(255,255,255,.98)");
});

test("returns the Python theme when Python is the selected stack", () => {
  const theme = getTechTheme("Python, Django, PostgreSQL");

  assert.equal(theme.key, "python");
  assert.equal(theme.icon, "ti-brand-python");
  assert.equal(theme.accent, "#315f8d");
  assert.equal(theme.accentStrong, "#82a9cc");
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
  assert.equal(theme.surface, "#132238");
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

test("uses refined enterprise color families for major stack groups", () => {
  assert.deepEqual(
    ["java", "python", "azure", "docker", "react", "go", "node", "mongodb", "sql", "aws", "rust", "sap", "postgresql"].map((stack) => {
      const theme = getTechTheme(stack);
      return [theme.key, theme.accent, theme.accentStrong, theme.surface];
    }),
    [
      ["java", "#9a6a2f", "#c89a5a", "#1b1814"],
      ["python", "#315f8d", "#82a9cc", "#101823"],
      ["azure", "#2e6694", "#83add1", "#101823"],
      ["docker", "#2f6e9c", "#7fb2d6", "#101824"],
      ["react", "#25768d", "#71b9c8", "#0f1a21"],
      ["go", "#247984", "#72bdc7", "#0f1a1f"],
      ["node", "#4d7752", "#91b58f", "#111a15"],
      ["mongodb", "#4b7654", "#90b58f", "#111a15"],
      ["sql", "#94672f", "#c59a58", "#1b1711"],
      ["aws", "#9c6b2e", "#d0a261", "#1b1710"],
      ["rust", "#9b6544", "#c9966f", "#1d1612"],
      ["sap", "#426f86", "#8fb4c8", "#111922"],
      ["postgresql", "#466b88", "#8baec8", "#111923"],
    ],
  );
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

  assert.equal(theme.glass.panel, "rgba(27,24,20,.74)");
  assert.equal(theme.glass.panelStrong, "rgba(27,24,20,.90)");
  assert.equal(theme.glass.tint, "rgba(154,106,47,.12)");
  assert.equal(theme.glass.shine, "rgba(200,154,90,.08)");
  assert.match(theme.glass.shadow, /rgba\(2,12,26/);
});

test("keeps stack identity while giving each workspace a different room theme", () => {
  const baseTheme = getTechTheme("Java, Spring Boot");
  const workspaceThemes = ["chat", "company", "canvas", "designLab", "scenarioBank", "javaDigest", "dsaLab", "course"]
    .map((activeTab) => getWorkspaceTheme(baseTheme, activeTab));

  assert.deepEqual(workspaceThemes.map((theme) => theme.key), Array(8).fill("java"));
  assert.deepEqual(workspaceThemes.map((theme) => theme.icon), Array(8).fill("ti-brand-java"));
  assert.equal(new Set(workspaceThemes.map((theme) => theme.accent)).size, workspaceThemes.length);
  assert.equal(new Set(workspaceThemes.map((theme) => theme.surface)).size, workspaceThemes.length);
  assert.equal(workspaceThemes[0].stackAccent, "#9a6a2f");
});

test("uses polished room palettes for major workspace windows", () => {
  const baseTheme = getTechTheme("Python, Azure");

  assert.deepEqual(
    ["chat", "company", "canvas", "designLab", "scenarioBank", "javaDigest", "dsaLab", "course"].map((activeTab) => {
      const theme = getWorkspaceTheme(baseTheme, activeTab);
      return [theme.workspaceKey, theme.accent, theme.accentStrong, theme.surface, theme.background.glyphs[0]];
    }),
    [
      ["chat", "#5b6f8f", "#9fb2d1", "#101c2d", "Mock Round"],
      ["company", "#7a6836", "#d0b76f", "#17253a", "Company Prep"],
      ["canvas", "#3f6f86", "#8eb8ca", "#122238", "Architecture"],
      ["designLab", "#6d678f", "#aaa4ce", "#18233a", "HLD"],
      ["scenarioBank", "#58744d", "#a0ba8c", "#14243a", "Scenarios"],
      ["javaDigest", "#936734", "#c89d61", "#17263d", "Java Digest"],
      ["dsaLab", "#287c7d", "#79c2bd", "#10263a", "DSA Lab"],
      ["course", "#7b5d79", "#c09bbb", "#1d243b", "Course"],
    ],
  );
});
