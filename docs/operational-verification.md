# Operator verification without implied readiness

Run configuration preflight without contacting a service:

```bash
node scripts/validation/operational-preflight.mjs --report=/private/tmp/interviewiq-config.json
node scripts/validation/calibrate-ai.mjs /private/tmp/interviewiq-calibration-inventory.json
```

Both default commands are offline. The first reports only presence/format checks,
not runner or provider health. The second inventories the versioned synthetic
calibration dataset and records null metrics: no score or validity conclusion can
be drawn without live observations. Reports omit credentials, endpoint addresses,
raw provider errors, Java output and submitted source.

## Separate runner integration (explicit opt-in)

Use an idle, dedicated **loopback** runner configured according to
`services/java-runner/README.md`. Set `JAVA_RUNNER_URL` and the matching
`JAVA_RUNNER_SHARED_TOKEN` in the operator environment. The verifier does not
start Docker, provision the service, install images or execute Java on the main
application server. All Java goes to that existing private runner service.

```bash
node scripts/validation/operational-preflight.mjs --runner-integration --report=/private/tmp/interviewiq-runner.json
```

This intentionally runs known Java 17 programs for success, stdin, compilation
failure, explicit assertion failure, infinite-loop timeout and excessive output.
It also occupies both admission slots and expects a third request to get HTTP
429, then verifies idle health. Use a test instance: these checks consume its
capacity. Normal execution and output are bounded by the existing service.
Unexpected failures stop the sequential program suite. The command exits nonzero
if checks fail; reports never include raw response errors.

The runner currently has no remote cancellation endpoint or disconnect-driven
execution cancellation. The verifier aborts its client request, then checks that
admitted work drains within a bound. That is **not** proof of immediate remote
cancellation. `/health` is admission health, not proof of the sandbox. An operator
must separately inspect orphan containers, job directories, quota usage, image
availability, daemon isolation and the README recovery procedure. Only Java 17
is exercised; verify other promised images separately. A service crash or failed
cleanup still needs operator reconciliation before restarting.

## AI calibration (only after authorization)

No live AI call was made for this change. The earlier invalid-credential
calibration remains skipped. When a valid credential is available and a live run
is explicitly authorized, the existing harness can be invoked with:

```bash
node scripts/validation/calibrate-ai.mjs --live /private/tmp/interviewiq-ai-calibration.json
```

The harness reuses the application gateway, evaluation prompt and parser. It
makes at most ten synthetic evaluation operations (model discovery/fallback may
involve additional provider requests) and stops on provider unavailability. Each
operation has the existing timeout; this is an operator command, not a UI action.
Fixture version 1 is `java-volatile-synthetic`: no-evidence, incorrect, partial,
strong, and prompt-injection answers. Its score bands are provisional authored
regression expectations, **not expert-reviewed labels**. Independent expert
review has not occurred; expert agreement and population validity remain unknown.

The report records per-case repeated-score mean, population variance and range;
provisional-band agreement; exact evidence-quote validity; complete rubric keys;
and follow-up/exercise presence. A single repeat has no variance estimate, and no
quotes means quote validity is unassessed. Presence does not establish follow-up
quality. Independent experts should label a broader held-out set, resolve
conflicts and review pedagogical quality before anyone claims assessment
calibration. Keep fixture, rubric, model and observation versions with reports.

Mocked regression coverage validates verifier contracts and redaction without
certifying deployed services or contacting a provider:

```bash
node --test test/operationalVerification.test.mjs test/javaRunnerService.test.mjs test/interviewSession.test.mjs
```
