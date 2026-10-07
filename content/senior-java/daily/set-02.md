**Set 2 · 7 October 2026 — Coordinating concurrent work and failures**

This is today’s second run: **12 new questions**, checked against the earlier set and cumulative ledger. Baseline: your [Senior Java Interview Master Guide](/senior-java-interview), using **Java 21 without preview features**.

Practise the “Say aloud” paragraphs in 45–90 seconds, then tackle the follow-ups. All examples are illustrative.

---

**1. Writing a report throws an exception, and closing its output stream also throws. Which exception should the caller receive?**

**Say aloud:**  
“I would use try-with-resources, Java’s language construct for closing resources automatically. A resource is something such as a file or socket whose lifetime needs explicit management; garbage collection does not provide timely closure.

If the body throws and closing also throws, try-with-resources preserves the body’s exception as the primary failure. The closing failure becomes a suppressed exception—additional diagnostic information attached to the primary exception. This prevents cleanup from hiding the original problem.

Resources close in reverse declaration order. If acquiring a later resource fails, already acquired resources still close. I would also establish ownership: a method should normally close resources it creates and owns, while a borrowed stream may belong to its caller. Automatic cleanup is useful only when the lifetime boundary is correct.”

```java
try (var out = Files.newOutputStream(path)) {
    writeReport(out); // Application-specific operation
}
```

- **Example:** Writing throws `IOException("disk full")`; closing also fails. The write exception escapes, with the close exception available through `getSuppressed()`.
- **Guarantee/cost:** Each successfully initialized, non-null resource gets a closing attempt during normal language-level exit. For r resources, there are r attempts; their duration depends on the resource.
- **Trade-off/failure:** A manual `finally` that throws can replace the original failure. Closing a caller-owned stream can break subsequent work. Process termination can prevent cleanup entirely.
- **Follow-ups:** “Only closing fails?” → That closing exception escapes. “Does closing guarantee durable storage?” → No; closure and durability are separate contracts.

Reference: [Java 21 try-with-resources rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3).

---

**2. An in-memory seat allocator uses separate atomic counters for available and reserved seats. Can its totals still become inconsistent?**

**Say aloud:**  
“Yes. An atomic counter makes an individual operation indivisible, but it does not combine operations on different counters. Our invariant—the condition that must always remain true—is that available plus reserved equals capacity, with neither count negative.

A reservation contains several steps: check availability, decrease available, and increase reserved. Two callers can both pass the check, or a reader can observe the state between updates.

I would protect validation, both updates, and any combined read using the same lock. A lock allows one participating thread at a time into that protected operation. For a small in-memory allocator, this makes the business rule easy to verify. All access must follow that discipline. The guarantee stops at this Java process; multiple service instances need coordination around shared authoritative state.”

```java
synchronized boolean reserve(int seats) {
    if (seats <= 0) throw new IllegalArgumentException("seats");
    if (seats > available) return false;

    available -= seats;
    reserved += seats;
    return true;
}
```

- **Example:** Available is 1; two callers each request 1. The lock permits one success and one rejection.
- **Guarantee/cost:** O(1) state work per request; lock waiting has no fixed upper bound. Combined snapshots must acquire the same lock.
- **Trade-off/failure:** Serialization limits concurrency. Exposing either field through an unsynchronized reader breaks the observation guarantee.
- **Follow-ups:** “Could one count be derived?” → Yes; storing capacity and reserved removes redundant state. “What about many independent shows?” → Separate locks by show can reduce contention, with careful lifecycle management.

---

**3. A `CompletableFuture` times out after 200 ms, but the remote operation continues for five seconds. Is that a Java bug?**

**Say aloud:**  
“No. A future represents a computation’s eventual result; it is not necessarily the owner of the running computation. `orTimeout` completes the future exceptionally if it has not completed in time. It does not automatically stop the underlying network request.

I would distinguish the response deadline, which limits how long the caller waits, from cancellation, which asks the actual operation to stop. The network client needs appropriate time limits and, where supported, an operation-specific cancellation handle.

Even cancellation cannot prove that a remote side effect did not happen. The server may have completed it before receiving the cancellation. Also, `orTimeout` changes the future it is called on. If several callers share that future, I would apply an individual caller’s timeout to a copy rather than unexpectedly timing out everyone.”

