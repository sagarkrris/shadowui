# DSA Confidence Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add confidence-trainer behavior to DSA Visual Lab with mastery progress, mistake replay, code walkthrough, test-case training, and Blind 75 readiness filters.

**Architecture:** Keep generated Blind 75 learning metadata in `lib/blind75VisualTrack.mjs`, expose it through existing lesson builders in `lib/dsaVisualLab.mjs`, and render progress-driven panels in `components/dsa/DsaVisualLab.js`. Store progress in browser localStorage only.

**Tech Stack:** Next.js, React, Node test runner, localStorage.

---

### Task 1: Metadata And Progress Helpers

**Files:**
- Modify: `lib/blind75VisualTrack.mjs`
- Test: `test/blind75VisualTrack.test.mjs`

- [ ] Add tests proving all 75 problems expose `masteryChecklist`, `testCases`, and `codeWalkthrough`.
- [ ] Add tests for creating progress state, recording mastery steps, recording mistakes, summarizing progress, and filtering by difficulty/status.
- [ ] Implement generated metadata and progress helpers.
- [ ] Run `node --test test/blind75VisualTrack.test.mjs` and confirm the new tests pass.

### Task 2: Lesson Exposure

**Files:**
- Modify: `lib/blind75VisualTrack.mjs`
- Modify: `lib/dsaVisualLab.mjs`
- Test: `test/dsaVisualLab.test.mjs`

- [ ] Add tests proving Blind 75 visual lessons expose trainer content and code walkthrough steps.
- [ ] Return trainer fields from `buildBlind75VisualLesson`.
- [ ] Run `node --test test/dsaVisualLab.test.mjs`.

### Task 3: UI Trainer Panels

**Files:**
- Modify: `components/dsa/DsaVisualLab.js`
- Test: `test/featureFlowUi.test.mjs`

- [ ] Add source-level UI tests for Pattern Mastery Mode, Mistake Replay, Code Walkthrough, Test Case Trainer, readiness filters, and progress counts.
- [ ] Render progress summary, filters, status chips, mastery checklist, mistake replay, code walkthrough, and test-case trainer.
- [ ] Preserve root `overflow: "visible"` and avoid nested All 75 `overflowY`/`maxHeight`.
- [ ] Run `node --test test/featureFlowUi.test.mjs`.

### Task 4: Docs And Full Verification

**Files:**
- Modify: `README.md`

- [ ] Update README feature bullets for DSA confidence trainer.
- [ ] Run `node --test test/*.test.mjs`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the dev server, perform browser QA for desktop, tablet, and mobile DSA Lab workflows, then stop all app servers on ports 3000, 3001, and 3002.
