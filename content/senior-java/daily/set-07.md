**Set 7 · 13 October 2026 — Evolution, recovery, and string algorithms**

Twelve new scenarios following the 72 questions in Sets 1–6. Reference targets: **Java 21 without preview features**, Spring Framework 6.2 in a Spring Boot 3.5 application, Hibernate ORM 6.6, and Kafka 4.0. These are compatibility assumptions, not latest-version claims. Examples are original illustrations, not personal experience.

Practise each **Say aloud** answer in 45–90 seconds. Stable IDs: **S07-Q01–S07-Q12**, in order. The two Java blocks are executable methods/nested classes with `java.util.*` and a class wrapper. Other examples are contextual fragments or protocol designs, not deployable services.

---

**1. Adding format(Integer) beside format(String) breaks a client's format(null). How can adding an API be incompatible?**

**Say aloud:**
“Overloading means multiple methods share a name but have different parameter types. Java chooses an overload at compile time from the argument's declared type and the applicable conversion rules. A null literal can match both String and Integer. Neither type is more specific than the other, so this call becomes ambiguous when the new overload appears.

The original compiled client still refers to the String method's descriptor if that method remains available. Recompiling the same source can fail. That separates binary compatibility from source compatibility; adding a member is not automatically safe in both dimensions.

I would prefer distinct operation names when the inputs represent different concepts, or an explicit request type. I would compile representative client snippets, including null, boxed values and method references, rather than judging compatibility only from the library's own tests.”

- **Example:** Before: `format(String)`. After adding `format(Integer)`, `format(null)` is ambiguous; `format((String) null)` still selects String, assuming the API accepts null.
- **Guarantee/cost:** Resolution is a compilation rule, not runtime dispatch on argument class; no per-call overload search.
- **Trade-off/failure:** Explicit client casts repair that call but impose migration work. Removing the old descriptor breaks existing binaries too.
- **Follow-ups:** “Object-typed String?” → Selects an Object overload if available. “Override?” → Runtime receiver dispatch occurs after overload selection.
- **Primary reference:** [Java 21 method invocation rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2).

---

**2. A compare-and-set sees the same object reference after it was removed and restored. Why can the operation still be stale?**

**Say aloud:**
“Compare-and-set, or CAS, updates a value only if it still matches an expected value. The ABA problem occurs when a value changes from A to B and back to A. A reference-only comparison sees A again but cannot tell that the intervening history invalidated the caller's assumptions.

For a reusable slot, I would compare the reference together with a generation identifying that slot's state transition. AtomicStampedReference provides an atomic reference-and-integer-stamp pair. I would read the pair together and require every relevant writer to advance the stamp, rather than reading two unrelated snapshots.

The stamp is finite and can wrap, so it is not an unlimited history guarantee. A lock or a fresh immutable state object per transition can be simpler. Garbage collection avoids dangling freed objects, but it does not prevent an application from deliberately restoring the same reference.”

- **Example:** Slot `(jobA,7)` becomes `(jobB,8)` then `(jobA,9)`; a CAS expecting `(jobA,7)` fails.
- **Guarantee/cost:** Reference and stamp compare/update atomically; retries under contention have no fixed attempt bound.
- **Trade-off/failure:** Reusing stamps or updating without advancing them defeats the protocol. Fresh state objects must never be reinstalled as old generations.
- **Follow-ups:** “Read stamp separately?” → Can mix generations; use pair snapshot. “External resource?” → JVM CAS does not establish remote ownership.
- **Primary reference:** [Java 21 AtomicStampedReference](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html).

---

**3. Optional.orElse(createDefaultAccount()) creates accounts even when a match exists. What evaluation rule explains this?**

**Say aloud:**
“Optional represents a present value or absence. It does not change Java's argument evaluation rules. Before orElse runs, Java evaluates createDefaultAccount to produce the fallback argument. The existing value may be returned, but the account creation has already happened and can even throw.

orElseGet accepts a supplier, which is a function used to obtain a value when needed. Placing creation inside that supplier defers it until the Optional is empty. I would still separate lookup from a business command when creation has significant side effects, so the transaction and authorization boundaries are clear.

Lazy evaluation is not global single execution. Two concurrent requests can both observe absence and run their suppliers. Uniqueness and conflict handling belong in the authoritative store. I would test invocation counts and exceptions for both present and empty cases.”

