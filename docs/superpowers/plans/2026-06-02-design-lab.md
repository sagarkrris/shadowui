# Design Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class Design Lab workspace for design patterns, HLD, LLD, and guided practice inspired by catalog-style and system-design learning flows without copying third-party content.

**Architecture:** Add a focused `lib/designLab.mjs` data/prompt module and a `components/design-lab/DesignLab.js` workspace component. Wire the workspace into `pages/index.js` as a new `activeTab` sibling to Course, DSA Lab, Canvas, and Company Prep, and persist it through `lib/sessionPersistence.mjs`.

**Tech Stack:** Next.js Pages, React, local deterministic content modules, Node test runner, Playwright smoke script.

---

### Task 1: Design Lab Domain Module

**Files:**
- Create: `lib/designLab.mjs`
- Test: `test/designLab.test.mjs`

- [ ] **Step 1: Write failing tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  DESIGN_LAB_CATALOG,
  buildDesignLabPracticePrompt,
  getDesignLabPattern,
  listDesignLabPracticeSystems,
} from "../lib/designLab.mjs";

test("catalog separates patterns HLD LLD and practice tracks", () => {
  assert.equal(DESIGN_LAB_CATALOG.patterns.label, "Design Patterns");
  assert.equal(DESIGN_LAB_CATALOG.hld.label, "HLD");
  assert.equal(DESIGN_LAB_CATALOG.lld.label, "LLD");
  assert.ok(DESIGN_LAB_CATALOG.patterns.groups.creational.length > 0);
  assert.ok(DESIGN_LAB_CATALOG.hld.questionBreakdowns.length > 0);
  assert.ok(DESIGN_LAB_CATALOG.lld.practiceTasks.length > 0);
});

test("patterns expose intent code examples and interview traps", () => {
  const strategy = getDesignLabPattern("strategy");
  assert.equal(strategy.name, "Strategy");
  assert.match(strategy.javaExample, /interface/);
  assert.match(strategy.springBootExample, /@Service|@Component/);
  assert.ok(strategy.interviewTraps.length > 0);
});

test("practice systems build interview-ready prompts", () => {
  const systems = listDesignLabPracticeSystems();
  assert.ok(systems.some((system) => system.id === "ticket-booking"));
  const prompt = buildDesignLabPracticePrompt("ticket-booking");
  assert.match(prompt, /HLD/);
  assert.match(prompt, /LLD/);
  assert.match(prompt, /Ticket Booking/);
});
```

- [ ] **Step 2: Run test to verify red**

Run: `node --test test/designLab.test.mjs`
Expected: FAIL because `lib/designLab.mjs` does not exist.

- [ ] **Step 3: Implement data and helpers**

Create `DESIGN_LAB_CATALOG` with `patterns`, `hld`, `lld`, and `practice` sections. Export `getDesignLabPattern`, `listDesignLabPracticeSystems`, and `buildDesignLabPracticePrompt`.

- [ ] **Step 4: Run test to verify green**

Run: `node --test test/designLab.test.mjs`
Expected: PASS.

### Task 2: Design Lab Workspace UI

**Files:**
- Create: `components/design-lab/DesignLab.js`
- Test: `test/designLabUi.test.mjs`

- [ ] **Step 1: Write failing UI source tests**

Assert the component imports `DESIGN_LAB_CATALOG`, renders tabs for `Patterns`, `HLD`, `LLD`, and `Practice`, and exposes action buttons that call `onAction`.

- [ ] **Step 2: Implement component**

Build a dense, work-focused workspace with tabs, catalog cards, Java/Spring examples, HLD/LLD learning tracks, and practice systems.

- [ ] **Step 3: Run UI tests**

Run: `node --test test/designLabUi.test.mjs`
Expected: PASS.

### Task 3: App Navigation And Persistence

**Files:**
- Modify: `pages/index.js`
- Modify: `lib/sessionPersistence.mjs`
- Test: `test/designLabUi.test.mjs`
- Test: `test/sessionPersistence.test.mjs`

- [ ] **Step 1: Write failing tests**

Assert `DesignLab` is imported/rendered, top nav/mobile nav include `Design Lab`, and `activeTab: "designLab"` persists.

- [ ] **Step 2: Wire navigation**

Add `DesignLab` import, new top-bar button, title mapping, render branch, mobile nav item, and session active-tab whitelist.

- [ ] **Step 3: Run focused tests**

Run: `node --test test/designLab.test.mjs test/designLabUi.test.mjs test/sessionPersistence.test.mjs`
Expected: PASS.

### Task 4: Verification

**Files:**
- Temporary smoke script in `/private/tmp` if needed.

- [ ] **Step 1: Run full Node suite**

Run: `node --test test/*.mjs`
Expected: PASS.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: successful Next.js production build.

- [ ] **Step 3: Browser smoke**

Start dev server on `127.0.0.1:3001`, open Design Lab, click `Patterns`, `HLD`, `LLD`, and `Practice`, and verify content renders without overflow.
