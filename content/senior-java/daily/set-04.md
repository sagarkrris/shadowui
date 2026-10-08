**Set 4 · 8 October 2026 — Ownership, recovery, and invariants**

Twelve new scenarios, following the 36 questions in Sets 1–3. Baseline: **Java 21, no preview features**. Framework references: Jakarta Persistence 3.2, Kafka Java client 4.0, Spring Boot 3.5, PostgreSQL 17, and Resilience4j 2.x circuit-breaker concepts. These are explicit assumptions, not latest-version claims. All scenarios are original illustrations, not personal experience.

Practise each **Say aloud** answer in 45–90 seconds. Java method examples below are extracted and exercised by the repository tests with imports and a class wrapper supplied. Configuration and operational sequences are contextual examples, not complete deployed systems. Stable question IDs are **S04-Q01–S04-Q12**, in the order below.

---

**1. Your copy helper accepts `List<Number>`, but a caller has `List<Integer>`. How would you design its type signature safely?**

**Say aloud:**  
“Java generics are invariant: a list of integers is not a subtype of a list of numbers. Otherwise code receiving a number list could insert a decimal into an integer list. I would describe how the method uses each argument. The source produces values, so it can contain an unknown subtype of T. The destination consumes those values, so it can accept T or a superclass of T. That gives extends on the source and super on the destination.

The compiler then checks the transfer without casts. This does not make the source immutable or the destination writable at runtime; an unmodifiable destination still rejects additions. I would also specify that the lists must be distinct and not overlapping views, because modifying the destination while iterating an aliased source can fail. Type safety and mutation policy are separate contracts.”

```java
static <T> void appendAll(List<? extends T> source, List<? super T> target) {
    Objects.requireNonNull(source, "source");
    Objects.requireNonNull(target, "target");
    if (source == target) throw new IllegalArgumentException("same list");
    // Contract: no overlapping backing storage; target supports add.
    for (T value : source) target.add(value);
}
```

- **Example:** Append integers `[2, 5]` to an empty `ArrayList<Number>`. Adding a `Double` through the source reference remains forbidden.
- **Guarantee/cost:** Compile-time transfer safety; O(n) with constant-cost iteration and amortized constant-cost target additions. No atomic rollback on a failed addition.
- **Trade-off/failure:** Flexible arguments, more complex signatures; raw types can defeat checks. Null elements follow the destination's policy.
- **Follow-ups:** “Read from `? super T`?” → Only `Object` is guaranteed. “Is extends read-only?” → No; operations such as clear may still work.

Reference: [Oracle wildcard guidance](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html), whose Java 8 variance rules also apply to Java 21.

---

**2. A plugin host grows in metaspace after every plugin reload. Why might deleting the plugin reference not help?**

**Say aloud:**  
“A class loader is the object that defines classes, and metaspace is HotSpot's native-memory area for class metadata. Replacing a plugin field does not necessarily make its loader unreachable. A host-owned listener registry might still reference a plugin callback, which keeps plugin objects and their defining loader alive.

I would compare repeated reloads under a controlled workload and inspect reference paths from long-lived roots to old loaders. I would also inspect plugin-created threads, context class loaders, and scheduled callbacks. The fix is an explicit unload lifecycle: stop new plugin work, wait for active work to finish, unregister callbacks, close owned resources, then release references.

Increasing the metaspace limit only postpones failure if old generations remain reachable. Conversely, rising usage alone does not prove a leak; generated classes or legitimate new plugins can explain growth. I need evidence of obsolete generations retained.”

- **Example:** `hostRegistry → oldPluginListener → oldPluginClass → oldLoader` remains after the current plugin field is replaced.
- **Guarantee/cost:** Loader reclaimability is a prerequisite for class unloading; prompt unloading is not guaranteed. Investigative cost depends on dump size and retained graph, not a useful fixed Big-O for the incident.
- **Trade-off/failure:** Waiting for active callbacks makes unload slower but avoids executing closed plugin state. A weak registry alone does not stop threads or close resources.
- **Follow-ups:** “Call GC?” → It cannot collect reachable loaders and is no lifecycle contract. “Static fields always leak?” → An unreachable loader and its internal cycles can be collected.

Reference: [Java 21 class unloading rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.7).

---

**3. Two dispatchers each see two active couriers, then independently take one offline. Both rows have versions. Can the depot still end with no courier?**

