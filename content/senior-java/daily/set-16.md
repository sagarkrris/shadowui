**Set 16 · 27 October 2026 — Preserving meaning across boundaries**

Reference assumptions: **Java 21 without preview features**, Spring Boot 3.5 / Spring Framework 6.2, Jakarta Persistence 3.2 contracts, PostgreSQL 17 and Kafka 4.0. These are reference versions, not latest-release recommendations. Use Boot's managed persistence provider/API; do not assume it implements Persistence 3.2. Security guidance checked on 27 October 2026. No dependency upgrades.

Stable IDs: **S16-Q01–S16-Q12**, in order. Spoken answers target 45–90 seconds. Examples are original illustrations, not personal experience or benchmarks. Framework, database, broker, security and distributed protocols below are contextual designs, not runnable integrations. The two Java blocks are complete class members using `java.util.*`; the fixture compiles the published blocks with `--release 21` and tests their behavior. Calls are thread-confined and inputs must not be mutated during a call.

---

**1. Inserting a new enum constant changes the meaning of old integer status values. How should a Java service evolve persisted enums?**

**Say aloud:** “An enum is a fixed set of named constants. Its ordinal is its zero-based position in the declaration, so position is a poor durable business identifier. If I insert a status before an existing one, the same stored integer can now decode as a different state without any parsing failure. That is silent data corruption rather than a simple deployment error.

I would give each stored state a stable, explicit code and define how unknown codes are handled. Names can work when renaming is controlled, but names are also a compatibility contract. To migrate existing integers, I need the historical mapping used by each writer, not the current declaration alone. I would introduce compatible readers, translate known old values, verify counts and meaning, then change writers and retire the old format. During overlap, old replicas must not reinterpret new values. Tests should decode historical fixtures and exercise rollback, unknown values and deleted states.”

**Example:** Old declaration is `NEW, SENT`; stored 1 means SENT. New declaration `NEW, HELD, SENT` makes position 1 mean HELD. An explicit code `sent-v1` keeps its meaning across reordering. Preserve a retired code for historical reads; do not recycle it for a new business state.

**Deep dive / verification:** Distinguish custom integer encoding, a chosen JPA mapping and Java native serialization; do not assume they all encode enums identically. Changing to strings cannot recover already ambiguous integers without provenance. Unknown-state handling may reject a write or quarantine a message; mapping everything unknown to NEW can trigger unsafe actions. Migration work is O(n) rows plus index/log costs. Compare old/new decoders against exported historical samples and verify every writer and consumer before cutover.

**Follow-ups:** *Does Enum.name solve renaming?* Only if the old name remains a supported wire/storage value or is explicitly migrated. *Should UI labels be codes?* No; localized labels may change independently of durable state identity.

**Primary reference:** [Java 21 Enum name and ordinal contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Enum.html). The migration protocol is an illustrative design.

---

**2. A cache holds a ReentrantReadWriteLock read lock and then requests its write lock on a miss. Why can one thread stall itself?**

**Say aloud:** “A read-write lock allows concurrent readers while a writer needs exclusive access. Reentrancy means a thread can reacquire certain locks it already owns; it does not mean every lock mode can be upgraded. ReentrantReadWriteLock does not support acquiring the write lock while retaining a read hold. The would-be writer is itself one of the readers preventing exclusive ownership.

I would release the read lock, acquire the write lock, and recheck the miss before loading or installing anything. Another thread may populate the cache in that gap, so the recheck is part of correctness. If I need to continue reading a consistent value afterward, the supported downgrade is to acquire the read lock while holding write, then release write. I would keep slow remote work outside broad locks where practical, with a separate per-key coordination design. A simpler exclusive lock may be better when misses or writes dominate.”

**Example:** Two readers both see key X absent. After releasing read, A acquires write and inserts X. B later acquires write and must observe X before deciding whether to load it. Releasing read makes progress possible; rechecking avoids replacing A's result with a redundant stale load.

**Deep dive / verification:** Every acquisition needs matching finally-based release, including exceptions. Test the repaired miss path with barriers and bounded completion, not sleeps or an intentionally uninterruptible deadlock. A timed write tryLock while retaining a read hold can demonstrate upgrade failure without hanging a fixture. Fairness affects admission policy, not upgrade support. Measure contention and writer delay before assuming that reader parallelism improves performance; remote latency under write lock can serialize unrelated keys.