```java
CompletableFuture<Quote> callerView =
        sharedWork.copy().orTimeout(200, TimeUnit.MILLISECONDS);
```

- **Example:** The caller receives a timeout while the original quote request continues. Cancelling it requires coordination with the client performing that request.
- **Guarantee/cost:** Bounds the caller’s intended waiting policy, subject to scheduling delays; it does not guarantee termination or rollback. Algorithmic complexity is not the useful measure here.
- **Trade-off/failure:** Continued work wastes resources; cancelling shared work may harm other callers.
- **Follow-ups:** “Does `cancel(true)` interrupt `CompletableFuture` work?” → Its interrupt flag has no effect on processing. “Should capacity be released on timeout?” → Only when the underlying operation actually releases the resource.

Reference: [Java 21 `CompletableFuture`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**4. A request occasionally runs under the previous customer’s tenant context. How could a thread pool cause this?**

**Say aloud:**  
“`ThreadLocal` stores a separate value for each thread. It can make request context available without passing it through every method, but its lifetime follows the thread, not the request.

A thread pool reuses worker threads. If request A stores tenant A and fails before removing it, request B may run on that worker and observe tenant A. This can become an authorization defect, not just incorrect logging. The stored value can also retain objects for longer than intended.

At the outer request boundary, I would set trusted context and remove it in a finally block. For nested temporary context, I would restore the previous value instead. Work submitted to another executor needs deliberate context transfer and cleanup; ordinary thread-local values do not automatically follow the task.”

```java
tenantContext.set(verifiedTenant);
try {
    handleRequest();
} finally {
    tenantContext.remove();
}
```

- **Example:** A worker handles tenant A, then a request with no tenant context. Without cleanup, the second request may inherit A accidentally.
- **Guarantee/cost:** Cleanup removes this thread’s stored association. Retained memory otherwise scales with live worker associations and their reachable objects.
- **Trade-off/failure:** Thread-local access simplifies signatures but hides dependencies. Copying mutable context into asynchronous tasks creates additional sharing risks.
- **Follow-ups:** “Why not inheritance between threads?” → Pool workers may predate the request; thread creation is not task submission. “Simpler alternative?” → Pass an immutable context explicitly.

Reference: [Java 21 `ThreadLocal`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html).

---

**5. Two buyers read stock quantity 1 and both attempt a purchase. How does a JPA version field help, and where does it stop helping?**

**Say aloud:**  
“Optimistic locking detects conflicting updates instead of reserving exclusive access when data is read. It exists to prevent one writer silently overwriting another writer’s changes.

With a JPA version field, each buyer reads both quantity and version. A typical update succeeds only if the stored version still matches the version originally read, and then advances it. If both buyers read version seven, one update can win; the other encounters a conflict.

The losing operation must roll back. If retry is appropriate, it needs a fresh transaction, fresh data, and a new availability check. It must not blindly repeat the old decision.

This protects the versioned entity. It does not automatically enforce a business rule spread across independently updated rows, and direct bulk updates need explicit attention to version handling.”

```sql
-- Illustrative version-check mechanism:
UPDATE stock
SET remaining = 0, version = 8
WHERE id = 42 AND version = 7;
```

- **Example:** Buyer A changes version 7 to 8. Buyer B’s version-7 update affects no row; a fresh read reveals no stock.
- **Guarantee/cost:** Detects stale updates to participating versioned entities. Indexed row access is efficient, but contention may cause repeated failed attempts.
- **Trade-off/failure:** Good when conflicts are uncommon; frequent conflicts waste work. Detection may occur when changes are sent to the database or when the transaction commits.
- **Follow-ups:** “Can two different rows violate a shared limit?” → Yes; coordinate around the shared rule. “Does versioning replace quantity validation?” → No.

Reference: [Jakarta Persistence 3.2 locking specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#locking).

---

**6. A Spring Boot service has 20 database connections. Twenty requests each start a transaction, then call an audit service using `REQUIRES_NEW`. Why might everything stall?**

**Say aloud:**  
“Transaction propagation defines how a called operation participates in an existing transaction. `REQUIRES_NEW` starts an independent transaction, suspending the outer one.

With a typical local database transaction manager, the outer transaction keeps its connection while the inner transaction needs another. If all twenty requests already hold the twenty connections, none can acquire a connection for auditing. They wait until a timeout or some other intervention releases resources.

I would first decide whether the audit must commit independently. If it should commit only with the business change, a shared transaction is a better fit. If independent persistence is required, I would bound concurrent outer work and provide capacity for the inner work. I would also inspect database lock dependencies: more connections cannot fix an inner operation waiting on a row locked by its suspended outer transaction.”

- **Example:** Twenty outer connections remain occupied; twenty inner audit calls queue for a connection.
- **Guarantee/cost:** Independent transactions can commit separately. With one inner level, a request can simultaneously hold two connections.
- **Trade-off/failure:** An audit record may survive a business rollback. More pool capacity consumes database resources and does not remove lock conflicts.
- **Follow-ups:** “Would one extra connection help?” → It can permit progress under simple assumptions, but is not a universal sizing rule. “Does the outer rollback undo the audit?” → No.

Reference: [Spring Framework transaction propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html).

---

**7. A descending activity feed duplicates entries between pages when new rows arrive. How would you redesign pagination?**

**Say aloud:**  
“Offset pagination skips a number of rows before returning a page. Inserts near the beginning shift those positions, so the next offset can revisit rows already shown.

I would use keyset pagination: continue after the last ordering key seen, rather than after a row count. A cursor carries that boundary. For descending creation time, I would also include a unique ID so rows with identical timestamps have a deterministic order.

The next query requests rows older than the timestamp boundary, or rows with the same timestamp and a smaller ID. An index matching the filters and ordering helps it seek directly to that boundary.

This improves traversal through changing data, but it does not create a frozen dataset. Updated ordering fields, deletions, and changing filters still require an explicit consistency policy.”

```sql
WHERE tenant_id = :tenant
  AND (
       created_at < :lastTime
       OR (created_at = :lastTime AND id < :lastId)
  )
ORDER BY created_at DESC, id DESC
LIMIT :pageSize;
```

- **Example:** After `(10:00, 105)`, request keys below that pair. A new `(10:01, 120)` does not shift the continuation boundary.
- **Guarantee/cost:** With a suitable index and filters, approximately O(log N + page size) retrieval; verify the query plan. Stable ordering keys prevent position-shift duplicates.
- **Trade-off/failure:** Efficient sequential navigation, but arbitrary “jump to page 500” becomes harder. Mutable ordering keys can still cause skips or repeats.
- **Follow-ups:** “Need an exact export?” → Use a consistent database snapshot or materialized result. “Is an encoded cursor authorization?” → No; independently enforce tenant and filter scope.

---

**8. Three layers each allow three total attempts. How can one request produce 27 calls to the deepest dependency?**

**Say aloud:**  
“Retries multiply when each layer repeats the work of the layers below it. If three layers each allow three total attempts, one original request can produce three cubed, or twenty-seven, attempts at the deepest dependency.

I would assign retry ownership to the layer that understands whether the operation can safely repeat. An end-to-end deadline limits the total time, including waiting and retries. A retry budget limits additional attempts across traffic, so a struggling dependency does not receive unlimited extra load.

Between eligible attempts, backoff increases the delay, while jitter randomizes it so many clients do not retry together. Neither creates capacity; both only shape demand. I would stop when the deadline or budget is exhausted and avoid retrying permanent validation failures or side effects whose outcome cannot safely be repeated.”

- **Example:** A 900 ms budget allows a 250 ms first attempt, 100 ms delay, and another attempt capped by the remaining time, with response overhead reserved.
- **Guarantee/cost:** With a attempts at d independently retrying layers, worst-case downstream attempts can reach aᵈ. One owner with limit a avoids that multiplication for a single call chain.
- **Trade-off/failure:** Retries can recover transient failures but increase load and latency. Random delay alone does not cap retries.
- **Follow-ups:** “What does a 10% budget mean?” → At most one extra attempt per ten original requests over a defined window. “Retry a timeout?” → Only when repeating the operation is safe and time remains.

---

**9. Kafka events for an order use the same key. Event 12 goes to a retry topic, while event 13 succeeds. Why is the order still wrong?**

**Say aloud:**  
“A Kafka partition is an ordered log, but log order is not automatically the order in which business effects complete. Routing related events to one partition helps only if processing preserves that order.

A retry topic is a separate log used to delay failed processing. Moving event twelve there and continuing with thirteen allows thirteen’s effect to happen first. Kafka has not reordered the original partition; the application has changed the processing path.

For strict order, I would prevent later events for that order from taking effect until the failed event is resolved. I could also store the expected business sequence with the order and accept only the next sequence. A gap then triggers bounded waiting or recovery. That choice sacrifices availability for the affected order, so the business must decide whether strict sequencing is necessary.”

- **Example:** `12 = approve order`, `13 = dispatch order`. Applying dispatch first violates the workflow.
- **Guarantee/cost:** Sequential processing preserves effects only within its coordinated scope. Sequence validation can be constant application work plus a database operation; buffering gaps needs bounded storage.
- **Trade-off/failure:** Pausing a whole partition also delays unrelated keys. Per-key coordination permits more concurrency but requires more state and recovery logic.
- **Follow-ups:** “Skip old sequence numbers?” → Only when known to be already applied or safely obsolete. “Increase partition count?” → Key routing may change; plan migration if historical per-key order matters.

Kafka’s log guarantees: [Kafka 4.0 design documentation](https://kafka.apache.org/40/design/design/). The retry scenario illustrates an application-level consequence.

---

**10. A refresh token is stolen. Why does issuing a replacement token on every refresh help, and what race does it introduce?**

**Say aloud:**  
“An access token authorizes API calls. A refresh token obtains replacement access tokens, allowing access tokens to expire quickly without requiring frequent sign-in.

Refresh-token rotation replaces the refresh token after each successful use and invalidates its predecessor. The server retains the relationship between replacements, often called a token family. If an invalidated predecessor appears again, that reuse can reveal theft. The server can revoke the active replacement, forcing fresh authorization.

The transition must be atomic so two simultaneous uses cannot independently create valid successor branches. However, legitimate requests can also race—for example, two browser tabs refreshing together, or a retry after a lost response. I would coordinate refreshes in the client and define recovery explicitly. A broad grace period reduces accidental sign-outs but gives a stolen token more opportunity for reuse.”

- **Example:** `R1 → R2`; later reuse of R1 causes the active family to be revoked.
- **Guarantee/cost:** Rotation detects reuse of an invalidated token; it does not prevent the thief’s first successful use. It requires server-side state and coordinated updates.
- **Trade-off/failure:** Strong replay detection can force legitimate users to sign in again after races.
- **Follow-ups:** “Are existing access tokens immediately invalid?” → Not necessarily; local validation may accept them until expiration. “Can rotation identify which caller is the attacker?” → No.

Reference: [RFC 9700, refresh-token protection](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14).

---

**11. Merge overlapping maintenance intervals without changing the caller’s input. What invariant makes the algorithm correct?**

**Say aloud:**  
“I would first clarify the endpoint convention. For this problem, intervals are closed: both endpoints belong to the interval, so intervals touching at an endpoint overlap.

I would copy the input and sort by start time. Then I maintain one current merged interval. Because starts are sorted, the next interval either overlaps the current interval or begins after it ends. On overlap, I extend the current end to the larger end. Otherwise, I emit the current interval and start another.

The invariant is that everything already emitted is complete and cannot overlap any future interval. Future starts cannot move backward. This explains why comparing with the current interval is sufficient. Sorting dominates the runtime. Copying the list and using immutable interval values avoids changing the caller’s data.”

```java
// Uses java.util.ArrayList, Comparator, List, and Objects.
record Interval(int start, int end) {
    Interval {
        if (start > end) {
            throw new IllegalArgumentException("start > end");
        }
    }
}

static List<Interval> merge(List<Interval> input) {
    Objects.requireNonNull(input, "input");
    var sorted = new ArrayList<>(input);
    sorted.forEach(x -> Objects.requireNonNull(x, "interval"));
    sorted.sort(Comparator.comparingInt(Interval::start));

    var result = new ArrayList<Interval>();
    if (sorted.isEmpty()) return result;

    Interval current = sorted.get(0);
    for (int i = 1; i < sorted.size(); i++) {
        Interval next = sorted.get(i);
        if (next.start() <= current.end()) {
            current = new Interval(
                    current.start(),
                    Math.max(current.end(), next.end()));
        } else {
            result.add(current);
            current = next;
        }
    }
    result.add(current);
    return result;
}
```

- **Example:** `[1,4], [4,7], [2,3], [10,12]` → `[1,7], [10,12]`.
- **Complexity/guarantee:** O(n log n) time; O(n) additional space including copy and output. Handles empty input, nesting, duplicates, and negative endpoints.
- **Trade-off/failure:** Sorting a caller-owned list saves a copy but mutates input. Comparing integers by subtraction can overflow; `comparingInt` avoids that.
- **Follow-ups:** “Half-open intervals `[start,end)`?” → Touching endpoints do not overlap; use `<` if merging only overlaps, and define empty-interval handling. “Input already sorted?” → O(n) scan.

---

**12. Given build tasks and prerequisites, return a valid execution order or report a dependency cycle. How would you implement it?**

**Say aloud:**  
“I would model this as a directed graph: each task is a vertex, and an edge from prerequisite to dependent means the prerequisite must come first. A topological order is an ordering that respects every such edge.

I would use Kahn’s algorithm. For each task, count its unmet prerequisites; that count is called its indegree. Initially, tasks with zero indegree can run. I put them in a queue, remove one, append it to the result, and reduce the counts of its dependents. A dependent enters the queue when its count reaches zero.

If I process every task, the result is valid. Otherwise, some tasks remain blocked by a cycle. I must initialize every task, including isolated tasks, and be explicit about edge direction. Multiple valid orders are possible.”

```java
// Uses java.util.ArrayDeque, ArrayList, List, and Objects.
// Each edge is [prerequisite, dependent]; task IDs are 0..n-1.
static List<Integer> buildOrder(int n, int[][] edges) {
    if (n < 0) throw new IllegalArgumentException("negative n");
    Objects.requireNonNull(edges, "edges");

    List<List<Integer>> dependents = new ArrayList<>(n);
    for (int i = 0; i < n; i++) {
        dependents.add(new ArrayList<>());
    }
    int[] remaining = new int[n];

    for (int[] edge : edges) {
        if (edge == null || edge.length != 2
                || edge[0] < 0 || edge[0] >= n
                || edge[1] < 0 || edge[1] >= n) {
            throw new IllegalArgumentException("invalid edge");
        }
        dependents.get(edge[0]).add(edge[1]);
        remaining[edge[1]]++;
    }

    var ready = new ArrayDeque<Integer>();
    for (int task = 0; task < n; task++) {
        if (remaining[task] == 0) ready.addLast(task);
    }

    var order = new ArrayList<Integer>(n);
    while (!ready.isEmpty()) {
        int task = ready.removeFirst();
        order.add(task);
        for (int next : dependents.get(task)) {
            if (--remaining[next] == 0) ready.addLast(next);
        }
    }

    if (order.size() != n) {
        throw new IllegalArgumentException("dependency cycle");
    }
    return order;
}
```

- **Example:** Tasks 0–3, edges `0→2`, `1→2`, `2→3` → valid order `[0,1,2,3]`. Adding `3→1` creates a cycle.
- **Complexity/guarantee:** O(V + E) time and space, where V is tasks and E is dependency entries. Duplicate edges are counted and removed consistently.
- **Trade-off/failure:** Detects a cycle but does not identify its exact path. Reversing the edge direction produces the wrong build semantics.
- **Follow-ups:** “Always choose the smallest ready task?” → Use a minimum-priority queue, costing O(E + V log V). “Execute tasks concurrently?” → Release dependents only after prerequisites successfully finish, not when they are merely scheduled.

The code examples are illustrative and were not executed in this run.

---

**Today’s coverage:** Resource ownership and exception preservation; multi-field concurrency; cancellation; thread-local lifecycle; JPA optimistic locking; Spring transaction resource use; pagination under writes; retry amplification; Kafka processing order; refresh-token security; interval merging; dependency ordering.

**Next day’s progression:** Virtual-thread resource limits, JVM CPU diagnosis, cache invalidation races, reliable database-to-Kafka publication, schema evolution, Spring startup validation, and sliding-window/heap coding.

The cumulative ledger now tracks **24 distinct questions across two sets**.
