import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const componentUrl = new URL("../components/scenario-bank/ScenarioBank.js", import.meta.url);
const componentSource = existsSync(componentUrl) ? readFileSync(componentUrl, "utf8") : "";
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const sessionSource = readFileSync(new URL("../lib/sessionPersistence.mjs", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../lib/workspaces.mjs", import.meta.url), "utf8");

test("scenario bank workspace renders tracks engines drills and detailed answers", () => {
  assert.match(componentSource, /SCENARIO_BANK_TRACKS/);
  assert.match(componentSource, /DATABASE_ENGINES/);
  assert.match(componentSource, /Scenario Bank/);
  assert.match(componentSource, /Java/);
  assert.match(componentSource, /Database/);
  assert.match(componentSource, /PostgreSQL/);
  assert.match(componentSource, /MySQL/);
  assert.match(componentSource, /MongoDB/);
  assert.match(componentSource, /Redis/);
  assert.match(componentSource, /Timed Drill/);
  assert.match(componentSource, /Practice as Mock/);
  assert.match(componentSource, /Generate Fresh Scenario/);
  assert.match(componentSource, /Fresh Local Scenario/);
  assert.match(componentSource, /Generated Variant/);
  assert.match(componentSource, /buildLocalScenarioVariant/);
  assert.match(componentSource, /setGeneratedScenario/);
  assert.match(componentSource, /Deep-Dive Answer/);
  assert.match(componentSource, /Common Traps/);
  assert.match(componentSource, /Follow-ups/);
  assert.match(componentSource, /onAction/);
  assert.match(componentSource, /overflowWrap/);
  assert.match(componentSource, /minmax\(min\(100%/);
});

test("scenario bank is wired as a first-class workspace", () => {
  assert.match(indexSource, /ScenarioBank/);
  assert.match(indexSource, /activeTab==="scenarioBank"/);
  assert.match(workspaceSource, /Scenario Bank/);
  assert.match(workspaceSource, /ti-database-search|ti-database/);
  assert.match(indexSource, /startScenarioBankAction/);
  assert.match(sessionSource, /normalizeWorkspaceTab/);
  assert.match(workspaceSource, /scenarioBank/);
});
