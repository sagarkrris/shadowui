# DSA Visual Lab And PrepOS Upgrades Design

## Goal

Add a learning-first DSA Visual Lab and connect the existing interview-prep signals into a clearer daily operating system. The new DSA section should help users remember algorithms visually, dry-run them confidently, and write code in interviews without hesitation.

## Scope

This design covers five additions:

- DSA Visual Lab: Visualgo-inspired, interview-focused DSA lessons.
- PrepOS Dashboard: a single "today" surface for what to practice next and why.
- Smart Prep Timeline: a visual journey from resume upload to final interview readiness.
- AI Interview Panel Mode: panel personas that change follow-ups and scoring behavior.
- Skill Graph and Resume-to-Interview Story Matcher: readiness map plus resume claim-to-story prompts.

## DSA Visual Lab

The first version uses the recommended "A plus a little C" direction:

- Interview Core Pack: Arrays, Strings, Hashing, Two Pointers, Stack/Queue, Trees, Graph BFS/DFS, and DP basics.
- Guided learning flow: Concept, visual memory hook, step-by-step dry run, code template, complexity, quiz, and mock bridge.
- Simple visuals: no draggable graph editor yet. Use deterministic animated state models that can be rendered with React and tested as pure data.
- Interview confidence bridge: every lesson ends with "write it in interview" reminders, common mistakes, and a mock prompt.

Each lesson should be simple enough to learn without prior theory:

- Explain the pattern in plain English.
- Show the current data structure state.
- Highlight the pointer/node/index being processed.
- Explain why the next step happens.
- Show a stable code skeleton.
- Provide a tiny quiz and a practice-as-mock action.

## PrepOS Dashboard

PrepOS should sit on the home/prep surface and summarize:

- what to practice now
- why it matters
- upcoming interview risks
- weak topics due today
- top saved story to reuse
- next mock recommendation

It should derive from existing local signals: profile, topics, weak spots, mock scores, Career Toolkit state, question memory, proof stories, and interview tracker data. It must not require a database.

## Smart Prep Timeline

The timeline should be visual but compact. It should show milestone cards:

- profile created
- resume uploaded
- JD analyzed
- mock completed
- weak spots found
- questions mastered
- stories saved
- interview scheduled
- final day pack ready

Each milestone should be complete, active, or pending, with one clear next action.

## AI Interview Panel Mode

Panel Mode upgrades Round Strategy Mode by exposing interviewer personas:

- Recruiter
- Senior Engineer
- Engineering Manager
- System Design Architect
- Bar Raiser

Each panelist has a coaching style, follow-up pattern, and scoring emphasis. The first version can be deterministic prompt shaping and UI selection; no multi-agent API orchestration is required.

## Skill Graph

Skill Graph should show readiness nodes for major prep areas:

- Java Core
- Spring Boot
- SQL
- System Design
- Behavioral
- DSA
- React
- any selected stack topics

Node status should map to local evidence:

- New: no attempts or evidence
- Weak: repeated weak spot or low scores
- Improving: some attempts or partial progress
- Strong: recent good score or good evidence
- Mastered: repeated strong scores or completed memory

## Resume-To-Interview Story Matcher

When resume analysis finds claims such as "improved performance", "built APIs", "led migration", or "reduced latency", the app should ask:

- Do you have a story for this?
- Can you prove this with metrics?
- Practice this as a behavioral answer.

The matcher should produce story cards using local resume text/analysis only. It should avoid inventing metrics and encourage the user to provide real ones.

## Architecture

Keep pure logic in `lib/*.mjs` files and UI in focused components. Workers should create independent slices, and the main integration should wire them into shared app surfaces.

Pure logic files:

- `lib/dsaVisualLab.mjs`
- `lib/prepOperatingSystem.mjs`
- `lib/interviewPanel.mjs`
- `lib/skillGraph.mjs`
- `lib/resumeStoryMatcher.mjs`

UI files:

- `components/dsa/DsaVisualLab.js`
- `components/welcome/PrepOSDashboard.js`
- `components/welcome/SmartPrepTimeline.js`
- `components/welcome/SkillGraphPanel.js`
- `components/welcome/ResumeStoryMatcherPanel.js`

Shared integration:

- `pages/index.js`
- `components/Sidebar.js` or existing topic navigation surface if needed
- `components/welcome/Welcome.js`
- `components/welcome/PrepInsightsPanel.js`
- `lib/chatPrompt.mjs`
- `README.md`

## Data Storage

Use localStorage/session-derived inputs only. Do not add a database.

The DSA Visual Lab can start stateless, with local progress added later. If progress is added now, use a versioned localStorage key such as `interviewiq.dsaVisualLab.v1`.

## Testing

Use TDD for each slice:

- Pure logic unit tests for generated lesson state, dashboard decisions, panel prompts, skill graph statuses, and story matching.
- Source-level UI wiring tests for new navigation and visible panel labels.
- Build verification after integration.
- Browser QA for desktop, tablet, and mobile layout.

## Non-Goals

- Do not clone the full Visualgo feature set.
- Do not add live collaborative graph editing.
- Do not add a backend database.
- Do not call external APIs for DSA lesson generation.
- Do not make the DSA lab depend on Gemini to render lessons.