**Say aloud:**  
“Yes. Write skew is when transactions read a shared condition but change different rows, allowing their combined result to break that condition. Each version check can succeed because neither transaction updates the other's courier row. Row-level optimistic locking does not automatically enforce a rule spanning several rows.

For PostgreSQL 17, repeatable read can still allow this anomaly. One option is serializable isolation, which makes committed outcomes equivalent to some serial execution and may abort a conflicting transaction. The application must retry the entire transaction with fresh reads and a bounded policy. Another option is a shared depot guard row: under read committed, every operation changing membership locks that row before reading the active count and updating couriers.

The guard works only if all writers participate. I would include administrative tools and bulk jobs in that contract, and avoid irreversible external work inside a transaction that may retry.”

- **Example:** A reads `{A,B}` and disables A; B reads `{A,B}` and disables B. Their distinct row versions do not conflict.
- **Guarantee/cost:** A serializable solution must include all relevant invariant-changing transactions. The guard serializes changes per depot, with contention proportional to that depot's traffic.
- **Trade-off/failure:** Serializable transactions can abort; guard locking reduces throughput. Locking only the row being disabled leaves the anomaly.
- **Follow-ups:** “Retry just UPDATE?” → No, repeat the decision and reads. “Empty depot?” → Define creation and deletion rules, and keep the guard stable.

