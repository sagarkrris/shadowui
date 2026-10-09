# Part 21 semantic review - 9 October 2026

All eight supplied findings are corrected in the canonical website chapter and both exports. The chapter retains Q273-Q292, four tiers and three probes each. The prior master material is preserved.

- Q273: Spring delegates sync=true semantics to the provider; Caffeine is named for the instance-local example. A separate distributed lock is conditional on measured/provider guarantees, not automatic.
- Q276: PostgreSQL nextval allocates outside transactional rollback and does not order commits. The answer distinguishes allocation, aggregate ordering, causal clocks and commit-log order; A=100/B=101 commits are explicitly challenged.
- Q280: RFC 9110 strong validators cover every observable representation change and appropriate variants. Independent child changes must invalidate the validator, and concurrency validation must be atomic; a standalone root @Version is conditional, not universal.
- Q281: two layers with three retries after the initial attempt yield 4 x 4 = 16; three layers with three total attempts yield 27. Retry safety still depends on idempotency and ambiguous-outcome handling.
- Q283: connection replacement can reuse DNS cache entries, including indefinite positive caching. Client-specific resolver TTL and connection lifetime must both be assessed; the verification procedure changes an address explicitly.
- Q287: JDK 21 documents both histogram and heap dump as high impact. head limits output, not heap scanning. Metrics/JFR are the initial options; histogram cost is qualified in the core answer, probe and command comment.
- Q289: Java 21 join returns after all tasks finish or scope shutdown; close waits for unfinished threads. Cancellation is interrupt-based and cooperative. joinUntil is not a hard bound on close. Scoped bindings do not freeze mutable objects; nested rebinding restores the outer binding.

Primary references are linked beside the relevant claims: Spring Framework cache API/reference; PostgreSQL sequence documentation; RFC 9110 section 8.8.1; Java 21 InetAddress, jcmd, StructuredTaskScope and ScopedValue documentation.

Behavioral evidence: the Part21Checks fixture compiles both actual published Java fragments with supplied domain types on JDK 21.0.9 and preview flags for Q289. It checks same-key coalescing, unrelated-key progress, success/failure cleanup, retry after failure, null-key rejection, join with an unfinished interrupted sibling, completion after close, scoped inheritance, nested rebinding, unbound access and mutable objects. Fixtures use test latches and time-bounded waits, not sleeps. These are teaching fragments, not framework integration tests.

Empty/list boundaries do not affect the single-flight loader contract; null keys are tested and rejected by ConcurrentHashMap. Duplicate completion and key identity are checked through a shared internal future, isolated caller copies and conditional removal. Persisted data, tenant transitions, retention/replay, DNS failover, lock fencing and cache-provider behavior require the named infrastructure and remain source-backed/manual integration procedures. No new transaction, broker, HTTP server or cluster implementation was added.

Q19, Q165 and Q205 cross-references were verified in the existing source. The website preserves the numbering gap Q245-Q272 because Parts 17-20 currently remain export-only supplements. Static routing, reader pagination, catalog links, sitemap and mobile/desktop reading have explicit browser coverage in the complete gate. Existing javaRelease tech-blog registry remains unchanged; this supplemental guide has a dedicated unit-suite fixture.

PDF verification: all 292 master questions and 20 standalone questions present; 143 canonical code blocks preserved; five daily sets unchanged; all HTML text blocks found in PDF extraction; 114 internal master links resolve. All 365 master pages and 29 standalone pages were rendered and inspected at contact-sheet scale, with high-resolution checks of the chapter cover, diagnostic commands and structured-concurrency example.

The mandatory repository gate runs on frozen final files. Its timestamped report and actual outcome are recorded separately after execution; historic v24 results are not v25 evidence. Framework/database/cloud/Kubernetes behavior and deployed-site alignment are not claimed as live validation.

Prior revision gate outcome (superseded by this review): PASSED, 704 unit tests and 179 browser tests, no failures/skips/flaky results, 50 courses, practice Java/lint/build/diff checks passed. Evidence: /private/var/folders/28/mv34cj954cs07yfssf_pj30c0000gq/T/tech-blog-release-ndFNa0/report.json. Final content was frozen throughout.


## Independent follow-up review

Reviewed the complete website wiring, new chapter, Java harness and export synchronization. Fixed the following additional issues:

- Q273: returning the map's mutable future let one caller cancel, time out or inject a result for everyone. Return CompletableFuture.copy() to each caller. Clarify synchronous winning work and cancellation scope. Preserve interruption and rethrow fatal Errors after completing followers exceptionally. Tests execute actual published code and cover 20 followers, caller cancel/complete/orTimeout, unrelated keys, success/failure removal, retry, interruption and fatal cleanup. The same fixture fails when copy() is removed, demonstrating the shared-future regression.
- Q274: atomic commit does not by itself establish global serializable isolation. Removed the stronger-isolation promise.
- Q278: DLT diversion/replay can reorder effects after blocking retries. Clarified strict-key quarantine and acknowledgement/recovery configuration, including failed asynchronous publication. Added explicit infrastructure verification scenarios.
- Q282: reading a non-null new column while old-only writers remain can return stale data. Keep old reads through writer migration and concurrency-safe backfill, validate before switching reads, retain dual writes through rollback. Corrected the claim that a rename necessarily prevents new pods becoming ready.
- Q283: Little's law estimates in-flight requests; HTTP/2 streams multiplex connections. Qualified connection sizing by protocol.
- Canonical master Markdown contents pointed to a fragment absent from that file. It now resolves to the sibling chapter. The test opens the actual target and verifies its heading anchor.

Primary evidence: Java 21 CompletableFuture.copy()/orTimeout() API; PostgreSQL PREPARE TRANSACTION; Spring Kafka recovery/offset reference; GitLab staged migration guidance; RFC 9113 section 5. Links are embedded beside affected guidance. Database and Kafka changes are explanatory procedures; no database or Kafka implementation was added, and live migration/recovery behavior remains an integration-test requirement.

Updated export verification passes: 365 master pages, 29 standalone pages, all 292 questions, 143 canonical code blocks, 5 daily sets, 114 internal links, and every extracted HTML text block accounted for. Full gate on this revision follows; the previous gate is not claimed for these new edits.

Final follow-up gate: PASSED at 2026-10-09T07:52:20.188Z. 704 unit tests and 179 browser tests, zero failures/skips/flaky results; Java practice, lint, production build and whitespace checks passed. Source fingerprint stayed unchanged during the gate. Evidence: repository-gate-report.json (copied from tech-blog-release-7iO26Q/report.json). Only evidence metadata was written after the gate; application content, tests, Markdown exports and PDFs were unchanged. Inspected all 29 standalone PDF pages and master pages 333-364, including adjacent section transitions, with a detailed view of the corrected Java example.
