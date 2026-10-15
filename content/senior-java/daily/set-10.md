**Set 10 · 15 October 2026 — Recovery boundaries and information loss**

Reference assumptions: **Java 21 without preview features**, Spring Framework 6.2 (Boot 3.5 generation), Jakarta Persistence 3.2 API semantics, PostgreSQL 17, Kafka 4.0, and Prometheus classic histograms. These identify reference contracts, not latest releases. Boot 3.5 applications commonly use an earlier Persistence API; verify provider, driver and database support before applying a 3.2 API assumption. Security guidance was checked against OWASP on 15 October 2026.

Stable IDs: **S10-Q01–S10-Q12**, in order. Each spoken answer targets roughly 45–90 seconds with a short pause for its example. Examples are original teaching scenarios, not personal experience. The two Java blocks are complete methods when placed inside a class with `java.util.*` imports; the published methods are compiled and exercised with Java 21. SQL, framework flows and configuration are contextual fragments, not runnable infrastructure deployments.

---

**1. Collecting catalog rows with toMap fails only when two rows share a SKU. Should the merge function simply keep the last value?**

**Say aloud:**
“A collector combines stream elements into a result. The two-argument toMap collector requires unique keys and throws when equal keys occur. Adding a merge function changes the data contract: it decides which information survives.

I would first establish whether repeated SKUs represent corrupt input, several valid offers, or competing versions. Corrupt input should fail visibly. Multiple offers belong in grouped values. For version selection, group and validate all equal-version conflicts before selecting the maximum; reducing to one row too early can hide conflicts in discarded older versions.

For parallel reduction, merging must be associative: regrouping intermediate results must preserve the answer. If source order is undefined, choosing the first or last encountered row is not a reliable business rule. I would test duplicates, ties and reordered input before optimizing collection.”

- **Example:** Rows `(SKU7, version 2, price 8)` and `(SKU7, version 5, price 9)` select version 5; equal version with different prices is an error.
- **Guarantee/cost:** A hash-map accumulation is typically expected O(n), with O(unique keys) result storage; grouping retains all n rows.
- **Trade-off/failure:** Silent conflict resolution can hide an upstream join bug.
- **Follow-ups:** “Map iteration order?” → Choose a supplier if required. “Parallel?” → Check associativity and source-order assumptions.
- **Primary reference:** [Java 21 Collectors.toMap overloads](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html).

---

**2. A static initializer cannot read configuration. Later requests receive NoClassDefFoundError even after the file is repaired. Why?**

**Say aloud:**
“Class initialization executes static field initializers and static initialization blocks before certain active uses of a class. If that work fails, the JVM marks that class erroneous for its defining class loader. This is different from failing to locate a class file.

When an initializer throws an ordinary runtime exception, the triggering call typically sees ExceptionInInitializerError. Later initialization attempts see NoClassDefFoundError because the class is already erroneous. Repairing the file does not rerun its initializer through the same class loader.

I would find the original initialization failure in logs and remove transient I/O from static initialization. An explicitly owned startup component can validate configuration, report failure and implement a deliberate retry policy. Restarting with corrected inputs may restore service, but repeatedly catching the later linkage error cannot repair that class.”

- **Example:** `static final Rules RULES = loadFile();` fails once; later requests lose the original file error behind the initialization failure chain.
- **Guarantee/cost:** Initialization is coordinated per class; waiting callers do not each get an independent retry. I/O there can block initialization-dependent callers.
- **Trade-off/failure:** Throwing an Error directly need not produce an ExceptionInInitializerError wrapper.
- **Follow-ups:** “New class loader?” → A different class identity, with lifecycle costs. “Compile-time constant?” → Reading one need not initialize its declaring class.
- **Primary reference:** [JLS 21 §12.4.2 initialization procedure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4.2).

---

**3. A CopyOnWriteArrayList listener is removed, yet a running dispatch still invokes it. Is thread safety broken?**

**Say aloud:**
“Copy-on-write means mutations publish a replacement backing array while readers can keep an older array. An iterator is a snapshot of references at iterator creation. It does not include subsequent additions or removals.

A dispatch that already captured the listener can therefore invoke it after removal. Removal prevents inclusion in later snapshots; it does not cancel an invocation already selected. If unsubscribe must wait until no callback can run, I would design an explicit registration state and coordinate in-flight invocations. A flag check alone has a check-then-call race.

