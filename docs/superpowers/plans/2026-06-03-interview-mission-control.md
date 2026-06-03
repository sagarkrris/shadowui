# Interview Mission Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided home-panel that turns existing prep signals into three next-best interview actions.

**Architecture:** Put mission selection and persistence helpers in a focused `lib/interviewMissionControl.mjs` module. Render the missions from a new `components/welcome/InterviewMissionControl.js` component, then wire it into `Welcome` and `pages/index.js` so actions can either start a mock prompt or open the right workspace.

**Tech Stack:** Next.js/React, existing localStorage adapter, Node `node:test`, existing glass UI tokens.

---

### Task 1: Mission Engine

**Files:**
- Create: `lib/interviewMissionControl.mjs`
- Test: `test/interviewMissionControl.test.mjs`

- [ ] Write failing tests for building three missions, choosing selected database engines, preserving local completion state, and creating workspace/action prompts.
- [ ] Implement `buildInterviewMissionControl`, `createMissionControlState`, and `recordMissionCompletion`.
- [ ] Verify with `node --test test/interviewMissionControl.test.mjs`.

### Task 2: Mission UI

**Files:**
- Create: `components/welcome/InterviewMissionControl.js`
- Modify: `components/welcome/Welcome.js`
- Test: `test/interviewMissionControl.test.mjs`

- [ ] Write failing source-level UI tests that assert the prep home imports and renders Interview Mission Control.
- [ ] Implement the panel with mission cards, Start/Open/Done controls, compact responsive layout, and local persistence.
- [ ] Verify with `node --test test/interviewMissionControl.test.mjs`.

### Task 3: App Wiring and QA

**Files:**
- Modify: `pages/index.js`

- [ ] Pass `onOpenWorkspace` from the page shell to `Welcome`.
- [ ] Use `setActiveTab` for workspace navigation without clearing profile or chat state.
- [ ] Run `node --test test/*.mjs`.
- [ ] Run `npm run lint`.
- [ ] Browser-check `http://127.0.0.1:3001/` to confirm Mission Control renders and buttons are visible on the prep home.
