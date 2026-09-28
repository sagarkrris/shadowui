# Java engineering practice

`/build` includes twelve original Java 17 challenges across system components,
object design, and concurrency. Existing multi-chapter projects remain available.
Each challenge has an editable starter, explicit contract, visible examples and
failure checks, progressive hints, authored reference, design follow-up, and
links to its lesson and System Canvas. The public and workspace lesson readers
link back to relevant challenges.

## Available without a runner

Download the current draft with its test harness as `Main.java`, then run:

```sh
javac --release 17 Main.java
java Main
```

Save drafts and reasoning explicitly in the browser. Progress distinguishes
self-reported local checks from runner checks for the exact saved source.
Editing invalidates results; basic examples alone do not complete a challenge.
Local storage is not an account sync or trustworthy assessment record.
Optional AI review uses the existing configured evaluation service, sends the
current implementation, and never substitutes for execution or records a pass.

## Shared Java runner

Practice uses the same private runner as the Java editor. Set these server-only variables:

```dotenv
JAVA_RUNNER_URL=https://your-private-runner.example
JAVA_RUNNER_SHARED_TOKEN=replace-with-a-random-token-at-least-32-characters
```

No Piston service or `PRACTICE_RUNNER_*` settings are needed. The adapter sends
Java 17 source plus its harness to `/v1/run` using `X-Java-Runner-Token`.
Deploy the updated service with its shared host-visible workspace as described in
[the runner guide](../services/java-runner/README.md). Install the Java 17 image.
Configuration enables the buttons; it is not an availability or isolation check.

Provision the service separately from the web application with no host secrets,
no outbound workload network, ephemeral filesystem, unprivileged isolation,
bounded queue/concurrency, process/memory/CPU limits, timeout enforcement and
output limits. Request-supplied limits alone are not a security boundary: enforce
them at the runner. Verify these properties before enabling the endpoint.
Use application authentication (do not disable REQUIRE_AUTH in production) and
shared rate limiting for replicas; the existing local limiter is only per process.

The service enforces 8-second compile/run limits and bounded container cleanup.
The adapter caps upstream responses at 128 KiB and displayed output at 16,000
characters. Runtime phase, exit code, timeout/output flags, signal and the correct
harness marker must all indicate success. Since
learners can alter source, visible checks and markers can be spoofed: this is
practice feedback, never secure grading or certification. Both entry points now
share the same execution service and credentials.

No live runner was provisioned as part of this feature. After provisioning, verify
a known passing reference, a compile error, assertion failure, infinite loop,
output flood, denied network/file access, cancellation and concurrent saturation.

## Verification

```sh
npm run test:build-challenges
npm run test:unit
npm run lint
npm run build
npx playwright test e2e/build-challenges.spec.js --project=chromium --workers=1 --output=/private/tmp/build-practice-results
```

The Java verifier compiles every authored starter/reference using `--release 17`,
runs both example and full suites, requires references to pass, and requires
starters to fail. It only executes repository-owned fixtures, never submissions.
Unit tests cover lesson integrity, persistence and runner trust boundaries;
browser tests cover discovery, mobile use, downloads, persistence, stale results,
AI failure and mocked runner feedback. Mocked tests do not verify a deployed sandbox.

For new tech blogs, add a related challenge only when a small executable contract
improves the lesson. Reuse an existing challenge when appropriate. Add it to the
shared catalog; both lesson readers and sitemap discover it automatically. Keep
the stated challenge count and tests in sync, and run this verifier after changes.
