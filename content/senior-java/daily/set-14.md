**Set 14 · 23 October 2026 — Distinguishing evidence from guarantees**

Reference assumptions: **Java 21 without preview features**, Spring Boot 3.5 / Spring Framework 6.2, Jakarta Persistence 3.2 API semantics, PostgreSQL 17, Kafka 4.0, and Guava 33.4.8-jre documentation. These identify reference contracts, not latest releases; a Boot 3.5 application must use its managed persistence provider/API versions rather than assume it implements Persistence 3.2. OWASP guidance was checked on 23 October 2026. No dependency is added.

Stable IDs: **S14-Q01–S14-Q12**, in order. Each spoken answer targets 45–90 seconds. Examples are original illustrations. Framework, broker, security and recovery examples are contextual designs requiring integration verification. The two Java blocks are complete class members requiring `java.util.*`; their fixture compiles the published text with `--release 21` and compares results against independent exhaustive oracles. Inputs must remain unchanged by other threads during these thread-confined computations.

---

**1. A service caches ten items using hugeList.subList(0, 10). Why can that retain much more memory and change when the original list changes?**

**Say aloud:** “A list view exposes part of another list rather than taking an independent snapshot. ArrayList.subList is backed by its parent. Keeping a tiny view can therefore keep the parent's backing storage and its other elements reachable. A replacement through the view also changes the parent, and replacements in the parent can be visible through the view.

For a cached page that should own its membership, I would copy the selected range into a new ArrayList. That copies references, not the objects themselves, so mutable elements still need an ownership policy. If nulls are forbidden and an unmodifiable list is useful, List.copyOf is another option. I would not keep using a view after structural changes to the parent outside that view; its semantics are then undefined. I would verify both alias behavior and the heap retaining path rather than assume that a ten-element size means ten elements of retained storage.”

**Example:** With parent `[A,B,C]`, view `subList(0,1)` and a copied page, `parent.set(0,D)` changes the view's first element to D but leaves the copy pointing to A. Mutating object A itself can still affect every holder of A.

**Deep dive / verification:** Copying k selected references costs O(k) time and space. In Java 21 ArrayList, constructing a view does not copy the selected elements. A wrapper making the view unmodifiable does not remove its backing relationship. Test view writes, parent replacement and copy independence; do not rely on a particular exception after unsupported structural interference. Diagnose retention with a heap graph, not a forced-GC timing assertion.

**Follow-ups:** *Is a copied list deeply immutable?* No; independently mutable elements remain shared. *When is a view useful?* A short-lived, coordinated range operation such as clearing part of an owned list.

