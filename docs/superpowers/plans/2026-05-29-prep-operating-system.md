# Prep Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build guided prep missions, JD Copilot, and structured mock replay timelines that connect existing InterviewIQ signals.

**Architecture:** Add deterministic data builders in `lib/prepInsights.mjs` and `lib/careerToolkit.mjs`, then render them through the existing welcome dashboard components. Keep state in existing localStorage-backed toolkit storage.

**Tech Stack:** Next.js, React components, Node test runner, localStorage persistence.

---

### Task 1: Guided Prep Mission Logic

**Files:**
- Modify: `lib/prepInsights.mjs`
- Test: `test/prepInsights.test.mjs`

- [ ] Write failing tests for `buildGuidedPrepMissions`.
- [ ] Run `node --test test/prepInsights.test.mjs` and confirm the new test fails because the function is missing.
- [ ] Implement `buildGuidedPrepMissions` using profile, topics, weak spots, mock scores, mistake bank, interviews, resume analysis, JD analysis, proof stories, and activity data.
- [ ] Re-run the targeted test.

### Task 2: JD Copilot Logic

**Files:**
- Modify: `lib/careerToolkit.mjs`
- Test: `test/careerToolkit.test.mjs`

- [ ] Write failing tests for enriched `analyzeJobDescriptionFit` output: `mustKnowSkills`, `likelyQuestions`, `resumeRewriteSuggestions`, `gapUrgency`, and `crashPlan`.
- [ ] Run `node --test test/careerToolkit.test.mjs` and confirm the new test fails.
- [ ] Implement deterministic JD Copilot fields using existing skill matching.
- [ ] Re-run the targeted test.

### Task 3: Mock Replay Timeline Logic

**Files:**
- Modify: `lib/prepInsights.mjs`
- Test: `test/prepInsights.test.mjs`

- [ ] Write failing assertions for replay `steps` and `actions`.
- [ ] Run the targeted test and confirm it fails.
- [ ] Extend `deriveMockReplayTimelines` to emit structured timeline steps and actions while preserving existing fields.
- [ ] Re-run the targeted test.

### Task 4: UI Integration

**Files:**
- Modify: `components/welcome/PrepInsightsPanel.js`
- Modify: `components/welcome/CareerToolkit.js`
- Test: `test/featureFlowUi.test.mjs`
- Test: `test/careerToolkitUi.test.mjs`

- [ ] Add UI source tests for Guided Prep Mission, JD Copilot, and replay timeline labels.
- [ ] Run the UI source tests and confirm they fail.
- [ ] Render mission cards in `PrepInsightsPanel`.
- [ ] Render JD Copilot sections in `CareerToolkit`.
- [ ] Render part-wise replay timeline and action buttons in `PrepInsightsPanel`.
- [ ] Re-run UI source tests.

### Task 5: Docs And Verification

**Files:**
- Modify: `README.md`

- [ ] Update README feature list.
- [ ] Run `node --test test/*.test.mjs`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Check ports 3000, 3001, and 3002 are not left running.
