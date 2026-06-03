# Java + Database Scenario Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-class Scenario Bank workspace for Java and selected database engines with local scenario seeds, detailed answers, AI variant prompts, and mock handoff.

**Architecture:** Add pure scenario-bank helpers in `lib/scenarioBank.mjs`, render them through `components/scenario-bank/ScenarioBank.js`, and wire the workspace into the existing `pages/index.js` active-tab shell. Keep AI generation and mock practice on the current `onAction(prompt, metadata)` chat path.

**Tech Stack:** Next.js Pages, React, local `node:test` tests, source-level UI tests, existing session persistence, existing responsive Playwright suite.

---

## File Structure

- Create `lib/scenarioBank.mjs`: metadata, curated seeds, state normalization, filtering, and prompt builders.
- Create `test/scenarioBank.test.mjs`: pure helper tests.
- Create `components/scenario-bank/ScenarioBank.js`: Scenario Bank workspace UI.
- Create `test/scenarioBankUi.test.mjs`: source-level UI/app wiring tests.
- Modify `lib/sessionPersistence.mjs`: persist `activeTab: "scenarioBank"`.
- Modify `test/sessionPersistence.test.mjs`: preserve Scenario Bank across refresh.
- Modify `pages/index.js`: import/render Scenario Bank, add desktop/mobile navigation, and chat action handoff.
- Modify `e2e/responsive-nonfunctional.spec.js`: include Scenario Bank in mobile no-overflow regression.

### Task 1: Scenario Bank Domain Module

**Files:**
- Create: `test/scenarioBank.test.mjs`
- Create: `lib/scenarioBank.mjs`

- [ ] **Step 1: Write failing domain tests**

Create `test/scenarioBank.test.mjs` with tests that import:

```js
import {
  DATABASE_ENGINES,
  SCENARIO_BANK_TRACKS,
  buildScenarioAnswerPrompt,
  buildScenarioMockPrompt,
  buildScenarioVariantPrompt,
  createScenarioBankState,
  getScenarioSeed,
  listScenarioBankTopics,
  listScenarioSeeds,
} from "../lib/scenarioBank.mjs";
```

Assert:

```js
assert.ok(SCENARIO_BANK_TRACKS.some((track) => track.key === "java"));
assert.ok(SCENARIO_BANK_TRACKS.some((track) => track.key === "database"));
assert.deepEqual(DATABASE_ENGINES.map((engine) => engine.key), ["postgresql", "mysql", "mongodb", "redis"]);
assert.equal(createScenarioBankState({ track: "database", engine: "mongodb", difficulty: "Senior", mode: "Mock Interview" }).engine, "mongodb");
assert.equal(createScenarioBankState({ track: "unknown", engine: "oracle" }).track, "java");
assert.ok(listScenarioBankTopics("java").some((topic) => topic.key === "concurrency"));
assert.ok(listScenarioBankTopics("database", "redis").some((topic) => topic.key === "caching-patterns"));
assert.ok(listScenarioSeeds({ track: "java", topic: "concurrency" }).length > 0);
assert.ok(listScenarioSeeds({ track: "database", engine: "postgresql" }).some((seed) => seed.engine === "postgresql"));
assert.equal(getScenarioSeed("java-thread-pool-saturation").id, "java-thread-pool-saturation");
```

Also assert prompt builders include selected engine/topic/difficulty and request scenario, traps, follow-ups, and rubric.

- [ ] **Step 2: Run red**

Run:

```bash
node --test test/scenarioBank.test.mjs
```

Expected: FAIL because `lib/scenarioBank.mjs` does not exist.

- [ ] **Step 3: Implement minimal domain module**

Create `lib/scenarioBank.mjs` with:

- two tracks: Java and Database
- four database engines: PostgreSQL, MySQL, MongoDB, Redis
- normalized state defaults: Java, Core Java, Mid, Learn
- local seed scenarios for Java concurrency, Java collections, Spring Boot transactions, PostgreSQL indexes, MySQL deadlocks, MongoDB modeling, Redis cache stampede
- detailed seed answer fields: `answerOutline`, `deepDive`, `traps`, `followUps`, `rubric`
- prompt builders for variant, answer expansion, and mock interview

- [ ] **Step 4: Run green**

Run:

