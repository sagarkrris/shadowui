# Connected learning hub — 12 October 2026

The agreed feature scope is implemented as one connected experience:

| Feature | Surface and behavior |
| --- | --- |
| Four role roadmaps | `/learn` links Java Backend (`/java/roadmap`), Full Stack, System Design, and AI Engineering (`/learn/roadmaps/<id>`). Each stage declares preparation, a checkpoint, and Learn → Experiment → Build → Interview → Review activities. |
| Structured courses | Searchable catalogue of all 50 tech-blog courses, 103 curated Java tutorials, React and Node.js guide collections, and the six-session AI course. Catalogue cards expose ordered lessons and suggested preparation. |
| Interactive labs | `/labs` provides caching, concurrency, index comparisons, bounded queues, and approval/budget-controlled agent-workflow models. Inputs compute traces and results; reset restores the initial experiment. |
| Connected practice | A shared control on each catalogue lesson links its exercise/self-check to a topic-specific Tech Buddy warm-up and records completion or a need for another attempt. It appears in public and workspace course readers. |
| Shared progress map | `/learn` shows role activity counts, lesson counts, marked gaps, scored question reviews, a next role activity and a next catalogue lesson. Weak stages take priority; unknown stored IDs do not affect counts. |

The public AI course at `/learn/ai-engineering` presents the existing six sessions
in order with their worked reasoning, build instructions, failure cases, and
practice links. Its progressive build remains available in the existing workspace.
The Full Stack path starts with React and Node.js guide material before connecting
real-time communication, persistence, and security. Workspaces require the existing
prep profile; live Tech Buddy needs the configured AI provider.

## Persistence and compatibility

`interviewiq.learningHub.v1` holds bounded, normalized completion IDs, marked gaps,
and stage notes. Public and workspace controls use the same lesson IDs. Writes
merge with the latest saved state to avoid discarding another lesson's changes;
same-tab events and browser storage events refresh shared controls. On a failed
write, consecutive edits stay usable in the current component and a warning
explains that they will not survive the visit. There is no account sync.

The progress map reads the existing Java Backend activity key, versioned Java
Digest chapter state, question-memory review state, and saved assessed practice
attempts without rewriting those records. Completing an activity is self-reported;
marked gaps and scored review records are shown separately. None of these counts
predict interview success. Reopening a lesson does not clear its marked gap;
learners remove a gap deliberately after another attempt.

## Independent semantic review

Reviewed the final data, routes, model algorithms, and reader wiring separately
from implementation. No new Java code examples or Java-release declarations are
introduced; the existing per-course compilation and behavioral fixtures remain
registered and selected by the mandatory gate.

- Lab results are computed from small bounded deterministic models. LRU uses
  access order over a fixed seven-request sequence; the queue serves before
  admitting arrivals each tick and accounts for served, retained and rejected
  work. The lost-update lab compares two prescribed schedules, not live threads.
  The index lab compares searches of sorted integers, not SQL plan timings.
  Agent approval is a simulated application policy and never invokes a tool.
- Verified reference boundaries against Oracle Java 21 LinkedHashMap,
  ArrayBlockingQueue and atomic package documentation, PostgreSQL index-type
  documentation, and the OWASP prompt-injection prevention guidance. References
  do not certify the model as a production implementation. The actual algorithms
  are exercised by `test/learningHub.test.mjs` at their boundaries.
- Challenged malformed/null/empty state, duplicate and retired IDs, blank numeric
  controls, non-finite/out-of-range inputs, absent searches, zero arrivals, zero
  step budget, unapproved writes, reordered completion, weak-stage priority,
  reopening activities, failed writes, and legacy imports.
- Counter and queue models do not perform asynchronous execution, cancellation,
  or durable retries; their scope statements make those dimensions inapplicable.
  Lesson controls do not automatically trigger provider requests. Existing runtime
  courses retain their own source/version limits and fixtures.
- Browser verification checks every catalogue chapter's practice region and
  lesson anchor, all roadmap destinations, lab recomputation/reset, persisted
  reflections, weak-area priority, consecutive failed-storage edits, legacy
  progress, unknown-route 404s, and mobile/desktop layout plus WCAG axe scans.
- Visual review inspected the mobile hub screenshot. Final gate includes both
  the complete hub browser suite and the earlier Java roadmap suite, alongside
  all public/workspace course and diagram checks. This is not a physical-device
  or live-provider validation claim.
- Review found a residual literal `${SITE_URL}` fallback in the earlier field-note
  SEO edit. It now uses the shared origin directly. The indexing suite and final
  reader tests verify the corrected rendered pages.

## Final validation

Focused model tests: 10 passed. Initial hub browser checks: 9 passed, including
all catalogue course chapter wiring and mobile/desktop accessibility. The final
mandatory command is `npm run verify:tech-blog` with the existing ARM Git wrapper;
its full outcome and evidence directory are recorded in
`/private/tmp/learning-hub-gate.log`. Lint, build, complete unit suite, Java
fixtures/practice suites, production reader checks, indexing checks, and the hub
regressions must all pass on unchanged final source.

Deployment is separate. These additions are local source changes until published.
No production deployment, live model call, or Google reindexing is claimed by
these checks.
