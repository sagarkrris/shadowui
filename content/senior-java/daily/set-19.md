**Set 19 · 30 October 2026 — Preserving contracts during recovery and evolution**

Reference assumptions: **Java 21 without preview features**, Spring Framework 7.0 MVC (as used in a compatible Spring Boot application), Jakarta Persistence 3.2 and Kafka 4.0. These are explicit reference versions, not upgrade recommendations. Primary references checked 30 October 2026. Verify the actual provider and Boot-managed versions.

Stable IDs: **S19-Q01–S19-Q12**, in order. Spoken answers target 45–90 seconds. Examples are original illustrations, not personal experience. Framework, broker, filesystem and distributed protocols are contextual designs, not executed integrations. Q11 is runnable Java compiled by its fixture; Q12 is a conceptual algorithm with a derived proof.

---

**1. Arrays.asList on an int array produces a list of size one. Why did boxing not create one Integer per element?**

**Say aloud:** “Boxing converts a primitive value into its wrapper object. It does not recursively convert a primitive array into an array of wrappers. The generic variable-argument method can treat the entire int array as one reference element, so the result is a list containing that array. This is different from calling the same method with several individual integer arguments.

I would choose the conversion explicitly: stream the primitive values, box each value and collect into the required list type. I would also specify whether the result must be mutable and whether it should reflect later input changes. The array-backed list returned by asList has fixed size; fixed size does not mean its elements are immutable. I would test empty arrays, later array mutation and attempted insertion. A generic-looking utility call does not establish the intended element or ownership contract.”

**Example:** Contextual expressions: `Arrays.asList(new int[]{4,7}).size()` is 1; `Arrays.stream(new int[]{4,7}).boxed().toList()` has two Integers and is unmodifiable.

**Deep dive / verification:** Element conversion costs O(n) time and storage. For a mutable independent list use an explicit ArrayList copy. With an object array, asList shares the array storage; replacing elements affects both views.

**Follow-ups:** Does List.copyOf deeply copy array elements? No; copying references does not copy their targets. Can a fixed-size list support set? Yes, asList supports replacement while rejecting size changes.

