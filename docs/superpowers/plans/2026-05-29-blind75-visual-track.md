# Blind 75 Visual Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Blind 75 Visual Track to DSA Visual Lab with reusable interview-pattern visualizers, original problem coaching, selected-stack code templates, quizzes, and mock practice actions.

**Architecture:** Add a focused Blind 75 metadata module, extend the existing DSA visual engine to accept problem-backed lessons, and add a track/filter selector to the current DSA Lab component. Keep all visuals in the existing theater so the experience stays cohesive.

**Tech Stack:** Next.js, React, Node test runner, local ES modules, inline component styles matching the current app.

---

### Task 1: Blind 75 Data Contract

**Files:**
- Create: `test/blind75VisualTrack.test.mjs`
- Create: `lib/blind75VisualTrack.mjs`

- [ ] **Step 1: Write failing tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURED_BLIND75_IDS,
  getBlind75Problem,
  listBlind75Problems,
  listBlind75Visualizers,
} from "../lib/blind75VisualTrack.mjs";

test("Blind 75 track contains complete original metadata", () => {
  const problems = listBlind75Problems();
  assert.equal(problems.length, 75);
  assert.equal(new Set(problems.map((problem) => problem.id)).size, 75);
  assert.equal(FEATURED_BLIND75_IDS.length, 15);
  for (const problem of problems) {
    assert.ok(problem.title.length > 3);
    assert.ok(problem.summary.length > 20);
    assert.ok(problem.invariant.length > 20);
    assert.ok(problem.quiz.question.includes("?"));
    assert.ok(problem.quiz.answer.length > 15);
    assert.ok(problem.edgeCases.length >= 2);
    assert.ok(problem.defaultInput !== undefined);
    assert.ok(problem.visualizerId);
  }
});

test("Blind 75 track exposes the requested reusable visualizers", () => {
  const visualizers = listBlind75Visualizers().map((item) => item.id);
  assert.deepEqual(
    ["arrays-hashing", "two-pointers", "sliding-window", "stack", "binary-search", "linked-list", "trees", "graphs", "dp"].every((id) => visualizers.includes(id)),
    true,
  );
});

test("returns a complete featured problem", () => {
  const problem = getBlind75Problem("two-sum");
  assert.equal(problem.title, "Two Sum");
  assert.equal(problem.featured, true);
  assert.ok(problem.mockPrompt.includes("Two Sum"));
});
```

- [ ] **Step 2: Verify red**

Run: `node --test test/blind75VisualTrack.test.mjs`

Expected: fail because `lib/blind75VisualTrack.mjs` does not exist.

- [ ] **Step 3: Implement metadata module**

Create `lib/blind75VisualTrack.mjs` with `FEATURED_BLIND75_IDS`, `BLIND75_VISUALIZERS`, `BLIND75_PROBLEMS`, `listBlind75Problems`, `getBlind75Problem`, `listBlind75Visualizers`, `buildBlind75VisualLesson`, and `getBlind75ProblemCodeTemplate`.

- [ ] **Step 4: Verify green**

Run: `node --test test/blind75VisualTrack.test.mjs`

Expected: pass.

### Task 2: Visual Engine Support

**Files:**
- Modify: `test/dsaVisualLab.test.mjs`
- Modify: `lib/dsaVisualLab.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that `buildDsaVisualizationState("blind75-two-sum")` returns map/table state, `buildDsaVisualizationState("blind75-binary-search")` returns low/mid/high state, and `getDsaCodeTemplate("blind75-two-sum", "Java")` returns Java code.

- [ ] **Step 2: Verify red**

Run: `node --test test/dsaVisualLab.test.mjs`

Expected: fail because Blind 75 ids are not recognized by the visual engine.

- [ ] **Step 3: Implement engine support**

Import the Blind 75 module, resolve `blind75-*` lessons in `getDsaVisualLesson`, let `normalizeInput` use `lesson.defaultInput`, route side panels through `lesson.visualizerId`, and prefer problem-specific code templates in `getDsaCodeTemplate`.

- [ ] **Step 4: Verify green**

Run: `node --test test/dsaVisualLab.test.mjs test/blind75VisualTrack.test.mjs`

Expected: pass.

### Task 3: DSA Lab UI Track

**Files:**
- Modify: `components/dsa/DsaVisualLab.js`
- Modify: `test/featureFlowUi.test.mjs`

- [ ] **Step 1: Write failing UI source tests**

Assert the component contains `Blind 75 Visual Track`, `Featured 15`, `All 75`, `Pattern visualizer`, and `Edge cases`.

- [ ] **Step 2: Verify red**

Run: `node --test test/featureFlowUi.test.mjs`

Expected: fail because the UI labels are missing.

- [ ] **Step 3: Implement UI**

Add the track segmented control, featured/all filter, Blind 75 problem grid, current problem context panel, edge cases, and problem-aware mock practice.

- [ ] **Step 4: Verify green**

Run: `node --test test/featureFlowUi.test.mjs`

Expected: pass.

### Task 4: Docs and Full Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README**

Describe the Blind 75 Visual Track and selected-stack problem templates.

- [ ] **Step 2: Run full verification**

Run:

```bash
node --test test/*.test.mjs
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 3: Stop local servers and check ports**

Run:

```bash
ps -axo pid,command | rg "next dev|next-server|npm run dev|node_modules/.bin/next|:3000|:3001|:3002" || true
```

Expected: no app server left running on ports 3000, 3001, or 3002.
