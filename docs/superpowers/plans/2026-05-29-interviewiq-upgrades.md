# InterviewIQ Upgrade Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Company Prep Room, Answer Coach, Resume Bullet Generator, Weak Spot Radar, and Real Pressure Mode.

**Architecture:** Extend existing deterministic prep modules and render them in existing dashboard/chat surfaces. Keep local-only state and reuse existing prompts/action paths.

**Tech Stack:** Next.js, React, localStorage, Node test runner.

---

### Task 1: Pure Logic

**Files:**
- Modify: `lib/prepInsights.mjs`
- Modify: `lib/companyPrep.mjs`
- Modify: `lib/chatPrompt.mjs`
- Test: `test/prepInsights.test.mjs`
- Test: `test/companyPrep.test.mjs`
- Test: `test/chatPrompt.test.mjs`

- [ ] Add failing tests for answer coach actions, resume bullet generation, weak spot radar, company prep room, and real pressure prompt mode.
- [ ] Implement minimal deterministic builders.
- [ ] Re-run targeted tests.

### Task 2: UI Wiring

**Files:**
- Modify: `components/welcome/PrepInsightsPanel.js`
- Modify: `components/company/CompanyPrep.js`
- Modify: `pages/index.js`
- Test: `test/featureFlowUi.test.mjs`

- [ ] Add failing UI source tests for visible labels and mode wiring.
- [ ] Render new sections/actions in the existing panels.
- [ ] Re-run UI source tests.

### Task 3: Docs And Verification

**Files:**
- Modify: `README.md`

- [ ] Update README features.
- [ ] Run all tests, lint, build, browser smoke if available, and port sweep.
