**Set 5 · 9 October 2026 — Safe transitions and shortest paths**

Twelve new scenarios following the 48 questions in Sets 1–4. Baseline: **Java 21 without preview features**, HotSpot 21, Spring Framework 6.2 (as used with Spring Boot 3.5), Jakarta Persistence 3.2, PostgreSQL 17, and Kafka 4.0. These are reference versions, not claims about the latest releases. Examples are original illustrations, not personal experience.

Practise each **Say aloud** answer in 45–90 seconds. Stable IDs: **S05-Q01–S05-Q12**, in order. The two Java coding examples are methods and nested records compiled with a supplied `java.util.*` import and class wrapper. Other snippets describe protocols or deliberately faulty examples; they are not complete services.

---

**1. A producer puts a mutable job into a blocking queue, then changes its payload. What can the consumer safely assume?**

**Say aloud:**
“A happens-before relationship is a memory-ordering guarantee: earlier writes become visible to the receiving thread through a specified synchronization action. A BlockingQueue provides that guarantee for actions before the object is placed in the queue and actions after another thread accesses or removes that element. So building the payload before enqueueing safely publishes those earlier writes.

It does not freeze the object. If the producer changes the payload after enqueueing while the consumer reads it, the queue does not order that later mutation. I would transfer ownership and prohibit further producer mutation, or enqueue an immutable snapshot, including copies of mutable nested values. The choice depends on copying cost and whether ownership is enforceable.

I would also define bounded admission and interruption handling. Thread-safe transport solves publication; payload ownership and overload remain application responsibilities.”

- **Example:** `job.amount = 7; queue.put(job); job.amount = 9;` gives no queue-based guarantee that the consumer observes the later value. Prefer a completed immutable job before `put`.
- **Guarantee/cost:** Publication covers pre-enqueue actions. A snapshot of n payload elements costs O(n); queue operation cost depends on implementation and contention.
- **Trade-off/failure:** Ownership transfer avoids copies but requires every alias to cooperate. A shallow copy leaves nested mutable state shared.
- **Follow-ups:** “Does put close the queue?” → No built-in shutdown protocol. “What if interrupted?” → Propagate or restore interruption according to the caller contract; do not silently lose the job.

Reference: [Java 21 BlockingQueue contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html).

---

**2. A container is killed for memory use while the Java heap stays below its limit. What would you investigate beyond heap leaks?**

**Say aloud:**
“The heap is only part of a Java process's memory. Native memory is allocated outside that heap, including thread stacks, class metadata, compiled code and native library allocations. Direct buffers also use memory outside the ordinary object heap. A container limit applies more broadly than the maximum heap setting, so a healthy heap does not rule out memory exhaustion.

I would first confirm the container's termination reason and compare its memory accounting with process resident memory, thread count and direct-buffer metrics. On HotSpot I would use Native Memory Tracking, enabled at startup, and compare a baseline with later summaries. It tracks JVM categories but does not explain every third-party native allocation.

The fix follows the growing category: bound threads, release owned native resources or reduce retained buffers. I would budget native headroom before changing the heap ceiling.”

- **Example:** A 2 GiB container with a 1.5 GiB heap budget can still exceed its limit through stacks, buffers and other accounted memory; the remaining 0.5 GiB is not automatically adequate.
- **Guarantee/cost:** NMT adds overhead and is diagnostic evidence, not a complete process accounting ledger. Reserved virtual address space is different from committed or resident memory.
- **Trade-off/failure:** A larger heap can reduce available native headroom. Stable NMT with rising resident memory calls for OS/native investigation, not an automatic heap-leak diagnosis.
- **Follow-ups:** “Enable NMT after the incident?” → Plan startup enablement; it cannot be started dynamically if disabled. “Heap dump sufficient?” → It may expose owners, but not every native allocation.

Reference: [HotSpot 21 diagnostic tools and NMT](https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html).

---

**3. You must replace `customer_name` with `display_name` while old and new service replicas overlap. Why is a direct column rename risky?**

**Say aloud:**
“A rolling deployment runs several application versions at once. Renaming a column immediately breaks old SQL, even if the new application works perfectly. I would use expand and contract: first add a compatible representation, migrate readers and writers, and remove the obsolete representation only after its users are gone.

During overlap I would choose one authoritative value and a synchronization rule covering every writer. For example, keep the old column authoritative while a database trigger copies its value to the new column. Backfill historical rows in bounded batches with concurrency-safe conditions, verify convergence, then switch readers. Only after old writers are retired can a later release change write authority.

