# InterviewIQ Next Upgrades Design

## Goal

Add five local-first interview operating-system upgrades: Question Memory + Mastery Map, Interview Recording Review, System Design Canvas, Role Pack Builder, and Final Interview Report.

## Architecture

The features stay client/local-first and reuse the current Next.js app shell. Deterministic feature logic lives in focused `lib/*.mjs` modules, durable browser-only prep state uses versioned `localStorage` keys, and chat-facing actions flow through the existing `onAction -> callAPI -> /api/chat` path.

## Features

### Question Memory + Mastery Map

Track practice and mock attempts by stable question id, topic, stack, score, attempt count, last seen date, and status. Status values are `New`, `Needs Review`, `Improving`, and `Mastered`. Practice packs use memory to avoid repeating mastered questions and to show mastery labels. Prep Insights renders a Mastery Map summary.

### Interview Recording Review

Add a privacy-first recording review entry point. The user can record or paste an answer transcript, review local signals such as duration, filler words, STAR structure, metrics, and clarity, then send a short display message plus full transient API text for coaching. Audio is not persisted. Unsupported browsers show a typed-answer fallback.

### System Design Canvas

Add a first-class workspace tab for building a lightweight architecture sketch. The user can edit requirements, scale, APIs, data model, components, flows, trade-offs, reliability, observability, and open questions. Canvas actions generate system-design review/mock prompts through the existing chat route.

### Role Pack Builder

Generate deterministic role packs such as Java Backend SDE II, React Frontend Senior, Full Stack Lead, Python Backend, SAP Consultant, and Rust Systems. Packs include focus topics, likely rounds, priority drills, scoring emphasis, and action prompts.

### Final Interview Report

Extend the existing prep report exporter into a final interview report with offer readiness, resume/JD match, mastery map, weak spot radar, proof stories, role pack, company prep, canvas summary, and a final 24-hour plan.

## Constraints

- No database or account system.
- No raw audio persistence.
- Keep Gemini/API keys server-side.
- Preserve mobile and tablet responsiveness.
- Keep ports `3000`, `3001`, and `3002` stopped after verification.

## Testing

Add deterministic unit tests for each new library, UI source wiring tests for visible controls, full `node --test test/*.test.mjs`, lint, build, and browser smoke across desktop, phone, and tablet.