Snapshot iteration avoids interference with structural writes, but it is shallow: mutable listener state still needs its own synchronization. Long-lived iterators can also retain old arrays and listeners. This collection fits frequent traversal and relatively rare mutation, rather than a high-churn work queue.”

- **Example:** Capture iterator over `[A,B]`, remove B, then traverse: the snapshot still yields B; a new iterator yields only A.
- **Guarantee/cost:** Traversal is O(n); adding/removing generally copies O(n) references. Iterator mutation methods are unsupported.
- **Trade-off/failure:** Strict unsubscribe coordination must handle callbacks that unsubscribe themselves without deadlocking.
- **Follow-ups:** “Deep snapshot?” → No, only element references. “Memory leak?” → Inspect retained iterators and expected ownership first.
- **Primary reference:** [Java 21 CopyOnWriteArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html).

---

**4. An outer transaction catches an inner service exception and returns success, but commit throws UnexpectedRollbackException. What should the caller believe?**

**Say aloud:**
“Rollback-only is a transaction state saying that the transaction must not commit. With Spring REQUIRED propagation, an inner proxied transactional service can share the outer service's physical transaction even though each has its own logical scope.

If the inner scope marks that shared transaction rollback-only, catching its exception in the outer method does not clear the marker. The attempted outer commit rolls back and raises UnexpectedRollbackException so the caller is not falsely told that the writes committed.

I would decide whether the inner operation is mandatory or genuinely optional. Mandatory failure should fail the whole request clearly. Optional work needs a deliberately separate transaction or another workflow with independent outcomes. Merely swallowing the exception or adding noRollbackFor everywhere hides the business decision and may still fail when the database has already aborted the transaction.”

- **Example:** Outer `placeOrder` calls proxied REQUIRED `reserveStock`; reservation fails and marks rollback-only. Catching it does not save the order.
- **Guarantee/cost:** Shared physical transaction means shared final outcome; separate transactions require extra resources and permit partial success.
- **Trade-off/failure:** A same-object call does not cross the normal Spring transaction proxy.
- **Follow-ups:** “Savepoint?” → NESTED support depends on transaction manager/resources. “HTTP result?” → Reflect actual commit outcome.
- **Primary reference:** [Spring 6.2 REQUIRED propagation](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/tx-propagation.html).

---

**5. A JPA query times out. Can the service catch the exception and safely keep writing in the same transaction?**

**Say aloud:**
“A statement is one database operation; a transaction groups operations into a commit or rollback unit. A query timeout and a transaction timeout are different boundaries. The exception contract and actual database state decide what remains usable.

Jakarta Persistence defines QueryTimeoutException for a timeout that rolls back only the statement without marking the transaction rollback-only. If the transaction is rolled back, query execution can instead report PersistenceException. A Spring interceptor may independently mark rollback-only when a runtime exception crosses its boundary.

I would inspect the translated exception and transaction status, then verify behavior with the actual provider, driver and database. For a required operation, ending the failed unit and restarting safely is clearer than assuming recovery. A timeout setting is not proof that all server work stopped instantly or that a business operation can be retried without duplicate effects.”

- **Example:** A report read times out after earlier writes; do not return “saved” until the transaction really commits.
- **Guarantee/cost:** Statement-only and whole-transaction failure have distinct contracts; waiting and retry consume the end-to-end budget.
- **Trade-off/failure:** Treating every persistence failure as recoverable can continue a transaction already doomed to roll back.
- **Follow-ups:** “Provider portability?” → Integration-test translation and cancellation. “Read fallback?” → Define consistency and isolate recovery when needed.
- **Primary references:** [Persistence 3.2 QueryTimeoutException](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/QueryTimeoutException.html), [Query execution exceptions](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Query.html).

---

**6. A Kafka transformer writes output, then commits input offsets separately. How can transactions close that particular crash window?**

**Say aloud:**
“An input offset records consumer-group progress. If output and progress commit separately, a crash can leave output without progress or progress without output. A Kafka transaction can make those two Kafka updates one atomic committed outcome.

I would disable consumer auto-commit, configure transactional producer ownership, begin a transaction, publish output and send the next input offsets with current consumer-group metadata before committing. Downstream consumers use read_committed to exclude aborted transactional output. After an abort, the application must also reset its local processing position or recreate the consumer so input is replayed correctly.