Reference: [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

---

**4. A managed project's `tasks` list includes a new task, but the task's project foreign key is absent. What JPA relationship rule did the code miss?**

**Say aloud:**  
“In a bidirectional relationship, the owning side is the side whose reference controls the stored relationship. With a project collection mapped by the task's project field, the task's many-to-one field owns the foreign key. Adding only to the inverse project collection changes the Java view without establishing that owning reference.

I would use a domain operation that sets task.project and adds the task to project.tasks, maintaining both directions. I would separately ensure the new task is persisted, either explicitly or through an intentional persist cascade. Cascade means propagating a persistence operation; it does not choose relationship ownership.

I would flush to send pending changes to the database, clear the persistence context to discard the managed-object cache, and read again. The assertion then checks stored state rather than the in-memory list. Moving or removing tasks needs a deliberate contract, especially if orphan removal is configured to delete children.”

- **Example:** Mapping: `Project.tasks @OneToMany(mappedBy="project")`; `Task.project @ManyToOne`. Inside a transaction, set both references and persist the new task if cascade does not do so.
- **Guarantee/cost:** Correct owning references determine relationship persistence. SQL count depends on mapping, identifiers, batching, and flush behavior.
- **Trade-off/failure:** A helper centralizes consistency but must define duplicate additions and reparenting. Nulling a mandatory foreign key can fail at flush.
- **Follow-ups:** “Does `mappedBy` name a column?” → It names the owning Java attribute. “Cascade REMOVE everywhere?” → Dangerous for shared entities; model lifecycle ownership first.

Reference: [Jakarta Persistence 3.2 relationship ownership and synchronization](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2).

---

**5. A failed dependency recovers, but every replica sends a burst when its circuit breaker starts admitting traffic again. How would you control recovery?**

**Say aloud:**  
“A circuit breaker is a state machine that stops admitting calls after observed failures or slow calls. Its open state rejects calls; half-open permits a limited sample to test recovery. I would distinguish those probes from normal traffic and bound both their count and duration.

A breaker usually belongs to one process, so three allowed probes across a hundred replicas can still mean three hundred simultaneous calls. I would combine staggered recovery with a bulkhead, meaning a concurrency limit protecting downstream capacity, and suitable transport deadlines. The breaker alone does not limit concurrency in its closed state.

I would classify failures carefully: an invalid customer request should not necessarily imply a broken dependency. Recovery metrics should show admitted probes, failures, rejection rates, and downstream saturation. A successful probe is evidence for recovery, not proof the dependency can immediately sustain the previous peak.”

- **Example:** 80 replicas × 2 simultaneous probes permits up to 160 probes; a per-process setting is not a fleet-wide quota.
- **Guarantee/cost:** Constant-size admission decisions can be cheap, but state/window maintenance is implementation-specific. A breaker does not cancel already-running calls or guarantee availability.
- **Trade-off/failure:** Slow reopening protects the dependency but delays service recovery. Fallback responses need an explicit freshness or incompleteness contract.
- **Follow-ups:** “Window size equals concurrency?” → No. “Probe hangs?” → Bound call duration and half-open waiting; check library configuration.

Reference: [Resilience4j circuit-breaker states and limits](https://resilience4j.readme.io/docs/circuitbreaker). Check exact property support in the deployed 2.x version.

---

**6. A Kafka partition is reassigned while an asynchronous worker still processes its old records. How do you prevent stale completion from advancing progress?**

**Say aloud:**  
“Rebalancing changes which consumer owns a partition. A worker dispatched earlier can finish after ownership changes, so I would attach an assignment generation to dispatched work. A generation is a local identifier for the current ownership period. The consumer thread accepts completion only if that identifier is still current.

For each partition I track the highest contiguous completed position, not just the largest completed offset. If offset forty-two finishes before forty-one, committing forty-three would skip unfinished work after a crash. On revocation I stop dispatch for the affected partitions, bound any drain, and commit only safe progress while ownership permits. On lost partitions I assume ownership is already gone.

The local generation prevents stale bookkeeping, not stale database writes. External effects still need deduplication or storage-enforced fencing, where the destination rejects writes from superseded owners. Consumer API calls stay on the consumer's owning thread.”

- **Example:** Offset 41 pending, 42 complete: next safe offset remains 41. Completion tagged generation 8 is ignored after reassignment to generation 9.
- **Guarantee/cost:** Tracking out-of-order completions takes O(w) space for w outstanding records. Bound w and paused-partition buffering; keep polling within client liveness requirements.
- **Trade-off/failure:** Draining can delay rebalancing. A local generation must not be mistaken for a globally authoritative storage fence.
- **Follow-ups:** “Lost versus revoked?” → Lost may mean another member already owns it; do not rely on a final commit. “Exactly once externally?” → Requires an external atomicity/idempotency design.

Reference: [Kafka 4.0 rebalance callbacks](https://kafka.apache.org/40/javadoc/org/apache/kafka/clients/consumer/ConsumerRebalanceListener.html).

---

**7. A document-preview API downloads a user-provided URL. Is checking that the string starts with `https://` sufficient?**

**Say aloud:**  
“No. Server-side request forgery means an attacker makes the server access a destination the attacker should not reach directly. HTTPS protects a connection; it does not authorize its destination. An apparently valid URL could target an internal administration service or redirect there.

I would prefer selecting known document providers instead of accepting arbitrary URLs. Where arbitrary fetches are required, I would isolate the fetcher, limit outbound network access, parse URLs with one consistent parser, and restrict schemes, ports, and destinations. DNS translates names to addresses; DNS rebinding changes those answers between validation and connection. The actual connected address must satisfy policy, including IPv4 and IPv6 handling, while preserving proper TLS hostname checks.

I would disable redirects or revalidate every hop. I would also cap bytes and time, and avoid forwarding application credentials. Input checks and network restrictions should reinforce each other.”

- **Example:** A public image endpoint returns a redirect to a link-local metadata address. The second destination must not inherit trust from the first.
- **Guarantee/cost:** Policy applies to each connection and redirect, not merely the original text. DNS/network latency dominates; bytes and hop limits bound work.
- **Trade-off/failure:** Strict allowlists reduce supported providers. A public address can still host hostile or oversized content; destination safety does not make a document safe to render.
- **Follow-ups:** “Hostname suffix match?” → Parse and compare canonical domain boundaries, not substrings. “Resolve once, connect by hostname?” → A second resolution can defeat validation.

Reference: [OWASP SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

---

**8. `computeIfAbsent` performs a slow remote catalog lookup. Why can a thread-safe map still suffer stalls?**

**Say aloud:**  
“Thread safety protects the map's structural and operation contracts; it does not make a slow mapping function harmless. ConcurrentHashMap computes an absent mapping atomically, and some other updates can wait while that computation runs. A network lookup can therefore turn a small map operation into a long contention point.

I would keep the atomic step short. If duplicate remote reads are acceptable, load outside the map and publish with putIfAbsent. If callers must share one load, I would atomically install a lightweight future placeholder, and only the winner would schedule the lookup on a bounded executor outside the map operation. That is single-flight loading: concurrent callers share one in-progress operation.

I would complete the placeholder on every terminal path, including scheduling rejection, and remove failed entries conditionally using the same placeholder identity. Otherwise an old failure can remove a newer successful entry. Capacity, expiration, and load deadlines remain separate policies.”

- **Example:** `putIfAbsent(key, mine)` chooses one owner; on failure `remove(key, mine)` avoids deleting a replacement. This is a design sequence, not a complete cache implementation.
- **Guarantee/cost:** Expected constant-time map lookup under suitable hashing; remote latency and contention dominate loading. Null results and exceptions do not establish a `computeIfAbsent` value.
- **Trade-off/failure:** Shared loads reduce duplicate work but couple callers. Do not let one caller's cancellation cancel everyone's load; bound retained placeholders.
- **Follow-ups:** “Exactly once forever?” → No; removal/failure permits another load. “Does the map protect mutable values?” → No, values need their own state contract.

Reference: [Java 21 ConcurrentHashMap atomic computations](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html).

---

**9. During a rolling release, requests are cut off even though Spring Boot graceful shutdown is configured. What would you investigate?**

**Say aloud:**  
“Graceful shutdown means stopping admission and giving active work a bounded opportunity to finish. It depends on the entire termination sequence, not just one application property. I would confirm that the process receives a normal termination signal, that traffic routing stops selecting the instance, and that the platform waits long enough before force-killing it.

For Spring Boot 3.5, I would explicitly configure graceful server shutdown and inspect the lifecycle timeout per phase. That timeout is not necessarily the total process shutdown budget. I would measure routing propagation, request drain time, and other lifecycle phases when choosing the platform allowance.

I would also distinguish HTTP requests from detached background tasks: a request returning does not prove its asynchronous side effect finished. Those tasks need their own shutdown ownership and durable recovery. I would test termination under representative long requests and persistent connections, since embedded server behavior and upstream routing affect what new traffic observes.”

```properties
# Spring Boot 3.5 contextual configuration; size budgets from measurements.
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=25s
```

- **Example:** A platform force-kills after 20 seconds while an admitted request needs 23 seconds. A 25-second application phase budget cannot override that kill.
- **Guarantee/cost:** Bounded draining is best effort, not guaranteed completion after crashes. Extra deployment time and temporarily overlapping replicas cost capacity.
- **Trade-off/failure:** Longer grace periods slow releases; unbounded jobs cannot be drained safely forever. Readiness routing and active connection handling are distinct.
- **Follow-ups:** “SIGKILL?” → No cleanup opportunity. “Client saw a timeout?” → The effect may still have committed; use the operation's recovery contract.

Reference: [Spring Boot 3.5 graceful shutdown](https://docs.spring.io/spring-boot/3.5/reference/web/graceful-shutdown.html).

---

**10. A worker's lease expires during a long pause; a replacement starts, then the old worker resumes. Why is a lease check before writing unsafe?**

**Say aloud:**  
“A lease is permission valid for a limited period. Checking it and then writing leaves a race: the worker can pause between those actions, and the lease can expire before its write arrives. A fencing token is an increasing ownership number that the protected destination uses to reject obsolete owners.

I would require lease acquisition to issue a higher token and the destination to atomically compare the token with its highest accepted ownership number while applying a write. Once token eleven has been accepted, a delayed write carrying ten must fail. Merely including the number in a log does nothing.

This guarantee has a boundary: a lower token can still be accepted before the destination has learned a higher one. If the requirement is immediate rejection at lease expiry, the destination must enforce authoritative lease validity too. Repeated requests from the current owner separately need operation IDs or sequencing; fencing is not deduplication.”

- **Example:** Destination accepts owner 11 and records its token atomically; owner 10's late update is rejected. Equal-token retries need their own rules.
- **Guarantee/cost:** Protects a destination that enforces a monotonic fence; requires atomic comparison plus mutation. Cross-resource enforcement is a separate distributed consistency problem.
- **Trade-off/failure:** Requires storage cooperation and durable token state. Local clock checks or a random owner UUID alone do not provide ordering.
- **Follow-ups:** “Counter resets?” → Can resurrect stale ownership; preserve monotonicity across recovery. “Object store cannot compare tokens?” → Use a supported conditional-write/version mechanism or redesign ownership.

This is a conceptual protocol, not a claim about a particular lock provider. It extends Q6's external-effect boundary without treating Kafka assignment generations as global fencing tokens.

---

**11. Given ordered nonnegative parcel weights and at most `days` shipments, find the minimum daily capacity without reordering or splitting parcels.**

**Say aloud:**  
“I would binary-search the answer rather than a position in the input. A capacity is feasible if a greedy scan can ship all parcels within the allowed number of days. The predicate is monotonic: if a capacity works, a larger capacity also works, because the same grouping remains valid.

The lower bound is the heaviest parcel, and the upper bound is the sum, which ships everything in one day. For each midpoint, I keep adding parcels to the current day until the next would exceed capacity, then start another day. Greedily taking the longest legal prefix cannot require more days than cutting that prefix earlier.

A feasible midpoint moves the upper bound down; an infeasible one raises the lower bound. I use long for sums and capacity, reject negative weights and nonpositive days, and define empty input as requiring zero capacity. The array remains unchanged.”

```java
static long minimumCapacity(int[] weights, int days) {
    Objects.requireNonNull(weights, "weights");
    if (days < 1) throw new IllegalArgumentException("days must be positive");
    long low = 0, high = 0;
    for (int weight : weights) {
        if (weight < 0) throw new IllegalArgumentException("negative weight");
        low = Math.max(low, weight);
        high += weight;
    }
    while (low < high) {
        long mid = low + (high - low) / 2;
        int used = 1;
        long load = 0;
        for (int weight : weights) {
            if (load + weight > mid) {
                used++;
                load = 0;
            }
            load += weight;
        }
        if (used <= days) high = mid;
        else low = mid + 1;
    }
    return low;
}
```

- **Example:** `[4, 2, 5, 3]`, two days → **8**, using `[4,2]` and `[5,3]`. Capacity 7 needs three days.
- **Guarantee/cost:** O(n log(S−M+2)) time, O(1) auxiliary space, with sum S and maximum M (both zero for empty input). Nonnegative int-array sums fit long.
- **Trade-off/failure:** Multiple scans exchange runtime for constant space. Negative weights invalidate the greedy reasoning; arbitrary reordering changes the problem.
- **Follow-ups:** “Exactly days?” → Clarify empty shipments and parcel count. “Return grouping?” → Run a final greedy pass at the computed capacity.

---

**12. Produce the maximum in every width-`k` window of an integer array in linear time, including duplicates and negative values.**

**Say aloud:**  
“I would use a monotonic deque, a queue accessible at both ends whose stored candidate values stay in decreasing order. It stores indices so I can expire entries that have left the window. Before adding a new index, I remove older candidates from the back whose values are no larger than the new value.

Those removed candidates can never win again: the new value is at least as large and expires later. The front is therefore the largest remaining value in the current window. Equal values can discard the older index safely because the newer one lasts longer.

Each index is appended once and removed at most once, either by expiration or domination, so all nested-loop work totals linear time. I would validate that k is between one and the input length, avoid mutating the array, and distinguish auxiliary deque space from the returned output.”

```java
static int[] windowMaxima(int[] values, int k) {
    Objects.requireNonNull(values, "values");
    if (k < 1 || k > values.length) throw new IllegalArgumentException("invalid window");
    var candidates = new ArrayDeque<Integer>();
    int[] result = new int[values.length - k + 1];
    for (int right = 0; right < values.length; right++) {
        while (!candidates.isEmpty() && candidates.peekFirst() <= right - k) {
            candidates.removeFirst();
        }
        while (!candidates.isEmpty() && values[candidates.peekLast()] <= values[right]) {
            candidates.removeLast();
        }
        candidates.addLast(right);
        if (right >= k - 1) result[right - k + 1] = values[candidates.peekFirst()];
    }
    return result;
}
```

- **Example:** `[5,5,-2,4,1]`, `k=3` → `[5,5,4]`. At the last window both fives have expired.
- **Guarantee/cost:** O(n) amortized total time; O(k) auxiliary storage and O(n−k+1) output. Individual insertions can remove several entries.
- **Trade-off/failure:** The deque deliberately discards values, so it cannot answer arbitrary later range queries. Storing only values makes expiry with duplicates harder to get right.
- **Follow-ups:** “k=1?” → Every element is its own maximum. “Window minimum?” → Reverse the domination comparison. “Empty input?” → No valid positive k under this contract.

---

**Today's coverage:** S04-Q01 generics variance; Q02 class-loader lifecycle; Q03 cross-row write skew; Q04 JPA relationship ownership; Q05 circuit-breaker recovery; Q06 Kafka assignment ownership; Q07 SSRF prevention; Q08 atomic map loading; Q09 graceful shutdown; Q10 destination-enforced fencing; Q11 binary search on capacity; Q12 monotonic deque maxima.

**Next set will build on:** safe schema migrations during mixed-version deployments, read replicas and read-your-writes behavior, Spring transaction event boundaries, concurrent queue publication, JVM native memory outside metaspace, Kafka tombstones and compaction, secure file processing, and graph shortest paths. Continue with Set 5 even if another run happens on 8 October; do not repeat the existing 48 scenarios.