**Primary references:** [ArrayList range-view contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html#subList(int,int)), [List.copyOf null and modification rules](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection)).

---

**2. A timed semaphore acquisition fails, but finally releases a permit anyway. Why does the configured concurrency limit gradually increase?**

**Say aloud:** “A semaphore is a counter of permits used to admit work. It is not an ownership-tracking lock: release increases the permit count even if that thread never acquired a permit. If tryAcquire times out and finally unconditionally releases, the application creates capacity that it never took. Repeating that path can exceed the intended downstream limit.

For synchronous work I would enter the release-protected region only after acquisition succeeds. Interruption or timeout before acquisition must not release anything. For asynchronous work I would transfer one explicit release obligation to the completion owner, including rejection and exceptional completion, and prevent double completion from releasing twice. A request timeout alone does not prove the underlying resource is free. I would test failed admission and each completion path, checking actual simultaneous downstream work rather than only availablePermits. Fairness can influence scheduling, but cannot repair a broken accounting protocol.”

**Example, contextual pseudocode:** `if (!tryAcquire(budget)) return BUSY; try { useResource(); } finally { release(); }`. If useResource hands work to another thread, this region is too short: release must follow real resource completion.

**Deep dive / verification:** Exercise immediate failure, interrupted waiting, submission rejection, success, failure and duplicate callbacks using controlled tasks. Semaphore permits are not bound to a particular thread; cross-thread release is legal when the lifecycle protocol authorizes it. One semaphore limits one process, so fleet capacity also depends on replica count. Permit operations can contend or park; they promise neither a fixed latency nor a distributed quota.

**Follow-ups:** *Can I release in both timeout and completion?* Only with one shared, once-only release owner and only when the resource is actually relinquished. *Does a fair semaphore prevent all barging?* Untimed tryAcquire does not honor its fairness setting.

**Primary reference:** [Java 21 Semaphore acquisition, release and fairness](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html).

---

**3. A flight recording contains no slow file-write events. Does that prove the service did no file I/O during the incident?**

**Say aloud:** “Java Flight Recorder, or JFR, records selected runtime events under configured settings. Evidence depends on which events were enabled, the recording interval and filters such as duration thresholds. An empty slow-file-write view means no matching recorded events were observed; it does not prove that every file operation was absent.

I would first check that the recording covers the affected process and time, and inspect the actual event settings. Many short writes can contribute substantial total cost while each stays below a duration threshold. Missing stack traces can also prevent attribution even when events exist. I would run a controlled operation with the intended configuration to establish that the diagnostic path sees it, then correlate recording data with request timings and operating-system evidence. Lower thresholds may produce more data and overhead, so I would use a bounded diagnostic capture instead of enabling every expensive detail indefinitely.”

**Example, contextual configuration:** Enable `jdk.FileWrite` with a chosen duration threshold and stack traces for a short investigation. A 20 ms threshold will not describe the distribution of individual 2 ms writes; neither number is a measured claim about this application.

**Deep dive / verification:** Distinguish duration thresholds from periodic sampling intervals; they are different event settings. Confirm recording start/stop, event counts, metadata and any data-loss indicators. An event type's semantics determine what it measures; do not treat file-write events as a complete disk-device trace. Compare identical workloads before changing configuration. Capture size and runtime overhead depend on event rate, payload and enabled details, not just recording duration.

**Follow-ups:** *Should zero matching events close the incident?* Only if independent evidence and known capture coverage support the conclusion. *Will adding stack traces create missing events?* It adds attribution to recorded events; it does not enable a disabled event type or remove its threshold.

**Primary references:** [Java 21 JFR EventSettings](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.jfr/jdk/jfr/EventSettings.html), [Recording lifecycle and settings](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.jfr/jdk/jfr/Recording.html).

---

**4. A developer uses Transactional(readOnly=true) to make an administrative reporting endpoint incapable of writing. Is that a security boundary?**

**Say aloud:** “Spring's read-only transaction flag describes the transaction's intended use. The annotation contract treats it as a hint to the transaction subsystem; it does not universally reject every write. A transaction manager, driver or database may enforce more, and a persistence provider may change flush behavior, but those effects are stack-specific.

I would keep reporting code free of mutations and verify behavior with the actual transaction manager and database. If write prevention is a security requirement, I would give the reporting connection a database role with only the necessary read privileges, and keep that credential separate from privileged write paths. I would also check whether the method starts a new transaction or joins an existing one: a local annotation does not necessarily replace the enclosing transaction's characteristics. Read-only hints can help optimization, but a security guarantee should come from enforced permissions and a tested boundary rather than a performance annotation.”

**Example, contextual design:** A report calls a helper that executes an UPDATE. One stack may reject it; another may allow it. A dedicated role lacking UPDATE permission on that table supplies a separate enforcement layer, provided no elevated stored function or alternate credential bypasses it.

**Deep dive / verification:** Test through the Spring proxy with real permissions, including direct SQL, managed-entity mutation, joins to existing transactions and prohibited function execution. PostgreSQL READ ONLY transaction mode and database grants are distinct controls with their own semantics. Do not use application code to switch a privileged session to read-only and call that credential least-privileged. Inspect connection reset/reuse behavior. There is no universal throughput improvement; measure the provider's actual work.

**Follow-ups:** *Can dirty checking be skipped?* Some integrations optimize it; that is provider behavior, not the annotation's universal guarantee. *Why test an existing transaction?* Propagation can preserve characteristics chosen by the outer boundary.

**Primary references:** [Spring 6.2 Transactional readOnly contract](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/transaction/annotation/Transactional.html#readOnly()), [PostgreSQL 17 transaction modes](https://www.postgresql.org/docs/17/sql-set-transaction.html), [database privileges](https://www.postgresql.org/docs/17/ddl-priv.html).

---

**5. EntityManager.getReference returns an object for a nonexistent customer. Why is checking that object against null not an existence check?**

**Say aloud:** “An entity reference can stand for an identity whose state has not yet been loaded. getReference is designed to let an association be established without necessarily loading that state. A non-null reference therefore does not prove the row exists. Missing-state failure can be deferred until state is accessed; the provider is also permitted to fail earlier.

If an API must report that a customer exists and is accessible to this tenant, I would perform a tenant-scoped lookup inside the service boundary and map absence to the intended response. If I only need an already-validated foreign-key identity, a reference can avoid unnecessary state loading, with the database constraint still protecting referential integrity. Neither a prior lookup nor a reference prevents a concurrent deletion forever. I would define the transaction and constraint failure policy, and avoid turning a late initialization exception during JSON serialization into the first user-visible validation.”

**Example:** `getReference(Customer.class, id) != null` is insufficient validation. A contextual query such as `customer where id=:id and tenantId=:trustedTenant` validates both lookup scope and visibility at that query's snapshot; it is not a permanent reservation of the row.

**Deep dive / verification:** Test existing, missing and wrong-tenant IDs, then concurrent deletion and access after persistence-context closure with the actual provider. Avoid promising a query count for identifier access across all proxy/provider implementations. A narrow lookup adds database work; a reference can save it when existence is guaranteed by the enclosing workflow. Access errors may affect the transaction: do not blindly catch and continue writing.

**Follow-ups:** *Does find always return a fresh row?* The persistence context may already hold the entity; freshness is a separate concern. *Can an ID alone authorize an association?* No; identity knowledge is not permission to link that entity.

**Primary reference:** [Jakarta Persistence 3.2 getReference and find](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html#getReference(java.lang.Class,java.lang.Object)).

---

**6. A Kafka topic has three replicas and acks=all, but min.insync.replicas is one. Can a successful write have only one current replica?**

**Say aloud:** “Replication factor says how many replicas are configured. The in-sync replica set, or ISR, contains replicas currently considered sufficiently caught up. With acks set to all, acknowledgement waits for the in-sync replicas, rather than necessarily all configured replicas. If the ISR has shrunk to one and the minimum is one, the durability assumption can be much weaker than three copies.

For a topic requiring tolerance of a broker failure, I would consider replication factor three, minimum in-sync replicas two and producer acks all, then test the intended failure model. This trades availability for protection: writes fail when the ISR cannot meet the minimum. I would monitor ISR shrinkage and producer errors and define leader-election policy. These settings do not promise survival of every correlated failure, application-level exactly-once effects or an immediate physical disk flush on every acknowledged message. A client timeout also remains an uncertain outcome requiring safe retry handling.”

**Example, contextual sequence:** Configured replicas A/B/C, current ISR `{A}`, minimum one: an all-ack write can succeed with A alone. With minimum two the same degraded state rejects writes. If a replica falls out during a write, outcomes and error timing need failure-injection verification.

**Deep dive / verification:** In an isolated broker test, remove followers and then the leader, observe ISR transitions, acknowledgements, restart recovery and election settings. Distinguish capacity to accept writes from the guarantees of already acknowledged writes. More replicas consume network/storage; a stricter minimum can reduce write availability. Producer idempotence controls a different duplicate/reordering boundary and does not increase the ISR size.

**Follow-ups:** *Does acks=1 become safe because minimum ISR is two?* The documented minimum-ISR acknowledgement protection is used with acks all. *Does three replicas span three failure domains automatically?* No; placement and operational configuration must provide that separation.

**Primary references:** [Kafka 4.0 producer acknowledgements](https://kafka.apache.org/40/configuration/producer-configs/#acks), [minimum in-sync replicas](https://kafka.apache.org/40/generated/topic_config.html#min.insync.replicas).

---

**7. A Bloom filter says an event ID was seen, so a consumer discards it without consulting storage. What correctness guarantee is lost?**

**Say aloud:** “A Bloom filter is a compact probabilistic membership structure. It can report possibly present for an item never inserted: that is a false positive. In the ordinary insertion-only model it does not report absent for an inserted item, assuming consistent encoding and correctly maintained state. Treating possibly present as proof of duplication can silently drop a new business event.

I would use it only as an optimization around an authoritative store. A possible match requires checking the durable event identity before dropping work. A negative can avoid some reads only if the filter is known to include the relevant committed history; restart, lag and rebuilds can invalidate that coverage. The final deduplication decision still belongs to an atomic durable protocol. I would size the filter for expected insertions and a tolerated false-positive rate, monitor saturation and document generation changes. Reduced memory does not turn probabilistic evidence into a business correctness boundary.”

**Example:** Hashes for event X happen to hit bits already set by other events, although X is new. Discarding X loses its effect. Clearing bits to remove another event can also damage membership evidence for IDs sharing those bits; an ordinary bit filter does not support that deletion protocol.

**Deep dive / verification:** Test the consumer with a deliberately injected positive result for an unseen ID; correctness must still come from storage. Verify rebuild coverage and canonical byte encoding. At fixed bit count m and k hashes, each query costs O(k) hash/bit work, with O(m) bits; real hashing cost includes ID length. More insertions than planned increase false positives. A negative result is relative to inserted filter contents, not proof about all historical database rows.

**Follow-ups:** *Can I use a filter to authorize access?* No; a positive is not proof of membership or permission. *Can it replace a unique constraint?* No; concurrent events still need an authoritative uniqueness decision.

**Primary reference:** [Guava 33.4.8 BloomFilter error and sizing contract](https://guava.dev/releases/33.4.8-jre/api/docs/com/google/common/hash/BloomFilter.html). The durable consumer protocol above is a proposed design.

---

**8. Every backup job is green, yet a restore drill cannot reach yesterday's target time. What should a recovery objective actually test?**

**Say aloud:** “A successful backup job is evidence that one production step completed, not proof of recoverability. PostgreSQL point-in-time recovery needs a usable base backup and the required continuous write-ahead log, or WAL, history. Missing archive segments, inaccessible keys or a wrong recovery target can leave green backup reports without a working recovery path.

I would define recovery point objective as the acceptable data-loss window and recovery time objective as the acceptable time to restore usable service. Then I would restore into an isolated environment, obtain the same credentials and keys through the intended emergency process, replay to a chosen target and verify business records. I would include application startup and dependent state in the measured recovery time. A replica is useful for availability but can reproduce an accidental deletion; it does not replace a tested historical recovery path. The drill should produce measured evidence and owned remediation.”

**Example, contextual drill:** Create known markers around a controlled accidental deletion. Restore to a target before that deletion; verify the earlier marker exists and the later destructive action is absent. Keep outbound effects disabled so restored jobs cannot charge customers or emit production notifications.

**Deep dive / verification:** Test archive gaps, unavailable encryption keys, wrong timelines, corrupt artifacts, access revocation and realistic restore bandwidth. Preserve an unbroken needed WAL sequence; keeping only the latest segment is insufficient. Verify configuration and secrets separately: WAL recovery does not reconstruct all external files or external systems. State what happens to Kafka projections and object storage after database rollback. Scan/restore cost depends on bytes and replay work; a job duration measured on an empty database is not a production RTO.

**Follow-ups:** *Is a database consistency check enough?* No; verify application invariants and external-state reconciliation too. *How often should drills run?* According to risk and change rate, with another drill after a material recovery-path change.

**Primary reference:** [PostgreSQL 17 continuous archiving and recovery](https://www.postgresql.org/docs/17/continuous-archiving.html). RPO/RTO acceptance and the marker drill are explicit design choices.

---

**9. A short user-supplied regular expression makes one request consume CPU for minutes. Why are input length and a future timeout insufficient?**

**Say aloud:** “Regular-expression denial of service, or ReDoS, happens when matching takes excessive work on adversarial input. Backtracking engines can explore many alternatives for ambiguous patterns, especially when a long near-match fails at the end. A small pattern can therefore create a large computation; limiting only pattern length does not establish a useful runtime bound.

If users need literal search, I would quote their text instead of interpreting it as a pattern. If they need patterns, I would restrict the supported language or choose an engine with suitable documented complexity, accepting syntax differences. I would also bound input size and admission. Timing out the future only stops waiting unless the matcher cooperates with cancellation; it does not prove the worker stopped consuming CPU. For untrusted expensive computation requiring hard termination, I would consider process isolation with a resource budget rather than promise that an interrupt will stop arbitrary Java matching.”

**Example, contextual threat:** Nested ambiguous repetition such as `(a+)+$` against a growing run of `a` followed by a failing character is a classic risk shape. Do not execute unbounded hostile patterns on application request threads as a diagnostic experiment.

**Deep dive / verification:** Use bounded test inputs in an isolated, externally limited worker, measure growth as length increases and inspect CPU stacks. A precompiled pattern avoids compilation repetition but does not fix expensive matching. Prefer literal substring search where product semantics allow it. Engine replacement needs compatibility tests for captures, backreferences, Unicode and anchors. Do not claim all regexes are exponential or that one universal length limit makes every allowed pattern safe.

**Follow-ups:** *Does Pattern.quote make arbitrary patterns safe?* It changes them into literal text, so it is appropriate only when literal semantics are intended. *Why cap concurrent matching?* It bounds fleet exposure but does not fix one nonterminating or extremely expensive task.

**Primary references:** [OWASP ReDoS mechanism](https://community.owasp.org/attacks/Regular_expression_Denial_of_Service_-_ReDoS), [Java 21 Pattern quoting and syntax](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html).

---

**10. An HTTP upload retries with the same idempotency key, but the second attempt has an empty body. Which part of retry safety was overlooked?**

**Say aloud:** “An idempotency key lets a server recognize a repeated logical operation under its contract. It does not recreate the request bytes. An input stream is consumed as it is read; reusing the same exhausted stream can send an empty or partial body on another subscription or attempt.

With Java's ofInputStream body publisher I would provide a supplier that opens a fresh stream for each attempt needing one. The source must also represent stable bytes: reopening a file that another process changes does not recreate the same request. For a large upload I would create a bounded, owned snapshot or use a resumable protocol, with explicit cleanup and storage limits. The server should bind the idempotency key to an appropriate request fingerprint and reject incompatible reuse. I would distinguish transport replayability, server deduplication and deadline policy, because satisfying any one of them alone does not make retrying safe.”

**Example, contextual design:** `ofInputStream(() -> openSnapshot())` creates independent readers of an immutable upload artifact. `ofInputStream(() -> sameAlreadyOpenedStream)` does not. The supplier must handle failure according to the API contract; opening the snapshot, cleanup and authorization belong to the surrounding application.

**Deep dive / verification:** Use a controlled local HTTP peer to interrupt transfer and record the complete bytes on retry, including supplier failure and cleanup. Test changed-source rejection and identical fingerprints; a retry must preserve content semantics as well as key text. Buffering B bytes in memory costs O(B) heap; a disk artifact moves the budget to storage and adds I/O. Stream creation must not reopen an arbitrary user-controlled path without validation. Do not assume an automatic client resend occurs in every failure case.

**Follow-ups:** *Can I retry every POST if its bytes are reproducible?* Only if its application semantics and server contract make repetition safe. *Does a digest alone recreate the body?* No; it verifies content identity but cannot supply missing bytes.

**Primary reference:** [Java 21 BodyPublishers.ofInputStream repeatable supplier contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.BodyPublishers.html#ofInputStream(java.util.function.Supplier)).

---

**11. Assign exactly one task to each worker at minimum total cost. Why can choosing each worker's cheapest available task fail?**

**Say aloud:** “This is a complete square assignment problem: every worker gets one distinct task, and every pair has a nonnegative integer cost. Greedy decisions can consume the task that a later worker needs much more. For a small number of workers, I would use dynamic programming over subsets of assigned tasks.

A bit mask stores which tasks are taken. If it contains r set bits, exactly the first r workers have been assigned. For each unused task I extend that state by assigning worker r, and retain the cheapest total for the new mask. This works because future costs depend only on which tasks remain, not the earlier assignment order. I would store parent choices to reconstruct a complete optimal assignment, use long for summed int costs and reject inputs above the explicit sixteen-worker limit. The exponential state count is acceptable only under that small bound; larger instances need a polynomial assignment algorithm or a more general optimization model.”

**Example:** Costs `[[1,2],[1,100]]`: worker-first cheapest chooses task 0 for worker 0 and pays 101. The optimum gives worker 0 task 1 and worker 1 task 0, total 3. All pairs are allowed; forbidden edges are outside this API's model.

```java
record Assignment(long cost, List<Integer> taskByWorker) {}

static Assignment cheapestAssignment(int[][] cost) {
    Objects.requireNonNull(cost, "cost");
    int n = cost.length;
    if (n > 16) throw new IllegalArgumentException("at most 16 workers");
    for (int[] row : cost) {
        Objects.requireNonNull(row, "row");
        if (row.length != n) throw new IllegalArgumentException("square matrix required");
        for (int value : row)
            if (value < 0) throw new IllegalArgumentException("nonnegative costs required");
    }
    int states = 1 << n;
    long[] best = new long[states];
    Arrays.fill(best, Long.MAX_VALUE);
    int[] chosen = new int[states];
    Arrays.fill(chosen, -1);
    best[0] = 0;
    for (int mask = 0; mask < states - 1; mask++) {
        int worker = Integer.bitCount(mask);
        for (int task = 0; task < n; task++) {
            int bit = 1 << task;
            if ((mask & bit) != 0) continue;
            int next = mask | bit;
            long candidate = best[mask] + cost[worker][task];
            if (candidate < best[next]) {
                best[next] = candidate;
                chosen[next] = task;
            }
        }
    }
    Integer[] tasks = new Integer[n];
    for (int mask = states - 1, worker = n - 1; worker >= 0; worker--) {
        int task = chosen[mask];
        tasks[worker] = task;
        mask ^= 1 << task;
    }
    return new Assignment(best[states - 1], List.copyOf(Arrays.asList(tasks)));
}
```

**Deep dive / verification:** Every subset is reachable because every pair is allowed; thus no unreachable Long.MAX_VALUE state is added. Setting a previously unset bit increases the mask numerically, so transitions go forward. Equal-cost ties may return any optimum. Time O(n·2^n + n²), auxiliary space O(2^n + n); the empty matrix returns cost zero and an empty immutable assignment. Sixteen maximum int costs sum safely in long. The method does not mutate input. Verify all task IDs occur once, recompute output cost and compare with an independent permutation enumerator on small matrices. Test greedy failure, ties, invalid trailing entries, null/ragged rows and the admitted size boundary.

**Follow-ups:** *What if pairs can be forbidden?* Define impossibility and skip unreachable states before addition; this implementation deliberately assumes complete compatibility. *What about hundreds of workers?* Consider Hungarian assignment, commonly O(n³) for the dense square problem, or min-cost flow when capacities/general constraints require it.

**Primary references:** [Java 21 Integer.bitCount](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html#bitCount(int)), [Bertsekas on the assignment problem and dense Hungarian complexity](https://web.mit.edu/dimitrib/www/Bertsekas_Assignment_1981.pdf). The bounded subset recurrence and implementation above are original illustrative code.

---

**12. Two ranked exports contain an integer priority sequence. Count out-of-order pairs without checking every pair. Why does merge sort count many at once?**

**Say aloud:** “An inversion is a pair of positions i before j where the earlier value is strictly greater. Equal priorities do not count. A direct check is quadratic. I would adapt merge sort: count inversions inside the left and right halves, then count those crossing between halves while merging their sorted values.

When the next right value is smaller than the next left value, it is smaller than every remaining left value, so it contributes the number of remaining left elements at once. When the values are equal I take from the left, preserving the strict comparison. I would clone the input because callers asked for a count, not a reordered export, and reuse one temporary array rather than allocate for each recursive call. The result must be long: descending input can have n times n minus one divided by two inversions. I would compare small cases against a direct pair enumeration and test duplicates, negative values and extreme integers.”

**Example:** `[3,1,2]` has two inversions: `(3,1)` and `(3,2)`. `[2,2,1]` also has two, not three. This compares numeric values, not matching IDs across two independent exports; converting two rankings into one comparable sequence is a separate validation step.

```java
static long inversionCount(int[] values) {
    Objects.requireNonNull(values, "values");
    if (values.length > 1_000_000)
        throw new IllegalArgumentException("at most one million values");
    int[] sorted = values.clone();
    return countAndMerge(sorted, new int[sorted.length], 0, sorted.length);
}

private static long countAndMerge(int[] a, int[] scratch, int from, int to) {
    if (to - from < 2) return 0;
    int mid = from + (to - from) / 2;
    long count = countAndMerge(a, scratch, from, mid)
               + countAndMerge(a, scratch, mid, to);
    int left = from, right = mid, out = from;
    while (left < mid && right < to) {
        if (a[left] <= a[right]) scratch[out++] = a[left++];
        else {
            scratch[out++] = a[right++];
            count += mid - left;
        }
    }
    while (left < mid) scratch[out++] = a[left++];
    while (right < to) scratch[out++] = a[right++];
    System.arraycopy(scratch, from, a, from, to - from);
    return count;
}
```

**Deep dive / verification:** Split the inversion set into disjoint left-only, right-only and crossing pairs; each is counted exactly once. O(n log n) time for n≥2, O(n) arrays and O(log n) recursion stack; even an already sorted input follows this implementation's merge traversal. Empty and singleton arrays return zero. The one-million limit bounds copied storage and recursion depth, not a universal latency promise. Use direct comparison rather than subtraction, which could overflow for extreme ints. Verify descending length 100,000 yields 4,999,950,000, and check caller input remains unchanged. A count alone does not list offending records; listing all pairs can require quadratic output.

**Follow-ups:** *Can a Fenwick tree solve this too?* Yes, after order-preserving coordinate compression, with careful exclusion of equal values; merge counting avoids that mapping step. *Why not parallelize immediately?* Shared scratch ranges and cross-half merging require ownership; first measure whether the bounded sequential implementation needs it.

**Primary reference:** [Princeton authors' merge-counting implementation](https://github.com/kevin-wayne/algs4/blob/master/src/main/java/edu/princeton/cs/algs4/Inversions.java). Code above is an original bounded, non-mutating variant.

---

**Topic coverage:** Core Java views and ownership; concurrency permit accounting; JVM recording evidence; Spring transaction enforcement; JPA deferred references; Kafka replica durability; probabilistic structures; recovery engineering; regex security; microservice request replay; minimum-cost assignment; inversion counting. The earlier sets remain prerequisites rather than being repeated.

**Next set will build on:** Partial-order recovery across independent partitions, fair admission under mixed request costs, database sequence gaps versus commit order, and algorithms that return a concrete witness when a constraint is impossible. Continue with Set 15, even if another run occurs on 23 October.
