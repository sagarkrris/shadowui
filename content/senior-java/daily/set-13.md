**Set 13 · 22 October 2026 — Proving progress and bounding state**

Reference assumptions: **Java 21 without preview features**, HotSpot JVM, Spring Boot 3.5, Jakarta Persistence 3.2 semantics, PostgreSQL 17 and Kafka 4.0 Java clients. These are explicit reference versions, not claims about the latest releases. JWT guidance uses RFC 8725; metrics guidance uses Prometheus documentation checked on 22 October 2026.

Stable IDs: **S13-Q01–S13-Q12**, in order. Each spoken answer targets 45–90 seconds. Examples are original illustrations, not personal experience. The two Java blocks are complete class members requiring `java.util.*`; the dedicated fixture compiles the published text with `--release 21` and checks it against independent sum and cut-enumeration oracles. Configuration, database and infrastructure flows are contextual designs, not executed framework applications or benchmarks.

---

**1. A WeakHashMap stores a document as key and a preview callback as value. Why does memory still grow when the callback captures the document?**

**Say aloud:** “A weak reference lets the collector reclaim its referent when no stronger path keeps it alive. WeakHashMap weakens its keys, but retains its values strongly. If a preview callback closes over its document, the rooted map reaches the callback, which reaches the document. The weak key cannot break that strong path.

I would inspect retaining paths before changing the reference type. For this preview cache, I would store a result that does not capture the document, or use explicit lifecycle removal and a size budget. Weak keys do not provide a predictable eviction deadline or a hard memory limit. Collection timing also makes them unsuitable for deciding whether a document is valid or authorized. If callbacks own sockets or files, I would close those through an explicit lifecycle rather than waiting for collection. I would verify the corrected ownership graph with a heap dump under repeated preview creation.”

**Example:** `root → map → callback → document` retains the document even though `map → weak-key → document` is weak. A preview containing only independent text avoids this particular path; it still needs a cache budget.

**Deep dive / verification:** Search callback fields and indirect cycles in a dominator/retaining-path view. Do not make tests depend on one `System.gc()` call reclaiming an object. Synchronization protects map access, not collection timing. Expected lookup cost resembles hashing; cache space depends on retained entries and values, not just key count.

**Follow-ups:** *Would weak values solve it?* They can disappear while a key remains; callers need a missing-result policy and resource ownership still needs explicit closure. *Can I use this for deduplication?* No durable replay guarantee follows from collector-controlled retention.

**Primary references:** [Java 21 WeakHashMap ownership contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/WeakHashMap.html), [weak-reference reachability](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/WeakReference.html).

---

**2. Two consumers wake for one queued item. Why must a condition wait recheck the predicate in a loop?**

**Say aloud:** “A condition is a way to suspend a thread until shared state may permit progress. A signal is a notification, not a reservation of an item. Waiting releases the associated lock and returning from the wait reacquires it. Before a notified consumer gets the lock, another consumer may take the only item. Spurious wake-ups, which are returns without a corresponding signal, are another reason to recheck.

I would hold the same lock while testing and changing the queue state, and wait in a while loop while it is empty. The producer adds the item and signals under that lock. For shutdown, I need a closed flag in the predicate so an empty closed queue does not wait forever. I would normally use an established blocking queue and define termination separately. If interruption cancels this operation, I would propagate it rather than pretending an item was obtained.”

**Example, contextual pseudocode:** `while (queue.empty && !closed) await(); if (queue.empty) return END; return remove();` The producer changes queue/closed state under the same lock. Closure signals all waiters; an end marker must be distinguishable from data.

**Deep dive / verification:** Use barriers and controlled producers to exercise two consumers, one item and closure. A wake-up alone never establishes the queue predicate. A timed wait must recompute remaining budget or use the returned remaining nanoseconds; restarting the full timeout on every wake can exceed the deadline. Lock hold time and waiter scheduling dominate latency; no fairness or constant completion-time promise follows.

**Follow-ups:** *Why not signal before changing state outside the lock?* That separates predicate ownership from notification and enables missed-progress races. *Does signalAll fix an if check?* No: competing consumers still have to retest.

**Primary reference:** [Java 21 Condition wait and notification semantics](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Condition.html).

---

**3. A fresh replica is slower for its first minute even with a warm database. Why can Java execution change after startup?**

**Say aloud:** “HotSpot can execute methods through an interpreter and compiled code. Tiered compilation uses execution profiles to decide where compilation effort helps. Just-in-time compilation means machine code is generated while the application runs; the initial workload can therefore include profiling and compilation costs that a steady-state measurement misses.

