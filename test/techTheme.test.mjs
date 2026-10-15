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

  assert.equal(theme.surface, "#f8f9fa");
  assert.equal(theme.appearance, "light");
  assert.equal(theme.accent, "#1967d2");
  assert.equal(theme.accentText, "#202124");
  assert.equal(theme.glass.panelStrong, "#ffffff");
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

test("keeps stack identity inside one consistent workspace palette", () => {
  const base = getTechTheme("Java, Spring Boot");
  for (const appearance of ["light", "dark"]) {
    const themes = ["chat", "company", "canvas", "designLab", "scenarioBank", "javaDigest", "dsaLab", "course"].map(id => getWorkspaceTheme(base, id, appearance));
    assert.deepEqual(themes.map(theme => theme.key), Array(8).fill("java"));
    assert.deepEqual(themes.map(theme => theme.icon), Array(8).fill("ti-brand-java"));
    assert.equal(new Set(themes.map(theme => theme.accent)).size, 1);
    assert.equal(new Set(themes.map(theme => theme.surface)).size, 1);
    assert.equal(themes[0].stackAccent, base.accent);
    for (const theme of themes) {
      assert.equal(theme.appearance, appearance);
      assert.equal(theme.glass.shadow, "none");
      assert.equal(theme.background.image, theme.surface);
      assert.deepEqual(theme.background.glyphs, []);
    }
  }
});

test("workspace palette retains readable text and action contrast in both appearances", () => {
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  for (const appearance of ["light", "dark"]) {
    const theme = getWorkspaceTheme(getTechTheme("Python, Azure"), "canvas", appearance);
    for (const [a,b] of [[theme.accentText,theme.panel],[theme.accentStrong,theme.panel],[theme.accentStrong,theme.accentSoft]]) {
      const x=luminance(a),y=luminance(b);
      assert.ok((Math.max(x,y)+.05)/(Math.min(x,y)+.05) >= 4.5);
    }
  }
});
