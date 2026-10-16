**Set 11 · 16 October 2026 — Validating outcomes and reconstructing decisions**

Reference assumptions: **Java 21 without preview features**, Spring Framework 6.2 with imperative transactions (Boot 3.5 generation), Jakarta Persistence 3.2 locking contracts, PostgreSQL 17 and Kafka Streams 4.0. These are explicit reference versions, not latest-release claims. Check the actual provider/API combination in a Boot application before using Persistence 3.2. HTTP caching follows RFC 9111; recovery guidance was checked against OWASP on 16 October 2026.

Stable IDs: **S11-Q01–S11-Q12**, in order. Spoken answers target 45–90 seconds, including a brief example. All scenarios are original illustrations, not personal experience. The two Java blocks are complete class members with `java.util.*` imports; their published code is compiled with `--release 21` and exercised against independent oracles. Other flows are contextual designs, not deployed framework or database applications.

---

**1. Two required futures fail and a third is still running. Does CompletableFuture.allOf return every failure immediately?**

**Say aloud:**
“A future represents an eventual outcome. allOf is a completion barrier: it completes after all supplied futures complete. It returns no collected values and, if inputs fail, its exceptional result is not a report containing every failure. It also does not cancel siblings automatically.

For a bounded batch where every outcome matters, I attach handle to each input and convert completion into an explicit success or failure value carrying the input identity. Then I wait for those handled stages and assemble the report. A successful null value must remain distinguishable from failure. If reporting itself throws, that is a separate failure rather than missing data.

A request deadline still needs a policy for unfinished work. I can return a partial report with pending items explicitly marked, while operation owners enforce transport cancellation. I would not interpret the barrier's failure as proof that the other operations stopped.”

