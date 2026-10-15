# System-design lesson review — 15 October 2026

Scope: all 50 concepts in `systemDesignConceptLessons.mjs`, their integration into
the existing visual guide, native learning disclosures, article tools and tests.

The independent semantic pass covered all four levels, the spoken answer and
follow-up for every concept. These are original conceptual interview scenarios,
not runnable infrastructure, framework applications or measured benchmarks. No
new Java course or `javaRelease` declaration is introduced. The ten existing
diagrams retain their original nodes and relationships.

Primary sources are linked per lesson: Google SRE for reliability and operations;
PostgreSQL, MongoDB, DynamoDB and etcd for data and consistency; Kafka and Debezium
for messaging boundaries; AWS and Azure Architecture Center for recovery patterns;
OWASP for identity, authorization, tenants and secrets; OpenTelemetry for signals;
RFC 1034 for DNS. Product-specific behavior is qualified rather than generalized
to every database, broker or provider.

Reviewed boundaries include:

- Foundations: offered versus successful work, percentile versus mean, stable
  system assumptions, skew, and request-based versus time-based availability.
  Arithmetic checked: 1,000 bad events out of one million at 99.9%; 1% failures
  imply ten-times budget burn; 100 operations/s × 0.2 s implies 20 in progress;
  8.64 million daily writes imply 100/s average and 8.64 GB/day at decimal 1 KB.
- Data: null and historical schema values, concurrent updates, stale replica
  reads, hot partitions, read/write locality, cache fill-after-invalidation,
  delete/recreate cycles, and ACID versus replica consistency. Cross-service
  transactions are explicitly possible with supported coordination; Saga is an
  alternative, not evidence of impossibility.
- Messaging: duplicate and concurrent delivery, acknowledgement after effect,
  replay retention, reordered versions, outbox rollback and relay duplication,
  poison messages, checkpoint ordering, compensation failure and commit ambiguity.
  Three layers with three total attempts each can produce 27 leaf attempts.
- Reliability: nested deadline exhaustion, cancellation after commit, breaker
  transitions, permit ownership and double completion, hidden shared resources,
  readiness versus liveness, stale writers, split-brain risk, missing keys during
  restore, and limits of a fault experiment. The separate review clarified that a
  caller timeout must not release a permit while protected local work continues.
- Evolution: valid identity without object permission, tenant scope in alternate
  paths, authorization/state races, revocation and rotation, old/new reader/writer
  combinations, historical replay, delete resurrection during migration, low-volume
  canary uncertainty, irreversible external effects, and recovery headroom costs.

Rendering review: beginner explanation and full interview answer stay visible.
Native disclosures expose intermediate, applied and deep levels plus follow-ups.
All-level controls are scoped to this article. Heading identities and existing
bookmarks are preserved; heading actions are compact within this guide only. A
separate visual pass found a generic 15px scroll-margin override hiding headings
under this guide’s sticky header. Scoped 110px offsets and an occlusion regression
now protect direct concept links on mobile and desktop.
No raw HTML injection, external SDK, dependency or new network mutation is added.

Behavioral regressions cover every lesson on mobile and desktop; expand/collapse,
keyboard disclosure, deep-content search, section links, persisted bookmarks and
axe accessibility. Structural tests also reject missing stages and references.
Final full-gate evidence is recorded in the application-audit artifact after the
unchanged production build completes. Automated success is not a zero-bug promise
or live-service verification.
