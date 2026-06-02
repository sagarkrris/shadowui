# System Design Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the System Design Canvas into a System Design Studio that accepts prompts such as `Implement Ticket Booking System`, generates local HLD/LLD guidance, and exposes an interview/design-pattern learning rail inspired by common system-design and pattern-catalog structures.

**Architecture:** Add pure blueprint/pattern helpers in `lib/systemDesignCanvas.mjs`, then render them in the existing `components/system-design/SystemDesignCanvas.js` workspace. Keep AI integration through the existing `onAction` pathway so generated local guidance is instant and users can still ask for deeper HLD/LLD review through `/api/chat`.

**Tech Stack:** Next.js pages app, React components, local `node:test` coverage, existing chat API workflow.

---

### Task 1: Studio Domain Helpers

**Files:**
- Modify: `lib/systemDesignCanvas.mjs`
- Modify: `test/systemDesignCanvas.test.mjs`

- [ ] Write failing tests for `buildSystemDesignStudioBlueprint`, `buildSystemDesignStudioPrompt`, and `SYSTEM_DESIGN_PATTERN_LIBRARY`.
- [ ] Verify the tests fail because the helpers do not exist.
- [ ] Implement deterministic HLD/LLD blueprint generation from a problem statement, including requirements, APIs, services, data model, flows, scaling, risks, LLD classes, design patterns, schema, and interview questions.
- [ ] Verify the focused system design tests pass.

### Task 2: Studio UI

**Files:**
- Modify: `components/system-design/SystemDesignCanvas.js`
- Modify: `test/systemDesignCanvas.test.mjs`

- [ ] Write failing source-level tests that assert the Studio UI exposes `Generate HLD + LLD`, `HLD`, `LLD`, `Patterns`, and `Interview`.
- [ ] Implement a multi-line problem prompt, generate button, HLD/LLD blueprint panels, pattern rail, and interview prompt actions.
- [ ] Keep the existing Review, Mock, Export, and canvas textareas working.
- [ ] Verify focused tests pass.

### Task 3: Integration Verification

**Files:**
- Existing UI and test files only.

- [ ] Run focused system design tests.
- [ ] Run related feature-flow tests.
- [ ] Run `npm run build`.
- [ ] Report live/deployed testing recommendation separately from local mocked Playwright coverage.
