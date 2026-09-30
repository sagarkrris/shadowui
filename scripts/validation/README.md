# Content and scoring validation

## Mandatory tech-blog release gate

Run `npm run verify:tech-blog` after **every** tech-blog addition or change. It is
also called by CI and `npm run test:release`; do not substitute a topic-specific
verifier, a partial run, or compilation alone. Prerequisites: Node 20+, JDK 21
(`JAVA_HOME` must be valid), Maven, installed dependencies, and Playwright Chromium
(`npx playwright install --with-deps chromium`). Port 3001 must be free.

The gate fails closed and accepts no skip/filter arguments. It checks:

1. Complete catalog/chapter guidance, unique identities, known diagrams, explicit
   demo assignments, and practice lesson links.
2. Every declared `javaRelease` course has a registered behavioral fixture in
   `tech-blog-contracts.mjs`. It compiles the **published** examples with their
   declared `--release` and executes each fixture. Its JSON report lists the
   selected course IDs, example counts, fixtures, and results. New framework or
   other-runtime examples need their own executable tests in the unit suite;
   contextual snippets must be explicitly described as such in the lesson.
3. Full unit tests, all Java practice starter/reference suites, lint, and build.
4. The freshly built production app: every catalog course in public mobile and
   desktop readers and the workspace reader; answers, links, demo scenarios and
   reset controls; public index and sitemap; broad diagram/image layout checks;
   practice downloads and mocked adapter behavior. Browser retries are disabled.
   Unit/browser evidence must contain executed tests and no skipped, cancelled,
   todo, flaky, failed, or global-error results; exit code zero alone is insufficient.
5. Diff whitespace and an unchanged source fingerprint from start to finish.
   Concurrent edits invalidate the result even when individual commands pass.

Logs and browser artifacts stay in a temporary `tech-blog-release-*` directory.
`report.json` distinguishes a pass from failure and records completed steps;
unlisted steps after a failure did **not** run. CI uploads the evidence even on
failure. Configure the repository's **CI / validate** status as a required branch
check in hosting settings to prevent merges around it; local code cannot enable
server-side branch protection. No runner provisioning or deployment occurs.

### Required independent semantic review

A green command is necessary, **not proof of zero bugs**. Before marking work ready,
review the complete final diff separately from implementation and record evidence
in the task/automation memory:

- Verify technical claims and diagram arrows against primary documentation;
  state runtime versions and whether an example is a model, fragment, or runnable system.
- Challenge assumptions with invalid/null/empty/boundary inputs, duplicate and
  concurrent completion, cancellation, stale ownership, retry retention, and
  ambiguous outcomes where applicable. Record why a dimension is not applicable.
- Add behavioral regressions that fail without each fix. Content-presence checks
  and tests that repeat the implementation's assumptions are insufficient.
- Inspect public/workspace rendering, mobile/desktop diagrams, and authored answers.
- Do not call a blocked/skipped check passed or a mocked adapter a live sandbox.
  Fix every actionable finding, then rerun the gate after the final edit.

The gate catches missing wiring, missing declared Java fixtures, executable
regressions, and rendered failures; human review still owns semantic correctness,
real infrastructure behavior, and whether the cases sufficiently cover the lesson.

- `npm run test:build-challenges`: compiles every Java 17 practice starter/reference and executes both example and full failure suites. Starters must fail; references must pass. Run after changes to practice content or harness, alongside `e2e/build-challenges.spec.js`. See `docs/build-practice.md` for the deferred runner and distinction between local, mocked and deployed verification.

- `npm run verify:background-jobs`: compiles all six published background-job examples using Java 17 and runs deterministic assertions from `test/fixtures/BackgroundJobsChecks.java`. Covers duplicate/concurrent release, capacity exhaustion, exceptional cleanup, every drain state before/after the deadline, and identity/fencing/reconciliation/lateness boundaries. Uses temporary files, cleans them on success/failure, and exits nonzero on compilation or assertion failure. Also runs in `npm run test:unit` via `test/backgroundJobs.test.mjs`.
- New standalone Java 17 tech-blog courses should declare `javaRelease: 17` in their catalog definition. The shared compilation test discovers those courses automatically; add a course-specific behavioral fixture/test for meaningful failure boundaries. Framework examples and other Java versions need an explicit runtime harness with the declared version. Compilation alone does not verify the lesson's behavior.
- After each blog addition: review the complete diff for factual accuracy and executable failure cases, prove the new examples are actually selected by their harness, run `npm run test:unit`, `npm run lint`, `npm run build`, and focused public/workspace/mobile browser checks. Fix findings and rerun affected checks. Record exact successful commands and any blocked checks; do not report completion from partial command output. Use a temporary Playwright output directory to avoid changing tracked run artifacts.

- `node scripts/validation/check-java-content.mjs`: inventories all 103 Java chapters and compiles/runs 35 standalone or method-harness examples with their declared `--release` level. Other examples require application types, infrastructure, or express a behavioral result rather than stdout; the JSON report labels them contextual snippets.
- `node scripts/validation/check-blind75.mjs`: compiles all 75 canonical Java reference solutions with `--release 8` and executes bounded regression fixtures, including empty, duplicate, negative, cyclic, ordering, and overflow-sensitive examples where relevant. Standard ListNode, TreeNode and Node fixtures are supplied by the harness. The canonical source is `lib/blind75JavaReferences.json`; lesson views consume it directly. It originated in the existing study guide; subsequent corrections are maintained in this file. Compilation and bounded cases are not a proof for every input.
- Set `CONTENT_JAVA_HOME` to a JDK 21 installation outside this Mac. Reports and compiled classes use temporary directories.
- `node scripts/validation/calibrate-ai.mjs`: makes at most ten synthetic Gemini requests, compares score bands, validates exact evidence quotations, and writes a credential-free report. It does not use personal answers. Requires a valid `GEMINI_API_KEY`; explicitly skipped by the user on 2026-09-17 after the configured credential was rejected.
- `npx playwright test e2e/practice-accessibility.spec.js`: WCAG A/AA axe scans, narrow layout, text scaling, keyboard access and reduced-motion checks for Today, system design and DSA. Real assistive-technology and physical-device usability are separate manual acceptance checks; emulation does not prove them.

All commands exit nonzero on failure. See the release notes for the exact runs and scope.