**Primary reference:** [Java 21 Arrays](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**2. A worker counts down a latch and then writes its result. Why can await return before the result is ready?**

**Say aloud:** “A latch is a one-shot gate that opens when its count reaches zero. Its memory guarantee orders actions before a worker's countDown with actions after another thread successfully returns from await. It does not order arbitrary actions performed after countDown. Signalling completion before publishing the result therefore places the result outside the promised boundary.

I would store the outcome first and signal afterward, using finally when the gate represents terminal completion even on failure. The outcome must represent failure as well as success, so a released gate cannot be mistaken for a successful computation. Distinct workers also need safe ownership of result slots; the latch does not make concurrent writes into an ordinary list safe. I would test with a second gate deliberately pausing the worker after signalling. This exposes the ordering mistake deterministically without depending on sleeps or repeated lucky scheduling.”

**Example:** Conceptual: worker assigns its own result slot, then countDown; coordinator consumes slots only after successful await. A timed await returning false permits no complete-result assumption.

**Deep dive / verification:** A latch cannot reset for the next batch. Size the count to obligations actually guaranteed to signal, including rejection/cancellation policy. Successful completion publication does not make subsequent mutations safe.

**Follow-ups:** Is getCount()==0 a replacement for outcome modelling? No; zero says the gate opened, not that jobs succeeded. What if await is interrupted? Follow interruption policy and do not consume an assumed complete batch.

**Primary reference:** [Java 21 CountDownLatch](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html).

---

**3. A parallel reduction subtracts readings and differs from a sequential run. Is preserving input order enough?**

**Say aloud:** “A reduction combines many values into one. Associativity means regrouping combinations does not change their result. Parallel reduction splits the input and combines partial answers, so its operator needs that property and its identity must leave values unchanged. Subtraction fails associativity: subtracting a grouped difference is different from subtracting each value in order. Encounter order alone does not repair an invalid reduction.

I would first define the mathematical operation. If the requirement is an ordered running subtraction, use an explicit sequential fold. If it is total debits from an opening balance, sum the debits with a valid numeric policy, then subtract once. Floating-point addition introduces rounding differences even though real-number addition is associative. I would test alternative partitionings and boundary values. Parallel execution is an implementation choice that requires a compatible operation, not permission to change business arithmetic.”

**Example:** With values 8,3,2, `(8-3)-2` is 3 while `8-(3-2)` is 7. These are illustrative groupings, not a promise about a particular stream's partitioning.

**Deep dive / verification:** A sequential fold takes O(n) work and O(1) accumulator storage. Parallel overhead can outweigh benefit. Mutable accumulation belongs in a correctly designed collector with isolated partial containers, not a shared reduce identity.

**Follow-ups:** Is zero a subtraction identity? It is not a two-sided identity. Can money use double? Prefer an explicit decimal or integer-unit policy with bounded arithmetic and rounding rules.

**Primary reference:** [Java 21 Stream reduction contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**4. A dashboard shows committed heap much larger than used heap. Does the difference prove a retained-object leak?**

**Say aloud:** “Used heap measures memory currently reported as occupied, while committed heap is memory the JVM has made available for heap use. Maximum heap is a separate capacity bound, which can also be undefined in management data. A gap between committed and used is not by itself evidence that application objects are retained incorrectly.

I would compare used memory after comparable collection cycles under equivalent workload, then investigate retaining paths if the live population keeps growing. I would correlate heap measurements with allocation, collection activity and process memory instead of expecting every number to match. Heap commitment can change with JVM and collector policy, and unused committed memory need not immediately return to the operating system. I would label dashboard units and timestamps and retain the workload context. A leak diagnosis needs an ownership or reachability explanation, not subtraction of two capacity metrics.”

**Example:** Illustrative values: used 300 MiB, committed 800 MiB, max 2 GiB do not establish a 500 MiB leak. Compare repeated observations and the reachable object population.

**Deep dive / verification:** Management sampling is observational and may include garbage not yet collected in used values. Avoid forced collections as a routine production measurement strategy. Process memory has additional components outside the heap.

**Follow-ups:** Does a falling used value prove all resources closed? No; handles and native allocations have separate lifetimes. Is max always positive? Management APIs allow an undefined maximum; display it explicitly.

**Primary reference:** [Java 21 MemoryMXBean](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/MemoryMXBean.html).

---

**5. A global Spring exception handler returns an error DTO but clients see HTTP 200. Which contract is missing?**

**Say aloud:** “An error body describes a problem, while the HTTP status tells clients and intermediaries how to classify the response. Returning an ordinary body from a REST exception handler does not automatically choose the intended error status. A successful status with a failure body can break retries, monitoring and generated clients even when the JSON looks clear to a human.

I would map known domain failures to explicit statuses using ResponseEntity or another documented status mechanism. Unexpected failures should return a safe generic response with a correlation identifier, while diagnostic details stay in protected logs. I would keep validation, absence, conflict and dependency failures distinct where the API contract requires it. Tests should make real MVC requests and assert status, headers and body together. A unit test calling the handler method directly can miss the framework's response semantics and handler selection.”

**Example:** Contextual design: a duplicate reservation returns an explicitly constructed 409 response with a stable error code. Do not derive the status by parsing a localized exception message.

**Deep dive / verification:** Assume Spring MVC 7.0; exception handlers have documented return-value rules. A broad handler can hide programming errors or override intended mappings; test precedence and nested exceptions. No runnable controller is introduced here.

**Follow-ups:** Should every exception be 500? Known client and domain failures need their specified contracts. Can an error body expose SQL? Return safe fields; retain internal evidence behind access controls.

**Primary reference:** [Spring MVC exception handling](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html).

---

**6. A JPA pessimistic lock times out. Can code always catch the exception and continue the same transaction?**

**Say aloud:** “A pessimistic lock asks the database to reserve access that could conflict with another transaction. A failure to obtain that lock can invalidate only the statement or the whole transaction, and the distinction matters. Jakarta Persistence distinguishes LockTimeoutException for statement-level rollback from PessimisticLockException when the failure causes transaction-level rollback.

I would inspect both the provider's exception translation and the transaction manager's rollback policy before deciding recovery. A transaction marked rollback-only cannot be repaired by catching its exception and issuing more business writes. For a retryable conflict I would normally leave the failed scope and retry the entire business decision in a fresh transaction, with a deadline and bounded attempts. I would test two real connections contending on the same row, checking final persisted state. Mocked exceptions alone cannot establish the database's lock and rollback behavior.”

**Example:** Contextual: T1 locks inventory row R; T2 cannot acquire R before its configured wait limit. T2 records a failure outside any invalid transaction and retries only under the chosen conflict policy.

**Deep dive / verification:** Persistence 3.2 defines the distinction; database support for timeout hints varies. Lock waiting consumes connection capacity. Error handling must not accidentally acknowledge an uncommitted reservation.

**Follow-ups:** Is every timeout safe to retry? Revalidate business conditions and effect safety. Does a lock protect absent rows? Not universally; choose constraints or an appropriate database-specific range/invariant protocol.

**Primary reference:** [Jakarta Persistence 3.2 locking](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

---

**7. A Kafka topic retains seven days by time, yet a slow consumer loses data after one day. What other retention boundary matters?**

**Say aloud:** “Retention defines how long or how much log data the broker keeps; it is not a promise to retain every record until each consumer reads it. A delete-policy topic may remove eligible old segments when either its time limit or its size limit is reached. Consumer progress does not reserve those segments. A small byte budget can therefore make the effective replay window much shorter than the configured number of days.

I would inspect effective topic overrides, broker defaults, partition traffic and the actual earliest available offsets. I would size retention against peak byte rate, skew and recovery time, then alert on remaining replay headroom rather than lag alone. If required history has already disappeared, automatically resetting to earliest hides a gap; rebuild or reconcile explicitly. I would test a lagging group under a deliberately small size budget and verify that missing history is detected rather than silently declared processed.”

**Example:** Illustrative capacity: a partition receiving 20 GiB/day with a 20 GiB retention byte limit cannot promise seven days merely because retention.ms says seven days. Segment lifecycle affects exact deletion timing.

**Deep dive / verification:** Kafka 4.0 retention.bytes is per partition. Deletion is segment-based and asynchronous, not an exact record expiration timer. Compaction is a separate policy and does not preserve complete event history.

**Follow-ups:** Does increasing group offset retention retain data? No; offset metadata and topic data are different. Is global average traffic sufficient? Plan for the hottest partition and outages during peak load.

**Primary reference:** [Kafka 4.0 topic configuration](https://kafka.apache.org/40/generated/topic_config.html).

---

**8. A new workflow worker sees an unknown durable state and resets it to PENDING. Why can a compatible JSON change still duplicate work?**

**Say aloud:** “A durable state machine stores facts that survive process restarts. Wire compatibility means a message can be decoded; semantic compatibility means the reader still understands what actions those facts permit. A new state such as REFUND_PENDING may be valid data that an older worker cannot safely execute. Treating every unknown state as a fresh job discards the history that prevents repeated effects.

I would version the state contract, preserve unknown values for investigation, and stop incompatible workers from claiming those jobs. Roll out readers capable of understanding the new state before writers begin producing it, with an explicit rollback plan. State changes should use guarded transitions so a stale worker cannot overwrite newer progress. I would replay persisted fixtures from each supported version and test mixed worker generations. Refusing unsafe execution reduces availability, but inventing a default can violate the business invariant permanently.”

**Example:** Conceptual: an old worker knows PENDING and DONE; a new worker persists REFUND_PENDING after charging. Old readers must not reinterpret that value as permission to charge again.

**Deep dive / verification:** This is an original protocol design, not a workflow-engine guarantee. Store schema/state version separately when needed; additive fields alone do not establish safe transitions. Test downgrade and recovery, not just fresh installation.

**Follow-ups:** Can an enum default solve this? Only if its behavior is explicitly safe; preserving uncertainty is preferable to authorizing effects. Must old workers stop entirely? They can serve compatible job versions under explicit routing.

**Primary reference:** [Persistence 3.2 versioned update mechanisms as one implementation building block](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html). The rollout protocol is derived here.

---

**9. A file path passes normalize().startsWith(root), but a symlink later redirects access. What did lexical validation fail to prove?**

**Say aloud:** “Lexical normalization simplifies path components without proving which filesystem objects will be accessed. A symbolic link is a directory entry pointing elsewhere. Even a real-path check followed by a separate open can race with replacement of a directory or link. This is a time-of-check to time-of-use problem: the checked object may differ from the one eventually used.

I would prefer server-generated identifiers and storage directories that untrusted users cannot modify. Where hostile filesystem mutation is in scope, use supported directory-relative secure operations and reject symbolic links according to policy, rather than trusting one string check. SecureDirectoryStream can anchor operations to an open directory on supporting providers, but secure traversal still requires careful handling of every component. I would test nested links, replacement races and unsupported-provider behavior. If the required guarantee is unavailable, fail explicitly or change the storage boundary instead of silently weakening it.”

**Example:** Contextual: root/reports/current passes a lexical prefix test; current is replaced by a link outside root before open. Restricting directory mutation or securely traversing from an open trusted directory addresses the actual boundary.

**Deep dive / verification:** Reject absolute paths and unexpected components independently. NOFOLLOW_LINKS on a final open alone does not validate every intermediate directory. SecureDirectoryStream support is provider-dependent; this is not a portable one-line containment recipe.

**Follow-ups:** Does toRealPath eliminate all races? It resolves at that time, not atomically with a later open. Can process isolation help? Restrict accessible storage and filesystem permissions as part of the design.

**Primary reference:** [Java 21 SecureDirectoryStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/SecureDirectoryStream.html).

---

**10. A recovery rehearsal passes using the same status table as production. What independent evidence would detect a falsely reported success?**

**Say aloud:** “An oracle is the evidence a test uses to decide whether an outcome is correct. If both production and its test trust the same incorrect status field, the rehearsal can agree with the bug. Recovery needs evidence of business effects and durable obligations, not merely a green internal flag.

I would define a small independently generated workload with known expected effects, record acknowledged commands outside the recovering component, and compare outcomes after injected crashes. For a payment simulation, a separate provider ledger can reveal a charge missing from local success records or two charges for one command. I would compare identities and amounts, not only counts, and classify unresolved outcomes explicitly. The independent ledger also has assumptions about durability and completeness that must be tested. A passing rehearsal gives evidence for the exercised failures; it does not prove every production dependency or crash schedule behaves identically.”

**Example:** Original conceptual exercise: commands A and B each debit 5 units. Two ledger rows and total 10 are insufficient if both belong to A. Compare expected command identities, multiplicity and value.

**Deep dive / verification:** Compare O(n) expected-time indexed identities for n effects, or sort in O(n log n). Include accepted-but-unfinished obligations and duplicates. This advances model testing into independent recovery evidence; no external payment system was executed.

**Follow-ups:** Is a second query over the same corrupt table independent? No. What if evidence is missing? Keep the outcome unresolved and reconcile; absence of observation does not prove absence of effect.

**Primary reference:** [Kafka retention boundaries illustrate why an evidence source needs its own retention contract](https://kafka.apache.org/40/generated/topic_config.html). The recovery test design is derived here.

---

**11. Find the smallest missing positive integer in an unsorted array using constant extra storage. How do duplicates avoid an infinite swap loop?**

**Say aloud:** “For an array of length n, the answer lies between one and n plus one: if every value from one through n occurs, the next value is missing. This lets each array index act as the home for one useful positive integer. I repeatedly move a value v into position v minus one, ignoring values outside the useful range.

Before swapping, I check whether that home already contains v. That stops duplicates from swapping forever. Every successful swap places a value into its final home, and a correctly placed value will not be displaced by a different value. There can therefore be at most n successful placements. A final scan returns the first position whose expected value is missing. I would compare against an independent set-based oracle on exhaustive small arrays and extreme integers. This trades input preservation for constant auxiliary storage; clone first if callers need the original order.”

**Example:** [3,4,-1,1] becomes an arrangement with 1 at index 0 and no 2 at index 1, so return 2. Empty input returns 1. The Java 21 code below mutates input by contract.

**Deep dive / verification:** O(n) time, O(1) extra storage. Null throws NullPointerException. Return long so n+1 is representable without an int overflow assumption. Bounds are checked before v-1 is used as an index. No sorting or allocation proportional to n occurs in this method.

**Follow-ups:** Why not sum the values? Duplicates and irrelevant values break that reasoning. Need a non-mutating API? A hash set gives expected O(n) time with O(n) storage, or copy before placement.

**Primary reference:** [Java 21 Arrays for independent test utilities](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html). The placement invariant is derived above.

```java
public final class MissingPositive {
    public static long find(int[] values) {
        java.util.Objects.requireNonNull(values, "values");
        for (int i = 0; i < values.length; i++) {
            while (values[i] > 0 && values[i] <= values.length) {
                int home = values[i] - 1;
                if (values[home] == values[i]) break;
                int displaced = values[home];
                values[home] = values[i];
                values[i] = displaced;
            }
        }
        for (int i = 0; i < values.length; i++) {
            if (values[i] != i + 1) return (long) i + 1;
        }
        return (long) values.length + 1;
    }
}
```

---

**12. A build DAG has task durations and unlimited workers. How do you return the minimum finish time and a critical-path witness?**

**Say aloud:** “A directed acyclic graph describes dependencies without cycles. A critical path is a dependency chain whose total duration determines the earliest possible finish under the stated resource assumptions. With unlimited workers, tasks wait only for prerequisites, so a task's earliest finish is its duration plus the largest finish time among its prerequisites.

I process tasks in topological order, which puts every prerequisite before its dependents. For each task I save the predecessor giving that maximum, then reconstruct a path backward from the task with the largest finish. This path is a lower bound on every valid schedule, because its tasks must run sequentially. Starting each task as soon as all prerequisites finish achieves that bound with unlimited workers. I would verify both the reconstructed edges and a simulated earliest-start schedule. Limited workers, setup costs or shared resources invalidate this simple optimality claim.”

**Example:** Conceptual: A takes 3, B takes 5, C takes 2 and depends on both. A and B start together; C finishes at 7. The witness B→C sums to 7, not the sum of all durations, 10.

**Deep dive / verification:** O(V+E) time and storage with adjacency lists and topological processing. Reject negative durations, bad endpoints and cycles; empty input finishes at zero. Use checked long addition or explicit duration bounds. Retain all disconnected components and choose a deterministic predecessor on ties.

**Follow-ups:** Does the witness alone prove feasibility? No; also check the earliest-start schedule respects every edge. What changes with two workers? Resource scheduling becomes an additional optimization problem; the critical path remains a lower bound.

**Primary reference:** [Java 21 Arrays for test comparisons](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html). The unlimited-worker recurrence and optimality argument are derived here, not library guarantees.

---

**Topic coverage:** Primitive conversion and ownership, latch publication, associative reduction, JVM memory metrics, Spring MVC response contracts, JPA lock failure scope, Kafka retention capacity, durable state evolution, filesystem races, independent recovery evidence, in-place placement and critical-path certificates.

**Next set builds on:** safe mixed-version recovery, testing observable promises across subsystem boundaries, and constrained optimization where unlimited-resource assumptions no longer hold. Continue sequential numbering even on the same date.
