# Daily practice release

## Product changes

- **Reliability:** one canonical attempt ledger in the saved session. A structured answer uses one evaluation endpoint for feedback, history, topic trends and dashboard values. Stable IDs deduplicate retries. Legacy free-form scores record only an explicit overall score, never every rubric fraction. Null means unassessed. Draft text/code, current question, feedback depth, pending request and timer state survive reload and navigation. Interrupted streams require retry; only a completed stream starts the timer. Device write errors remain visible. Cloud PUTs serialize; failed hydration cannot overwrite remote data; edits during hydration remain local.
- **Today:** one primary practice action, a resume action for unfinished work, completed-attempt summary, topic exploration, and collapsed advanced planning tools. Learn, Practice, Mock and Review have visible descriptions.
- **Learning loop:** answer → evidence-backed assessment → manageable exercise → comparable retest or 60-second same-question attempt → saved comparison. Both attempts use rubric v1 and the original difficulty/round. AI-written examples never create improvement records. Exercise notes persist.
- **Credibility:** separate technical and communication dimensions, exact-quote verification, deductions, uncertainty and topic trends. The former readiness scores now show recent answer averages. Profile setup, canvas edits and workspace clicks do not increase that average. Activity lanes remain planning/activity heuristics and are not mastery measures.
- **AI:** elapsed time, 90-second recovery timeout, stop/retry, persisted original answers, retry semantics, compact feedback and expandable detail, visible question/topic/difficulty/round, per-attempt pause/resume timers, and feedback depth choice.
- **Content:** curated Java chapters keep their existing canonical definitions and version context, with official specification/API links. Course video titles were checked against YouTube oEmbed on 2026-09-17 and corrected; durations are no longer invented and module discussion prompts are not represented as video chapters. Content reports preview their exact payload and remain local until explicitly shared in a backup.
- **DSA:** the existing broad lab remains available. A canonical executable section provides maximum, duplicate detection and binary search with precise contracts, brute-force/improved explanations, normal/boundary/adversarial cases, real-input traces, synchronized code/variables, operation-based complexity, invariant exercises and separate self-reported understanding/implementation/independent-solution states.
- **Resume:** editable reusable evidence records include situation, responsibility, decision, result, measurement and trade-offs. Each generated bullet links to its evidence ID. Unknown facts remain explicit placeholders. Keyword coverage is not a hiring prediction.
- **Design:** named autosaved drafts, version snapshots/restore (including the original canvas), editable components/connections, capacity assumptions and arithmetic, failure scenarios and design-specific critique prompts tied to requirements and trade-offs.
- **Navigation/accessibility:** categorized search for curated Java lessons, questions, scenarios, saved attempts and designs; keyboard focus, command-dialog focus trapping/restoration and Escape, loading/saving/error announcements, reduced motion, narrow reading layouts and stable workspace drafts.
- **Data:** session export plus a full device-practice backup, import preview, format/version/size validation, rollback on failed writes, individual attempt/message removal, explicit transcript-retention choice and local/cloud storage explanations. Authentication credentials are excluded from backups.
- **Measurements:** privacy-bounded events for practice starts (elapsed milliseconds), answer submissions, AI completion latency/failure, recovered drafts, durable result writes/failures, retests, resumed sessions, content reports and resolution time. The existing metrics webhook must be configured for durable aggregation. No answer, transcript or resume body is sent as an analytics value.

## Permanent release checklist

Original TC01–TC08 remain in onboarding, navigation and company tests. Their assertions now follow the actual tour/setup flow, stack-specific topics, collapsed workspace menu, and accessible video names. Their original behavioral coverage is retained. The following eight explicit reliability checks are the permanent daily-practice gate:

1. Complete a mock; compare review, dashboard, history and exported result.
2. Reload while drafting; preserve question, answer/code and timer.
3. Reload after scoring; preserve the same result identity and value.
4. Edit profile during evaluation; preserve the submitted answer and result.
5. Fail/interupt a request; retry after refresh without duplicate messages/results.
6. Complete a drill/retest; compare two user-authored attempts under the same rubric.
7. Execute canonical examples; verify outputs and trace line numbers for normal, empty and adversarial input.
8. Export, preview, restore and compare state; reject incompatible input without changing saved work.

Additional browser coverage checks narrow layout/focus, individual deletion, evidence/report persistence, named design versions, and independent DSA progress.

```sh
npm run test:unit
npm run lint
npm run build
npx playwright test e2e/daily-practice.spec.js --project=chromium
E2E_BROWSER_MATRIX=1 npx playwright test e2e/daily-practice.spec.js --project=chromium --project=firefox --project=webkit
```

## Coverage limits

Browser tests stub AI responses and account APIs; they verify product behavior, not model quality or a live production database. Live scoring calibration was attempted, the provider returned `API_KEY_INVALID`, and the user explicitly chose to skip it. A bounded, synthetic calibration runner is ready for a valid credential; no live scoring quality claim is made.