- **Example:** `found.orElseGet(() -> createDefaultAccount())` defers the call; `found.orElseGet(makeSupplier())` still evaluates `makeSupplier()` immediately.
- **Guarantee/cost:** Present Optional skips supplier invocation; empty Optional invokes it for that call. Cost includes the supplier's actual work.
- **Trade-off/failure:** Lazy creation cannot prevent concurrent duplicate commands; use a database invariant and defined conflict response.
- **Follow-ups:** “map returns null?” → Produces empty Optional. “Use for fields everywhere?” → Prefer it where absence is an explicit return contract.
- **Primary reference:** [Java 21 Optional](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html).

---

**4. Two constructor-injected Spring services depend on each other. Should enabling circular references be the design fix?**

**Say aloud:**
“A dependency cycle means A requires B to exist while B requires A. With eager constructor injection, neither object can be fully constructed first. Spring reports an unresolvable cycle rather than providing two complete instances. Allowing some setter-based cycles does not make this constructor dependency valid.

I would first inspect the responsibilities. Often an application coordinator should call two independent services, or shared policy belongs in a third component that neither calls back. That removes the construction cycle and makes the business direction clearer without introducing arbitrary interfaces.

A lazy proxy can defer resolution when delayed access is intentional, but calling it during construction can recreate the problem. It also moves failures to runtime. I would validate startup with the production configuration and exercise the deferred path. Configuration switches should not replace reasoning about initialization and ownership.”

- **Example:** Replace `Pricing → Checkout → Pricing` with `CheckoutCoordinator → Pricing` and `CheckoutCoordinator → OrderWriter`, if those responsibilities fit the actual domain.
- **Guarantee/cost:** Eager constructor cycles cannot produce fully initialized beans. Deferred lookup adds indirection and later failure opportunities.
- **Trade-off/failure:** Events can hide a cycle while creating ordering or durability requirements; choose them only for a real event boundary.
- **Follow-ups:** “Setter cycle?” → Some are resolvable but expose initialization hazards. “Lazy everywhere?” → Masks dependencies and delays diagnostics.
- **Primary reference:** [Spring dependency injection and circular dependencies](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html).

---

**5. A Hibernate import persists 200,000 entities and runs out of heap despite JDBC batching. What boundary is missing?**

**Say aloud:**
“JDBC batching groups compatible SQL statements to reduce database round trips. It does not automatically bound the persistence context, which is Hibernate's collection of managed entity state. A long import can retain every inserted entity and its tracking data even when statements are sent in batches.

I would process bounded groups, flush pending changes and then clear managed state when later work no longer depends on those instances. Flush sends pending SQL; clear detaches objects. Neither commits the transaction. If the import permits partial progress, separate chunk transactions can also bound locks and recovery work, with durable progress and idempotent restart.

I would inspect identifier generation and measured statement counts. Hibernate disables insert batching with identity generation. Sequence allocation and batch size are separate settings. I would test actual SQL and memory under representative data rather than assuming a configuration flag proves batching.”