Rollback compatibility, jobs and reporting queries belong in the plan. Backfill completion alone does not prove safety when old replicas can still change data.”

- **Example:** Add nullable `display_name`; synchronize old-column writes; backfill; compare values; roll out new readers; retire all old clients; later switch writes and remove the old column.
- **Guarantee/cost:** An application protocol, not an automatic ALTER TABLE guarantee. Backfill is O(rows) data work and generates WAL, PostgreSQL's write-ahead log; DDL can acquire disruptive locks.
- **Trade-off/failure:** Extra schema and synchronization cost buy rollback time. Naive dual writes in only new replicas miss updates from old replicas; a stale backfill can overwrite newer data.
- **Follow-ups:** “Add NOT NULL immediately?” → Only after existing rows and every active writer satisfy it; plan validation/locking. “When drop the column?” → After observed non-use and the agreed rollback window.

Reference: [PostgreSQL 17 ALTER TABLE behavior](https://www.postgresql.org/docs/17/sql-altertable.html); the rollout protocol above is a design proposal.

---

**4. A successful profile update is followed by an old value on refresh. How would you provide read-your-writes with database replicas?**

**Say aloud:**
“Read-your-writes means a client sees its own completed changes on subsequent reads. An asynchronous replica may not have replayed a successful primary commit yet, so load-balancing the next read can violate that expectation without losing the write.

The simplest targeted solution is to route the dependent read to the current primary, using a fresh transaction snapshot. If we need replica reads, a more involved protocol returns a replication progress marker that is at least as new as the commit. The chosen replica must replay through that marker before a fresh read, with a bounded wait and primary fallback.

A fixed delay is a latency guess, not a guarantee. Failover, cached responses and old transaction snapshots also matter. I would scope the guarantee explicitly rather than promise that all readers instantly see all writes.”

- **Example:** Update returns version 42; the next profile read goes to the primary. A replica-only alternative waits for verified replay progress, not merely receipt of WAL.
- **Guarantee/cost:** Primary reads trade replica capacity for simpler session consistency. PostgreSQL synchronous replication with `remote_apply` waits for replay on the configured synchronous standby set, not every arbitrary replica.
- **Trade-off/failure:** Marker routing needs topology/failover handling and deadlines. Old snapshots or stale caches can defeat a correct routing decision.
- **Follow-ups:** “Stick to primary for five seconds?” → Useful heuristic unless lag is strictly bounded. “Primary fails?” → State whether acknowledged writes survive the configured replication policy.

Reference: [PostgreSQL 17 standby and synchronous replication](https://www.postgresql.org/docs/17/warm-standby.html).

---

**5. An AFTER_COMMIT Spring event listener changes an entity, but the change does not persist. Why, and is the event durable?**

**Say aloud:**
“An AFTER_COMMIT listener runs after the publishing transaction has committed. Spring may still expose the old transaction's resources, which makes data access appear possible, but there is no further commit of that transaction to save new changes. I would put required business updates inside the original transaction, or invoke a separate proxied service with REQUIRES_NEW when a genuinely independent post-commit database write is appropriate.

That new transaction can fail after the original work succeeds. Also, an in-process event is not a durable task: a process crash after commit can prevent the listener from completing. If eventual execution is required, persist the work in the original transaction and process it with recovery.

I would distinguish timing from reliability. AFTER_COMMIT describes when a callback runs; it does not promise delivery, retries or atomicity with later effects.”

- **Example:** An order commits; its listener assigns an audit entity field. Use an explicit independent transaction for optional audit persistence, or persist mandatory audit/work alongside the order.
- **Guarantee/cost:** Default phase is AFTER_COMMIT; without a transaction the listener is skipped unless fallback execution is enabled. Independent work adds another commit and connection usage.
- **Trade-off/failure:** Separate commits allow partial success. Retried callbacks need duplicate protection; enabling fallback changes the no-transaction case rather than creating a transaction.
- **Follow-ups:** “Listener throws?” → Original commit cannot be rolled back. “Async listener?” → Does not inherit a thread-bound transaction; define its own boundary and failure handling.

Reference: [Spring Framework 6.2 TransactionalEventListener contract](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/transaction/event/TransactionalEventListener.html).

---

**6. A JPQL bulk update changes thousands of rows, but managed objects still show old values. What contract did you bypass?**

**Say aloud:**
“The persistence context is JPA's collection of managed entity instances and their tracked state. JPQL is the Jakarta Persistence query language. A bulk JPQL update operates directly on database rows rather than changing each managed object. JPA does not automatically synchronize those existing instances with the bulk result, and bulk operations bypass ordinary optimistic version checks.

I would isolate the bulk operation in a deliberate transaction boundary. If managed changes must be retained, flush them—synchronize pending changes to the database—before the bulk statement, then clear the context and reload what is needed. Clearing detaches all managed entities, so doing it casually can discard unflushed work and invalidate caller assumptions.

If the operation needs per-entity lifecycle behavior or conflict detection, I would use entity updates or explicitly design predicates and version changes. Bulk throughput is valuable only if the domain semantics remain correct.”

- **Example:** Load account A as ACTIVE; bulk-set matching accounts to SUSPENDED; A remains stale in memory until refreshed or detached and reloaded.
- **Guarantee/cost:** One bulk statement avoids per-entity materialization, but database work still depends on matched rows and indexes. Persistence-context synchronization must be handled explicitly.
- **Trade-off/failure:** Flush/clear affects more than the target rows. A later stale write can undermine the bulk result if version handling is absent.
- **Follow-ups:** “Version increment alone enough?” → It can invalidate older versions, but the bulk decision still needs explicit conflict semantics. “Test approach?” → Load, bulk-update, inspect stale state, clear, then reload in a real provider/database test.

Reference: [Jakarta Persistence 3.2 bulk update and delete semantics](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#bulk-update-and-delete-operations).

---

**7. A Kafka consumer restores an old snapshot after a long outage and resurrects a deleted key. How can compaction cause this?**

**Say aloud:**
“Compaction keeps the latest known record for a key while eventually removing older records. A tombstone is a record with a key and a null value, used to mark deletion. Tombstones themselves can eventually be removed, so a compacted topic is not an unlimited history of every delete.

If a consumer restores an old local snapshot containing a deleted key and resumes after the tombstone has disappeared, it may never learn to remove that key. I would pair snapshots with offsets and a recovery policy that guarantees required deletes remain available, or discard the old state and rebuild from an authoritative source when that window is exceeded.

I would monitor consumer recovery time against deletion retention. Compaction is asynchronous and preserves ordering of retained records, but it does not turn an arbitrary stale snapshot into a safe recovery point.”

- **Example:** Snapshot contains `K=active`; log later receives `(K,null)`; an outage exceeds the available delete history. Reusing that snapshot without reconciliation can retain K forever.
- **Guarantee/cost:** Offsets do not get renumbered after compaction; gaps are normal. A complete rebuild costs the retained log scan plus state storage. Tombstone retention bounds safe scan/recovery assumptions.
- **Trade-off/failure:** Longer retention uses more storage; short retention narrows recovery time. An empty string value is not a null tombstone.
- **Follow-ups:** “Immediate erasure?” → No, cleaning is asynchronous; backups and downstream copies need separate policies. “Replay all events?” → A compacted topic is unsuitable for complete event-history auditing.

Reference: [Kafka 4.0 log compaction](https://kafka.apache.org/40/design/design/#log-compaction).

---

**8. A ZIP upload is small, but extraction exhausts disk and writes outside its target folder. What controls belong in the processing boundary?**

**Say aloud:**
“An archive can expand into much more data than its compressed size, and entry names can attempt path traversal, meaning escape from the intended directory. I would treat extraction as untrusted computation with both path and resource controls.

Use a private, newly created workspace and server-generated storage names. Resolve and normalize each entry under its extraction root, reject absolute or escaping paths, and disallow links and unsupported entry types. Normalization alone is insufficient if an attacker can alter filesystem links while extraction runs, so workspace ownership and safe file creation matter.

Enforce limits while streaming actual decompressed bytes: total bytes, per-entry bytes, file count, nesting, time and concurrent jobs. Do not trust archive metadata. Publish only fully validated output; on failure, clean up the owned workspace and keep partial files inaccessible.”

- **Example:** Reject `../../config.yml` and stop an archive whose actual expansion exceeds 100 MiB even if its claimed size is 1 MiB. The numbers are illustrative policy values.
- **Guarantee/cost:** Work is bounded by enforced output and processing budgets; decompression can consume CPU before reaching byte limits. Isolation and deadlines complement counters.
- **Trade-off/failure:** Strict policies reject some legitimate archives. Extension/MIME checks and malware scanning are layers, not substitutes for safe extraction and private storage.
- **Follow-ups:** “Nested archives?” → Reject or apply one shared recursive budget. “Duplicate names?” → Reject or define collision handling; do not silently overwrite trusted output.

Reference: [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html); extraction policy above is an illustrative design.

---

**9. A stream uses `peek` to write audit records and then calls `count`. Why can auditing disappear?**

**Say aloud:**
“A stream describes a computation rather than promising that every intermediate callback will run. Peek is an intermediate operation, and Java permits optimizations that skip traversal when the terminal result can be derived directly. For a sized source with no size-changing operations, count may already know the answer, so an audit side effect in peek can be skipped.

I would separate required side effects from incidental observation. An explicit loop or a suitable terminal operation makes intended traversal clear, but it still does not make several external writes atomic or retry-safe. If auditing is mandatory business state, it belongs in a transaction or another durable protocol.

I would keep mapping and filtering functions free of externally required side effects. That makes sequential and parallel execution easier to reason about and prevents correctness from depending on an optimizer's chosen traversal.”

- **Example:** `List.of(3, 8).stream().peek(audit::write).count()` must not be relied on to produce two audit writes. It is a deliberately faulty contextual fragment.
- **Guarantee/cost:** Stream result semantics can hold without callback traversal. An explicit n-element loop does O(n) visits plus the cost of each effect.
- **Trade-off/failure:** `forEach` does not provide rollback; parallel `forEach` does not preserve encounter order. Failure may leave only part of the effects completed.
- **Follow-ups:** “Use forEachOrdered?” → Preserves encounter order where defined, not transactional atomicity. “No terminal operation?” → A lazy pipeline does not execute just because it was constructed.

Reference: [Java 21 Stream, count and peek contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**10. A team replaces a request counter with LongAdder, then uses its sum to enforce a hard admission limit. Is that safe?**

**Say aloud:**
“LongAdder spreads contended updates across internal variables to improve statistical counting throughput. Its sum is not an atomic snapshot while updates are happening. More fundamentally, reading a count, checking a limit and incrementing are separate actions: several callers can all pass the same check.

For admission I would use a semaphore, a counter of available permits, with an atomic try-acquire operation, releasing exactly once when the admitted work finishes. For a custom state rule, a compare-and-set loop can atomically validate and replace one state value. Compare-and-set means update only if the value still equals the one observed.

I would keep LongAdder for telemetry, where concurrent observations need not define permission. A process-local limiter still does not enforce a fleet-wide quota; that needs a separate shared authority or explicitly allocated per-instance budgets.”

- **Example:** With count 9 and limit 10, two callers can both read 9 and increment. A one-permit semaphore admits at most one of them before a release.
- **Guarantee/cost:** LongAdder favors throughput at a space cost. Atomic admission has contention; no universal constant latency is promised. A quiescent sum, with no concurrent updates, is accurate.
- **Trade-off/failure:** Incorrect release ownership can inflate permits. Replacing LongAdder with AtomicLong while keeping separate get/check/increment still leaves the race.
- **Follow-ups:** “sumThenReset for exact intervals?” → Concurrent updates do not yield an exact interval boundary. “Request times out?” → Release on actual owned-work completion, according to the resource being limited.

Reference: [Java 21 LongAdder contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html).

---

**11. Several depots are starting points in an unweighted directed road graph. Find each vertex's fewest hops from any depot.**

**Say aloud:**
“I would use multi-source breadth-first search. Breadth-first search processes vertices in increasing hop distance with a first-in, first-out queue. Instead of running it separately from every depot, seed every distinct depot at distance zero, then expand all of them together.

When I first discover an unvisited neighbor, assign the current distance plus one and enqueue it immediately. Marking on enqueue ensures a vertex enters the queue once, including when several depots reach it. Because every edge costs one hop and the queue visits layers in order, first discovery gives the minimum over all sources.

I would return minus one for unreachable vertices, accept an empty source set, and validate every endpoint before traversal. This computes directed reachability; for undirected roads the caller must include both directions. It does not solve unequal travel-time weights.”

```java
static int[] nearestDepot(int[][] edges, int[] depots) {
    Objects.requireNonNull(edges, "edges");
    Objects.requireNonNull(depots, "depots");
    int n = edges.length;
    for (int[] row : edges) {
        Objects.requireNonNull(row, "row");
        for (int v : row) if (v < 0 || v >= n)
            throw new IllegalArgumentException("endpoint");
    }
    for (int s : depots) if (s < 0 || s >= n)
        throw new IllegalArgumentException("depot");
    int[] distance = new int[n];
    Arrays.fill(distance, -1);
    ArrayDeque<Integer> queue = new ArrayDeque<>();
    for (int s : depots) if (distance[s] == -1) {
        distance[s] = 0;
        queue.addLast(s);
    }
    while (!queue.isEmpty()) {
        int u = queue.removeFirst();
        for (int v : edges[u]) if (distance[v] == -1) {
            distance[v] = distance[u] + 1;
            queue.addLast(v);
        }
    }
    return distance;
}
```

- **Example:** Edges `0→1→2`, `3→2`, isolated 4; depots `[0,3,3]` produce `[0,1,1,0,-1]`.
- **Guarantee/cost:** With V vertices, E edges and S source entries, O(V+E+S) time including validation, O(V) auxiliary/output space; inputs remain unchanged and must not be mutated concurrently.
- **Trade-off/failure:** Distances omit actual paths and depot identity. Weighted edges invalidate first-discovery optimality; duplicate edges and self-loops are harmless.
- **Follow-ups:** “Return paths?” → Store a predecessor when first discovered. “Tied depots?” → Define a tie rule; current queue/source order only determines implicit discovery preference.

---

**12. Now roads have nonnegative travel costs. How do you find the cheapest route when a vertex first discovered may later become cheaper?**

**Say aloud:**
“I would use Dijkstra's algorithm: repeatedly process the currently smallest tentative distance. Relaxation means trying an edge to see whether it improves the destination's best known cost. With nonnegative weights, a current minimum entry cannot later be beaten through a longer unfinished route.

Java's priority queue does not provide an efficient decrease-key operation, so I insert a new entry for each strict improvement. When removing an entry, I skip it if its distance no longer matches the best known value. This handles stale entries without scanning the queue to delete them.

I would reject negative weights, use long for accumulated distance, and preserve an explicit unreachable sentinel. Zero-cost edges, cycles and parallel edges are valid. If negative costs are part of the domain, I would choose another algorithm and consider negative cycles.”

```java
record Road(int to, int cost) {}
record Visit(int vertex, long distance) {}

static long[] cheapestRoutes(Road[][] roads, int source) {
    Objects.requireNonNull(roads, "roads");
    int n = roads.length;
    if (source < 0 || source >= n) throw new IllegalArgumentException("source");
    for (Road[] row : roads) {
        Objects.requireNonNull(row, "row");
        for (Road road : row) {
            Objects.requireNonNull(road, "road");
            if (road.to() < 0 || road.to() >= n || road.cost() < 0)
                throw new IllegalArgumentException("road");
        }
    }
    long[] best = new long[n];
    Arrays.fill(best, Long.MAX_VALUE);
    best[source] = 0;
    PriorityQueue<Visit> queue = new PriorityQueue<>(
        Comparator.comparingLong(Visit::distance));
    queue.add(new Visit(source, 0));
    while (!queue.isEmpty()) {
        Visit visit = queue.remove();
        int u = visit.vertex();
        if (visit.distance() != best[u]) continue;
        for (Road road : roads[u]) {
            long candidate = visit.distance() + road.cost();
            if (candidate < best[road.to()]) {
                best[road.to()] = candidate;
                queue.add(new Visit(road.to(), candidate));
            }
        }
    }
    return best;
}
```

- **Example:** `0→1:10`, `0→2:1`, `2→1:2`, isolated 3 gives `[0,3,1,MAX]`. The queued distance 10 becomes stale and is ignored.
- **Guarantee/cost:** With V vertices and E edges, O(V+E log(E+2)) time and O(V+E) auxiliary/output space for this duplicate-entry heap implementation, including full validation. E counts parallel edges. With int vertex counts and nonnegative int costs, shortest simple paths plus one examined edge fit in long; arbitrary long edge costs would require overflow handling.
- **Trade-off/failure:** Extra heap entries simplify code but cost memory. `Long.MAX_VALUE` means unreachable. No caller mutation; no concurrent graph mutation permitted.
- **Follow-ups:** “Early exit at discovery?” → Unsafe; exit when the target is removed with its current minimum. “Negative weights?” → Bellman–Ford is an option, O(VE), with reachable negative-cycle detection. “All weights one?” → Use breadth-first search.

---

**Topic coverage:** S05-Q01 queue publication and ownership; Q02 native memory; Q03 mixed-version database migration; Q04 replica consistency; Q05 transaction events; Q06 JPA bulk state; Q07 Kafka deletion recovery; Q08 secure archive processing; Q09 stream side effects; Q10 telemetry versus admission; Q11 multi-source BFS; Q12 weighted shortest paths.

**Next set builds on:** database index selectivity and query plans, HTTP conditional updates, Unicode string contracts, interruptible task shutdown, Kafka transaction visibility, certificate rotation, and union-find or dynamic-programming coding. Set 6 should introduce new decisions and failure cases rather than repeat these scenarios.
