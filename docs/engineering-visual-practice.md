# Engineering visual practice

The public learning sequence starts at `/prepare` and connects the existing
workspace to `/labs/sql`, `/labs/git`, `/assessments` and the library. Completion
marks reuse the learning hub's store and remain self-assessed. Failed lab checks
produce targeted recommendations on the relevant lab and preparation journey;
passing that same check clears its recommendation without marking a course done.
Transport/configuration errors do not create assessment skill-gap records.

Lessons use `GuidedLesson.js`: beginner explanation, mechanism, worked example,
interactive practice, trade-offs, spoken answer, explained follow-up and primary
reference. Existing authored courses remain intact.

## SQL curriculum and execution

Twelve original lessons cover filtering/NULL, joins, grouping, ranking, expressions,
ordering/pagination, aggregates/empty input, scalar subqueries, CTEs, EXISTS,
window frames and index/query-plan interpretation. Levels and displayed counts
come from the actual catalog. The searchable sidebar, overview, editor/results
split, logical-step play/pause and Ctrl/Cmd+Enter work on desktop and mobile.
Deep-linked lessons finish restoring before input is enabled, so early typing
cannot attach a draft to the wrong lesson.

Node 24+ and child-process support are required. Each batch launches a short-lived
Node process with a fresh in-memory SQLite database, disabled extension loading,
a 16 MiB SQLite heap limit, 32 MiB V8 heap, two-second deadline, 100 result rows and
64 KiB output. These are not total operating-system memory limits. No secrets are
inherited, no user database is attached, and the endpoint bounds query size and
rate. The narrow read-only surface accepts SELECT, WITH and EXPLAIN QUERY PLAN
SELECT; comments, database changes and some quoted keywords are refused.

Curated queries use separate queries for logical teaching stages, not an
instrumented execution trace. Custom queries return actual results without
invented stages. EXPLAIN QUERY PLAN shows SQLite's physical strategy separately;
its text is version-dependent and is not a benchmark. A trusted seed index is
created before the database becomes read-only. Challenges compare ordered column
names/values on two datasets. Feedback distinguishes shape, row-count and value/
ordering differences and suggests a related drill. It is not a query equivalence
proof or a diagnosis of every possible mistake.

## Git diagram and guided exercises

The one-file browser model has a working tree, staging snapshot, branch refs,
commit ancestry and local tip history. The SVG draws branch lanes and parent
arrows, highlights HEAD and its previous commit, and has a complete text graph
for accessibility. Guided conflict resolution, reset recovery and linear rebase
exercise real model transitions. Loading an exercise checkpoints the unfinished
repository; returning restores it. Checkpoints and guide position survive reload.

No shell or real repository operations run. Whole-file divergence conflicts;
real Git's line merge is more capable. Rebase is limited to linear replay: when both sides changed, only equal-line-count
nonconflicting edits are supported; already-applied patches are skipped. Revert supports only single-parent HEAD; branch switching requires clean state.
A bounded model's retained commit list is not a real-world backup guarantee.

## Five Java repository assessments

Checkout, pagination API contract, bounded expiring LRU cache, concurrent permit
lease and out-of-order event debugging each have two editable Java 17 classes,
a 35–45 minute timer, examples, hints, explicit contracts and review rubrics.
The API contract is an in-process string model, not a running HTTP server.
Concurrency fixtures coordinate contenders/closers using latches; timing bounds
stop hung tests and do not assert scheduler performance. The other tasks are
explicitly single-threaded local models, not distributed implementations.

The existing isolated runner combines the two package-private source files into
one compilation unit. The web process never executes submitted Java. Examples are
downloadable; additional checks stay in server-only modules. Runner feedback
suggests a contract area to revisit; it is practice feedback, not secure grading
or a certification boundary. A source-size bound applies to files plus harness.
Without the runner, local example downloads remain available and the UI does not
claim tests passed. Tech Buddy remains an explicit optional review handoff.

Rubric scores are user-entered 0/1/2 evidence assessments and are displayed
separately from executable check outcomes. An absolute browser deadline continues
across reloads; submission/expiry locks source edits. A finished attempt archives
its files, notes and rubric at that point. Later notes do not rewrite the archive.
New attempts retain current files and clear self-scores. Each task keeps its own
draft and selected source tab. History holds up to 100 snapshots without automatic
eviction; export and explicitly remove a snapshot to make space. Archived files
can be restored for another attempt. This is not a tamper-resistant exam.

## Session persistence and backups

SQL stores a selected lesson and per-lesson drafts, including empty edits. Git
stores its validated acyclic graph, work/stage state, guide position, checkpoint
and command replay. Assessment storage migrates the original checkout-only data
without changing its key and keeps task drafts and immutable attempt snapshots.
Executable results are not persisted as verified evidence on a later visit.

Writes occur only after hydration. Storage failures keep the working copy usable
and offer JSON export. If another tab changes a session, saving pauses until the
user explicitly chooses the working or saved copy; no automatic merge is claimed.
The private practice backup explicitly includes SQL/Git session keys while still
excluding credential/session-auth keys. New lab data remains browser-only, rather
than being silently added to account cloud sync. Sign-out's existing private-data
clear also removes these keys; export a backup first.

## Verification

`test/engineeringLabs.test.mjs` and `test/labExpansion.test.mjs` cover SQL semantics,
bounds and plan interpretation, saved-state validation/migration, Git transitions,
exercise completion, immutable history, safe recommendation links and backup keys.
All new Java references are compiled/executed with Java 17; starters and realistic
broken variants must fail. Tests also compile the adapter's generated harness.

`e2e/engineering-labs.spec.js` and `e2e/lab-expansion.spec.js` run desktop/mobile
SQL checks, curriculum search/playback, draft restore, deep links, cross-tab
conflicts, quota failure, Git exercises/diagram, assessment expiry/history/rubrics
and targeted recommendations. Both files join the mandatory completion gate.
Browser assessment adapters are mocked; Java fixtures execute locally. A deployed
runner and hosting environment still require separate operational verification.
