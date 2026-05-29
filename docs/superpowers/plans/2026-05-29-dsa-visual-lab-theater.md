# DSA Visual Lab Theater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade DSA Visual Lab from static lesson cards into an interview-focused visual trainer with guided stages, animation controls, side-state panels, narration, and selected-stack code templates.

**Architecture:** Keep algorithm lesson data in `lib/dsaVisualLab.mjs`, including stack-specific code generation and visual step metadata. Keep rendering and animation state in `components/dsa/DsaVisualLab.js`, receiving `profile` from `pages/index.js`. Extend existing source-level tests plus focused behavior tests for stack templates and UI wiring.

**Tech Stack:** Next.js pages router, React hooks, localStorage, Node test runner.

---

### Task 1: Stack-Aware DSA Code Templates

**Files:**
- Modify: `lib/dsaVisualLab.mjs`
- Modify: `test/dsaVisualLab.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests proving Java, Python, and JavaScript/React/Node stacks return different code templates for the same lesson.

- [ ] **Step 2: Run focused test**

Run: `node --test test/dsaVisualLab.test.mjs`
Expected: fail because `getDsaCodeTemplate` does not exist yet.

- [ ] **Step 3: Implement template resolver**

Add `detectDsaLanguage(stack)` and `getDsaCodeTemplate(lessonOrId, stack)` with Java-first support for Java profiles, Python for Python profiles, and JavaScript for JavaScript/React/Node/default profiles.

- [ ] **Step 4: Run focused test**

Run: `node --test test/dsaVisualLab.test.mjs`
Expected: pass.

### Task 2: Theater Step Metadata

**Files:**
- Modify: `lib/dsaVisualLab.mjs`
- Modify: `test/dsaVisualLab.test.mjs`

- [ ] **Step 1: Write failing tests**

Assert each visualization state step exposes `narration`, `changed`, `interviewScript`, `invariant`, and `sidePanel`.

- [ ] **Step 2: Run focused test**

Run: `node --test test/dsaVisualLab.test.mjs`
Expected: fail because metadata is missing.

- [ ] **Step 3: Implement metadata**

Enrich `buildDsaVisualizationState` by deriving side panels for arrays, strings, hashing, two-pointers, stack/queue, trees, graph traversal, and DP basics.

- [ ] **Step 4: Run focused test**

Run: `node --test test/dsaVisualLab.test.mjs`
Expected: pass.

### Task 3: Visual Trainer UI

**Files:**
- Modify: `components/dsa/DsaVisualLab.js`
- Modify: `pages/index.js`
- Modify: `test/dsaVisualLab.test.mjs`
- Modify: `test/featureFlowUi.test.mjs`

- [ ] **Step 1: Write failing source tests**

Assert the component source contains Play, Pause, speed control, Guided Mode, Learn, Visualize, Dry run, Code, Quiz, Practice as Mock, side panel labels, and selected stack code label.

- [ ] **Step 2: Run focused tests**

Run: `node --test test/dsaVisualLab.test.mjs test/featureFlowUi.test.mjs`
Expected: fail on missing UI wiring.

- [ ] **Step 3: Implement UI**

Add guided stage segmented controls, play/pause interval animation, speed slider, pointer/map/stack/queue/tree side panel rendering, step narration cards, invariant, dry-run script, and stack-aware code block. Pass `profile={candidateProfile}` from `pages/index.js`.

- [ ] **Step 4: Run focused tests**

Run: `node --test test/dsaVisualLab.test.mjs test/featureFlowUi.test.mjs`
Expected: pass.

### Task 4: Verification

**Files:**
- No production edits unless verification finds a defect.

- [ ] **Step 1: Run all automated checks**

Run:
- `node --test test/*.test.mjs`
- `npm run lint`
- `npm run build`

- [ ] **Step 2: Browser QA**

Open the local app, navigate to DSA Lab, verify desktop/tablet/mobile layout, Java profile shows Java code, Play/Pause/Next/Reset and speed controls render, and no horizontal overflow appears.