**Follow-ups:** *Can I keep one of several reentrant read holds?* No; every retained read hold prevents upgrading. *Is downgrade atomic?* A writer can acquire read before releasing write, so no other writer intervenes between those steps.

**Primary reference:** [Java 21 ReentrantReadWriteLock reentrancy and downgrading](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantReadWriteLock.html).

---

**3. A native-resource wrapper registers a Cleaner action capturing this, yet abandoned resources remain open. What went wrong?**

**Say aloud:** “Garbage collection reclaims unreachable Java objects; releasing a native handle is a separate ownership responsibility. Cleaner offers a fallback action associated with an object's reachability. If that action captures the wrapper itself, the registration keeps a path back to the object whose disappearance it is waiting for. Automatic cleanup may therefore never become eligible.

I would make the wrapper explicitly closeable and use try-with-resources at the owning boundary. Any fallback cleanup state must be separate and must not reference the wrapper, directly or through a callback. Explicit close should coordinate with the same cleanup mechanism so the handle is released at most once. Cleaner is a last-resort safety net, not a deadline or shutdown guarantee. I would test deterministic close and concurrent close/use policy directly, rather than call System.gc and assert that a file descriptor disappears within a guessed delay.”

**Example:** A static nested cleanup-state object can own only the native handle and release logic. A lambda invoking `this.releaseHandle()` retains the wrapper. In either design, the API must define whether close can race with an in-progress native operation; preventing double close alone does not make use-after-close safe.

**Deep dive / verification:** Inventory native resource count separately from live heap size. Bound outstanding handles even if allocation is cheap. Cleanup actions should avoid blocking unrelated cleanup work and must not carry business transactions. The Cleaner contract invokes an action at most once through its Cleanable, but application methods can still misuse a handle; ownership needs its own synchronization. Process termination can bypass fallback cleanup. A test should assert explicit cleanup once, rejected use after close and safe error paths, while leaving GC timing outside deterministic assertions.

**Follow-ups:** *Will a small heap force prompt release?* No; heap pressure does not establish the required resource lifetime. *Can the cleanup state store a helper?* Only if that helper has no reference chain back to the wrapper and has an appropriate lifetime.

**Primary reference:** [Java 21 Cleaner reachability, explicit cleaning and termination limits](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/Cleaner.html).

---

**4. An inner Spring method declares SERIALIZABLE, but a caller already has a READ_COMMITTED transaction. Why may the stronger isolation never take effect?**

**Say aloud:** “Isolation specifies which concurrent database observations and anomalies a transaction permits. With Spring's REQUIRED propagation, an intercepted inner method normally joins the caller's physical transaction instead of starting another one. Its annotation does not retroactively strengthen a transaction that has already begun. By default, participating declarations can therefore inherit the outer isolation even when the inner declaration asks for something stronger.

I would put the required isolation at the boundary that actually starts the complete business transaction. I would also consider strict validation of incompatible participating declarations so accidental callers fail visibly. A separate transaction is possible, but it changes atomicity, connection usage and visibility, so REQUIRES_NEW is not a mechanical replacement. I would verify the real transaction manager, database and proxy call path with concurrent integration tests that exercise the business invariant. Seeing SERIALIZABLE in source code is evidence of intent, not proof of the active database transaction's behavior.”

**Example:** READ_COMMITTED excludes reading another transaction's uncommitted changes. SERIALIZABLE requires successful concurrent transactions to behave like some one-at-a-time ordering, with retries when conflicts abort work. An order facade starts READ_COMMITTED and calls a separate proxied reservation service using REQUIRED plus SERIALIZABLE. The reservation work participates in the facade's transaction. Move the invariant and appropriate isolation to the outer operation, or redesign the boundary deliberately; self-invocation would add a separate interception problem.

**Deep dive / verification:** Spring's transaction manager can reject incompatible isolation via its existing-transaction validation setting. Driver/database support and retry of serialization failures still matter. Validate actual connection isolation and the complete concurrent outcome, not annotation presence. Independent inner commits may survive an outer rollback and cannot necessarily see its uncommitted changes. Stronger isolation can increase aborts and contention; retry the whole bounded operation from a clean transaction rather than only its last statement.