I would compare cold and established replicas at equal traffic, checking compilation activity alongside CPU, allocation, class loading and downstream timings. A warm database does not eliminate TLS setup, connection pools or lazy application initialization. I would use a representative, bounded warm-up workload before gradually admitting traffic, while keeping irreversible business operations out of synthetic warm-up. I would measure time until the replica meets its latency objective, not assume that JVM startup completion means stable throughput. Warm-up is an operational capacity concern; it does not justify masking a persistent regression as normal JIT behavior.”

**Example:** An illustrative rollout sends a new replica a small fraction of requests, increases the fraction only while latency and errors remain acceptable, and pauses the rollout if cold replicas never stabilize. No fixed warm-up duration is asserted.

**Deep dive / verification:** Correlate JFR compilation/class-loading events and request traces, then repeat with the same request mix and concurrency. Keep cold-start and steady-state distributions separately. JVM flags, code shape and workload affect results; do not promise that all code becomes compiled, or that a cache-only warm-up exercises serialization and validation paths. Extra replicas consume memory and compilation CPU during rollout.

**Follow-ups:** *Should readiness fail until the JVM is fully optimized?* There is no universal fully optimized point; define a service acceptance check and gradual admission. *Would ahead-of-time work remove every startup cost?* It cannot pre-open every external resource or predict every workload path.

