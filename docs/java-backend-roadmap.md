# Java Backend Engineer roadmap

`/java/roadmap` now connects existing material into six stages: foundations,
Spring, data, concurrency, reliable systems, and interview readiness. Each stage
has Learn, Experiment, Build, Interview, and Review activities, prerequisites,
and an explanation checkpoint. Home, the reader navigation, and Reading paths
link to the roadmap.

Activities are self-reported. The next recommendation is the earliest unchecked
activity, including when later stages were completed out of order. Progress uses
`interviewiq.javaBackendJourney.v1`; invalid/obsolete IDs are discarded and
repeated IDs count once. The existing `interviewiq.javaRoadmapProgress.v1`
chapter checklist and its saved progress remain separate and available.
Storage failures keep the current visit usable and display an unsaved warning.

Stage reflections reuse the learning notebook's validation, persistence, and
Markdown export. Each review links to its stage reflection. Interview actions
use the existing Tech Buddy warm-up parameters and carry the stage question;
they require a configured profile and an available AI provider. Following a link
never marks the activity complete. No AI calls run from the roadmap itself.

## Independent semantic review — 12 October 2026

Reviewed final routing, progress transitions, authored prompts, and linked
exercise boundaries separately from implementation:

- This is an organizational path through existing lessons, not a new Java
  course or runnable example. No Java declaration or fixture registration changes
  are needed. The linked exercise pages own their runtime and tests.
- Checked lesson slugs against `JAVA_CURATED_TUTORIAL_CATALOG`, build IDs against
  `BUILD_CHALLENGES`, and model routes against `TINY_SYSTEMS`. Browser requests
  verify that activity destinations resolve. Existing Next.js Pages Router and
  Link documentation were read from the installed Next 16.3.1 package.
- The pool and retry exercises retain their model boundaries. Prompts explicitly
  distinguish single-threaded models, concurrent checks, and durable databases.
  The roadmap makes no new API, durability, or infrastructure guarantees and
  introduces no technical diagrams needing external claim verification.
- Boundary review covers empty/malformed saved state, duplicate/stale IDs,
  out-of-order completion, reopening an activity, reload persistence, blocked
  writes, and old chapter-progress compatibility. No asynchronous completion,
  cancellation, retries, or remote ownership exist in this state machine.
- Preserved the chapter ItemList structured data and existing canonical URL behavior.
- Checked the existing Tech Buddy query consumer for `buddy`, `buddyTopic`, and
  `buddyMode=warmup`. The browser checks do not prove a live provider session.
- Review initially linked to the notebook, which only lists existing notes.
  Corrected this to a per-stage editable reflection with notebook persistence
  and export; a browser regression exercises save, reload, and export.
- Mobile/desktop browser checks cover layout and WCAG axe scans. Initial mobile
  screenshot was visually inspected. The full content gate must pass after
  final edits. Logs are under `/private/tmp/backend-roadmap-*`; the gate records
  its full evidence location in `/private/tmp/backend-roadmap-gate.log`.

Validation commands: `node --test test/javaBackendRoadmap.test.mjs`,
`npx playwright test e2e/java-backend-roadmap.spec.js --project=chromium
--workers=2 --retries=0`, and mandatory `npm run verify:tech-blog`.
The local Git subprocess requires the existing ARM wrapper at
`/private/tmp/shadowui-arm-git`; browser server execution requires permission to
bind a loopback port outside the sandbox. Neither changes application behavior.