- **Example:** Within a transaction, after each group of 50 inserts: `flush(); clear();`. Chunk commits require a separate explicit business contract.
- **Guarantee/cost:** Managed-state retention becomes bounded by each group if no other references retain entities; total O(N) inserts remain.
- **Trade-off/failure:** Clearing before flushing loses pending managed changes; detached references cannot be used as if still managed. One huge transaction still has huge rollback/lock costs.
- **Follow-ups:** “Identity IDs?” → No Hibernate insert batching. “Failure in group?” → Roll back its transaction and restart from durable progress.
- **Primary reference:** [Hibernate ORM 6.6 batching](https://docs.hibernate.org/orm/6.6/userguide/html_single/#batch).

---

**6. One malformed Kafka record crashes the consumer on every restart. When is skipping it safe?**

**Say aloud:**
“A poison record is one that deterministically fails processing, so ordinary retries make no progress. I would distinguish invalid data from a temporary dependency failure, record the partition and offset, and apply a bounded policy. Skipping is a business decision because later records may depend on the missing event.

If quarantine is allowed, I would preserve the original bytes and safe diagnostic metadata in durable storage before advancing progress. A dead-letter topic is a separate topic for rejected records, not automatic repair. When publishing quarantine and committing consumed offsets together, Kafka transactions can coordinate those Kafka effects; external stores require their own recovery design.

Deserialization can fail before poll returns records. The system needs a way to capture raw bytes or explicitly recover the failing offset. I would disable uncontrolled auto-commit and alert on quarantines, with a reviewed replay procedure and clear ordering consequences.”

- **Example:** Partition P offset 81 cannot decode; preserve raw payload under `(topic,P,81)`, then commit next offset 82 only under the agreed policy.
- **Guarantee/cost:** Committed offsets identify the next record to read. Quarantine adds storage, operator work and potentially replay duplicates.
- **Trade-off/failure:** Quarantine publication failure must not be treated as success. Advancing a partition beyond unresolved earlier work can lose it.
- **Follow-ups:** “Transient database outage?” → Back off with a deadline rather than classify data as bad. “Sensitive payload?” → Restricted retention/access, no raw logging.
- **Primary reference:** [Kafka 4.0 consumer offset and processing contracts](https://kafka.apache.org/40/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html).

---

**7. A role is revoked, but an authorization cache keeps allowing exports for ten minutes. How would you define revocation correctness?**

**Say aloud:**
“Authorization decides whether a subject may perform an action on a resource. A cached allow is a past decision, not proof that current policy still permits access. I would define the maximum acceptable revocation delay before choosing a cache strategy, especially for irreversible exports.

The cache key must include the trusted tenant, subject, action, resource and relevant policy generation. A policy generation is a version changed when authorization rules or memberships change. That version is useful only if the request obtains sufficiently fresh authoritative state; caching an old generation alongside the decision does not solve revocation.

For sensitive operations I would recheck at the authoritative boundary, and avoid a gap between checking and acting where feasible. Less sensitive reads may accept a documented short staleness window. Expiration and invalidation are operational controls; missed invalidations and policy-store outages need explicit fail-closed behavior.”

- **Example:** Export permission cached for tenant T and user U at generation 12 must not be reused after authoritative revocation advances it to 13.
- **Guarantee/cost:** Fresh checks add latency/dependency load; a TTL is a designed staleness allowance, not instantaneous revocation.
- **Trade-off/failure:** Revocation does not recall data already downloaded. Long-running jobs need a policy for rechecks and cancellation before subsequent effects.
- **Follow-ups:** “Cache deny too?” → Can delay grants; state the contract. “Client supplies tenant?” → Validate membership using trusted identity context.
- **Primary reference:** [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

---

**8. A local token-bucket limiter refills suddenly after a wall-clock jump. Which clock should it use?**

**Say aloud:**
“A token bucket stores capacity that refills over elapsed time and is consumed by admitted requests. A wall clock represents calendar time and can be adjusted. Using its difference for local refill can create extra tokens after a forward correction or stall refill after a backward correction.

For elapsed durations within one JVM, I would use nanoTime differences, with a bounded interval and overflow-safe subtraction. Its origin is arbitrary and cannot be compared with another process or persisted as a calendar timestamp. I would update the refill timestamp, token balance and admission decision together under one lock or equivalent atomic state.

I would cap refill at bucket capacity and define restart behavior. Each replica's limiter enforces its own quota unless a shared authority coordinates the fleet. Monotonic timing fixes local elapsed-time measurement; it does not make a distributed global quota or guarantee clock precision.”

- **Example:** Capacity 20, refill 5 tokens/second, elapsed 2 seconds: add at most 10 tokens, cap at 20, then atomically consume one if available.
- **Guarantee/cost:** Local decision can be O(1) with bounded state; nanoTime is for durations, with differences limited to less than about 292 years.
- **Trade-off/failure:** Lock contention, fractional rounding and restart bursts need tests. Sleep-based tests are fragile; inject elapsed time for deterministic checks.
- **Follow-ups:** “Cross-host timestamps?” → Use a shared quota protocol. “Suspend behavior?” → Verify platform timing behavior; define burst allowance after inactivity.
- **Primary reference:** [Java 21 System.nanoTime](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime()).

---

**9. Payment succeeds, shipment fails, and refund times out. Why is a saga not just a distributed rollback?**

**Say aloud:**
“A saga is a sequence of local transactions with compensating actions for completed steps when the overall workflow fails. A compensation is a new business operation, such as refunding a charge. It does not erase history or restore every observation as if nothing happened.

I would persist the workflow state and command identifiers, distinguish confirmed success from ambiguous timeout, and reconcile with the payment provider before issuing another refund. Compensation itself must tolerate duplicate delivery and failure. The coordinator needs retry limits, durable recovery and a manual-resolution state when automated progress cannot safely continue.

Concurrent business activity may occur between steps. I would compensate only effects owned by this workflow, rather than overwrite a snapshot of an account. The business contract should describe pending, compensated and unresolved outcomes. A customer may already have received a notification even after financial compensation completes.”

- **Example:** `CHARGED → SHIPMENT_FAILED → REFUND_PENDING → REFUNDED`; timeout stays pending until the provider resolves the refund ID's outcome.
- **Guarantee/cost:** No global isolation or instantaneous undo is implied. Recovery requires durable state and additional operations per compensated step.
- **Trade-off/failure:** Some effects are irreversible; reserve resources before committing where business rules allow it. Compensation order is domain-dependent.
- **Follow-ups:** “Refund repeated?” → Provider-supported idempotency and reconciliation. “Coordinator crash?” → Resume from durable state and confirmed outcomes.
- **Primary reference:** [Microsoft compensating transaction pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction).

---

**10. A CPU profiler highlights JSON serialization, but p99 latency barely improves after optimizing it. What might the profile omit?**

**Say aloud:**
“A CPU sample profile estimates where execution time is spent while threads run. Request latency is wall-clock time, including queueing, blocking, database waits and remote calls. A busy method can dominate CPU samples while contributing little to a slow request that mostly waits elsewhere.

I would correlate a representative recording with request traces, executor queues, connection-pool waits and downstream percentiles. JFR, Java Flight Recorder, collects configured runtime events; event settings, thresholds and stack traces determine what evidence is available. Missing an event does not prove a wait never occurred.

I would compare equivalent workloads before and after a change, including throughput, errors and tail latency. Aggregated profiles can mix fast and slow routes, so route and time-window correlation matters. Optimization should target the measured critical path and resource saturation, not simply the widest bar in a CPU flame graph.”

- **Example:** Serialization takes 3 ms of CPU while a p99 request waits 400 ms for a connection; halving serialization cannot remove that wait.
- **Guarantee/cost:** Sampling is statistical; event recording adds configurable overhead. Quantify overhead in the actual workload.
- **Trade-off/failure:** Short recordings, high event thresholds and mixed traffic can hide rare tails. Trace payloads and recordings can contain sensitive metadata.
- **Follow-ups:** “Low CPU, slow API?” → Inspect waiting and queueing. “Average improves?” → Inspect percentile distributions and error/timeout selection too.
- **Primary reference:** [Java 21 JFR API and event model](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.jfr/jdk/jfr/package-summary.html).

---

**11. Implement a set of lowercase words supporting prefix counts. How does a trie avoid scanning every word?**

**Say aloud:**
“A trie stores paths by character rather than storing each word as an unrelated key. Each node represents a prefix. For a prefix count, I walk its characters and return the number of distinct complete words below the resulting node. A missing path means zero matches.

I would define a narrow alphabet contract first: this example accepts only lowercase ASCII letters and treats the empty string as a valid word and prefix. Each node stores a subtree word count and a terminal marker. Adding an existing word changes nothing; only a new terminal increments counts along its path, including the root.

I would validate the entire input before mutating the structure so ordinary invalid-input errors do not leave partial counts. This example is single-threaded and additions-only. Deletion, Unicode normalization and concurrent access need explicit extensions. A trie is useful for many prefix queries, but its node overhead can exceed a sorted word collection.”

```java
static final class PrefixWords {
    static final class Node {
        final Node[] children = new Node[26];
        boolean terminal;
        int words;
    }
    private final Node root = new Node();
    private static void validate(String text) {
        Objects.requireNonNull(text);
        for (int i = 0; i < text.length(); i++)
            if (text.charAt(i) < 'a' || text.charAt(i) > 'z')
                throw new IllegalArgumentException("lowercase ASCII required");
    }
    boolean add(String word) {
        validate(word);
        Node node = root;
        List<Node> path = new ArrayList<>(); path.add(root);
        for (int i = 0; i < word.length(); i++) {
            int c = word.charAt(i) - 'a';
            if (node.children[c] == null) node.children[c] = new Node();
            node = node.children[c]; path.add(node);
        }
        if (node.terminal) return false;
        node.terminal = true;
        for (Node item : path) item.words++;
        return true;
    }
    int countPrefix(String prefix) {
        validate(prefix);
        Node node = root;
        for (int i = 0; i < prefix.length(); i++) {
            node = node.children[prefix.charAt(i) - 'a'];
            if (node == null) return 0;
        }
        return node.words;
    }
}
```

- **Example:** Add `car`, `cart`, `cat`, `car`: prefix `ca` returns 3, `car` returns 2, empty prefix returns 3. Add empty word: empty prefix returns 4.
- **Guarantee/cost:** Word length L: O(L+1) insertion time/temporary path space; prefix length P: O(P+1) query time/O(1) auxiliary space. Persistent space O(C+1) for C total inserted characters, with 26 child slots per node.
- **Trade-off/failure:** Cap word length and distinct-word count well below integer/memory limits. No concurrency or recovery from allocation failure promised; input rejection leaves counts unchanged.
- **Follow-ups:** “Remove word?” → Decrement only if terminal exists; prune empty subtrees carefully. “Unicode?” → Define normalization and code-point edges rather than reuse ASCII indexing.

---

**12. Compute the minimum single-character edits between two strings. Why must substitution use the previous row's diagonal?**

**Say aloud:**
“Levenshtein distance is the minimum number of insertions, deletions and substitutions needed to transform one sequence into another, each costing one. I define distance[i][j] for the first i source characters and first j target characters. The empty-prefix boundaries require deleting i or inserting j characters.

For matching characters I take the previous diagonal unchanged. Otherwise I choose one plus the minimum of deletion from the previous row, insertion from the current row's left cell, and substitution from the previous diagonal. Each candidate represents a valid last operation, and every optimal edit sequence has one of those endings.

Only two rows are needed for the distance value. I explicitly define characters here as UTF-16 code units, not user-perceived symbols, and bound input sizes. Returning the edit script requires more history or a reconstruction algorithm. Transposition is not one of the permitted edits.”

```java
static int editDistance(String source, String target) {
    Objects.requireNonNull(source); Objects.requireNonNull(target);
    int n = source.length(), m = target.length();
    int[] previous = new int[m + 1], current = new int[m + 1];
    for (int j = 0; j <= m; j++) previous[j] = j;
    for (int i = 1; i <= n; i++) {
        current[0] = i;
        for (int j = 1; j <= m; j++) {
            if (source.charAt(i - 1) == target.charAt(j - 1))
                current[j] = previous[j - 1];
            else current[j] = 1 + Math.min(previous[j - 1],
                    Math.min(previous[j], current[j - 1]));
        }
        int[] swap = previous; previous = current; current = swap;
    }
    return previous[m];
}
```

- **Example:** `kitten → sitting` costs 3; `ab → ba` costs 2; empty → `abc` costs 3. `😀` → empty costs 2 under this code-unit contract.
- **Guarantee/cost:** Lengths N/M: O(N·M+N+M+1) time including empty boundaries, O(M+1) auxiliary space. Strings are immutable; no input mutation.
- **Trade-off/failure:** Bound lengths and their product before exposure to untrusted input; this method assumes feasible array sizes and counts. Code-point or grapheme distance requires different tokenization.
- **Follow-ups:** “Only distance ≤k needed?” → Consider a proven banded algorithm. “Swap edit?” → Requires a different recurrence/metric. “Smaller memory?” → Put the shorter input on the column axis for this symmetric cost model.

---

**Topic coverage:** S07-Q01 overload/API compatibility; Q02 ABA and generations; Q03 lazy fallback; Q04 Spring dependency cycles; Q05 Hibernate batching and transaction boundaries; Q06 Kafka poison-record recovery; Q07 authorization revocation; Q08 limiter timing; Q09 saga compensation; Q10 CPU versus latency evidence; Q11 trie prefix counts; Q12 string edit distance.

**Next set builds on:** executor task failure observation, database uniqueness with nullable values, Spring cache proxy boundaries, Kafka producer delivery deadlines, session fixation, bounded fan-out aggregation, and strongly connected components or sequence reconstruction. Continue with Set 8, including for another run on 13 October, without rephrasing these scenarios.
