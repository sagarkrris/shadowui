**Set 12 · 21 October 2026 — Crossing time and data boundaries**

Reference assumptions: **Java 21 without preview features**, Spring Data JPA 3.5 with imperative Spring Framework 6.2 transactions, PostgreSQL 17, Debezium PostgreSQL connector 3.3 and Kafka 4.0. These are reference versions, not latest-release claims. Security guidance was checked against OWASP on 21 October 2026. Time-zone examples use the installed JDK's rules for Europe/Berlin in 2026; deployment rules can change with time-zone database updates.

Stable IDs: **S12-Q01–S12-Q12**, in order. Each spoken answer targets 45–90 seconds. All scenarios are original illustrations, not personal experience. The two Java blocks are complete class members requiring `java.util.*` imports; the behavioral fixture compiles their published text with `--release 21` and compares results with independent exhaustive oracles. SQL and infrastructure flows are contextual designs, not runnable service applications or measured benchmarks.

---

**1. A booking accepts 02:30 in Berlin on a clock-change date. Why is LocalDateTime plus ZoneId not always one instant?**

**Say aloud:**
“LocalDateTime describes wall-clock fields without an offset. A zone supplies rules translating those fields into an instant, a point on the global timeline. When clocks move forward, some local times never occur: that is a gap. When they move backward, some occur twice: that is an overlap. Silently accepting a library default can book the wrong occurrence.

At the input boundary I inspect the zone's valid offsets. For an ordinary time there is one; for a gap I reject or apply an explicitly disclosed rescheduling policy. For an overlap I ask for the intended offset and validate it against the zone. I store the resolved instant together with the original zone and scheduling intent when needed.

A recurring local appointment is different from repeating every 24 elapsed hours. I resolve each recurrence under a documented clock-change policy and test both transitions. Future legal rule changes require an explicit policy for already scheduled appointments.”

- **Example:** Under the reference rules, Berlin 29 March 2026 02:30 has no valid offset; 25 October 2026 02:30 has +02:00 and +01:00, producing instants an hour apart.
- **Guarantee/cost:** `getValidOffsets` exposes ambiguity; `ZonedDateTime.ofStrict` rejects an offset invalid for the local time and zone. Zone-rule lookup is not a network request.
- **Trade-off/failure:** An offset alone identifies an occurrence but cannot express a city's future recurrence rules. Keeping only an instant loses original local scheduling intent.
- **Verify:** Test normal, gap and overlap inputs, invalid offset selection, instant round trips and recurrence across transitions on the deployment JDK.
- **Follow-ups:** “Use UTC everywhere?” → Use instants for elapsed ordering, but retain local intent for schedules. “Add one day or 24 hours?” → Calendar recurrence and elapsed duration can differ across a transition.
- **Primary references:** [Java 21 ZoneRules](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/zone/ZoneRules.html), [ZonedDateTime](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZonedDateTime.html).

---

**2. A helper returns Files.lines from inside try-with-resources. Why does its caller fail before reading the file?**

**Say aloud:**
“A Java stream is a pipeline whose traversal is generally delayed until a terminal operation. Files.lines also owns an open file resource. Returning that stream from inside try-with-resources closes it before the caller traverses it, so the apparent convenience separates use from the resource lifetime.

I keep opening, traversal and closing within one explicit ownership boundary. For a small bounded result, the helper can materialize a list before closing. For a large file, I prefer processing inside the owning method or an API that clearly transfers close responsibility to the caller. A terminal operation such as findFirst does not replace close, even when it stops early.

I also distinguish failure to open from failure during lazy traversal. The latter can surface as UncheckedIOException. I enforce input and output size limits: streaming avoids loading all lines at once but does not bound a single enormous line or an accumulating collector.”