- **Example:** A fails validation, B fails transport, C succeeds with null. Three handled results retain all three identities and distinguish null success from failure.
- **Guarantee/cost:** O(n) reporting work/storage for n admitted inputs; this does not bound remote concurrency. allOf with zero inputs is already complete.
- **Trade-off/failure:** Waiting for all outcomes can outlive one failure; early termination needs a separate contract. Preserve sanitized error categories rather than returning raw exception messages.
- **Verify:** Complete inputs manually in different orders, including two failures, cancellation, null success and an unfinished sibling. Assert the barrier remains pending until the last completion.
- **Follow-ups:** “Does handle recover?” → Its returned value normally completes the dependent stage successfully, so use an explicit outcome type. “All exceptions suppressed?” → Not an allOf guarantee; gather per-input outcomes.
- **Primary reference:** [Java 21 CompletableFuture](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**2. HashSet keeps both 2.0 and 2.00, but TreeSet keeps one. Which BigDecimal contract explains the discrepancy?**

**Say aloud:**
“BigDecimal stores an integer value together with a decimal scale. Its equals method compares value and scale, while compareTo compares numerical value. Therefore 2.0 and 2.00 compare as numerically equal but are not equal objects. HashSet uses equals and hashCode; a naturally ordered TreeSet uses comparison to determine membership.

The fix starts with the domain's identity rule. If scale records meaningful precision, preserve it and choose collection semantics accordingly. If identity means numerical amount, normalize at a controlled boundary or use a wrapper whose equality, hashing and ordering agree. stripTrailingZeros can produce negative scales, so it is not a promise of a fixed display format.

For a fixed-scale contract I can validate with setScale and UNNECESSARY, rejecting values that need rounding. I would keep currency in the identity too, and test equivalent textual forms across lookup, persistence and serialization.”

- **Example:** `new BigDecimal("2.0").compareTo(new BigDecimal("2.00")) == 0`, while equals is false; this is about identity, not the earlier set's rounding-allocation problem.
- **Guarantee/cost:** BigDecimal arithmetic/comparison costs depend on precision and scale; do not label arbitrary-precision operations constant time.
- **Trade-off/failure:** Silent rounding can merge different amounts. Changing key normalization needs migration for existing stored/cache keys.
- **Verify:** Test trailing zeroes, zero, negative scale, over-precision rejection and round trips; ensure comparator equality agrees with intended membership.
- **Follow-ups:** “Is compareTo inconsistent with equals illegal?” → BigDecimal documents it; sorted collections need deliberate semantics. “Always two decimals?” → Only for a domain explicitly specifying that scale.
- **Primary reference:** [Java 21 BigDecimal equality and ordering](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html).

---

**3. A hand-written timing loop claims an unused calculation takes zero nanoseconds. How would you establish a credible JVM comparison?**

**Say aloud:**
“The just-in-time compiler translates frequently executed Java code into optimized machine code. If a calculation has no observable result, the compiler may remove it. Measuring an empty optimized loop says little about the operation we intended to compare.

I would use JMH, the Java Microbenchmark Harness, and return the result or pass it to a Blackhole consumer so it remains observable, and supply realistic changing input through benchmark state. Warmup gives compilation time to settle; separate JVM forks reduce contamination from earlier benchmark profiles. I would report the runtime, flags, data sizes and variability rather than one attractive number.

Then I would confirm the benchmark models the real bottleneck: allocation, contention or I/O may dominate production despite a fast isolated method. Correctness tests come first. A microbenchmark is evidence for a narrow operation under stated conditions, not an endpoint latency guarantee.”

- **Example:** Compare two parsers on varied valid and invalid messages, consume the parsed output and measure allocation as well as throughput. No timing figures here are benchmark results.
- **Guarantee/cost:** Harness controls reduce known measurement errors; results still depend on CPU, JVM, workload and measurement design.
- **Trade-off/failure:** Constant input can allow constant folding; putting many operations in a manual loop may change optimization. Shared state can introduce unintended contention.
- **Verify:** Inspect generated behavior/profiles when results are implausible; repeat independent forks and compare against an application-level profile.
- **Follow-ups:** “Cold startup?” → Measure a separate startup workload, not warmed steady state. “Blackhole proves realism?” → It prevents a specific elimination hazard; representative input remains your responsibility.
- **Primary reference:** [OpenJDK JMH dead-code sample](https://github.com/openjdk/jmh/blob/master/jmh-samples/src/main/java/org/openjdk/jmh/samples/JMHSample_08_DeadCode.java).

---

**4. A transactional service starts work on another thread, then rolls back. Why can the background database write still commit?**

**Say aloud:**
“An imperative Spring transaction is normally associated with the current thread. Starting another thread does not transfer that transaction, and an annotation on the caller does not make background work part of its atomic commit.

I would pass immutable command data, not a managed entity or EntityManager, to a separate worker. If the worker needs database atomicity, it enters its own transaction through an intercepted service boundary or an explicit transaction template. That transaction can commit even if the caller later fails, so the business contract must accept independent outcomes.

If work should happen only after a successful caller commit, a durable job or outbox row in that transaction is safer than merely launching a task. If both changes must commit together, keep them in the same transactional operation. I would verify outcomes with controlled execution order, not assume the async annotation supplies propagation.”

- **Example:** Caller creates a draft and schedules an audit worker, then fails. A worker transaction may retain an audit for a draft that never committed; decide whether that is intended.
- **Guarantee/cost:** Independent transactions have independent resource and failure boundaries. Queue limits, rejection handling and task lifetime need explicit ownership.
- **Trade-off/failure:** Waiting on the future does not merge transactions. Launching before commit can also make the worker miss uncommitted rows.
- **Verify:** Hold worker execution with a latch; roll back the caller, then release the worker and inspect durable state in a fresh transaction. This lesson is a design, not an executed Spring integration test.
- **Follow-ups:** “Reactive transactions?” → They use Reactor context, a different propagation model. “Copy the ThreadLocal?” → Do not share a connection/persistence context across threads to imitate transaction propagation.
- **Primary reference:** [Spring 6.2 Transactional thread-bound semantics](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/transaction/annotation/Transactional.html).

---

**5. Order has a version field, yet two edits to different OrderLine rows both succeed against the same order revision. Is the whole aggregate protected?**

**Say aloud:**
“An aggregate is a group of domain objects whose rules we want to enforce together. A JPA version field protects the versioned entity's concurrency contract; it does not automatically version every change to a different entity reachable from it.

For example, changing a line's scalar quantity need not change the order's row or version. If the API treats the order revision as protection for all lines, every aggregate writer must participate in that contract. One approach is an optimistic force increment, which requires a parent version increment, while validating the expected revision and changing children in the same transaction. Another is locking the parent before reading and editing the aggregate.

Both require all writers to cooperate, including bulk jobs and deletion paths. On conflict I discard the transaction's work and re-read before deciding whether to retry. I would verify emitted SQL and actual concurrent behavior rather than infer aggregate safety from the mapping alone.”

- **Example:** Two requests read order revision 8, edit different lines and force-increment that same parent; at most one transaction should commit against that revision.
- **Guarantee/cost:** Parent coordination creates an aggregate contention point; it does not protect external side effects or writers bypassing the protocol.
- **Trade-off/failure:** Collection relationship version rules and child scalar updates differ. A client-supplied revision alone is not a lock. Large aggregates may need smaller invariant boundaries.
- **Verify:** Synchronize two real transactions after the read, then attempt both commits; assert one conflict and no partial child change. Also test child insert/delete and native/bulk writer paths for the chosen provider.
- **Follow-ups:** “Force increment timing?” → Provider timing may vary; rely on successful commit, not an immediate in-memory version value. “Retry blindly?” → Revalidate command intent and suppress duplicate external effects.
- **Primary reference:** [Jakarta Persistence 3.2 locking and version rules, sections 3.5.2–3.5.4](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#locking).

---

**6. A one-minute Kafka Streams total changes after the minute ends. How would you define a correct late-event policy?**

**Say aloud:**
“Event time is when an event happened; processing time is when we handle it. A delayed device message can arrive after newer messages, so ending a minute on the wall clock does not mean all its events have arrived.

I would define the timestamp source, window boundaries and grace period, meaning how long the window admits out-of-order data after its end according to stream-time progress. In Kafka Streams, stream time advances from processed record timestamps; it is not simply the current wall clock. A grace period permits updates until the window closes, while later arrivals are rejected from that aggregation.

Consumers must know whether totals are provisional updates or final results. Longer grace increases delay and retained state. Events beyond grace need an explicit correction or reconciliation path if the business requires completeness. Exactly-once processing cannot manufacture missing or rejected historical events.”

- **Example:** Window `[12:00,12:01)` with two-minute grace may accept a 12:00:45 event while stream time is 12:02:30; it is closed once progress passes the closing boundary. Test the precise boundary for the selected operator/version.
- **Guarantee/cost:** State grows with active keys, retained windows and operator settings. Retention must cover the required window and grace contract.
- **Trade-off/failure:** A bad future timestamp can advance progress prematurely; an idle input does not make event time advance like a wall clock. Validate timestamp extraction and monitor rejected late records.
- **Verify:** Feed deterministic timestamps out of order, including at and beyond close, and test idle input; verify update versus final emission policy separately.
- **Follow-ups:** “Deduplication?” → A separate event-identity/state-retention contract. “Need immediate final totals?” → Arbitrarily late input prevents both immediate finality and perfect completeness.
- **Primary references:** [Kafka Streams time concepts](https://kafka.apache.org/40/streams/core-concepts/), [Kafka 4.0 TimeWindows grace contract](https://kafka.apache.org/40/javadoc/org/apache/kafka/streams/kstream/TimeWindows.html).

---

**7. Two room reservations pass a no-overlap query and both insert. How can PostgreSQL enforce interval exclusion directly?**

**Say aloud:**
“A pre-insert query is an observation, not a reservation of every possible conflicting interval. Another transaction can pass the same query before either commits. Row locks on existing bookings do not necessarily protect an empty gap.

In PostgreSQL I can model a booking as a timestamp range and use an exclusion constraint: for the same room, two stored ranges must not overlap. An exclusion constraint rejects combinations for which all the specified comparisons are true. With GiST, PostgreSQL's extensible search-tree index framework, and the appropriate operator support, room equality and range overlap can enforce the rule at the database boundary.

I would use half-open ranges so adjacent bookings can touch, reject missing, empty or unbounded ranges if the domain requires finite bookings, and map a conflict to a useful response. A friendly availability query remains useful, but the constraint decides correctness under concurrent inserts.”

- **Example:** Contextual schema shape: `EXCLUDE USING gist (room_id WITH =, during WITH &&)` with `btree_gist` for the room scalar type. `[10:00,11:00)` and `[11:00,12:00)` can coexist; `[10:30,11:30)` conflicts in the same room.
- **Guarantee/cost:** Index-backed enforcement covers all writes subject to the constraint. Actual index/write cost depends on data and contention; budget extension installation and migration validation.
- **Trade-off/failure:** Nulls or empty ranges can defeat an intended universal overlap rule unless constrained. Cancellation needs an explicit active-row policy, such as a carefully defined partial exclusion constraint.
- **Verify:** Race concurrent inserts into initially empty data; test adjacency, different rooms, cancellation, nulls, empty/unbounded intervals and timestamp-zone conversion.
- **Follow-ups:** “Portable JPA?” → This is database schema behavior; portable annotations alone do not express it. “Serializable instead?” → Possible with correct reads and full-transaction retry; choose one explicit enforcement design.
- **Primary reference:** [PostgreSQL 17 range exclusion constraints](https://www.postgresql.org/docs/17/rangetypes.html#RANGETYPES-CONSTRAINT).

---

**8. Two requests redeem the same password-reset link concurrently. What makes a token truly single-use?**

**Say aloud:**
“A reset token is a bearer credential: whoever possesses it can attempt account recovery. Randomness and expiry are necessary, but reading an unused flag and then updating it in a separate operation is not single-use under concurrency.

I would generate a cryptographically random token, store a protected verifier rather than the raw link secret, and bind it to one account and purpose with an expiry. Redemption atomically claims an unused, unexpired token and changes the password in the same database transaction. If the claim affects no row, the request fails safely; rollback must leave the token and password consistent.

Recovery also needs generic request responses, rate limits and trusted reset URLs to resist enumeration and abuse. After success I notify the user through an approved channel and apply the session invalidation policy. I would not automatically log in a requester merely because they submitted a reset.”

- **Example:** Contextual transaction: conditional update of the token where unused and unexpired; require one affected row, change the account verifier, invalidate other reset credentials according to policy, then commit.
- **Guarantee/cost:** Atomic redemption prevents two successful uses of that token when all writers follow the protocol. It does not make a stolen token harmless before use.
- **Trade-off/failure:** A link preview must not consume the token on GET; require an intentional password submission. Never log reset URLs or allow untrusted Host headers to choose their origin.
- **Verify:** Race two submissions and assert one success; inject failure between claim and password update and check rollback. Test expiry, unknown account responses, token leakage and old-session policy.
- **Follow-ups:** “Two different outstanding links?” → Define one account-wide credential-generation or invalidation policy with concurrency control. “New password hash cost?” → Bound abuse and compute safely without holding database locks unnecessarily.
- **Primary reference:** [OWASP forgot-password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

---

**9. An authenticated statement page is cached by a shared proxy. Is Cache-Control: no-cache enough to prevent disclosure?**

**Say aloud:**
“A shared cache serves multiple users, while a private cache belongs to one user agent. In HTTP, no-cache permits storage but requires validation before reuse. It does not mean do not store.

For a sensitive statement I would normally use no-store and explicitly configure the CDN or proxy to bypass storage, verifying both the response policy and deployment rules. private prevents shared-cache storage but can still allow browser storage, so it solves a different requirement. Authentication by itself is not a complete cache policy; cookie-based personalization especially needs deliberate handling.

I would test two accounts requesting the same URL through the real cache boundary, including redirects and errors. Correct database authorization cannot repair a response already served from an unsafe shared cache. Existing cached responses also need a purge or migration plan when fixing policy.”

- **Example:** A statement containing balances uses `Cache-Control: no-store`; a non-sensitive personalized preference response might permit private browser caching if the product allows it.
- **Guarantee/cost:** Compliant caches obey the applicable directives; no-store is not retroactive erasure of prior stored copies or protection from a malicious intermediary.
- **Trade-off/failure:** `Vary: Cookie` can create huge key cardinality and is not an authorization check. A 304 revalidation path must preserve the same security boundary.
- **Verify:** Inspect upstream and downstream headers plus cache-hit indicators; exercise A then B at the same path and audit CDN overrides. Browser-local testing alone cannot certify CDN behavior.
- **Follow-ups:** “Authorization header?” → RFC 9111 restricts shared reuse unless explicitly allowed; do not rely on that for all cookie sessions. “no-cache versus max-age=0?” → Both involve freshness/validation semantics; neither expresses a blanket storage prohibition.
- **Primary reference:** [RFC 9111 cache directives and authenticated requests](https://www.rfc-editor.org/rfc/rfc9111.html).

---

**10. A StampedLock optimistic read validates successfully, but code then rereads the fields. Is the returned snapshot protected?**

**Say aloud:**
“An optimistic read tries to observe state without holding a read lock. StampedLock gives a stamp that can be validated to detect an intervening write lock. Validation checks the read attempt; it does not lock future reads.

For a small pair of primitive fields I copy both into local variables first, then validate. If validation fails or the stamp is zero, I acquire a read lock and copy them again, releasing it in finally. The result is built from those local copies. Rereading shared fields after validation starts a new unprotected observation and can mix generations.

All relevant writers must use the same write lock. The speculative section must tolerate inconsistency and avoid side effects or unsafe traversal of mutable structures. For complex state, a normal read lock or immutable snapshot is often simpler. I would measure a real read-heavy workload before choosing this extra complexity.”

- **Example:** A writer changes `(x,y)` together. Read `localX`, then `localY`, validate, and return that pair; do not validate and then read `(x,y)` for the return expression.
- **Guarantee/cost:** Optimistic reads may require retry under a read lock; no fairness or bounded wait guarantee is implied. StampedLock is not reentrant.
- **Trade-off/failure:** Optimistic traversal of a mutating collection can fail before validation. Holding a stamp does not grant thread-owned reentrant lock semantics.
- **Verify:** Coordinate a writer between the two speculative reads and assert fallback rereads both fields. Test a writer immediately after validation and assert the returned locals remain one valid snapshot.
- **Follow-ups:** “Read then write?” → Try conversion and handle failure by unlocking/reacquiring and rechecking the condition. “Always faster?” → No; contention, retry rate and complexity determine value.
- **Primary reference:** [Java 21 StampedLock optimistic-read contract and example](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/StampedLock.html).

---

**11. Choose non-overlapping paid jobs for maximum total value and return the actual chosen jobs. Why does earliest-finish greedy fail?**

**Say aloud:**
“Each job has a start, end and nonnegative value. We use half-open intervals, so a job ending when another starts is compatible. Earliest-finish greedy maximizes the number of compatible jobs, but can discard one expensive job in favor of several cheap ones.

I sort a copy by end time. For each job, binary search finds how many earlier jobs end no later than its start. The best value for the first i jobs is the greater of skipping job i and taking its value plus the best compatible prefix. I store both that predecessor prefix and whether taking was strictly better.

To reconstruct, walk backward: a taken job jumps to its compatible prefix, while a skipped job moves one position back. Reverse the result into execution order. Ties skip the current job for deterministic output. I use long totals, reject invalid intervals and preserve caller input.”

- **Example:** Jobs `(0,2,4)`, `(2,4,4)` and `(0,4,11)` choose the last job, value 11, instead of the two-job value 8.

```java
record Job(int id, int start, int end, int value) {}
record Plan(long value, List<Job> jobs) {}

static Plan bestSchedule(List<Job> input) {
    Objects.requireNonNull(input, "input");
    Job[] jobs = input.toArray(Job[]::new);
    Set<Integer> ids = new HashSet<>();
    for (Job job : jobs) {
        Objects.requireNonNull(job, "job");
        if (job.start() >= job.end() || job.value() < 0 || !ids.add(job.id()))
            throw new IllegalArgumentException("invalid job or duplicate id");
    }
    Arrays.sort(jobs, Comparator.comparingInt(Job::end)
        .thenComparingInt(Job::start).thenComparingInt(Job::id));
    int n = jobs.length;
    long[] best = new long[n + 1];
    int[] previous = new int[n];
    boolean[] take = new boolean[n];
    for (int i = 0; i < n; i++) {
        int low = 0, high = i;
        while (low < high) {
            int mid = low + (high - low) / 2;
            if (jobs[mid].end() <= jobs[i].start()) low = mid + 1;
            else high = mid;
        }
        previous[i] = low;
        long candidate = best[low] + jobs[i].value();
        take[i] = candidate > best[i];
        best[i + 1] = take[i] ? candidate : best[i];
    }
    List<Job> selected = new ArrayList<>();
    for (int i = n; i > 0; ) {
        if (take[i - 1]) {
            selected.add(jobs[i - 1]);
            i = previous[i - 1];
        } else i--;
    }
    Collections.reverse(selected);
    return new Plan(best[n], List.copyOf(selected));
}
```

- **Guarantee/complexity:** O(n log n) time, O(n) auxiliary/output space. Expected O(n) ID validation with hashing; sorting and predecessor search dominate. Values are nonnegative int, so any representable Java array's total fits long. Empty input returns an empty zero-value plan; nulls, duplicate IDs and nonpositive duration are rejected.
- **Trade-off/failure:** Only one optimum is returned, not all optima or a minimum-job-count optimum. Caller must bound input memory and keep the input stable while copied. Negative timestamps are allowed; negative durations are not.
- **Verify/reasoning:** Every optimum either excludes the final job or includes it with an optimal compatible prefix. Independently enumerate all subsets for small inputs; verify both the value and that reconstructed jobs are original, unique and pairwise compatible. Test ties, touching endpoints and overflow-sized totals.
- **Follow-ups:** “Streaming insertion?” → Sorting/prefix DP assumes a static batch; arbitrary insertions can change many decisions. “Setup gap?” → Adjust the compatibility condition with overflow-safe arithmetic and retain the same recurrence.

---

**12. Assign every vertex in an undirected conflict graph to one of two groups, or report that this is impossible. Why must you restart traversal?**

**Say aloud:**
“A bipartite graph can be split into two groups so every edge crosses between them. An odd cycle makes this impossible because alternating two labels returns to a vertex needing the opposite label. A self-loop is already a conflict.

I use breadth-first search, assigning each newly reached neighbor the opposite group. If an edge joins two vertices with the same group, no valid assignment exists. A graph can have disconnected components, so I start another traversal at every still-unassigned vertex; checking only vertex zero can miss a distant odd cycle.

The implementation builds both directions from an edge list, validates every endpoint before traversal, and returns an explicit optional result. An empty graph has a valid empty assignment, which is different from failure. Each vertex is enqueued once and each stored edge is scanned, giving linear work in vertices plus edges.”

- **Example:** Edges `0–1, 1–2` permit groups `[0,1,0]`; adding a disconnected triangle on `3,4,5` makes the entire graph impossible.

```java
static Optional<int[]> twoGroups(int vertices, int[][] edges) {
    if (vertices < 0) throw new IllegalArgumentException("negative vertices");
    Objects.requireNonNull(edges, "edges");
    List<List<Integer>> neighbors = new ArrayList<>(vertices);
    for (int i = 0; i < vertices; i++) neighbors.add(new ArrayList<>());
    for (int[] edge : edges) {
        Objects.requireNonNull(edge, "edge");
        if (edge.length != 2 || edge[0] < 0 || edge[0] >= vertices
                || edge[1] < 0 || edge[1] >= vertices)
            throw new IllegalArgumentException("invalid edge");
        neighbors.get(edge[0]).add(edge[1]);
        neighbors.get(edge[1]).add(edge[0]);
    }
    int[] group = new int[vertices];
    Arrays.fill(group, -1);
    ArrayDeque<Integer> queue = new ArrayDeque<>();
    for (int start = 0; start < vertices; start++) {
        if (group[start] != -1) continue;
        group[start] = 0;
        queue.addLast(start);
        while (!queue.isEmpty()) {
            int from = queue.removeFirst();
            for (int to : neighbors.get(from)) {
                if (group[to] == -1) {
                    group[to] = 1 - group[from];
                    queue.addLast(to);
                } else if (group[to] == group[from]) return Optional.empty();
            }
        }
    }
    return Optional.of(group);
}
```

- **Guarantee/complexity:** O(V+E) time/storage for V vertices and E input edges, including duplicates. No recursion-depth risk. Nulls, negative vertex counts, malformed edges and out-of-range endpoints are rejected. Valid self-loops produce impossibility rather than an input error.
- **Trade-off/failure:** The returned array is caller-owned and mutable. Labels are not a balanced partition or a unique assignment; isolated vertices go to group zero. This is an undirected model, not directed dependency ordering.
- **Verify/reasoning:** Assignment propagates the forced opposite label along each component. Check against exhaustive binary assignments for all small graphs, and validate every returned edge crossing. Test a disconnected odd cycle, duplicate edges, self-loops, zero vertices and invalid input appearing after a conflicting edge.
- **Follow-ups:** “Return the odd cycle?” → Store BFS parents/depths, then join paths from a same-label conflicting edge to their common ancestor. “Three groups?” → General three-colorability has a different computational boundary; this BFS rule no longer solves it.

---

**Topic coverage:** S11-Q01 complete asynchronous outcome reports; Q02 decimal identity and collection membership; Q03 JVM measurement validity; Q04 asynchronous transaction boundaries; Q05 aggregate version participation; Q06 event-time grace and corrections; Q07 database interval exclusion; Q08 concurrent reset redemption; Q09 shared HTTP cache policy; Q10 optimistic-read snapshot validation; Q11 reconstructable weighted scheduling; Q12 disconnected bipartite validation. The app contains **148 authored prompts across eleven sets**; Set 9 contains 28 prompts and some earlier-topic reinforcement. Count is not a claim of 148 unique concepts.

**Next set:** Continue at Set 12 even if another run occurs today. Build on these boundaries with concurrent schema backfills, CDC snapshot handoff, Java date/time ambiguity, resource-safe streaming responses, maximum-flow modeling and dynamic programming with an explicit memory budget. Do not repeat today's scenarios by merely changing entity names.
