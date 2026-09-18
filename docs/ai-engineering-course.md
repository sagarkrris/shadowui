# AI for Software Engineers

Six stable-ID modules cover model fundamentals and context, prompt contracts,
retrieval and embeddings, evaluation and cost, workflows and agents, and AI-assisted
coding. Each includes a 90-minute teaching plan, worked example, dialogue, guided
exercise, expected solution, misconception, and homework. Timing is a facilitation
plan, not measured content duration.

Open Course in the workspace navigation. Download the reference lab from the
progressive-project section and run it with Node.js 20 or later:

```
node interviewiq-lab.mjs 1
node interviewiq-lab.mjs 2 --malformed
node interviewiq-lab.mjs 3 --unknown
node interviewiq-lab.mjs 4
node interviewiq-lab.mjs 5 --approve --stale
node interviewiq-lab.mjs 6
```

Malformed output and stale approval intentionally exit with code 1. Stage 6 reports
five passing deterministic checks and one save despite replay. The single file
contains the sample data, implementation, evaluation fixtures, and CLI. Students
modify the same artifact through all six modules. Stack tracks are optional porting
sketches.

The lab uses fake generation, lexical retrieval, and an in-memory store. It does
not call a real model or embedding service, persist approvals, or implement
production authentication. Optional live integration requires server-side keys,
measured model usage, durable authorization and idempotency, and held-out quality
and adversarial evaluation. These limits are displayed in the course.

The interview studio provides four questions per level, including coding and
failure diagnosis. Enter an attempt to reveal the answer, explained follow-up,
and rubric. Editing hides the answer again. Attempts are transient and reset on
navigation or changing the level; no model request is made.

Validation: unit tests exercise stable routing, schema validation, context overflow,
tenant filtering, abstention, approval binding, replay, and all six stages. Browser
tests cover navigation, download, solutions, level selection, answer gating, and
mobile width. Architecture readings link to the original Anthropic and Google
Cloud guides inside the course.

## Advanced workshops and scenario interviews

The core course now links to six additional advanced workshops:

1. Production RAG: rank fusion, chunking, freshness, and access.
2. Evaluation engineering: paired comparisons, hard release gates, and uncertainty.
3. Inference serving: prefill/decode, streaming, capacity, retries, and cost.
4. Durable agents: transactions, approval versions, deduplication, and unknown outcomes.
5. Model adaptation: prompting, RAG, fine-tuning, data splits, and routing.
6. Production incidents: safe traces, containment, cache isolation, and code review.

Each workshop is a suggested two-hour study block with concepts, an original
numerical or failure example, a guided design/coding exercise, an explained solution,
acceptance checks, and homework. These are extensions to the local lab, not claims
that production integrations have been implemented. The advanced reading links were
reviewed on September 18, 2026.

The scenario simulator adds six original main questions and six changed-constraint
follow-ups to the existing 12-question bank. It offers 5-minute, 10-minute, and untimed
rounds. Submit a nonblank main answer to reveal the follow-up, then submit a nonblank
follow-up to see the reference answer, detailed reasoning, pitfalls, and rubric.
The timer can pause/resume, accounts for delayed browser ticks using a deadline,
and never submits or reveals answers automatically on expiry.

Rubric checkboxes are explicitly self-assessment, not automatic grading or a hiring
prediction. Reference answers depend on the stated assumptions; they are not universal
“perfect” answers. The simulator is local and scripted, not a live AI interviewer or
verified company question feed. Drafts are transient. Scenario switching, retrying,
or leaving the course resets them. After review, download a Markdown record containing
your attempts, the reference explanations, your checked criteria, and your revision.

Browser coverage includes both mobile and desktop, workshop selection and solutions,
answer gating, timer pause/resume/expiry, review export, and state reset. No new API,
model requests, credentials, or dependencies are used by this feature.

## Start from scratch

Two six-lesson beginner paths now precede the core project:

- **Generative AI for Developers:** model proposals versus application decisions,
  tokens/context, prompts, API boundaries and structured output, architecture choices,
  and first-release evaluation.
- **RAG from Scratch:** retrieval purpose, document ingestion/chunking, embeddings
  and similarity, top-k selection, context/citations, and failure evaluation.

Every lesson includes an explanation, worked example, exercise with a hidden solution,
a misconception, a multiple-choice comprehension check with explained feedback, and
an interview question/reference answer. Previous/next and lesson selectors provide
ordered study. Lesson choices and quiz attempts are transient, not completion records.

The RAG playground runs entirely in the browser over three fictional help-center
sources. It splits paragraph chunks, builds a word-count vocabulary, calculates
cosine similarity, ranks top-k candidates, displays the context packet, and returns
cited source excerpts or an abstention. Learners can inspect all vectors and try exact,
ambiguous, missing-topic, and paraphrase examples. Input changes clear stale results.

This is intentionally a transparent lexical model, not a learned embedding service
or live LLM. It neither measures semantic retrieval quality nor automatically resolves
ambiguous intent. The lesson explains these limits and points to the existing runnable
lab and the advanced retrieval workshop for subsequent work. No API calls, credentials,
new dependencies, or user data persistence are introduced.

## Visual learning pass

All 24 lessons (12 beginner, six core, six advanced) now open with a concrete
four-card visual walkthrough. Cards show actual example inputs, intermediate
results, and decisions, with selectable focus and readable text at mobile widths.
The course orientation follows one fictional learner from question to approved
study plan. Core guides define terms and offer a pause-and-predict question.
Teacher timing, briefs, and debriefs are expandable; the duplicated practice-task
preview has been removed so the worked example precedes the coding exercise.

Module 1 includes a local context-budget explorer: vary history, add a document,
restore baseline, or show 20% headroom. It displays each allocation, arithmetic,
and explicit overflow status. The fixed 600-token allocation includes profile
and the latest question; all numbers are illustrative. The lab's legacy
`profileTokens` parameter represents this combined allocation for the exercise.
Real integration must count the actual messages and provider-specific overhead.
The explorer performs no generation or external calls.

Validation includes coverage for all 24 guide IDs, arithmetic parity with the lab,
exact-fit and overflow boundaries, and mobile/desktop browser interactions.
