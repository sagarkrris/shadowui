import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const componentUrl = new URL("../components/design-lab/DesignLab.js", import.meta.url);
const componentSource = existsSync(componentUrl) ? readFileSync(componentUrl, "utf8") : "";
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const sessionSource = readFileSync(new URL("../lib/sessionPersistence.mjs", import.meta.url), "utf8");

test("design lab component renders catalog tabs and practice actions", () => {
  assert.match(componentSource, /DESIGN_LAB_CATALOG/);
  assert.match(componentSource, /Design Lab/);
  assert.match(componentSource, /Patterns/);
  assert.match(componentSource, /HLD/);
  assert.match(componentSource, /LLD/);
  assert.match(componentSource, /Practice/);
  assert.match(componentSource, /Java Example/);
  assert.match(componentSource, /Spring Boot Example/);
  assert.match(componentSource, /Interview Traps/);
  assert.match(componentSource, /onAction/);
  assert.match(componentSource, /buildDesignLabPracticePrompt/);
  assert.match(componentSource, /overflowWrap/);
});

test("design lab is wired as a first-class workspace", () => {
  assert.match(indexSource, /DesignLab/);
  assert.match(indexSource, /activeTab==="designLab"/);
  assert.match(indexSource, /Design Lab/);
  assert.match(indexSource, /ti-puzzle/);
  assert.match(indexSource, /startDesignLabAction/);
  assert.match(sessionSource, /designLab/);
});