This does not mean transformation code executes only once. It can execute again after failure while only one output/progress outcome commits. An HTTP charge or external database write inside that code is outside the Kafka transaction and still needs its own correctness protocol.”

- **Example:** Input partition offset 41 produces an enriched event; atomically publish it and commit next offset 42.
- **Guarantee/cost:** Atomic Kafka output and group offsets require correct assignment, producer fencing and exception handling; transactions add coordination latency.
- **Trade-off/failure:** Committing offsets separately or blindly retrying fatal producer errors defeats the protocol.
- **Follow-ups:** “Rebalance?” → Current group metadata and ownership checks. “Duplicate input events?” → Distinct input records remain distinct business events unless deduplicated.
- **Primary reference:** [Kafka 4.0 delivery semantics and transactions](https://kafka.apache.org/40/design/design/#message-delivery-semantics).

---

**7. A dashboard averages each pod's p99 latency and calls it the service p99. Why can that hide an incident?**

**Say aloud:**
“The 99th percentile is a threshold below which about 99 percent of observations lie. A percentile discards most information about the distribution. Averaging pod percentiles, even with traffic weights, cannot reconstruct the percentile of all requests.

I would aggregate compatible latency distributions first, then calculate the fleet percentile over the same time window and labels. For Prometheus classic histograms, sum per-second bucket rates across pods while retaining the bucket boundary label, then apply histogram_quantile. Counter rates should be calculated before aggregation so resets are handled per series.

Choose common bucket boundaries fine enough around the objective. The resulting percentile is an estimate, not an exact reconstruction of raw observations. Also show traffic and error rates: an apparently fast service may be rejecting slow requests or measuring only successful calls.”

- **Example:** One pod serves 10,000 requests and another 10; their percentile values alone cannot recover the combined rank distribution.
- **Guarantee/cost:** Classic histogram bucket counts combine with matching boundaries; storage grows with bucket count and label combinations.
- **Trade-off/failure:** Broad buckets lose precision; tenant/request-ID labels can create excessive metric cardinality.
- **Follow-ups:** “Client summary quantiles?” → Cannot aggregate them into a fleet quantile. “SLO threshold?” → Count requests within that boundary directly when available.
- **Primary reference:** [Prometheus histograms and summaries](https://prometheus.io/docs/practices/histograms/).

---

**8. A profile PATCH binds JSON directly onto a JPA entity. The endpoint checks ownership; how could a user still become an administrator?**

**Say aloud:**
“Mass assignment means automatically binding client fields to properties that the client should not control. Ownership authorization answers whose record can change. It does not decide which fields that user may change.

If a persistence entity exposes role, tenant or account-status setters, an attacker may submit those properties even when the form never displays them. I would accept a dedicated request type containing only allowed profile fields, validate it and map those fields explicitly. Security-sensitive state changes use separate authorized operations. Server-derived fields stay server-derived.

Unknown-field rejection can reveal mistakes and attack attempts, but it is defense in depth; the key boundary is an allowlist of writable fields. Partial updates also need clear absent-versus-null semantics, so omission does not accidentally erase data or reset a privileged value.”

- **Example:** `{ "displayName": "Sam", "role": "ADMIN" }` must never change role through a profile-edit operation.
- **Guarantee/cost:** A narrow request contract limits assignment; validation and per-operation authorization still apply.
- **Trade-off/failure:** A generic reflection-based copy can reopen the vulnerability when new entity fields appear.
- **Follow-ups:** “Nested objects?” → Apply allowlists recursively. “Admin endpoint?” → Authorize the specific privileged transition and audit it.
- **Primary reference:** [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html).

---

**9. Workers use SELECT FOR UPDATE SKIP LOCKED for a database queue. Does an empty batch prove that the queue is drained?**

**Say aloud:**
“A row lock prevents conflicting access until transaction completion. SKIP LOCKED omits rows that cannot be locked immediately, allowing workers to claim different available jobs rather than queue behind each other.

An empty result means this statement found no claimable rows under its conditions and snapshot. Other transactions may currently hold pending jobs. It does not prove global completion. PostgreSQL explicitly describes this as an inconsistent view suitable for queue-like access, not general reporting.

I would claim a bounded ordered batch and persist its processing state in the same short transaction, then perform remote work outside the lock-holding transaction. Recovery needs explicit abandoned-claim handling and safe repeated effects. Monitor oldest pending age because repeated skipping and priority traffic can starve jobs. Deterministic ordering improves selection but cannot guarantee strict FIFO across concurrent workers.”

- **Example:** `SELECT id FROM jobs WHERE state = 'READY' ORDER BY id LIMIT 20 FOR UPDATE SKIP LOCKED;` is a claim step, followed by a state update before commit.
- **Guarantee/cost:** Avoids waiting for conflicting row locks; table locks can still block. Indexes and contention determine actual scan cost.
- **Trade-off/failure:** A lock released at commit is not a durable claim by itself.
- **Follow-ups:** “Worker crashes after side effect?” → Reconcile/repeat safely. “Drain signal?” → Coordinate producers and all outstanding claims explicitly.
- **Primary reference:** [PostgreSQL 17 locking clause](https://www.postgresql.org/docs/17/sql-select.html#SQL-FOR-UPDATE-SHARE).

---

**10. How would you migrate legacy password hashes without knowing users' plaintext passwords or weakening password reset?**

**Say aloud:**
“A password hash is a one-way verifier. A salt is a random per-password value that prevents identical passwords from sharing identical stored verifiers. We cannot recover plaintext from a legacy hash to perform a normal rehash in bulk.

I would store the algorithm identifier and parameters with each verifier. After successful legacy verification during login, hash the supplied password with an approved modern password-hashing scheme and a fresh salt, then replace the old verifier conditionally. If a concurrent reset changed the credential, that update must fail. Revalidate authentication against the current credential before issuing a session; do not overwrite the reset or silently accept stale verification.

Accounts that never return need a planned reset or retirement policy, otherwise weak hashes remain indefinitely. Benchmark verification cost and bound login load. Never log plaintext or keep it in asynchronous migration jobs; credential upgrade is part of an explicitly controlled authentication path.”

- **Example:** Update where credential version equals the one verified; a concurrent reset increments that version and wins.
- **Guarantee/cost:** Modern password hashing intentionally consumes resources; rate limiting and chosen parameters must fit measured capacity.
- **Trade-off/failure:** Rehashing does not erase copies of an old compromised verifier; breach response may require password changes.
- **Follow-ups:** “Pepper?” → A separately protected secret with a rotation plan. “Algorithm choice?” → Current approved guidance and environment constraints; do not invent a hash construction.
- **Primary reference:** [OWASP password storage and legacy upgrades](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#upgrading-legacy-hashes).

---

**11. Find the largest rectangular area beneath a histogram of nonnegative unit-width bars. How does a monotonic stack avoid checking every interval?**

**Say aloud:**
“A histogram here is an array of bar heights. A valid rectangle spans contiguous bars and its height cannot exceed the shortest bar in that span. Enumerating every interval works but takes quadratic time.

I keep indices on a stack whose heights are nondecreasing. When a shorter bar arrives, any taller stack top has reached its first strictly shorter bar on the right. Popping it exposes the left boundary; the rectangle width is the gap between those boundaries minus one. Equal heights may remain together, and the earlier equal bar eventually covers the wider span.

A final synthetic zero flushes the remaining candidates without extending the input. Every index is pushed once and popped at most once, giving linear total work. I use long for area, reject negative heights and leave the caller's array unchanged.”

- **Example:** `[2,1,5,6,2,3]` yields 10 from the bars of height 5 and 6.

```java
static long largestRectangle(int[] heights) {
    Objects.requireNonNull(heights, "heights");
    for (int height : heights)
        if (height < 0) throw new IllegalArgumentException("negative height");
    int n = heights.length, size = 0;
    int[] stack = new int[n];
    long best = 0;
    for (int i = 0; ; i++) {
        int current = i == n ? 0 : heights[i];
        while (size > 0 && heights[stack[size - 1]] > current) {
            int height = heights[stack[--size]];
            int left = size == 0 ? -1 : stack[size - 1];
            long width = (long) i - left - 1;
            best = Math.max(best, width * height);
        }
        if (i == n) return best;
        stack[size++] = i;
    }
}
```

- **Guarantee/complexity:** O(n) time and O(n) auxiliary space; empty input returns 0, null is rejected. For Java array lengths and nonnegative int heights the maximum product fits long. Input must remain stable during the call; callers must bound memory.
- **Trade-off/failure:** This returns area only, not rectangle coordinates; variable-width bars require accumulated widths.
- **Follow-ups:** “All equal?” → Earliest surviving equal bar covers the widest span. “Binary matrix?” → Build consecutive-one column heights per row and solve each histogram.
- **Reasoning:** Each popped height is evaluated over its maximal span up to the current shorter bar. Exhaustive interval enumeration is an independent test oracle.

---

**12. Return the shortest substring covering every required character, including repeated requirements. Which count makes shrinking safe?**

**Say aloud:**
“A multiset records how many copies of each value are required. For this exercise the alphabet is ASCII, so character means one code from zero through 127. I maintain deficits: required copies minus copies currently inside the window, together with the total number of missing copies.

When a character enters, a positive deficit means it fills one missing copy. After decrementing its deficit, a zero missing total means the window covers the target. I then move the left edge while coverage remains valid, recording shorter windows. Removing a character that makes its deficit positive creates a missing copy and stops shrinking.

Both edges move only forward, so total scanning is linear. Repeated required characters must count separately; tracking only distinct character presence would incorrectly accept one A when two are required. Ties return the earliest window.”

- **Example:** Source `ABAAC`, target `AAC` returns `AAC`; target `AAAA` has no covering window and returns empty.

```java
static String minimumCover(String source, String target) {
    Objects.requireNonNull(source, "source");
    Objects.requireNonNull(target, "target");
    for (int i = 0; i < source.length(); i++)
        if (source.charAt(i) >= 128) throw new IllegalArgumentException("ASCII source required");
    for (int i = 0; i < target.length(); i++)
        if (target.charAt(i) >= 128) throw new IllegalArgumentException("ASCII target required");
    if (target.isEmpty()) return "";
    int[] deficit = new int[128];
    for (int i = 0; i < target.length(); i++) deficit[target.charAt(i)]++;
    int missing = target.length(), left = 0, bestStart = 0;
    int bestLength = Integer.MAX_VALUE;
    for (int right = 0; right < source.length(); right++) {
        char entered = source.charAt(right);
        if (deficit[entered] > 0) missing--;
        deficit[entered]--;
        while (missing == 0) {
            int length = right - left + 1;
            if (length < bestLength) {
                bestLength = length;
                bestStart = left;
            }
            char removed = source.charAt(left++);
            if (++deficit[removed] > 0) missing++;
        }
    }
    return bestLength == Integer.MAX_VALUE ? "" : source.substring(bestStart, bestStart + bestLength);
}
```

- **Guarantee/complexity:** O(source length + target length) time plus returned-string copying; O(128) auxiliary storage and O(answer length) output. Null and non-ASCII inputs are rejected, including when the other string is empty. Empty target or absent cover returns empty.
- **Trade-off/failure:** Empty result conflates no cover with an empty requirement; use an explicit result type if that distinction matters. This deliberately does not define Unicode grapheme or normalization semantics.
- **Follow-ups:** “Unicode code points?” → Change iteration, count structure and substring offset mapping. “Streaming?” → Returning content requires retaining candidate data or external offsets.
- **Reasoning:** Coverage is equivalent to zero missing copies; shrinking examines the shortest valid suffix for each right boundary. Tests enumerate all candidate substrings independently.

---

**Topic coverage:** S10-Q01 collector conflict policy; Q02 erroneous class initialization; Q03 snapshot callback lifecycle; Q04 shared rollback-only state; Q05 timeout recovery boundaries; Q06 atomic Kafka output and progress; Q07 fleet percentile aggregation; Q08 field-level write authorization; Q09 queue claim visibility; Q10 password-verifier migration races; Q11 monotonic stack rectangles; Q12 minimum multiset covering window. The app now contains **136 authored prompts across ten sets**; Set 9 is an extended 28-question set with some earlier-topic reinforcement, so that count does not claim 136 unique concepts.

**Next set:** Build on recovery boundaries with structured validation of asynchronous outcomes, database isolation under aggregate updates, event-time lateness, authentication recovery, and reconstructable dynamic programming. Continue with Set 11 even if another run occurs today. Avoid repeating these twelve scenarios by changing domain names.