```bash
node --test test/scenarioBank.test.mjs
```

Expected: PASS.

### Task 2: Scenario Bank Workspace UI

**Files:**
- Create: `test/scenarioBankUi.test.mjs`
- Create: `components/scenario-bank/ScenarioBank.js`

- [ ] **Step 1: Write failing UI source tests**

Create `test/scenarioBankUi.test.mjs` that reads component source and asserts it contains:

```js
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
assert.match(componentSource, /Deep-Dive Answer/);
assert.match(componentSource, /Common Traps/);
assert.match(componentSource, /Follow-ups/);
assert.match(componentSource, /onAction/);
assert.match(componentSource, /overflowWrap/);
assert.match(componentSource, /minmax\\(min\\(100%/);
```

- [ ] **Step 2: Run red**

Run:

```bash
node --test test/scenarioBankUi.test.mjs
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement workspace component**

Create `components/scenario-bank/ScenarioBank.js`:

- import helpers from `../../lib/scenarioBank.mjs`
- keep local state from `createScenarioBankState`
- render selectors for track, database engine, topic, difficulty, and mode
- render scenario cards with local detailed answer content
- provide action buttons:
  - `Generate Fresh Scenario` calls `buildScenarioVariantPrompt`
  - `Explain Answer` calls `buildScenarioAnswerPrompt`
  - `Practice as Mock` calls `buildScenarioMockPrompt`
- use mobile-safe grids with `gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))"`

- [ ] **Step 4: Run green**

Run:

```bash
node --test test/scenarioBankUi.test.mjs test/scenarioBank.test.mjs
```

Expected: PASS.

### Task 3: App Wiring, Persistence, And Mobile Regression

**Files:**
- Modify: `pages/index.js`
- Modify: `lib/sessionPersistence.mjs`
- Modify: `test/sessionPersistence.test.mjs`
- Modify: `test/scenarioBankUi.test.mjs`
- Modify: `e2e/responsive-nonfunctional.spec.js`

- [ ] **Step 1: Write failing app wiring tests**

Extend `test/scenarioBankUi.test.mjs` to read `pages/index.js` and `lib/sessionPersistence.mjs`, then assert:

```js
assert.match(indexSource, /ScenarioBank/);
assert.match(indexSource, /activeTab==="scenarioBank"/);
assert.match(indexSource, /Scenario Bank/);
assert.match(indexSource, /ti-database-search|ti-database/);
assert.match(indexSource, /startScenarioBankAction/);
assert.match(sessionSource, /scenarioBank/);
```

Add to `test/sessionPersistence.test.mjs`:

```js
test("preserves the scenario bank tab across refreshes", () => {
  const storage = memoryStorage();
  const snapshot = createSessionSnapshot({ activeTab: "scenarioBank" });
  saveSessionSnapshot(storage, snapshot);
  assert.equal(loadSessionSnapshot(storage).activeTab, "scenarioBank");
});
```

- [ ] **Step 2: Run red**

Run:

```bash
node --test test/scenarioBankUi.test.mjs test/sessionPersistence.test.mjs
```

Expected: FAIL because `scenarioBank` is not wired.

- [ ] **Step 3: Implement app wiring**

Update `pages/index.js`:

- import `ScenarioBank`
- add `startScenarioBankAction(prompt)` using `roundStrategy: "systemDesign"` or `coding` based on metadata, `displayText: "Scenario Bank practice"`, and `skipQuestionMemory: true`
- add top-bar and mobile nav entries labeled `Scenario Bank`
- add title mapping
- render `<ScenarioBank theme={techTheme} onAction={startScenarioBankAction} />`

Update `lib/sessionPersistence.mjs` to whitelist `scenarioBank`.

- [ ] **Step 4: Add mobile regression coverage**

Extend `e2e/responsive-nonfunctional.spec.js` mobile overflow test to click `Scenario Bank`, assert the workspace heading is visible, and run `expectNoMobileHorizontalOverflow(page, "Scenario Bank")`.

- [ ] **Step 5: Run focused verification**

Run:

```bash
node --test test/scenarioBank.test.mjs test/scenarioBankUi.test.mjs test/sessionPersistence.test.mjs
npm run lint
```

Expected: PASS with no ESLint warnings or errors.

