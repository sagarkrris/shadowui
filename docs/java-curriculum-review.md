# Java curriculum review — 10 November 2026

The initial public chapter checklist, learning catalogue, Java Digest library and chapter
navigation used one explicit 109-chapter sequence. The follow-up release expansion is
recorded in `docs/java-release-path-review.md`. Original catalog IDs 1–103 and
existing slugs retain their meanings. Six appended foundation chapters explain
variables, classes, null, build dependencies, SQL and HTTP. Numbered chapters are
the beginner entry point; the existing backend project journey follows them and
states its collection/test prerequisites.

Every chapter now has a beginner explanation, mechanism, concrete example trace,
complete spoken answer, answered follow-up, verification guidance and an explained
practice solution. Diagrams use the same authored trace as the lesson, while
preserving existing ownership, reverse and branching relationships and the
JDK chapter's more detailed compile/launch diagram. Generic category
analogies are no longer substituted for authored explanations. Both public pages
and Java Digest cards show complete source/commands/output when supplied.

81 examples are complete standalone programs, tested using their declared Java
release. The remaining 28 are explicitly contextual: SQL, HTTP, module declarations,
JVM diagnostic commands or framework fragments. Their setup notes identify required
types, dependencies and infrastructure. Framework sketches are not advertised as
executed applications; the existing MVC test skeleton is explicitly identified as
an incomplete fixture. No new tech-blog javaRelease course is declared, so there
is no new tech-blog fixture registration; tutorial execution is registered through
the full unit suite's javaCurriculumCode test.

## Independent semantic review

Reviewed the final data/reader/navigation changes separately from their construction:

- JLS 21 chapter 5: widening does not guarantee integer precision when converting
  int to float or long to float/double. The old absolute statement was corrected.
  <https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.2>
- Java SE 21 Pattern documentation: Java string escaping and regex escaping are
  separate. Behavioral regression tests exercise the actual published pattern
  with matching text, embedded space and trailing space.
  <https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html>
- Class.forName's initialize flag and CompletableFuture cancellation are described
  according to the API contracts; cancellation is not represented as proof that
  the underlying operation stopped.
  <https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html>
  <https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html>
- The added SQL, HTTP and build introductions link PostgreSQL, RFC 9110 and Maven
  primary documentation. SQL constraints, absent rows, HTTP response loss and
  undeclared dependencies are distinguished in the worked follow-ups.
- Reviewed empty input, duplicate keys, mutable aliases, integer overflow,
  constructor bounds, cycles/disconnected graphs, invalid generic writes and
  builder reuse. Boundary fixtures use published implementations, not copies.
- The beginner Generics example uses a small Box without streams or wildcards;
  the Methods example uses primitive arguments without collections. OOP examples
  define the classes they execute. Import lists are derived from used JDK types.
- The discount strategy explicitly uses nonnegative minor units with rounding
  down. The property example explicitly enumerates 31 bounded cases; it does not
  claim to implement generator shrinking. Neither is a production guarantee.
- Framework notes explain that a duration does not enforce a deadline, an inner
  fetch join excludes empty associations, a configuration record alone performs
  no validation, and a local transaction cannot roll back a remote side effect.
- Concurrent completion, cancellation and ambiguous remote outcomes are teaching
  boundaries, not new application operations in this change. No new remote writes,
  infrastructure adapter, database schema or dependency has been added.
- Reader coverage follows every Next/Previous boundary and opens every chapter's
  explained solution. Mobile/desktop checks cover source, diagram and navigation;
  existing progress IDs remain checked after reordering. The full gate includes
  these regressions in its production browser suite.

## Validation evidence

Before the final gate, the 18 focused curriculum/roadmap/scroll browser checks
passed. The first 62 complete programs and nine focused boundary checks passed;
additional programs and boundaries are included in the final full unit run.
Lint passed during iteration. These partial results are not a release pass.

Run `npm run verify:tech-blog` against the final files. Its timestamped report in
`tech-blog-release-*` is the authoritative final result, including unit, practice
Java, lint, build, browser and source-fingerprint checks. Record its actual outcome
in the task delivery. Live Spring/database/container services are not exercised by
these standalone tutorial fixtures. No deployment is authorized by the gate.
