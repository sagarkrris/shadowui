# Engineering Symptoms Atlas

Public index `/symptoms` has ten Java/Spring diagnostic entries. The original permanent entry URLs remain:
- `/symptoms/low-cpu-slow-requests`
- `/symptoms/query-slower-after-index`
- `/symptoms/messages-processed-twice`

The homepage, reader navigation, and sitemap expose the atlas. Search matches normalized symptom terms and common aliases, ranks title matches first, and combines with an area filter. Unknown searches show a reset and topic-request link. Search terms remain in component memory; no API, query-string persistence, log upload, or AI request is added. The catalogue displays its current ten-entry count and generates area filters from the entries.

Each entry provides observations, a first diagnostic step, three plausible causes, evidence for and against each, follow-up investigations, links to existing lessons, and official references. These are curated differential hypotheses, not automatic diagnoses. Entries are statically rendered; explanations and code remain available without waiting for AI.

Reproduction files in `public/symptom-examples/` are the single source for displayed and downloaded code. Build-time loading only uses filenames in the curated catalogue. Python and Java fixtures use standard-library modules and synthetic/in-memory data. `node scripts/validation/check-symptom-examples.mjs` executes only these trusted repository fixtures with bounded compilation and execution deadlines, checks their assertions, and compares actual output with the published expectations.

Verified runtime: Python 3.13.5, SQLite 3.51.1. The pool exercise reproduces a waiting worker with queued work, not measured CPU utilization. The index exercise deliberately forces two paths and instruments filter evaluations, not an optimizer regression or latency benchmark. The duplicate-delivery exercise models sequential redelivery with a transactional database marker, not broker integration, concurrency, or exactly-once external effects. The site does not execute uploaded or edited code.

`test/engineeringSymptoms.test.mjs` covers exact symptom queries, aliases, area filters, empty/no-match searches, and entry completeness. `e2e/symptoms-atlas.spec.js` covers discovery, search/reset, file downloads, clipboard behavior, deep anchors, and every entry's expanded code scrolling at phone/tablet/desktop widths. No new application dependencies or backend services are needed; Java fixture validation requires a JDK.

Verification completed September 18, 2026: all three executable fixtures passed their assertions and expected-output checks; 560 unit tests passed; 54 production browser checks passed across Chromium, Firefox, and WebKit, including the existing reader regression suite. ESLint, production build, and diff whitespace checks passed. Browser viewport coverage is not physical-device validation. No site deployment was performed.

## Ten-entry Java/Spring edition

The current catalogue supersedes the original three-entry pilot. It preserves those URLs and adds:
- HashMap entry visible but lookup misses.
- Spring transaction does not roll back.
- Spring async method blocks its caller.
- Request receives another user's context.
- ConcurrentModificationException on one thread.
- Java heap grows after requests finish.
- NullPointerException for only some inputs.

Each entry now has a curated `learningPath` referencing a real public lesson and existing Scenario Bank seed, with a sentence explaining the connection. Some exercises deliberately transfer the concept to an adjacent problem (for example, transaction ownership to event-publish failure); the connection is explained rather than claiming they are identical incidents. `/scenarios/[id]` renders the existing prompt, answer outline, traps, follow-ups, and rubric without an account. `#practice` goes directly to a response field, saved locally under an isolated per-scenario key. No AI score or mastery credit is inferred. Lesson/scenario titles are resolved at build time so the full catalogues are not sent to symptom readers.

Source review and fixture checks were performed on September 18, 2026. Java API contracts were checked against official JDK 21 references. Spring proxy, rollback, and scheduling behavior were checked against the official Spring reference; custom rollback policy and AspectJ mode remain explicit scope boundaries. A named human reviewer remains unassigned. Reproduction verification is not certification of a user's production configuration.

Seven entry-level Java checks compile with `javac --release 8` and run on Temurin OpenJDK 21.0.9 (six distinct files; the proxy model supports two entries). The original three standard-library Python reproductions remain and are labeled as mechanism examples relevant to Java/Spring backend diagnosis. The two Spring entries use a real JDK dynamic proxy but do not run Spring or a transaction manager. Their displayed scope requires a framework integration test before relying on the diagnosis in an application. No old locally cached Spring dependency was introduced.

Review checks include failure versus repair assertions, hypotheses with counter-evidence, stable URLs, every lesson/seed mapping, exact symptom and context searches, existing detective links, runtime disclosure, and bounded examples. Public scenario responses remain browser-local and do not alter existing Scenario Bank progress.

Ten-entry edition validation: 562 unit tests passed; all ten entry-level reproduction checks passed; 36 reader browser regression checks passed, followed by 24 Atlas checks across Chromium, Firefox, and WebKit after fixing phone overflow from the long ConcurrentModificationException heading (60 distinct browser checks). The Atlas index and all ten expanded entries were checked at 390, 412, 768, and 1440 pixels. Lesson/scenario/practice navigation, response persistence, and unknown-scenario 404 behavior passed. ESLint, production build, and diff whitespace checks passed. No physical-device or full Spring integration validation is claimed. No deployment was made.
