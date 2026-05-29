# DSA Visual Lab And PrepOS Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DSA Visual Lab for unforgettable interview-focused algorithm learning, plus connected PrepOS dashboard, timeline, panel mode, skill graph, and resume story matcher.

**Architecture:** Workers create independent pure-logic and component slices in disjoint files. The controller integrates those slices into shared app files after worker outputs are reviewed, avoiding parallel edits to `pages/index.js`, `Welcome.js`, and `PrepInsightsPanel.js`.

**Tech Stack:** Next.js pages router, React components, localStorage-backed state, Node `node:test`, deterministic `.mjs` helper modules.

---

## File Ownership

- Worker 1 owns `lib/dsaVisualLab.mjs`, `components/dsa/DsaVisualLab.js`, `test/dsaVisualLab.test.mjs`.
- Worker 2 owns `lib/prepOperatingSystem.mjs`, `components/welcome/PrepOSDashboard.js`, `components/welcome/SmartPrepTimeline.js`, `test/prepOperatingSystem.test.mjs`.
- Worker 3 owns `lib/interviewPanel.mjs`, `test/interviewPanel.test.mjs`, and source-level tests for prompt/panel contracts if needed.
- Worker 4 owns `lib/skillGraph.mjs`, `lib/resumeStoryMatcher.mjs`, `components/welcome/SkillGraphPanel.js`, `components/welcome/ResumeStoryMatcherPanel.js`, `test/skillGraph.test.mjs`, `test/resumeStoryMatcher.test.mjs`.
- Controller owns integration in `pages/index.js`, `components/welcome/Welcome.js`, `components/welcome/PrepInsightsPanel.js`, `lib/chatPrompt.mjs`, `README.md`, and `test/featureFlowUi.test.mjs`.

## Task 1: DSA Visual Lab Core

**Files:**
- Create: `lib/dsaVisualLab.mjs`
- Create: `components/dsa/DsaVisualLab.js`
- Create: `test/dsaVisualLab.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that require:

- `listDsaVisualLessons()` returns at least 8 lessons: Arrays, Strings, Hashing, Two Pointers, Stack/Queue, Trees, Graph BFS/DFS, and DP Basics.
- `getDsaVisualLesson("two-pointers")` returns lesson sections: concept, memoryHook, steps, codeTemplate, complexity, quiz, mockPrompt.
- `buildDsaVisualizationState("two-pointers", sampleInput)` returns step states with highlighted indices and explanation text.
- `DsaVisualLab.js` source contains `DSA Visual Lab`, `Visualize`, `Dry Run`, `Quiz`, and `Practice as Mock`.

Run:

```bash
node --test test/dsaVisualLab.test.mjs
```

Expected: fail because files/exports do not exist.

- [ ] **Step 2: Implement pure lesson helpers**

Create deterministic lesson data and exports:

- `DSA_VISUAL_LAB_STORAGE_KEY`
- `listDsaVisualLessons()`
- `getDsaVisualLesson(id)`
- `buildDsaVisualizationState(id, input)`
- `buildDsaMockPrompt(lesson)`

The state model should be simple objects:

```js
{
  lessonId: "two-pointers",
  input: [1, 2, 3, 4],
  steps: [
    {
      title: "Start at both ends",
      highlight: { left: 0, right: 3 },
      explanation: "Use two pointers when the answer depends on comparing both sides.",
      memoryHook: "Two fingers walking toward the answer."
    }
  ]
}
```

- [ ] **Step 3: Implement React component**

Create `DsaVisualLab` with:

- lesson selector cards
- visualization panel
- step controls: previous, next, reset
- dry-run explanation
- code template panel
- quiz card
- `Practice as Mock` action via `onPractice(prompt)`

- [ ] **Step 4: Verify**

Run:

```bash
node --test test/dsaVisualLab.test.mjs
```

Expected: pass.

## Task 2: PrepOS Dashboard And Smart Timeline

**Files:**
- Create: `lib/prepOperatingSystem.mjs`
- Create: `components/welcome/PrepOSDashboard.js`
- Create: `components/welcome/SmartPrepTimeline.js`
- Create: `test/prepOperatingSystem.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that require:

- `buildPrepOSDashboard({ profile, topics, weakSpots, mockScores, questionMemory, proofStories, interviews })` returns `practiceNow`, `whyItMatters`, `interviewRisks`, `weakTopicsDue`, `topStory`, and `nextMock`.
- `buildSmartPrepTimeline(...)` returns milestones for profile, resume, JD, mock, weak spots, questions mastered, stories, scheduled interview, and final pack.
- UI source contains `PrepOS Today`, `Practice now`, `Why it matters`, `Interview risks`, and `Smart Prep Timeline`.

Run:

```bash
node --test test/prepOperatingSystem.test.mjs
```

Expected: fail because files/exports do not exist.

- [ ] **Step 2: Implement dashboard logic**

Use deterministic ranking:

- If weak topics are due, practice the first due/weak topic.
- If an interview is upcoming, elevate company/round risk.
- If no data exists, recommend first topic from `topics`.
- Use proof stories from existing prep insights shape when available.

- [ ] **Step 3: Implement timeline logic**

Each milestone should include:

```js
{
  id: "resume",
  label: "Resume uploaded",
  status: "complete" | "active" | "pending",
  detail: "Resume gaps are ready",
  action: "Analyze resume"
}
```

- [ ] **Step 4: Implement components**

`PrepOSDashboard` renders compact cards and an action button for the next mock. `SmartPrepTimeline` renders a horizontal/vertical responsive timeline.

- [ ] **Step 5: Verify**