**Follow-ups:** *Does NESTED establish independent isolation?* A savepoint-based nested scope normally shares the physical transaction. *Should every method use SERIALIZABLE?* Choose it from invariant and workload requirements, then measure abort rate and latency.

**Primary reference:** [Spring Framework 6.2 REQUIRED participation and isolation validation](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/tx-propagation.html).

---

**5. A JPA SELECT throws a unique-constraint error caused by an earlier entity edit. Why did a read appear to perform a write?**

**Say aloud:** “A persistence context tracks changes to managed entities. Flushing synchronizes pending changes to the database; committing completes the transaction. Under AUTO flush mode, a query executed in a joined transaction must see relevant pending changes. A provider can satisfy that requirement by flushing before the query, which can expose an earlier invalid update while the stack trace points at SELECT execution.

I would inspect pending entity changes and emitted SQL before blaming the query predicate. I would fix the invalid mutation or order the business steps so constraints remain valid at synchronization boundaries. Switching to COMMIT flush mode just to hide the exception can change query visibility and postpone the same failure until commit. I would reproduce the issue using the actual provider and database, including constraint timing. A successful read statement is not a guarantee that no write synchronization occurred around it, and a successful flush is still not a committed transaction.”

**Example:** A managed customer is assigned an email already used by another customer. A query over customer emails can trigger synchronization of that dirty entity, and the database rejects the update. The meaningful defect is the invalid state transition, even though execution first fails at the query call.

**Deep dive / verification:** AUTO guarantees visibility of relevant updates, not one universal SQL schedule; a provider may use other means. COMMIT mode leaves the effect of pending changes on query results unspecified by the contract. Outside a transaction, or when the context is not joined, the provider must not flush to the database. Test SQL order, resulting rollback status and final committed rows. Handle the failed operation at a safe transaction boundary; do not assume catching the persistence exception restores a usable transaction.

**Follow-ups:** *Does calling save explicitly control every write?* No; managed dirty state can be synchronized without that call. *Can a deferred constraint fail later?* Yes; database constraint timing can move detection to commit, so test the deployed schema.

**Primary reference:** [Jakarta Persistence 3.2, section 3.11.2 Queries and Flush Mode](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html). Verify Boot's managed provider separately.

---

**6. A Kafka group uses auto.offset.reset=latest and misses records written to a newly added partition. Why did existing committed offsets not protect it?**

**Say aloud:** “A consumer group's offset is progress for a particular topic partition. An offset committed for partition zero says nothing about a new partition. Auto offset reset selects a starting position when valid progress is unavailable; it is not a continuously applied choice between old and new messages. If producers write to a new partition before the consumer initializes it, resetting that partition to latest can start after those records.

I would decide the bootstrap contract before changing partition topology. For a group that must process every retained event, I would establish the intended starts and verify assignment before enabling new writes, or choose an appropriate reset policy and tolerate replay safely. Earliest only reaches retained data, not deleted history. None can fail visibly when progress is missing, but requires an operational recovery procedure. I would test a paused consumer, partition expansion, early producer writes and first assignment rather than infer coverage from healthy lag on the old partitions.”

**Example:** The group has offsets for partitions 0 and 1. Partition 2 receives offsets 0 through 8 before its first assignment. A latest reset can begin at 9. Existing offsets are valid yet irrelevant to partition 2. A later low lag metric cannot prove the first nine records were processed.

**Deep dive / verification:** Audit every partition's initial position and retain a source-of-truth reconciliation path for critical events. Reset policy also matters when stored progress falls outside retained offsets. Do not reset an active group casually: replay can duplicate effects, while skipping can permanently omit them. Partition expansion can additionally change key placement; that separate ordering contract needs review. Retention, recovery time and deduplication horizons must align with the intended replay window.

**Follow-ups:** *Will latest discard already committed valid progress?* No; reset policy applies when suitable progress is absent or invalid. *Is earliest a complete recovery mechanism?* Only for records still available and with correct downstream replay semantics.

