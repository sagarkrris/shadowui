# Java + Database Scenario Bank Design

## Goal

Build an original InterviewIQ feature for real-time, scenario-based interview preparation across Java and database topics. The feature must not reuse or copy content, structure, claims, wording, or assets from InterviewNinja or any third-party site.

The target experience is a large, expandable bank with 1000+ possible practice questions through a hybrid model:

- curated local seed scenarios for quality and deterministic offline coverage
- real-time AI-generated variants based on selected topic, difficulty, round style, and database engine
- detailed answers and evaluation rubrics generated through the existing chat/review flow

## Scope

In scope:

- Java scenario bank
- Database scenario bank
- User-selected database focus:
  - PostgreSQL
  - MySQL
  - MongoDB
  - Redis
- Scenario-based questions rather than static trivia-first Q&A
- Detailed answer guidance for local curated seeds, including expected reasoning, common traps, trade-offs, and follow-up probes
- AI-expanded detailed answers for generated scenario variants
- Topic filters, difficulty filters, timed drill, and practice-as-mock actions
- Local progress tracking using the existing question memory/mastery patterns where practical

Out of scope:

- Power BI/Data packs
- Ebook storefront behavior
- PDF-selling or purchase flows
- Third-party content import from InterviewNinja
- A literal static file containing 1000 hand-written questions in the first implementation

## Product Shape

Add a new first-class workspace named **Scenario Bank** as a sibling of Design Lab, Canvas, DSA Lab, and Company Prep. The workspace should feel like an interview drill room, not a landing page.

Primary controls:

- Track selector: Java or Database
- Database selector when Database is active: PostgreSQL, MySQL, MongoDB, Redis
- Topic selector:
  - Java: Core Java, Collections, Streams, Concurrency, JVM, Exceptions, Generics, Spring Boot, Testing, Design Patterns
  - PostgreSQL/MySQL: query design, indexes, transactions, isolation, schema design, tuning, joins, locks, replication basics
  - MongoDB: document modeling, indexes, aggregation, consistency, sharding, schema evolution
  - Redis: caching patterns, eviction, locks, pub/sub, streams, data structures, failure modes
- Difficulty selector: Beginner, Mid, Senior
- Mode selector: Learn, Timed Drill, Mock Interview

Main card contents:

- scenario prompt
- what the interviewer is testing
- hints available on demand
- ideal answer outline
- deep-dive answer
- common wrong answers
- follow-up questions
- scoring rubric

## Architecture

Create a focused domain module, likely `lib/scenarioBank.mjs`, that owns deterministic scenario seed data, local detailed answer content, and prompt construction. The module should expose pure helpers so tests can cover behavior without a browser:

- `SCENARIO_BANK_TRACKS`
- `DATABASE_ENGINES`
- `createScenarioBankState(input)`
- `listScenarioBankTopics(track, engine)`
- `listScenarioSeeds(filters)`
- `getScenarioSeed(id)`
- `buildScenarioVariantPrompt(filters)`
- `buildScenarioAnswerPrompt(scenario, filters)`
- `buildScenarioMockPrompt(scenario, filters)`

Create a React workspace component, likely `components/scenario-bank/ScenarioBank.js`, that renders the controls, scenario cards, answer panels, and action buttons. It should follow existing workspace conventions from Design Lab, DSA Lab, and System Design Canvas:

- dense, work-focused layout
- mobile-safe responsive grids
- no page-section cards inside cards
- use existing glass styles and Tabler icon classes
- call existing `onAction(prompt, metadata)` for AI review/mock flows

Wire the workspace in `pages/index.js` as a sibling of Design Lab, Canvas, DSA Lab, and Company Prep. Add `activeTab: "scenarioBank"` to session persistence.

## Hybrid Generation Model

The app should not store 1000 complete static questions. Instead, it should combine curated seeds and generated variants.

Each curated seed should include a scenario prompt, answer outline, deep-dive answer, traps, follow-ups, and rubric. Curated seed examples:

- Java concurrency incident: thread pool saturation under traffic spike
- Java collection choice: preserving insertion order while deduplicating events
- Spring Boot transactional boundary: payment saved but event publish fails
- PostgreSQL slow query: composite index choice for a filtered ordered dashboard
- MySQL deadlock: two update paths lock rows in different order
- MongoDB modeling: user feed document grows unbounded
- Redis cache stampede: hot key expires during peak traffic

Variant generation prompt should request:

- one realistic scenario
- interviewer intent
- expected senior answer
- step-by-step reasoning
- trade-offs
- traps
- follow-ups
- rubric

The UI can market this as "1000+ scenario coverage" only if implemented honestly as combinations of topic, engine, difficulty, mode, and generated variants, not as a fixed authored list.

## Data Flow

1. User opens Scenario Bank.
2. User selects track, engine if needed, topic, difficulty, and mode.
3. Component loads matching local seed scenarios.
4. User can:
   - open a local detailed answer
   - ask AI for a fresh scenario variant
   - start timed drill
   - practice as mock
5. AI actions route through the existing chat API using `onAction`.
6. Completed practice can update local question memory with status such as New, Needs Review, Improving, or Mastered.

## Error Handling

- If no seed matches a filter, show a fallback generated-practice prompt option instead of an empty state.
- If AI generation fails, keep local seed scenarios usable.
- If session persistence contains an unknown track, topic, or engine, normalize back to Java/Core Java or Database/PostgreSQL.
- If the user selects MongoDB or Redis, label the workspace as database-focused rather than forcing SQL wording.

## Testing

Use TDD during implementation.

Focused tests:

- `test/scenarioBank.test.mjs`
  - validates track and database engine metadata
  - validates topic listing per track/engine
  - validates normalized state
  - validates prompt builders include selected engine, topic, difficulty, and scenario instructions
- `test/scenarioBankUi.test.mjs`
  - source-level UI coverage for workspace controls, actions, and app wiring
  - session persistence whitelist includes `scenarioBank`
- E2E responsive check
  - mobile viewport opens Scenario Bank and verifies no right-edge overflow
  - selector actions for Java and Database engine switching

Verification commands:

- `node --test test/scenarioBank.test.mjs test/scenarioBankUi.test.mjs test/sessionPersistence.test.mjs`
- `npm run lint`
- Browser/mobile smoke against local dev server

## Rollout

Build this in stages:

1. Domain module and tests
2. Workspace UI and source tests
3. App navigation and persistence
4. AI action prompts and practice-as-mock handoff
5. Mobile overflow regression

The first implementation should prioritize a strong, original scenario practice experience over maximizing seed count. The 1000+ target comes from generated combinations and variants, while curated seeds keep the product grounded and useful immediately.