- **Example:** Contextual flow: open `Files.lines(path, UTF_8)` in try-with-resources, select the first matching line inside that block, then return the detached String/Optional result. Do not return the still-lazy pipeline from the block.
- **Guarantee/cost:** A bounded scan visits up to n lines; storage includes the longest decoded line and retained result. Sorting or collecting all rows changes that memory bound.
- **Trade-off/failure:** Transferring a Stream is possible but makes caller closure part of the API contract. Closing an unrelated borrowed stream would violate ownership in the other direction.
- **Verify:** Exercise no match, early match, traversal failure and downstream processing failure; attach a close handler to assert cleanup on all exits. Do not use file deletion on Unix as proof of closure.
- **Follow-ups:** “Does count close it?” → Terminal consumption and resource closure are separate. “Reusable?” → A consumed stream cannot be traversed again; reopen through the owning API.
- **Primary references:** [Files.lines](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html#lines(java.nio.file.Path,java.nio.charset.Charset)), [BaseStream.close](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/BaseStream.html#close()).

---

**3. An AtomicReference.updateAndGet lambda sends a receipt. Why can one accepted update send several receipts?**

**Say aloud:**
“An atomic update protects the reference transition, not every action executed while calculating it. The update function may be called again after a conflicting update. Sending a receipt inside it makes speculative computation externally visible, so a losing attempt can still send a receipt.

I make the function pure: it derives a new immutable state from the supplied old state and performs no external action or mutation of the old state. A successful compare-and-set, meaning replace only if the observed reference is still current, identifies the local state transition. Sending afterward avoids receipts from failed attempts but still leaves a crash window between updating memory and sending.

For a durable business receipt I put the business update and a pending notification in the same database transaction, then use a retryable dispatcher and stable notification identity. The in-memory atomic API cannot create an exactly-once relationship with an email service.”

- **Example:** Two writers read count 8. One installs 9; the other retries with 9 and installs 10. A receipt emitted during each calculation can outnumber successful transitions.
- **Guarantee/cost:** One successful atomic reference update; computation can repeat under contention, so there is no fixed per-call retry bound. All state behind the reference must follow the immutable-state contract.
- **Trade-off/failure:** A local lock can serialize computation but does not make remote effects crash-atomic. Returning the new count does not establish durable notification delivery.
- **Verify:** Use latches to hold one updater in its first calculation, let another writer change the reference, then release it. Assert function re-evaluation is allowed and the final state includes both updates; avoid sleep-based ordering.
- **Follow-ups:** “Generate IDs in the lambda?” → Re-evaluation can waste or change IDs; choose stable operation identity outside speculative work. “Mutate then return the same object?” → Readers may observe unprotected mutation; replace immutable values instead.
- **Primary reference:** [AtomicReference update function contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html#updateAndGet(java.util.function.UnaryOperator)).

---

**4. A transactional service returns a JPA Stream for an HTTP export. Why can the export fail or exhaust the connection pool?**

**Say aloud:**
“A repository stream can hold a database cursor (a handle for incremental result retrieval), connection and persistence context, which tracks managed entities. Returning it does not transfer the service transaction to a later HTTP callback. With imperative transactions, that transaction usually ends when the proxied service method returns. Later traversal can then fail because its resources are already unavailable.

I place consumption and closure inside the transaction-owning service. For a large slow export, I usually generate a bounded durable artifact in a background job rather than holding a database connection while a client downloads. Another option is bounded pages with a clear consistency contract; pages do not automatically form one snapshot.

Streaming is not proof of bounded memory either. Driver buffering, fetch configuration and retained managed entities matter. I verify the actual SQL, connection lifetime and memory profile for the chosen provider and driver, and define what happens when the consumer cancels.”

- **Example:** At an illustrative arrival rate of 2 exports/second and 30 seconds holding a connection each, about 60 connections are occupied on average under steady load, before ordinary requests. These figures are assumptions, not measurements.
- **Guarantee/cost:** Stream resources must be closed; fetch size is a driver/provider setting to validate, not a portable promise that only that many rows occupy memory.
- **Trade-off/failure:** A long consistent snapshot may retain database history and pool resources. Background files need authorization, expiration, cleanup and a completion state before download.
- **Verify:** In an integration fixture, observe borrowed connections after success, cancellation and mapping failure; inspect heap and SQL for a large result. Check first-byte and total transaction time separately.
- **Follow-ups:** “Return DTOs instead?” → They avoid entity lazy access, but materializing millions still costs memory. “readOnly=true?” → It expresses transaction intent; it does not detach streaming resource lifetime from the transaction.
- **Primary references:** [Spring Data JPA 3.5 streaming results](https://docs.spring.io/spring-data/jpa/reference/3.5/repositories/query-methods-details.html#repositories.query-streaming), [Spring transaction context](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/transaction/annotation/Transactional.html).

---

**5. A schema backfill reads an old value, then overwrites a newer dual-written value. How do you keep the migration restartable?**

**Say aloud:**
“A backfill converts existing rows while live traffic continues. Deploying writers that update both representations is necessary but does not make a stale backfill safe. If the worker reads revision 4, traffic commits revision 5, and the worker unconditionally stores its revision-4 conversion, the new representation goes backward.

I use a conditional update tied to the source revision and the migration state. For example, write the converted value only when the row still has the observed revision and still needs this migration. If no row changes, reread and recompute or establish that the live writer already completed it. Every writer, including old replicas and administrative jobs, must honor the transition contract before the backfill can be authoritative.

I process small committed batches with durable progress, repeatable conversion and reconciliation. A high-water cursor is progress information, not proof that skipped or concurrently inserted rows were migrated. Cutover needs an explicit invariant check and a rollback-compatible period.”

- **Example:** Contextual PostgreSQL predicate: `WHERE id = :id AND revision = :observed AND migration_version < :target`; update the converted value and migration marker atomically. Define null-marker semantics explicitly rather than letting SQL null comparisons silently skip rows.
- **Guarantee/cost:** Conditional row updates prevent this stale overwrite when all writers participate. Batch runtime includes indexed reads/writes, lock waits and conversion work, not merely O(n) Java iteration.
- **Trade-off/failure:** Busy rows may repeatedly conflict; use bounded retries plus reconciliation. A conversion-version marker alone does not protect against a concurrent source change unless the revision protocol also covers it.
- **Verify:** Force a live update between read and write, crash before and after batch commit, insert rows behind the cursor, and test missing markers, already-migrated rows and conversion errors.
- **Follow-ups:** “Store only a cursor?” → Also track/revisit conflicts and reconcile the predicate. “Old writers remain?” → Delay cutover or add a compatible capture mechanism; otherwise they can invalidate the new representation.
- **Primary reference:** [PostgreSQL 17 Read Committed update rechecks](https://www.postgresql.org/docs/17/transaction-iso.html#XACT-READ-COMMITTED).

---

**6. A search rebuild scans database rows and only afterward starts CDC. Which writes can disappear at the handoff?**

**Say aloud:**
“Change data capture, or CDC, reads committed changes from the database log. A snapshot is an initial view of existing rows. If I scan first and start log capture afterward, a row changed after its scan but before capture begins can be missing or stale forever in the target.

I use a connector's coordinated snapshot-and-log protocol rather than joining two unrelated exports. For the reference Debezium PostgreSQL initial snapshot, the connector records a log position as part of its snapshot workflow and streams from that position afterward. This closes the missing-change window under the supported configuration, while replay still requires safe target application.

The target applies the connector's per-key change order and deletes, and restart checkpoints must correspond to durable target effects. I build into a separate index generation, catch up to a chosen source boundary and validate before switching reads. A completed row scan alone does not mean the target is current.”

- **Example:** Row R is scanned at value 10, then updated to 11 and deleted during the rebuild. Coordinated capture must leave R deleted, including if target delivery restarts. Preserve source metadata rather than comparing unrelated wall clocks.
- **Guarantee/cost:** Snapshot work scales with selected source data; retained log and target backlog must cover the catch-up interval. Connector continuity does not guarantee exactly-once external indexing.
- **Trade-off/failure:** Lost replication slots, unavailable log history, incompatible DDL or incorrect table selection can require controlled rebootstrap. Incremental snapshots use a different coordinated protocol; do not replace it with arbitrary chunk scans.
- **Verify:** Update/insert/delete during scans, restart at the handoff, replay duplicate events and compare source/target at the same defined boundary. Monitor slot-retained bytes as well as target lag.
- **Follow-ups:** “Use updated_at as the cursor?” → Equal timestamps, deletes and clock assumptions can lose transitions. “Cut over at zero lag?” → Define the measured source boundary and validation criteria; a lag dashboard alone is insufficient.
- **Primary reference:** [Debezium PostgreSQL 3.3 snapshots and streaming](https://debezium.io/documentation/reference/3.3/connectors/postgresql.html#postgresql-snapshots).

---

**7. A cookie-authenticated transfer endpoint denies cross-origin reads with CORS. Can another site still trigger a transfer?**

**Say aloud:**
“Cross-origin resource sharing, or CORS, controls whether browser scripts can read certain cross-origin responses. Cross-site request forgery, or CSRF, exploits a browser automatically attaching credentials to an unwanted request. Preventing response access does not necessarily prevent the request or its side effect; a simple HTML form is enough for many vulnerable endpoints.

For cookie-authenticated state changes I use the framework's CSRF protection, with an unpredictable token validated against the authenticated session or an appropriately signed binding. I also use suitable SameSite cookie policy and validate request origin where supported. None of those replaces object-level authorization or deliberate HTTP method design: GET must not perform transfers.

I verify the actual accepted content types, methods and browser behavior. If a JSON-only endpoint depends on custom headers and preflight restrictions, those assumptions need explicit enforcement. I would not globally disable CSRF merely because an application also has bearer-token APIs.”

- **Example:** A hostile form submits an accepted transfer form body. The attacker need not read the success response to cause damage. Cross-site cookie delivery depends on SameSite policy and the request context.
- **Guarantee/cost:** Token validation is per state-changing request; server-side token storage scales with session design. CORS is not caller authentication and does not constrain arbitrary non-browser clients.
- **Trade-off/failure:** SameSite is defense in depth, with same-site sibling-domain and usability considerations. Cross-site scripting can defeat many CSRF defenses because injected code runs in the trusted origin.
- **Verify:** Test a real cross-origin form, missing/wrong token, allowed-origin JSON, login/logout flows and cookie policies; confirm failures occur before mutation. A command-line request does not reproduce browser enforcement.
- **Follow-ups:** “Authorization header only?” → A genuinely non-ambient credential changes the threat model; verify no cookie fallback. “Double-submit cookie?” → Prefer a signed, session-bound design over a naive matching pair vulnerable to cookie injection.
- **Primary reference:** [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

---

**8. A Flow subscriber requests one item at a time but its application queue keeps growing. Where did backpressure stop?**

**Say aloud:**
“Backpressure means the consumer communicates how much work it can accept. Java Flow demand counts onNext items, not completed downstream effects, bytes or database permits. If onNext queues work and immediately requests another item, delivery remains demand-compliant while the separate work queue grows without bound.

I replenish demand when processing releases capacity, with a bounded number of outstanding items and bounded queues at every asynchronous boundary. For a sequential worker I request the next item only after completing the current item. For parallel processing I admit an initial window and replenish slots on completion, coordinating requests and cancellation through a well-defined owner.

I also limit individual item size and remote-resource concurrency. Cancellation eventually stops delivery but does not promise reversal of an already started effect. The error policy must say whether failed work is retried, rejected or durably retained before more demand is requested.”

- **Example:** A subscriber queues 500 payloads/second while its writer completes 100/second. Calling request(1) after enqueue permits an illustrative backlog increase of 400/second; the tiny request size is not a capacity limit.
- **Guarantee/cost:** Positive requests add demand; nonpositive demand produces an error. An owned W-item window bounds admitted item count, but variable-size items still require a byte budget.
- **Trade-off/failure:** Blocking onNext can stall the delivery executor; immediate asynchronous handoff can hide an unbounded queue. Do not hold locks across request calls when synchronous callbacks could reenter the subscriber.
- **Verify:** Use a controlled publisher/worker, withhold completions and assert the admission ceiling. Test cancellation with in-flight work, synchronous delivery, errors and terminal signals without demand.
- **Follow-ups:** “request(Long.MAX_VALUE)?” → Effectively unbounded demand, not a memory strategy. “Does cancel undo writes?” → No; operation ownership and reconciliation remain separate.
- **Primary references:** [Java 21 Flow.Subscription](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Flow.Subscription.html), [Flow protocol](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Flow.html).

---

**9. A Kafka consumer commits offsets correctly but loses unread data after a long outage. Why did the group not retain it?**

**Say aloud:**
“A committed offset is a consumer group's checkpoint, not a pin on log data. On a deletion-policy topic, retention removes eligible log segments according to time or size policy regardless of whether every consumer has read them. A group can therefore return with its checkpoint older than the earliest available offset.

I treat this as a recovery-policy decision, not a harmless offset reset. Starting at earliest processes only what remains; starting at latest also skips the retained backlog. Neither recreates deleted business events. For critical processing I surface an out-of-range checkpoint, stop automatic silent recovery, and restore from a verified archive or rebuild from an authoritative source under an explicit reconciliation plan.

Retention must cover the outage plus catch-up interval with headroom and enough storage. I monitor oldest retained position and checkpoint distance, production and consumption rates, and retention overrides. Compaction and tiered storage require their own recovery assumptions.”

- **Example:** A group needs offset 100 but the partition now begins at 500. Missing offsets are not recovered by committing 500. Kafka offsets can also have gaps, so offset distance is not an exact business-record count.
- **Guarantee/cost:** In Kafka 4.0, `auto.offset.reset=none` surfaces missing/out-of-range checkpoints instead of choosing earliest/latest. Catch-up is possible only if sustainable consumption exceeds continuing production and needed data remains available.
- **Trade-off/failure:** Longer time retention does not override a smaller effective size limit. Segment deletion is not an exact per-record timer; capacity estimates must include segment and replica overhead.
- **Verify:** In an isolated broker fixture, stop consumption, expire segments, restart from the old checkpoint and assert the configured failure/recovery path. Test archive restoration and duplicate-safe replay separately.
- **Follow-ups:** “Increase retention after loss?” → It preserves future eligible data, not deleted history. “Lag zero means complete?” → Resetting to latest can make lag zero while losing required work.
- **Primary references:** [Kafka 4.0 topic retention settings](https://kafka.apache.org/40/generated/topic_config.html), [consumer offset reset policy](https://kafka.apache.org/40/generated/consumer_config.html#consumerconfigs_auto.offset.reset).

---

**10. A NOT IN subquery removes every candidate after one unrelated null is added. How should the anti-join be expressed?**

**Say aloud:**
“SQL has three truth values: true, false and unknown. Comparing a value with null normally gives unknown. NOT IN must establish that a value differs from every returned value; if no equal value exists but one comparison is unknown, the result is unknown, and WHERE does not keep that row.

For ‘customers with no matching suppression row’ I use a correlated NOT EXISTS with the full tenant and customer key. It asks whether a matching row exists, so an unrelated null does not poison every candidate. I still define how a null outer identifier should behave. Ordinary equality does not match null to null; if the business requires that, I need null-safe equality or, preferably for required identifiers, a non-null schema constraint.

This fixes selection semantics, not concurrency. A later insert into the suppression table can change eligibility after the query. A consequential action needs its own transaction and authorization or eligibility invariant at the action boundary.”

- **Example:** Contextual query: `WHERE NOT EXISTS (SELECT 1 FROM suppression s WHERE s.tenant_id = c.tenant_id AND s.customer_id = c.id)`. Assume both candidate identity columns are non-null; scope both sides to the trusted tenant.
- **Guarantee/cost:** An empty NOT IN subquery behaves differently from one containing null. Query complexity depends on indexes, statistics and the chosen join plan; NOT EXISTS does not promise an index probe per row.
- **Trade-off/failure:** Filtering inner nulls can repair a particular NOT IN contract but leaves outer-null semantics to decide. Never replace a business eligibility predicate with a query-shape preference alone.
- **Verify:** Test empty inner rows, null-only, exact match, nonmatch plus null, duplicate suppressions, outer null policy and same ID in another tenant; inspect a production-shaped execution plan.
- **Follow-ups:** “Use LEFT JOIN?” → Valid with complete join keys and a reliably non-null matched-row marker. “Null should equal null?” → PostgreSQL `IS NOT DISTINCT FROM` expresses that deliberately; confirm it is the desired domain rule.
- **Primary reference:** [PostgreSQL 17 EXISTS and NOT IN semantics](https://www.postgresql.org/docs/17/functions-subquery.html).

---

**11. Select each deployment improvement at most once within a capacity budget. Why must a one-row knapsack update run backward?**

**Say aloud:**
“This is zero-or-one knapsack: each item has a positive integer cost and nonnegative value, and we maximize total value without exceeding capacity. A greedy value-to-cost ratio is not generally optimal because items are indivisible.

I define dp[c] as the best value within budget c using only the items already processed. For each new item I compare skipping it with its value plus the best earlier-item solution at c minus its cost. Updating capacities downward keeps that source entry from the previous item layer. Going upward can read a value already improved with this same item and accidentally allow repeated selection.

The single row uses memory proportional to capacity and returns only the best value. Reconstructing selected items needs additional history or a different technique. Runtime depends on numeric capacity, so this is pseudo-polynomial: huge budgets are expensive even when written with few digits. I validate the contract and enforce a work budget before allocating.”

```java
static long bestImprovements(int[] costs, int[] values, int capacity) {
    Objects.requireNonNull(costs);
    Objects.requireNonNull(values);
    if (costs.length != values.length || capacity < 0 || capacity > 100_000
            || (long) costs.length * (capacity + 1) > 10_000_000L)
        throw new IllegalArgumentException("invalid input or work budget");
    for (int i = 0; i < costs.length; i++) {
        if (costs[i] <= 0 || values[i] < 0)
            throw new IllegalArgumentException("positive cost, nonnegative value required");
    }
    long[] dp = new long[capacity + 1];
    for (int i = 0; i < costs.length; i++) {
        for (int c = capacity; c >= costs[i]; c--) {
            dp[c] = Math.max(dp[c], dp[c - costs[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

- **Example:** Costs [2,3,4], values [4,5,7], capacity 5 → 9 from the first two. One item costing 2 with value 4 and capacity 4 must return 4, not 8.
- **Guarantee/cost:** O(n(C+1)) worst-case time, O(C+1) auxiliary space, no input mutation. Empty/zero-capacity inputs yield 0 after validation. With at most ten million items under this work bound and int nonnegative values, the sum fits long.
- **Trade-off/failure:** The explicit 100,000-capacity and ten-million-work limits are teaching API policy, not universal limits. Zero costs and negative values are rejected even if an item could never be selected. Exact-fill knapsack needs a separate unreachable-state representation.
- **Verify:** Compare against every subset of small inputs, reverse item order, include duplicate items, over-budget items, zero values and long totals. Assert one item is never reused and invalid tail entries still fail at zero capacity.
- **Follow-ups:** “Unlimited copies?” → That changes the recurrence/update direction. “Recover chosen indices?” → Keep trustworthy per-layer decisions or recompute; one mutable parent pointer per capacity can describe overwritten history.
- **Primary reference:** [MIT dynamic programming lecture: knapsack](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-21-dp-iii-parenthesization-edit-distance-knapsack/). The recurrence and code above are original teaching material.

---

**12. Assign workers to compatible tasks, one of each per assignment. Why can a maximal greedy assignment miss the maximum?**

**Say aloud:**
“This is bipartite matching: vertices form worker and task groups, and an edge means a compatible assignment. A matching uses no worker or task twice. Maximal means no single extra edge can be added immediately; maximum means the largest possible number of assignments. Those are different guarantees.

For each unmatched worker I search for an augmenting path. That path alternates between unused compatibility edges and current assignments, ending at a free task. Flipping those edges increases the matching by one and can relocate earlier workers instead of getting stuck with a greedy choice.

The implementation uses breadth-first search and explicit parent links, avoiding recursive stack depth. After each new worker, the existing matching is maximum for the processed workers; a successful augment increases it, and if none exists it cannot increase. This maximizes count only. Preferences, fairness and assignment costs require another objective and algorithm.”

```java
static int[] assignTasks(int taskCount, int[][] compatible) {
    Objects.requireNonNull(compatible);
    if (taskCount < 0) throw new IllegalArgumentException("negative task count");
    for (int[] tasks : compatible) {
        Objects.requireNonNull(tasks);
        for (int task : tasks) {
            if (task < 0 || task >= taskCount)
                throw new IllegalArgumentException("task outside range");
        }
    }
    int[] workerTask = new int[compatible.length];
    int[] taskWorker = new int[taskCount];
    Arrays.fill(workerTask, -1);
    Arrays.fill(taskWorker, -1);
    for (int root = 0; root < compatible.length; root++) {
        int[] parentWorker = new int[taskCount];
        Arrays.fill(parentWorker, -1);
        boolean[] seenWorker = new boolean[compatible.length];
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        seenWorker[root] = true;
        queue.add(root);
        int freeTask = -1;
        while (!queue.isEmpty() && freeTask == -1) {
            int worker = queue.remove();
            for (int task : compatible[worker]) {
                if (parentWorker[task] != -1) continue;
                parentWorker[task] = worker;
                int owner = taskWorker[task];
                if (owner == -1) { freeTask = task; break; }
                if (!seenWorker[owner]) {
                    seenWorker[owner] = true;
                    queue.add(owner);
                }
            }
        }
        while (freeTask != -1) {
            int worker = parentWorker[freeTask];
            int previousTask = workerTask[worker];
            workerTask[worker] = freeTask;
            taskWorker[freeTask] = worker;
            freeTask = previousTask;
        }
    }
    return workerTask;
}
```

- **Example:** Worker 0 accepts tasks [0,1]; worker 1 accepts [0]. Greedy 0→0 strands worker 1. An augmenting path moves worker 0 to 1 and assigns worker 1 to 0, achieving two.
- **Guarantee/cost:** Returns one task per worker or -1, with unique assigned tasks. O((L+1)(E+L+R)) time and O(L+R) peak auxiliary space for L workers, R tasks and E listed edges including duplicates. Validation, empty-group initialization and per-search initialization are included. Inputs are not mutated; equal optimal matchings need not be identical.
- **Trade-off/failure:** Duplicate edges add work but not capacity. Dense graphs can require a faster layered matching algorithm; weighted assignment is a different problem. Caller-side graph-size admission is needed before allocating arrays.
- **Verify:** Enumerate every small compatibility graph and compare cardinality with exhaustive legal assignments. Validate returned edges, uniqueness and input preservation; cover empty groups, isolated workers, duplicates, invalid IDs and a long reassignment chain.
- **Follow-ups:** “All workers assigned?” → Only if maximum cardinality equals the worker count. “Minimum total assignment cost?” → Use a cost-aware assignment or min-cost-flow formulation; arbitrary edge order does not optimize cost.
- **Primary reference:** [Princeton authored bipartite matching implementation and augmenting paths](https://github.com/kevin-wayne/algs4/blob/master/src/main/java/edu/princeton/cs/algs4/BipartiteMatching.java). This iterative teaching implementation is original.

---

**Topic coverage:** local time versus instants; lazy file resources; speculative atomic updates; JPA streaming and connection ownership; conditional concurrent backfills; CDC snapshot continuity; browser CSRF boundaries; demand versus completed work; Kafka retention recovery; SQL null-aware exclusion; one-row zero-or-one dynamic programming; maximum bipartite matching. These are distinct scenarios from Sets 1–11, including the earlier calendar formatter, schema rename, Kafka compaction and two-group coloring questions.

**Next set builds on:** deterministic migration reconciliation, source-position checkpoints, transactional resource budgets and cost-aware flow modeling. Practise the distinction between a local guarantee and the end-to-end outcome before extending these designs. Continue with Set 13 even if another run occurs on this date.