**Primary reference:** [HotSpot Java 21 tiered compilation](https://docs.oracle.com/en/java/javase/21/vm/java-hotspot-virtual-machine-performance-enhancements.html).

---

**4. A library's fallback bean sometimes wins over a user's bean. Why is ConditionalOnMissingBean sensitive to configuration order?**

**Say aloud:** “A Spring bean is an object managed by the application context. ConditionalOnMissingBean decides whether to register a definition based on matching bean definitions processed so far. It is not a continuous rule that later deletes a fallback when a user's definition appears. That makes ordinary configuration scanning order a poor foundation for a reusable fallback.

I would put the fallback in Boot auto-configuration, which is designed to run after user configuration, and declare ordering when another auto-configuration supplies the prerequisite. I would express the condition in terms of the intended service type and expose an informative bean return type. I would test both a default context and a context with a user's replacement. Enabling arbitrary bean-name overriding can hide the mistake instead of giving a stable extension contract. Conditions decide registration; they do not choose an implementation dynamically for every request.”

**Example, contextual design:** A library supplies `RatePolicy` only when the application supplies none. With a custom `RatePolicy`, the context must contain the custom instance and no fallback. Two unrelated names do not prevent a type-based collision.

**Deep dive / verification:** Use Boot's ApplicationContextRunner to check default, replacement and relevant configuration-order cases; inspect the condition evaluation report. Parent contexts and search strategy can affect matching, so document whether a parent policy should suppress a child fallback. Startup evaluation cost is not request-path complexity. Avoid turning deployment-dependent discovery order into business policy.

**Follow-ups:** *Will Primary prevent fallback creation?* It helps choose among injection candidates; it does not inherently suppress registration. *What about runtime tenant-specific policies?* Use an explicit tenant-aware selection contract after authentication.

**Primary references:** [Boot 3.5 ConditionalOnMissingBean matching and ordering](https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingBean.html), [ApplicationContextRunner](https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/test/context/runner/ApplicationContextRunner.html).

---

**5. saveAndFlush returns successfully, then an external system is notified, but the surrounding transaction rolls back. What guarantee was mistaken?**

**Say aloud:** “A persistence context tracks managed entity changes. Flushing synchronizes those changes with the database inside the current transaction. Committing finishes that transaction. Successful SQL execution during flush therefore does not mean other sessions can observe a committed row, and a later rollback can still undo it.

I would not use flush success as permission to send an irreversible notification. If a committed order must eventually produce an event, I would persist an outbox row in that same transaction and have a relay publish committed rows. That adds delivery lag and replay handling, but ties the publication obligation to the business commit. Flush is useful for surfacing some constraint errors earlier or making pending writes available to subsequent database work in the same transaction. It cannot guarantee that commit will succeed, particularly with deferred checks or later failures. The receiver also needs an idempotent handling contract.”

**Example:** `begin → persist order → flush → remote email accepted → rollback` can leave an email for an absent order. Replacing the remote step with an outbox insert keeps order and obligation in one local commit.

**Deep dive / verification:** In a real database integration test, flush in transaction A, query through a separate transaction B at the chosen isolation level, then roll A back. Confirm no relay publishes uncommitted obligations. Do not use a test that shares one persistence context as proof of external visibility. Flush can introduce round trips and extend lock occupancy; excessive per-row flushing can destroy batching.

**Follow-ups:** *Can commit fail after flush?* Yes; flush is an intermediate synchronization point. *Does an after-commit callback survive a process crash?* An in-memory callback alone does not durably record the obligation.

**Primary reference:** [Jakarta Persistence 3.2 EntityManager flush contract](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html#flush()).

---

**6. max.poll.records is ten, but a Kafka consumer still retains large fetched batches. Which limit is being confused?**

**Say aloud:** “Kafka fetches batches from brokers and returns records through poll. max.poll.records bounds how many records a poll call returns; it does not directly bound the underlying fetch or the application's retained work. Reducing it to ten can make processing batches smaller while large fetched data remains cached by the consumer.

I would budget bytes as well as record counts: fetch request size, per-partition fetch size, assigned partitions, decompressed data, deserialized objects and application queues. The documented oversized-first-batch exception means fetch size settings are not an unconditional hard memory ceiling. I would coordinate producer/topic batch limits and downstream admission, measure actual retained heap, and keep processing within the poll interval contract. Pausing partitions controls further delivery through poll for them; it does not erase objects already fetched or handed to workers. A safe design accounts for in-flight data across all stages rather than relying on one setting.”

**Example:** Ten records containing large documents may cost more than thousands of small events. A consumer assigned many partitions also needs a different budget from one assigned a single partition. These are workload assumptions, not measured capacities.

**Deep dive / verification:** Load-test compressible and incompressible payloads at allowed maxima; observe fetch sizes, deserialization allocation, queue depth, heap and lag. Include an allowed oversized first batch. Consumer-wide memory includes concurrent broker responses and application retention. Smaller fetches can add network overhead; increasing poll timeouts may hide slow processing without reducing memory.

**Follow-ups:** *Can I estimate bytes as ten times average size?* That misses tails, batching and object expansion; use bounds and measurements. *Will adding worker threads solve it?* Only if bounded admission and completion keep up without violating ownership and offset rules.

**Primary reference:** [Kafka 4.0 consumer fetch and poll settings](https://kafka.apache.org/40/configuration/consumer-configs/).

---

**7. Source and target each contain one million rows after a migration. What evidence is still missing before cutover?**

**Say aloud:** “Equal counts prove only equal cardinality, meaning the number of rows. One missing row and one extra row cancel out, and wrong values do not change the count. Reconciliation means comparing the intended source state with the target state under a defined consistency boundary.

I would identify a shared boundary: for example, quiesce writers, drain replication, then compare both sides; or build a snapshot and replay to an explicit source checkpoint. Comparing moving tables at different times can report false differences or miss real ones. I would compare key sets and canonicalized business values in bounded ranges, including deletions and nulls. Hashes can locate suspicious ranges efficiently, but matching hashes are probabilistic evidence rather than a mathematical proof of equality. Before switching readers, I would repair differences conditionally against the expected revision and repeat the comparison, so reconciliation does not overwrite newer live data.”

**Example:** Source IDs `{10,20}` and target IDs `{10,30}` have equal counts. Even equal IDs can hide `10.amount=8` versus `10.amount=80`. Canonical encoding must distinguish missing, null and empty, and specify decimal and timestamp representations.

**Deep dive / verification:** A PostgreSQL repeatable-read transaction holds a stable view within that database; it does not automatically coordinate a remote target's snapshot. Test compensating count errors, trailing-space/encoding differences, deleted rows and concurrent repair. Full comparison costs O(total encoded bytes) plus ordering/index work; chunking bounds working memory, not total I/O. Long-held snapshots have operational costs.

**Follow-ups:** *Is a sum of row hashes enough?* It can hide combinations and loses ordering; retain keys and inspect differences. *What is the cutover success condition?* Define permitted lag, mismatch count and rollback ownership before the migration.

**Primary reference:** [PostgreSQL 17 snapshot and isolation boundaries](https://www.postgresql.org/docs/17/transaction-iso.html). The cross-system reconciliation protocol above is a proposed design.

---

**8. A projection saves its checkpoint before saving the corresponding changes. Why can restart permanently skip data?**

**Say aloud:** “A projection is a derived view built from source changes. A checkpoint records which changes it claims to have applied. If progress advances first and the process crashes before the data write, restart begins after changes that never reached the view. Writing data first avoids that loss window but can replay changes after a crash.

When projection rows and checkpoint share a transactional database, I would commit both together. I would scope progress by source identity, generation and partition, serialize each partition's application, and reject stale workers. If the target cannot commit data and progress atomically, I need replay-safe operations with durable event identity or source-version checks, and advance the checkpoint only after acknowledged effects. A bare increment is not replay-safe. I would test crashes on both sides of every boundary and treat a successful checkpoint as a claim requiring durable evidence, not just a number in memory.”

**Example, contextual sequence:** With next-offset semantics, committed checkpoint `42` says records before offset 42 have been applied. If record 42 increments a total, committing checkpoint 43 before that increment loses it on restart. One target transaction commits the increment and checkpoint 43 together. Kafka offsets belong to a partition; they are not a global ordering across topics.

**Deep dive / verification:** Kill the worker before data, after data and after commit; restart and compare with a clean replay. Include repeated events and reassignment. Source positions can include connector-specific metadata; do not assume a PostgreSQL log position uniquely names every row event. Database checkpoints must be the recovery authority for this protocol; independently advancing a broker offset can undermine it.

**Follow-ups:** *Does atomic target progress make an email atomic too?* No; add a durable obligation and deduplicating delivery contract. *Can a new index reuse old progress?* Only if its data generation has the corresponding state; otherwise rebuild with separate progress.

**Primary references:** [Kafka 4.0 consumer positions and external offset storage](https://kafka.apache.org/40/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html), [PostgreSQL Debezium event metadata](https://debezium.io/documentation/reference/stable/connectors/postgresql.html). This is a target-side protocol design, not a connector guarantee.

---

**9. A gateway verifies a JWT signature using whichever algorithm the token header requests. Why is a valid signature check insufficient?**

**Say aloud:** “A JWT (JSON Web Token) carries claims such as issuer, audience and expiry, with a header describing its cryptographic format. The header arrives from an untrusted client. The service must configure the permitted algorithm and appropriate verification keys rather than allowing the token to choose an unrelated verification scheme. Historical algorithm-confusion vulnerabilities show why successful cryptographic processing alone is not enough.

I would use a maintained JWT library with an explicit algorithm allowlist, bind keys to the trusted issuer, and validate the expected audience, time claims and token purpose. A valid token for a different service must not authorize this API. A key identifier should select from trusted keys, not become a file path or arbitrary network URL. Rotation needs a bounded, trusted key-refresh policy. Finally, authentication establishes identity claims; authorization still checks the requested action and resource. I would reject malformed or unsupported tokens through a uniform safe error path.”

**Example:** A correctly signed token with audience `billing-export` is rejected by `payroll-write`. A token requesting `none` or an unexpected symmetric algorithm is rejected before it can redefine the gateway's trust policy.

**Deep dive / verification:** Test wrong issuer/audience, disallowed algorithms, unknown key IDs, expiry and wrong-purpose tokens using the actual configured verifier. Bound parser input size and key-fetch retries. Define clock tolerance narrowly. Avoid logging complete bearer tokens. Key-cache misses under attack must not trigger unbounded network work. Signature verification has input-dependent cryptographic cost; no simple O(1) service-latency guarantee is appropriate.

**Follow-ups:** *Does TLS replace token validation?* It protects a transport channel, not the intended recipient or purpose of a presented token. *May two token types share identical validation rules?* Only if substitution is safe; distinct purposes often need mutually exclusive rules.

**Primary references:** [RFC 8725 JWT best current practices](https://www.rfc-editor.org/rfc/rfc8725.html), [RFC 7519 registered claims and audience](https://www.rfc-editor.org/rfc/rfc7519.html).

---

**10. Adding customerId to every request metric exhausts the monitoring system. How would you retain diagnostic value?**

**Say aloud:** “A time series is one metric with one distinct combination of label values. Cardinality is the number of those combinations. A customer ID label can create a series per customer, multiplied by routes, status values, replicas and histogram buckets. Low request traffic does not imply low series count if each request introduces a different customer.

I would use bounded labels for aggregate metrics, such as templated route, method and status class, and put carefully controlled customer context in searchable logs or traces when justified. Raw URL paths can recreate the same problem through embedded IDs. I would estimate the combination count before rollout, enforce label conventions in instrumentation, and monitor active series and ingestion churn. Removing a label loses direct per-customer aggregation, so selected high-value diagnostics may need a separate bounded facility. Logs and traces still need retention, access and sampling controls; moving IDs there is not permission to collect unlimited sensitive data.”

**Example:** An illustrative upper bound of 20 routes × 5 status classes × 10 replicas is 1,000 label combinations before histogram expansion. Multiplying by 100,000 customers makes the potential space 100 million combinations. Actual populated combinations depend on traffic.

**Deep dive / verification:** Test instrumentation with many unique customer IDs and raw paths; aggregate metric labels should remain in a bounded vocabulary. Inspect emitted series, not just code configuration. Histogram buckets multiply series, and label-value churn can create storage overhead even when current activity is small. Do not use customer-specific metric names as an attempted workaround.

**Follow-ups:** *Why not hash customerId?* It hides the text but preserves essentially the same number of identities and is not necessarily anonymization. *Can exemplars help?* A supported exemplar can link a selected observation to a trace without making every trace ID a normal series label.

**Primary reference:** [Prometheus metric and label naming guidance](https://prometheus.io/docs/practices/naming/).

---

**11. A dashboard repeatedly replaces one integer reading and asks for a range sum. How can a Fenwick tree avoid rescanning each range?**

**Say aloud:** “A prefix sum is the sum of entries before a chosen boundary. A static prefix array answers range sums quickly, but changing one reading invalidates many later prefixes. A Fenwick tree, also called a binary indexed tree, stores sums of carefully chosen power-of-two-sized blocks. Each prefix query combines logarithmically many blocks, and a point change adjusts logarithmically many stored blocks.

I would expose replacement rather than addition here: remember the old reading, compute the difference as a long, and add that difference to the affected blocks. A half-open range, including its start and excluding its end, is the difference of two prefixes. I would clone the input so outside mutation cannot invalidate the tree, reject bad boundaries, and use long totals for sums of int readings. The structure is mutable and this implementation is thread-confined; a concurrent service needs a lock covering the complete update or query, not separate atomic cells.”

**Example:** Starting from `[4,-2,7]`, range `[0,3)` sums to nine. Replacing index one with five makes range `[1,3)` equal twelve. The empty range `[2,2)` sums to zero. The input array remains unchanged. This teaching implementation admits at most one million entries.

```java
static final class RangeReadings {
    private final int[] values;
    private final long[] tree;
    RangeReadings(int[] initial) {
        Objects.requireNonNull(initial, "initial");
        if (initial.length > 1_000_000)
            throw new IllegalArgumentException("entry budget");
        values = initial.clone();
        tree = new long[values.length + 1];
        for (int i = 0; i < values.length; i++) add(i, values[i]);
    }
    void replace(int index, int value) {
        if (index < 0 || index >= values.length)
            throw new IndexOutOfBoundsException("reading index");
        long delta = (long) value - values[index];
        add(index, delta);
        values[index] = value;
    }
    long sum(int from, int to) {
        if (from < 0 || from > to || to > values.length)
            throw new IndexOutOfBoundsException("half-open range");
        return prefix(to) - prefix(from);
    }
    private void add(int index, long delta) {
        for (int i = index + 1; i < tree.length; i += i & -i)
            tree[i] += delta;
    }
    private long prefix(int end) {
        long total = 0;
        for (int i = end; i > 0; i -= i & -i) total += tree[i];
        return total;
    }
}
```

**Deep dive / guarantees:** With one-based tree indices, `i & -i` extracts the lowest set bit. Entry i covers that many values ending at i. A query clears this bit to move to a disjoint earlier block; an update visits the containing blocks. For N > 0, construction here is O(N log(N+1)); each replacement/query is O(log(N+1)), with O(N) retained storage. A linear-time build is possible, but is not implemented here. At the stated bound, even a million maximum int readings sum safely in long; casting before subtraction avoids int overflow in the replacement difference. Empty input permits only `[0,0)`, with O(1) construction and query work. No fixed service latency or arbitrary-precision arithmetic is promised.

**Follow-ups:** *Can I ask for range minimum using prefix subtraction?* Minimum has no subtraction operation that removes an earlier prefix; use an appropriate segment tree. *Do atomic long cells make a sum consistent?* No: a query can observe only part of a multi-cell update. Protect the operation boundary or design versioned snapshots.

**Verification guidance:** Compare every range against a direct long sum before and after replacements, including negatives, empty ranges, extreme ints and replacing a value with itself. Mutate the constructor's original array to verify ownership; reject invalid updates without changing state. [Princeton's Fenwick-tree implementation](https://github.com/kevin-wayne/algs4/blob/master/src/main/java/edu/princeton/cs/algs4/FenwickTree.java) documents the binary-index mechanism; the replacement and long-sum contract above is specific to this example.

---

**12. Split a string into the fewest palindromic pieces and return those pieces. Why can taking the longest available palindrome first fail?**

**Say aloud:** “A palindrome reads the same in both directions. Longest-first is a local choice: for aababa it can take aa, then bab, then a, while a followed by ababa uses only two pieces. I would use dynamic programming to choose over every possible last piece of each prefix.

First I precompute whether each substring is a palindrome, using equal endpoints and the answer for the substring inside them. Then best[end] stores the fewest pieces covering the prefix that ends just before end. For each palindromic suffix of that prefix, I extend the best earlier prefix by one. I retain the earlier boundary that won, then walk those boundaries backward to reconstruct a complete partition. Every nonempty single character is a palindrome, so a solution always exists. I would state the character model, bound quadratic memory, and test minimality against exhaustive cut choices on short strings.”

**Example:** `aababa` returns `[a, ababa]`; `abba` returns `[abba]`; the empty string returns an empty list. This version accepts only lowercase ASCII `a`–`z`, deliberately avoiding ambiguity about Unicode code points and user-perceived characters. The length budget is 2,000 characters. Ties keep the first winning start boundary in the scan; no lexicographic ordering is promised.

```java
static List<String> palindromePieces(String text) {
    Objects.requireNonNull(text, "text");
    int n = text.length();
    if (n > 2_000) throw new IllegalArgumentException("length budget");
    for (int i = 0; i < n; i++)
        if (text.charAt(i) < 'a' || text.charAt(i) > 'z')
            throw new IllegalArgumentException("lowercase ASCII required");
    boolean[][] palindrome = new boolean[n][n];
    for (int start = n - 1; start >= 0; start--)
        for (int end = start; end < n; end++)
            palindrome[start][end] = text.charAt(start) == text.charAt(end)
                    && (end - start < 2 || palindrome[start + 1][end - 1]);
    int[] best = new int[n + 1], previous = new int[n + 1];
    Arrays.fill(best, n + 1);
    best[0] = 0;
    for (int end = 1; end <= n; end++) {
        for (int start = 0; start < end; start++) {
            if (palindrome[start][end - 1] && best[start] + 1 < best[end]) {
                best[end] = best[start] + 1;
                previous[end] = start;
            }
        }
    }
    List<String> reversed = new ArrayList<>(best[n]);
    for (int end = n; end > 0; end = previous[end])
        reversed.add(text.substring(previous[end], end));
    Collections.reverse(reversed);
    return List.copyOf(reversed);
}
```

**Deep dive / guarantees:** The substring table is filled from larger starts to smaller starts so an inner substring is ready when needed. The prefix recurrence considers every legal last piece, and any prefix has a finite solution through single characters. Thus the chosen predecessor strictly reduces end, and the returned concatenation exactly covers the input. For N characters, time and working memory are O(N² + 1), including the empty case; reconstructed string content totals O(N) characters. Minimum cuts for a nonempty input is pieces minus one, while the empty-input convention should be stated separately. A more memory-conscious center-expansion design is possible, but needs its own proof that prefix states are ready before use. Lower memory must not be claimed for this table-based code.

**Follow-ups:** *Does finding the longest palindromic substring solve partitioning?* No: it optimizes one substring rather than a complete cover. *How would natural-language text change it?* Decide normalization and whether to compare code points or grapheme clusters, then map result boundaries back to the original text; Java char indexing alone does not establish that model.

**Verification guidance:** Compare piece count against recursive enumeration of every cut pattern; independently check every returned piece and the joined text. Cover empty, single-character, repeated, odd/even palindrome, greedy counterexample, invalid trailing characters and the admitted length boundary. [Java 21 String indexing and substring contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html) defines the API behavior; the recurrence and proof are derived above.

---

**Topic coverage:** weak-key retention, condition predicates, HotSpot warm-up, Spring fallback registration, flush versus commit, Kafka byte budgets, migration reconciliation, transactional projection checkpoints, JWT trust policy, metric cardinality, mutable range sums and minimum palindrome partition reconstruction. Questions 7–8 deliberately extend Set 12's migration/CDC work into cutover evidence and target-side crash recovery; their decisions and failure sequences are new.

**Next set builds on:** cost-aware assignment, partial-order checkpoints, bounded result aggregation and reproducible recovery drills. Practise explaining what evidence proves progress, what state remains live, and which boundary owns each guarantee. Continue numbering with Set 14, including another run on this date.