All 103 Java chapters have a structural inventory. 35 executable chapter samples compile with their advertised Java release and pass output/boundary assertions. The other 68 are explicitly contextual snippets or behavioral examples requiring framework/application types or infrastructure. All 75 canonical Java DSA solutions compile with Java 8 compatibility and pass executable fixtures. The chapter reader, guided problems, Java code panels and concrete examples use the same corrected definitions. The original DOCX is retained as archival input; in-app readers overlay the canonical corrections.

The three browser-executable algorithms additionally have exhaustive small-input comparisons between displayed source and trace outputs. Other language templates remain labeled starters, and legacy visual scenes are explicitly illustrative rather than reported as execution of arbitrary input. The automated mobile/browser accessibility checks do not substitute for physical-device or assistive-technology usability testing. No physical device or screen-reader speech session was tested. These limits are visible rather than presented as completed verification.

## Measurement interpretation

A bounded local event journal (latest 2,000 events) and a device measurement view are implemented. Anonymous tab-session IDs survive refresh, attempt IDs deduplicate recorded results/retests, and the existing metrics webhook receives the same correlation fields when configured. The journal is included in full backups. Cross-device/fleet reporting still requires a configured metrics destination.

- Time to useful practice: first `practice_started.value` milliseconds after page mount; combine with first durable result latency rather than interpreting a click as success.
- Question-to-answer rate: distinct started sessions with an answer / distinct started sessions. Unmatched sessions and duplicate events do not inflate the numerator.
- AI failure rate: `ai_failed / (ai_failed + ai_completed)`; successful completion values carry latency in milliseconds.
- Recovery: `draft_recovered`, `unfinished_session_available` and `session_resumed`; the device report compares matching anonymous sessions with unfinished work available. This is a within-tab resumption measure, not a cross-device retention claim.
- Recording: `result_recorded` is emitted only after a successful device write; compare with evaluation completion and `result_save_failed`.
- Retests: saved parent IDs link the two attempts; compare only matching rubric, round and difficulty. Count improved/open/unassessed separately.
- Content: reports keep `createdAt`, `resolvedAt` and status; resolution duration is emitted without the report text.

No aggregate metric alone proves learning, readiness, or hiring probability.

## Validation results — 2026-09-17

- `npm run test:unit`: 513 passed, 0 failed.
- `npm run lint`: passed with no warnings/errors.
- `npm run build`: passed.
- Daily-practice browser matrix: 36 passed (12 journeys each in Chromium, Firefox and WebKit).
- Cloud synchronization: 3 passed (failed hydration, edits during hydration, serialized writes).
- Final Chromium regression after the last timer/sync/evidence-policy changes: all 15 daily-practice and sync tests passed.
- `git diff --check`: passed. Existing tracked test artifacts were restored; new artifacts remain under `/private/tmp/shadow-*`.

The local dependency installation was missing the platform SWC binary. The exact declared Next.js 16.3.1 binary was restored without changing package manifests or the lockfile. Matching Playwright Firefox/WebKit binaries were installed for the matrix.

## Completion pass — 2026-09-17

- Corrected Java version labels, regex escaping, missing console output, integer-overflow boundaries, and misleading configuration validation claims.
- Added a canonical 75-problem Java reference catalog from the existing guide; fixed Java 8 compatibility, missing Binary Search, and incorrect worked traces (stocks, brackets, rotated search, linked lists, medians, combination sum, palindromes, decoding, intervals, bit counting and XOR).
- Removed prose masquerading as Java solutions and checklist percentages masquerading as readiness. Chapter examples prefer their own explanations over family boilerplate.
- AI evaluation validates exact answer quotations server-side, rejects malformed score types, preserves empty scores as unassessed, and defines anchored scoring and untrusted-input rules.
- Added WCAG A/AA scans, 200% CSS zoom, reduced-motion and keyboard tests. Fixed inaccessible DSA scrolling regions and ambiguous topic/workspace accessible names.
- Added reproducible scripts under `scripts/validation`. Run `npm run test:release` for the product release gate and `npm run test:content` for Java content execution (`CONTENT_JAVA_HOME` selects a JDK 21 installation).

Final completion-pass results:

- `npm run test:release`: passed end to end.
- Unit tests: **521 passed**, 0 failed.
- ESLint and production build: passed.
- Practice/sync/accessibility matrix: **54 passed** across Chromium, Firefox and WebKit, including 200% CSS zoom.
- Original TC01–TC08: **8 passed**.
- Java chapter validation: **103 inventoried; 35 compiled/executed; 0 failures**; 68 contextual examples classified explicitly.
- Canonical Blind 75 Java validation: **75/75 compiled and executed successfully** with Java 8 compatibility.
- Displayed JavaScript reference code and trace results agree for every array of length 0–4 over {-1,0,1}, with present/absent search targets.
- `git diff --check`: passed. Release artifacts remain in the operating-system temporary directory; tracked test artifacts are untouched.

Skipped by user: live Gemini scoring calibration. Manual acceptance still required: physical devices and actual screen-reader speech/navigation. Broader legacy DSA scenes remain labeled illustrations; only the three explicitly executable browser lessons claim real-input execution.
