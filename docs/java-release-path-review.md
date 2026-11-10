# Java 8–26 release path and CI portability — 10 November 2026

The course now has 143 chapters: the existing 109 retain their IDs and URLs, and
34 new chapters extend the modern language, library and runtime material through
Java 26. `/java/releases` maps every release from 8 through 26 to real chapters.
It explicitly distinguishes historical previews from the later permanent forms
used by the executable lessons. This is a practical feature curriculum, not a
claim to document every JEP, implementation change or platform API addition.

The release map, Java index, roadmap, Java Digest and sitemap expose the path.
The main course teaches local type inference before new examples that use var.
New chapters have a complete spoken answer, a concrete trace/diagram, stated
assumptions, trade-offs, failure cases, a primary reference, an answered follow-up
and a separate explained practice solution.

115 complete programs are registered with the content inventory. The unchanged
28 contextual examples retain their explicit infrastructure/setup boundaries.
The 34 new examples compile at their declared releases and execute with their
published runtime flags. Four Java 26 preview lessons and the separate incubator
Vector lesson are labeled visibly in both the release path and chapter pages.
Scoped values and the Java 25 language features are labeled permanent. String
templates are identified as withdrawn rather than taught as Java 26 syntax.

## Toolchains and the CI failure

Run 42767876797 reached the validation gate after the Ubuntu runner correction.
Its curriculum tests failed trying to execute a macOS-only javac path on Linux.
The shared java-runtime helper now honors CONTENT_JAVA_HOME, then JAVA_HOME from
setup-java, then PATH. The Java curriculum test and both Java-content/Blind-75
validators use that helper. Newer release examples first use CONTENT_JAVA26_HOME.
CI installs JDK 26 and preserves that path before setting the JDK 21 baseline for
existing Maven/framework fixtures. No framework dependencies were upgraded.

Locally verified with Temurin JDK 21 and Oracle JDK 26.0.2.1, extracted to a
temporary directory without changing the system installation. CI selects Temurin
for both versions; a hosted Linux pass still requires pushing and running these
changes. The workflow remains pinned to Ubuntu 24.04 for Playwright 1.55.1.

## Independent semantic review

Reviewed the source, fixture behavior and diagrams separately from implementation:

- Primary language history: Oracle's Java 26 language-change summary. Stable target
  releases are kept distinct from preview introduction dates. Historical 12/13,
  19/20 and 23 cards explain why they link later finalized or version-specific labs.
  <https://docs.oracle.com/en/java/javase/26/language/java-language-changes-summary.html>
- Java 26 runtime and preview classification: HTTP/3, final-field mutation policy,
  G1/AOT changes and Applet removal are kept separate from primitive patterns,
  lazy constants, structured concurrency, PEM previews and the incubator Vector API.
  <https://docs.oracle.com/en/java/javase/26/migrate/significant-changes-jdk-26-release.html>
- The Java 9 interface is top-level in the published source. A nested interface
  would let the enclosing example class access its private helper, invalidating
  the proposed visibility exercise. The negative compilation fixture catches this.
- Vector compiler resolution is not assumed to require an explicit module flag
  on every compiler. The lab shows explicit module resolution and tests that
  launch without the incubator module fails. Preview labs separately reject
  compilation without --enable-preview on their declared Java 26 toolchain.
- HTTP fixtures build and inspect client/request configuration without sending
  traffic. A configured HTTP_3 preference is not a negotiated protocol result;
  the Java 26 constant is rejected when compiled for Java 21.
- Structured concurrency uses the Java 26 open/fork/join API. Latches establish
  the failure/interruption interleaving; the fixture verifies that the owned
  child exits before the parent observes scope completion. No sleep-based proof.
  <https://docs.oracle.com/en/java/javase/26/docs/api/java.base/java/util/concurrent/StructuredTaskScope.html>
- Foreign memory tests lifetime and bounds; scoped values test nested restoration
  and unbound access; collection factories test snapshots, null rejection and
  unsupported mutation; reversed collections test their shared-view lifecycle.
- Numeric patterns test both int boundaries and values just outside them. Switch
  tests cover null/default/guard ordering, and text blocks check exact content,
  indentation and trailing newline. Tests invoke published implementations.
- ML-DSA checks original and changed messages using ephemeral local keys. HKDF
  checks RFC 5869 test case 1 and context separation. The chapter uses public test
  inputs and explicitly distinguishes derivation from password storage. No real
  key material is logged or fetched from a user environment.
  <https://www.rfc-editor.org/rfc/rfc5869.html>
- Final-field mutation is tested under the displayed deny flag; it is not described
  as Java 26's unconditional default. Lazy-constant null rejection and cached reads
  are tested without promising a computation timeout or an eviction policy.
- Runtime/AOT discussion makes no benchmark claim. Its runnable fixture proves
  collector selection only; it does not claim to create an AOT cache, measure a
  throughput improvement or validate a production rollout.
- No new tech-blog javaRelease course was declared. The full unit suite discovers
  all release fixtures; the full gate also includes the new public/workspace,
  mobile/desktop, release-status, command-flag, sitemap and navigation regressions.

## Validation record

Focused checks before the final gate: 19 portability/curriculum checks passed
with only JAVA_HOME configured; 75/75 Blind-75 reference solutions passed; 40 new
release/toolchain/path checks passed; 20 production-browser checks passed. Lint
and production build passed during iteration. These are not substitutes for the
final `npm run verify:tech-blog` result.

The final gate report under its timestamped tech-blog-release directory records
actual completion, all executed test counts, no-skip/no-retry evidence and source
fingerprint. Record that report's actual result in the task delivery. Real HTTP/3
transport, foreign native calls, trained AOT caches and production performance
are outside these stated local fixture boundaries. No deployment is performed.

## CI report-path follow-up

Run 42773237550 reached the full unit suite: 942 tests passed and the inventory
wrapper failed while writing `/private/tmp/shadow-content-audit.json` on Ubuntu.
The default destination now uses `join(tmpdir(), filename)` in the Java-content,
Blind-75 and optional calibration scripts; explicit CLI destinations are retained.
The inventory regression executes all published programs with an isolated temporary
root and reads back the JSON report, checking the complete chapter count, executable
count and empty failure list. This would fail with the previous hardcoded path even
on macOS, where `/private/tmp` happens to exist. Reviewed the remaining validation
paths: CI-provided JDK homes take precedence over optional local fallback homes.
The optional calibration makes live provider requests and is not run for this path fix.
The final complete gate result is recorded in the task delivery.
