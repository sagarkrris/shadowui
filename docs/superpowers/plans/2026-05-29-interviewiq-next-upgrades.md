# InterviewIQ Next Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Question Memory + Mastery Map, Interview Recording Review, System Design Canvas, Role Pack Builder, and Final Interview Report.

**Architecture:** Add focused pure helper modules first, then wire them into existing welcome, prep insights, career toolkit, and navigation surfaces. Keep storage local-first and use existing chat actions for AI review.

**Tech Stack:** Next.js pages router, React components, Node test runner, localStorage, existing Gemini chat API.

---

### Task 1: Question Memory + Mastery Map

**Files:**
- Create: `lib/questionMemory.mjs`
- Test: `test/questionMemory.test.mjs`
- Modify: `lib/practicePacks.mjs`
- Modify: `components/welcome/PracticePack.js`

- [ ] Write failing tests for memory normalization, attempt recording, mastery statuses, due reviews, and memory-aware question ordering.
- [ ] Implement `QUESTION_MEMORY_STORAGE_KEY`, `loadQuestionMemory`, `saveQuestionMemory`, `recordQuestionAttempt`, `buildMasteryMap`, and `prioritizePracticeCards`.
- [ ] Add optional memory input to practice pack selection and render status labels.
- [ ] Run `node --test test/questionMemory.test.mjs test/practicePacks.test.mjs`.

### Task 2: Interview Recording Review

**Files:**
- Create: `lib/interviewRecordingReview.mjs`
- Create: `components/modals/RecordingReviewModal.js`
- Test: `test/interviewRecordingReview.test.mjs`
- Modify: `lib/voiceSupport.mjs`

- [ ] Write failing tests for transcript analysis, privacy-safe display text, prompt generation, empty transcript handling, and browser support detection.
- [ ] Implement local transcript analysis and review prompt builders.
- [ ] Add a modal with record/paste fallback, local analysis, clear transcript, and send-to-chat action.
- [ ] Run `node --test test/interviewRecordingReview.test.mjs test/voiceSupport.test.mjs`.

### Task 3: System Design Canvas

**Files:**
- Create: `lib/systemDesignCanvas.mjs`
- Create: `components/system-design/SystemDesignCanvas.js`
- Test: `test/systemDesignCanvas.test.mjs`
- Modify: `lib/sessionPersistence.mjs`

- [ ] Write failing tests for default state, normalization, review prompts, mock prompts, markdown export, and canvas tab persistence.
- [ ] Implement canvas helpers and component.
- [ ] Preserve `canvas` as a refresh-safe active tab.
- [ ] Run `node --test test/systemDesignCanvas.test.mjs test/sessionPersistence.test.mjs`.

### Task 4: Role Pack Builder + Final Report

**Files:**
- Create: `lib/rolePacks.mjs`
- Test: `test/rolePacks.test.mjs`
- Modify: `lib/prepReport.mjs`
- Modify: `components/welcome/CareerToolkit.js`
- Modify: `components/welcome/PrepInsightsPanel.js`

- [ ] Write failing tests for role pack detection, generated drills, report sections, and UI wiring.
- [ ] Implement role pack builder and wire visible role pack cards into Career Toolkit.
- [ ] Extend prep report markdown/html with final interview report sections.
- [ ] Run `node --test test/rolePacks.test.mjs test/prepReport.test.mjs test/featureFlowUi.test.mjs`.

### Task 5: Shared App Integration

**Files:**
- Modify: `pages/index.js`
- Modify: `components/welcome/Welcome.js`
- Modify: `components/welcome/PrepInsightsPanel.js`
- Modify: `test/featureFlowUi.test.mjs`
- Modify: `README.md`

- [ ] Wire question memory load/save, recording modal, canvas tab, role pack summary, mastery map, and final report exports into the existing app shell.
- [ ] Ensure chat requests can receive transient `apiText`, `displayText`, and forced `roundStrategy` without persisting raw recording transcripts.
- [ ] Update README.
- [ ] Run `node --test test/*.test.mjs`, `npm run lint`, `npm run build`, browser smoke, and final port sweep.