**Primary reference:** [Kafka 4.0 consumer auto.offset.reset, including partition expansion warning](https://kafka.apache.org/40/configuration/consumer-configs/#auto.offset.reset).

---

**7. A projection consumes two databases. Can saving the larger of their log positions prove a consistent recovery point?**

**Say aloud:** “A log position is meaningful within its source history. Independent sources do not share one ordered coordinate, so taking the maximum of their positions discards information. A checkpoint for two sources needs both positions and source identities. Even that pair only records how far each source was processed; it does not automatically describe a causally consistent business snapshot.

I would define whether the projection accepts temporary mismatch or requires related changes to be observed together. For eventual views, I would store per-source progress atomically with the corresponding projection effects and make replay safe. For a consistent cut, I need an explicit coordination or dependency protocol, such as buffering an event until its referenced source revision is included. I would retain the required history and test recovery with one source delayed or restored. I would never compare raw log numbers from different databases as though larger meant more globally complete.”

**Example, conceptual protocol:** A causal dependency means one event relies on an earlier fact. A projection is a derived view built from source changes. A shipment event from source B references order revision A:17. Restoring progress `{A:16, B:40}` may include that shipment before its order revision. Buffer or mark the dependent view incomplete until A:17 arrives. Positions need source identity and a defined generation/history identity after replacement or restore.

**Deep dive / verification:** A vector of k source positions costs O(k) metadata; pending cross-source dependencies may grow without bound during an outage, so bound buffering and expose degraded freshness. Atomic local checkpoint/effect storage solves one crash window, not cross-source transaction consistency. PostgreSQL logical decoding may resend recent changes after a crash; process them without repeating business effects. Test lag, duplicates, missing history, source replacement and checkpoint restore from the same projection backup. This is a designed protocol, not a built-in multi-database snapshot guarantee.

**Follow-ups:** *Can timestamps replace source positions?* Clocks and equal timestamps do not establish a complete causal order. *What if dependencies never arrive?* Alert, quarantine or rebuild from authoritative retained state; never silently certify completeness.

**Primary reference:** [PostgreSQL 17 logical decoding, per-source slots and replay responsibility](https://www.postgresql.org/docs/17/logicaldecoding-explanation.html). The multi-source protocol and causal example are original design reasoning.

---

**8. A cancellation request arrives after a payment provider charged the card but before the worker saved success. Can the API promise CANCELLED?**

**Say aloud:** “Cancellation is a request to stop work under a defined contract, not time travel. Once an external charge may have committed, stopping the local thread cannot prove that the effect did not happen. I would distinguish cancellation requested, confirmed cancellation before the effect, successful completion, and an outcome still being reconciled. A refund is a new compensating action, not evidence that the charge never existed.

I would persist the operation identity and intent, use the provider's idempotency and lookup contract, and reconcile ambiguous outcomes before declaring a final state. Local conditional transitions can prevent two workers from choosing contradictory local terminal states, but cannot atomically control the provider without its cooperation. The API should expose uncertainty honestly and restrict status access to the owning user. I would test cancellation at each external boundary, including after provider success but before local persistence, and verify that retries never silently create another charge.”

**Example, conceptual state machine:** A charge is sent under operation P7. The reply is lost; a cancel request records cancellation intent. P7 remains RECONCILING while the service asks the provider for that operation's outcome. If charged, policy can request one idempotent refund and report REFUND_PENDING, then REFUNDED after confirmation.

**Deep dive / verification:** Define the irreversible boundary with the provider and business policy. Bound retries and reconciliation frequency; retain ambiguous operations durably instead of expiring them into apparent success. A 202 response accepts work but does not certify cancellation completion. Separate user intent, provider outcome and compensation outcome so one overloaded status cannot conceal money movement. Audit transitions with operation IDs while excluding payment credentials. Test duplicate cancel, stale worker, late callback, refund failure and authorization on polling.

**Follow-ups:** *Is interrupting the worker enough?* It can stop cooperative local work but cannot revoke an already committed external effect. *May completion win a race with cancel?* Yes, if the documented contract and recorded evidence support it; return that outcome consistently.

**Primary reference:** [RFC 9110 section 15.3.3, accepted versus completed processing](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3). Payment state transitions are a contextual design requiring the provider's actual contract.

---

**9. An XML import validates fields after parsing, yet parsing makes an outbound request. Where should XXE protection happen?**

**Say aloud:** “XML external entities let a document refer to external resources through its document-type definition. XXE is the abuse of that feature to read files, make server-side requests or expose data. Field validation after parsing is too late if the parser already resolved a reference while constructing the document.

For an import format that needs no document-type definition, I would reject those declarations and disable external resolution on the actual parser before processing untrusted bytes. I would also control XInclude, schema and transformation resource access where those stages exist. Parser APIs and providers differ, so I would treat unsupported required hardening as startup failure rather than log it and continue. This also needs input, nesting and expansion limits; blocking network references alone does not bound all XML work. I would test the exact configured parser using harmless external-reference fixtures and verify that no resolver or network access occurs before rejection.”

**Example, contextual parser policy:** A DTD is a document-type definition; XInclude is a separate XML inclusion mechanism. A customer import permits elements and text but no DTD. Configure the selected Java DOM factory to reject DOCTYPE before building its parser; apply supported external DTD/schema access restrictions and keep XInclude disabled. Do not fetch an untrusted schema to determine whether the document is safe.

**Deep dive / verification:** Secure-processing settings are useful limits, not a substitute for an explicit external-resource policy. Inventory every parsing entry point, including framework mappers and validation/transformation stages; hardening one factory does not change another. Bound decoded bytes and processing resources and avoid echoing sensitive parser diagnostics to users. A local resolver that records attempted resolution is a safer fixture than reading real secret files. Test legitimate imports, DTD rejection, unsupported features and separate schema resolution with the deployed provider.

**Follow-ups:** *Is HTTPS resolution safe?* It still lets input choose a server-side destination and consume resources. *Must all XML be rejected?* No; keep the required data format and remove unnecessary parser capabilities under a tested policy.

**Primary references:** [OWASP XML external entity prevention](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html), [Java 21 DocumentBuilderFactory configuration](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html).

---

**10. A team duplicates every slow read to a second replica. When can hedged requests improve latency, and when can they amplify an outage?**

**Say aloud:** “A hedged request sends a delayed duplicate of eligible work and uses a suitable successful result. It targets occasional slow replicas, but it adds load. If replicas share an overloaded database or failure domain, both attempts can be slow and the extra work can make the tail worse. The benefit depends on workload and failure correlation, not a universal probability formula.

I would start with bounded, safe reads, a measured delay, one total deadline and a strict budget for extra attempts. Each attempt needs its own admission check; a hedge should not bypass an overloaded dependency's limits. The coordinator should accept the first valid success, distinguish errors from successes, and cancel losing local work where supported. Cancellation may not stop downstream execution, so I would count actual extra work. I would compare latency and dependency utilization under normal load, a single slow replica and shared overload before enabling hedging broadly.”

**Example, illustrative figures:** With a 300 ms total budget, allow one extra attempt after 80 ms only if the first is still incomplete and hedge capacity remains. An immediate 503 from attempt B is not a reason to discard a still-viable A. Both attempts must preserve tenant, authorization and freshness requirements.

**Deep dive / verification:** Specify what makes a result acceptable before racing replicas with different lag. Model two attempts maximum per operation and a fleet-wide extra-load budget, not only a per-thread counter. Disable or reduce hedges during saturation and measure queued, cancelled and still-running losers. Hedging side-effecting operations needs a stronger deduplication contract and may remain inappropriate. Use a controlled scheduler to test success/error ordering and expired deadlines; use load tests to assess capacity because functional tests cannot prove a tail-latency improvement.

**Follow-ups:** *Is this the same as a retry?* A hedge overlaps outstanding work; a retry often follows a known failure, though both consume the same attempt budget. *Do independent replicas guarantee independent delays?* No; shared storage, network and workload can correlate them.

**Primary reference:** [Dean and Barroso, The Tail at Scale](https://research.google/pubs/the-tail-at-scale/). Budgets and acceptance policy above are illustrative design choices, not reported benchmark results.

---

**11. Return the IDs of network links whose individual removal increases the component count. How do bridges work with parallel links and disconnected graphs?**

**Say aloud:** “A bridge is an undirected edge whose removal disconnects vertices that were previously connected. Depth-first search gives each vertex a discovery number. For each explored subtree, I also track the earliest discovery number reachable through its tree edges followed by a back edge. This low value tells me whether the subtree has an alternative connection above its parent edge.

After finishing a child, the parent edge is a bridge exactly when the child's low value exceeds the parent's discovery number. I must skip the exact parent edge ID, not every edge to the parent vertex: a second parallel link is a valid alternative. I restart traversal at every unvisited vertex, since the input may already be disconnected. An explicit stack avoids recursion depth failure on a long chain. I would validate the result independently by removing each edge on small graphs and recounting connected components, including self-loops and parallel links.”

**Example:** Triangle 0–1–2–0 plus link 2–3 has only the last edge as a bridge. Two separate links between 2 and 3 make neither link a bridge. Isolated vertices add components but no bridge IDs.

**Contract and mechanism:** Depth-first search (DFS) follows a branch before returning to explore alternatives. A tree edge first discovers a vertex; a back edge connects a descendant to an ancestor. A component is a maximal group connected by paths. Vertices are 0 through n−1; input-list position is the stable edge ID. Accept n=0 with no edges, self-loops, duplicates and disconnected graphs. Reject nulls, invalid endpoints, n above 200,000 or more than 400,000 edges. Output IDs are ascending and immutable; input is unchanged. Scan the boolean result array rather than sort, keeping O(V+E) time and space. The iterative stack stores the active DFS path; each adjacency entry is consumed once.

```java
record Link(int u, int v) {}
record Arc(int to, int id) {}

static List<Integer> bridges(int n, List<Link> links) {
    Objects.requireNonNull(links);
    if (n < 0 || n > 200_000 || links.size() > 400_000)
        throw new IllegalArgumentException("graph size");
    List<List<Arc>> adjacency = new ArrayList<>(n);
    for (int v = 0; v < n; v++) adjacency.add(new ArrayList<>());
    int id = 0;
    for (Link e : links) {
        Objects.requireNonNull(e);
        if (e.u() < 0 || e.u() >= n || e.v() < 0 || e.v() >= n)
            throw new IllegalArgumentException("endpoint");
        adjacency.get(e.u()).add(new Arc(e.v(), id));
        adjacency.get(e.v()).add(new Arc(e.u(), id++));
    }
    int[] discovered = new int[n], low = new int[n];
    int[] parent = new int[n], parentEdge = new int[n], next = new int[n];
    Arrays.fill(discovered, -1);
    Arrays.fill(parentEdge, -1);
    boolean[] bridge = new boolean[links.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    int clock = 0;
    for (int root = 0; root < n; root++) {
        if (discovered[root] != -1) continue;
        discovered[root] = low[root] = clock++;
        stack.push(root);
        while (!stack.isEmpty()) {
            int v = stack.peek();
            if (next[v] < adjacency.get(v).size()) {
                Arc a = adjacency.get(v).get(next[v]++);
                if (a.id() == parentEdge[v]) continue;
                int w = a.to();
                if (discovered[w] == -1) {
                    parent[w] = v;
                    parentEdge[w] = a.id();
                    discovered[w] = low[w] = clock++;
                    stack.push(w);
                } else {
                    low[v] = Math.min(low[v], discovered[w]);
                }
            } else {
                stack.pop();
                if (parentEdge[v] != -1) {
                    int p = parent[v];
                    bridge[parentEdge[v]] = low[v] > discovered[p];
                    low[p] = Math.min(low[p], low[v]);
                }
            }
        }
    }
    List<Integer> result = new ArrayList<>();
    for (int e = 0; e < bridge.length; e++) if (bridge[e]) result.add(e);
    return List.copyOf(result);
}
```

**Deep dive / verification:** A visited descendant cannot lower low[v] below discovered[v]; an ancestor back edge can. Propagate low only after the child's subtree finishes. Parallel edges require edge identity throughout traversal. The fixture compares against independent component recounts on exhaustive small graphs and seeded multigraphs, then tests a 200,000-vertex chain for stack safety. Directed strong connectivity and simultaneous multi-edge cuts are different questions.

**Follow-ups:** *Why strictly greater rather than greater-or-equal?* Equality means the child subtree can return to the parent via another edge, so removing this tree edge need not disconnect it. *Does this prove real network resilience?* Only for this static undirected single-link failure model; correlated failures require a different model.

**Primary reference:** [Java 21 ArrayDeque operation costs and thread confinement](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html). The low-link invariant, proof and multigraph implementation are derived above and checked against edge-removal oracles.

---

**12. Find a maximum-sum contiguous segment whose length is between L and R. Why does a deque of eligible prefix minima handle negative values?**

**Say aloud:** “A prefix sum stores the total before each boundary. A segment ending at boundary end has sum prefix[end] minus prefix[start]. The length restriction says start must lie between end minus R and end minus L. For each end, I therefore need the smallest prefix sum in that moving range, not an unrestricted best segment.

I keep eligible starts in a deque with nondecreasing prefix sums. A newly eligible start removes larger prefixes from the back because they produce a worse sum and expire earlier. Starts that are too old leave from the front. The front is then the best legal start for that end. Keeping equal prefixes preserves the earlier start for a deterministic tie rule. Each index enters and leaves at most once, giving linear time even with negative values. I would use long sums and compare every small result with direct enumeration of all legal segments, including all-negative arrays.”

**Example:** Values `[4,-10,7,3,-2]`, L=2, R=3 yield sum 10 at `[2,4)` containing `[7,3]`. Indices are zero-based and the end is exclusive. For `[-5,-2,-9]` and L=1, the answer is −2, not an empty segment worth zero.

**Contract:** A deque is a double-ended queue supporting insertion/removal at both ends. Require nonnull input, 1 ≤ L ≤ R ≤ n and n ≤ 1,000,000. Return sum and boundaries; ties choose smallest start, then smallest end. Never modify input. O(n) time, O(n) space for prefixes and eligible indices. With at most one million int values, long arithmetic safely represents every prefix and segment sum.

```java
record Segment(long sum, int start, int end) {}

static Segment bestSegment(int[] values, int minLength, int maxLength) {
    Objects.requireNonNull(values);
    int n = values.length;
    if (n > 1_000_000 || minLength < 1 || maxLength < minLength || maxLength > n)
        throw new IllegalArgumentException("length bounds");
    long[] prefix = new long[n + 1];
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + values[i];
    Deque<Integer> starts = new ArrayDeque<>();
    Segment best = null;
    for (int end = minLength; end <= n; end++) {
        int added = end - minLength;
        while (!starts.isEmpty() && prefix[starts.peekLast()] > prefix[added])
            starts.removeLast();
        starts.addLast(added);
        while (starts.peekFirst() < end - maxLength) starts.removeFirst();
        int start = starts.peekFirst();
        long sum = prefix[end] - prefix[start];
        if (best == null || sum > best.sum()
                || (sum == best.sum() && (start < best.start()
                || (start == best.start() && end < best.end())))) {
            best = new Segment(sum, start, end);
        }
    }
    return best;
}
```

**Deep dive / verification:** The newly added start is legal because minLength ≤ maxLength, so expiration cannot empty the deque. Removing only strictly larger prefixes retains equal candidates in age order. Initializing from an actual segment avoids inventing an empty solution. A normal positive-only sliding window cannot reason about arbitrary negative values. Tests should independently verify sum, boundaries and tie selection with direct nested loops, then check extreme int values and million-element bounds.

**Follow-ups:** *What if I use greater-or-equal for removal?* Maximum sum remains attainable, but dropping an earlier equal prefix can violate the stated tie rule. *Can space be reduced?* A streaming design can retain only the required prefix history and deque, but must preserve delayed eligibility and absolute output indices.

**Primary references:** [Java 21 ArrayDeque amortized operations](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html), [Java language integer types and arithmetic](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.2). The moving-prefix proof and algorithm are derived above.

---

**Topic coverage:** S16-Q01 durable Java state identity; Q02 lock mode transitions; Q03 JVM reachability and native ownership; Q04 Spring transaction participation; Q05 JPA synchronization; Q06 Kafka bootstrap; Q07 multi-source recovery; Q08 microservice cancellation after external commitment; Q09 XML security; Q10 bounded hedging and correlated load; Q11 iterative low-link graph analysis; Q12 constrained prefix optimization.

**Next set will build on:** evidence-backed cutover criteria, bounded dependency buffering and safe resource handoff, then coding problems that reconstruct explanations rather than only return a scalar. Revisit the [Senior Java guide](/senior-java-interview) for foundations or [all daily sets](/senior-java-interview/daily) for sequential practice.