Run:

```bash
node --test test/prepOperatingSystem.test.mjs
```

Expected: pass.

## Task 3: AI Interview Panel Mode

**Files:**
- Create: `lib/interviewPanel.mjs`
- Create: `test/interviewPanel.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that require:

- `INTERVIEW_PANELISTS` includes Recruiter, Senior Engineer, Engineering Manager, System Design Architect, and Bar Raiser.
- `normalizeInterviewPanel(value)` safely defaults to Senior Engineer.
- `buildInterviewPanelPrompt({ panel, profile, roundStrategy })` includes follow-up style and scoring emphasis.
- `buildPanelScoreRubric(panel)` returns scoring categories appropriate to that panel.

Run:

```bash
node --test test/interviewPanel.test.mjs
```

Expected: fail because files/exports do not exist.

- [ ] **Step 2: Implement deterministic panel helpers**

Each panelist should define:

- key
- label
- icon
- followUpStyle
- scoringEmphasis
- openingInstruction
- rubric categories

- [ ] **Step 3: Verify**

Run:

```bash
node --test test/interviewPanel.test.mjs
```

Expected: pass.

## Task 4: Skill Graph And Resume Story Matcher

**Files:**
- Create: `lib/skillGraph.mjs`
- Create: `lib/resumeStoryMatcher.mjs`
- Create: `components/welcome/SkillGraphPanel.js`
- Create: `components/welcome/ResumeStoryMatcherPanel.js`
- Create: `test/skillGraph.test.mjs`
- Create: `test/resumeStoryMatcher.test.mjs`

- [ ] **Step 1: Write failing Skill Graph tests**

Require:

- `buildSkillGraph({ profile, topics, weakSpots, mockScores, questionMemory })` returns nodes for Java Core, Spring Boot, SQL, System Design, Behavioral, DSA, and selected stack topics.
- statuses map to New, Weak, Improving, Strong, Mastered.
- UI source contains `Skill Graph`, `Weak`, `Improving`, `Mastered`.

Run:

```bash
node --test test/skillGraph.test.mjs
```

Expected: fail.

- [ ] **Step 2: Write failing story matcher tests**

Require:

- `extractResumeStoryClaims(resumeText)` detects performance, API, migration, leadership, reliability, and cost claims.
- `buildResumeStoryMatches({ resumeText, resumeAnalysis, proofStories })` returns cards with the three required questions and a mock prompt.
- UI source contains `Resume Story Matcher`, `Do you have a story for this?`, `Can you prove this with metrics?`, and `Practice this as a behavioral answer`.

Run:

```bash
node --test test/resumeStoryMatcher.test.mjs
```

Expected: fail.

- [ ] **Step 3: Implement graph and matcher helpers**

Use local deterministic text matching only. Do not invent metrics.

- [ ] **Step 4: Implement panel components**

Render compact cards suitable for the existing prep insights surface.

- [ ] **Step 5: Verify**

Run:

```bash
node --test test/skillGraph.test.mjs test/resumeStoryMatcher.test.mjs
```

Expected: pass.

## Task 5: Controller Integration

**Files:**
- Modify: `pages/index.js`
- Modify: `components/welcome/Welcome.js`
- Modify: `components/welcome/PrepInsightsPanel.js`
- Modify: `lib/chatPrompt.mjs`
- Modify: `test/featureFlowUi.test.mjs`
- Modify: `README.md`

- [ ] **Step 1: Write failing source-level integration tests**

Extend `test/featureFlowUi.test.mjs` to require:

- `DsaVisualLab` import and `activeTab === "dsaLab"` rendering.
- Desktop and mobile navigation label for `DSA Lab`.
- `PrepOSDashboard`, `SmartPrepTimeline`, `SkillGraphPanel`, and `ResumeStoryMatcherPanel` in prep surfaces.
- panel mode state and `buildInterviewPanelPrompt` in chat prompt flow.

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
node --test test/featureFlowUi.test.mjs
```

Expected: fail on missing integration strings/imports.

- [ ] **Step 3: Wire DSA Lab tab**

Add `activeTab === "dsaLab"` render branch. Add nav icon/label. Pass `onPractice` to call the chat API with a mock prompt.

- [ ] **Step 4: Wire PrepOS panels**

Add dashboard, timeline, skill graph, and story matcher into `Welcome` or `PrepInsightsPanel` using existing local signals.

- [ ] **Step 5: Wire Panel Mode**

Add panel selector state to `pages/index.js`, persist it if appropriate, and pass panel prompt instructions into API body or system prompt builder. Update `lib/chatPrompt.mjs` to use `buildInterviewPanelPrompt`.

- [ ] **Step 6: Update README**

Document:

- DSA Visual Lab
- PrepOS Today
- Smart Prep Timeline
- AI Interview Panel Mode
- Skill Graph
- Resume Story Matcher

- [ ] **Step 7: Verify integration**

Run:

```bash
node --test test/featureFlowUi.test.mjs
```

Expected: pass.

## Final Verification

Run:

```bash
node --test test/*.test.mjs
/bin/zsh -lc "source /Users/sagkrish/.nvm/nvm.sh && npm run lint"
/bin/zsh -lc "source /Users/sagkrish/.nvm/nvm.sh && npm run build"
```

Browser QA:

- Start dev server on an available port.
- Verify DSA Lab opens on desktop/mobile.
- Verify PrepOS/Timeline/Skill Graph/Story Matcher render on home/prep.
- Verify panel selector is visible and does not overflow on mobile.
- Stop dev server and confirm ports `3000`, `3001`, and `3002` are clear.
