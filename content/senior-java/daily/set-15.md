**Set 15 · 26 October 2026 — Ordering work and proving completion**

Reference assumptions: **Java 21 without preview features**, Spring Boot 3.5 / Spring Framework 6.2, Jakarta Persistence 3.2 API contracts, PostgreSQL 17 and Kafka 4.0. These are explicit reference versions, not latest-release recommendations. Use Boot's managed persistence API/provider rather than assume it implements Persistence 3.2. Security guidance was checked on 26 October 2026. No application dependency changes.

Stable IDs: **S15-Q01–S15-Q12**, in order. Each spoken answer targets 45–90 seconds. Examples are original illustrations, not personal experience or benchmark results. Framework, broker, database, scheduler and HTTP examples are contextual designs, not runnable integrations. The two Java blocks are complete class members using `java.util.*`, compiled and behaviorally exercised from this published text with `--release 21`. Their computations are thread-confined; callers must not mutate input collections during a call.

---

**1. An async decoder receives a read-only ByteBuffer slice, yet its payload changes before decoding. What did read-only actually protect?**

**Say aloud:** “A byte buffer combines byte storage with cursor state such as position and limit. A slice creates another view of shared storage, with its own cursor. A read-only view rejects writes through that view; it does not prevent the original buffer's owner from changing the same bytes. Reusing a network buffer before asynchronous decoding finishes can therefore corrupt the decoder's input even though its view is read-only.

I would define who owns the bytes until decoding completes. Either the producer transfers ownership and cannot reuse that storage yet, or it copies the selected bytes into independently owned storage before handing off. Copying costs memory bandwidth and allocation; retaining pooled storage needs explicit lifetime accounting and bounded outstanding work. I would test by delaying the decoder, reusing the producer's buffer, and checking the decoded payload. Separate cursor state and a write-rejecting interface are useful properties, but neither establishes immutable data ownership.”

**Example:** Producer bytes `[10,20]` have a read-only slice. A producer-side absolute write replacing byte zero with 99 is observable through that slice. Copying to a fresh two-byte array before handoff preserves `[10,20]` instead. Copy only the intended remaining range, not unrelated capacity.

**Deep dive / verification:** A copy of b bytes costs O(b) time and space. Verify pooled reuse, cursor independence, exact range and completion cleanup with a controlled executor. Do not hand out another writable alias to the copied storage. Buffer access is not automatically synchronized; sharing views across threads also requires safe publication and a concurrency policy. Read-only buffers can still change their own cursor.

**Follow-ups:** *Does duplicate solve this?* It also shares bytes. *Can zero-copy be correct?* Yes, when ownership or reference counting prevents reuse until every consumer finishes; that policy must cover rejection and cancellation too.

**Primary reference:** [Java 21 ByteBuffer views, slices and read-only buffers](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/ByteBuffer.html).

---

**2. Summing a ConcurrentHashMap during live transfers produces the wrong financial total without throwing. Why is thread safety insufficient?**

**Say aloud:** “Thread safety describes valid concurrent operations; a snapshot describes one coherent state across several values. ConcurrentHashMap supports concurrent access and traversal, but iteration is weakly consistent: it does not freeze the whole map at one instant. A traversal can combine observations from different stages of a transfer, even when every individual map operation is legal.

For money moving between accounts I would first make the transfer itself atomic in the authoritative system. Then I would obtain a report using that system's consistent snapshot mechanism, or coordinate every relevant in-memory writer and the snapshot under one shared protocol. Simply copying a live concurrent map is still a traversal, so it does not manufacture a coherent cut. For approximate operational metrics, a mixed-time view may be acceptable and cheaper. For a financial invariant, I would specify the required consistency and test an interleaving that pauses a transfer between its two account updates.”

**Example:** A=100, B=0. Reader sees A=100, transfer debits A and credits B, reader sees B=100: reported total 200, although the intended total is 100. Preventing exceptions does not prevent this observation.

**Deep dive / verification:** A shared external lock works only if all participating readers and writers use it; synchronizing on the map alone does not change ConcurrentHashMap's internal protocol. Immutable whole-state replacement is another small-state design. A copy costs O(n) references and still shares mutable values. A real database transaction must use an isolation level/query shape providing the intended report snapshot. No deterministic test should require an unspecified iterator to exhibit one particular mixed observation.

**Follow-ups:** *Will size before and after prove consistency?* No; unchanged cardinality says nothing about values or a transfer's intermediate states. *Is an approximate total always wrong?* Only relative to a contract requiring an exact coherent total; label monitoring estimates honestly.

**Primary references:** [ConcurrentHashMap aggregate and iteration guarantees](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html), [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

---

**3. CI builds successfully on JDK 21, but a Java 17 container throws UnsupportedClassVersionError. Why does changing only source syntax not repair it?**

**Say aloud:** “The JVM loads compiled class files, each carrying a format version. A compiler accepting the source does not mean an older runtime can load its output. UnsupportedClassVersionError means a loaded class has a major or minor format version that runtime does not support. The incompatible class might belong to the application, generated code or a dependency loaded only on one request path.

I would inspect the runtime inside the actual container and identify the class named in the error, then inspect its class-file version and provenance. If Java 17 is the required deployment baseline, I would compile compatible source with release 17 and ensure every shipped dependency and generated class also supports it. The release option constrains language, target format and exposed platform APIs, but cannot rewrite a dependency compiled for Java 21. Otherwise I would intentionally align the deployment runtime to Java 21 and run compatibility checks there before release.”

**Example, contextual build:** `javac --release 17 Example.java` on a supporting newer JDK targets Java 17's platform API and class format. It will reject using Java 21-only APIs. Shipping an unchanged Java 21 library beside that class still leaves a runtime incompatibility.

**Deep dive / verification:** Inspect with `javap -verbose` and execute representative routes using the exact supported runtime image. Include annotation processors' generated outputs and shaded/transitive classes in the artifact audit. Source/target settings alone can allow accidental compilation against newer platform APIs; release is the intended compiler mechanism. Preview class files add minor-version/runtime restrictions; this set uses no preview. Audit cost grows with artifact/class count; successful startup alone cannot exercise all lazy class loading.

**Follow-ups:** *Is NoSuchMethodError the same problem?* No; the class format may load while an expected binary member is absent. *Can a catch block make deployment compatible?* No; fix the build/runtime/dependency contract rather than hiding a linkage failure.

**Primary references:** [Java 21 UnsupportedClassVersionError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/UnsupportedClassVersionError.html), [javac release option](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html).

---

**4. After proxyBeanMethods=false, one Bean method calls another and creates a second client. Why is singleton scope not preventing this?**

**Say aloud:** “Spring singleton scope applies to instances obtained through the container's bean definition. With full configuration proxying, calls between eligible Bean methods can be intercepted and resolved through the container. Turning proxyBeanMethods off makes those direct Java calls ordinary method calls. If the called method constructs a client, each direct invocation can construct another object instead of retrieving the managed singleton.

I would express the dependency as a parameter to the Bean factory method, so Spring supplies the registered client, and avoid depending on inter-method interception. This makes construction explicit and works with proxying disabled. I would test that consumers receive the container's client and verify resource shutdown and customization, since an extra manually created client can bypass post-processing and container-owned cleanup. Disabling proxies can be appropriate for independent factory methods, but it changes this particular call behavior; a singleton label cannot govern arbitrary constructor calls made by application code.”

**Example, contextual configuration:** Prefer `service(Client client)` returning a service built with that parameter over `service()` invoking `client()` directly when `client()` constructs a resource. Use a qualifier when multiple Client beans exist; argument type alone may be ambiguous.

**Deep dive / verification:** Test the actual application context, bean identity, applied interceptors/customizers and shutdown counts. Distinguish the configuration-class proxy from transactional proxies on produced beans. An unmanaged extra instance may allocate sockets or worker threads, so cost is the resource multiplied by unintended creations, not merely one extra reference. Do not toggle proxying globally without auditing direct calls; preserve deliberately independent factory behavior.

**Follow-ups:** *Does calling getBean avoid this?* It requests a managed instance, but method-parameter injection usually expresses the dependency more directly. *Does false turn off every Spring proxy?* No; other post-processors can still proxy the produced beans.

**Primary reference:** [Spring 6.2 Configuration proxyBeanMethods contract and alternatives](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html).

---

**5. A repair script updates a product row, but evicting the shared JPA cache leaves an active request reading the old product. Which cache was missed?**

**Say aloud:** “A persistence context is the identity-managed set of entities belonging to an EntityManager. It is distinct from an optional shared second-level cache used across contexts. If the request already holds a managed product, removing a shared cache entry does not rewrite that in-memory entity. A repeated lookup can return the same managed instance, and the database transaction's isolation may also restrict which database version is visible.

I would decide whether the request should retain its existing view or explicitly reload authoritative state at an appropriate boundary. Refresh can reload a managed entity and overwrite local changes; clearing detaches all managed entities and risks losing pending work. Neither should be added blindly to every read. I would coordinate external writers with the caching policy, then test separate contexts and actual isolation behavior. Shared-cache eviction is an invalidation action at one layer, not a universal freshness guarantee for active objects or already-open transactions.”

**Example:** Context A loads price 40. A script commits price 45 and the shared entry is evicted. A's Java object still holds 40. A new context may observe 45; refresh in A must be assessed against transaction visibility and unsaved local edits.

**Deep dive / verification:** Test first-level reuse, a new context, provider-specific shared caching, refresh after a local edit, concurrent deletion and the configured isolation level. Prefer a short service boundary with explicit freshness needs. Reloading introduces database work; disabling a shared cache alone does not disable persistence-context identity. A raw SQL repair also needs an operational invalidation plan for application caches beyond JPA.

**Follow-ups:** *Will clear update my existing Java reference?* No; it detaches, and a subsequent load may return a different instance. *Can refresh discard unsaved changes?* Yes; that is why its ownership and transaction boundary must be deliberate.

**Primary references:** [Persistence 3.2 persistence contexts and caching](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [EntityManager refresh and clear](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html).

---

**6. KafkaProducer.flush returns, so an API reports that an email was delivered. Which completion boundary is missing?**

**Say aloud:** “Flush concerns the producer's outstanding sends, not the business actions of consumers. It makes prior sends complete under their producer acknowledgement configuration, either successfully or with errors that must be observed through the send results. Even a successfully acknowledged record does not prove that a consumer has read it, committed its own work or delivered an email.

I would define separate states for publication, processing and the external effect. If the API promises completed delivery, it needs evidence from the responsible downstream workflow, with a correlation identity and an explicit definition of delivered. Often the honest API contract is asynchronous acceptance with a status resource. Kafka transactions also require their transaction boundary; flush alone is not a transaction commit. I would test a stopped consumer and a failing email provider while publication succeeds. The system should report queued or failed work accurately rather than treat a broker acknowledgement as evidence of an unrelated external effect.”

**Example, contextual sequence:** Publish notification N; flush completes; consumer is offline. N is published but no email work occurred. Even a provider's accepted response may mean queued delivery rather than arrival in a recipient's mailbox; choose the state names accordingly.

**Deep dive / verification:** Capture send failures, transaction commit outcomes, consumer-side status and provider receipts separately. Concurrent sends after flush starts are outside its prior-send guarantee. Flushing every record removes batching benefits and adds acknowledgement waiting without closing the business-completion gap. Test delayed, duplicated and missing receipts; reconcile by durable operation identity. Do not claim that this design eliminates external duplicate delivery.

**Follow-ups:** *Does a consumer offset commit prove the email arrived?* Only the consumer's progress decision, with its own crash boundaries. *Does commitTransaction prove all consumers processed the record?* No; it completes the Kafka transaction, not downstream business workflows.

**Primary reference:** [Kafka 4.0 producer flush, send and transaction contracts](https://kafka.apache.org/40/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html). The business status model above is a proposed application design.

---

**7. An outbox poller remembers the largest sequence ID it published. How can it permanently miss a smaller ID committed later?**

**Say aloud:** “A sequence allocates identifiers; it does not order transaction commits. Transaction A can reserve ID 41 and stay open while transaction B reserves 42 and commits. A poller can publish 42 and advance its high-water mark. When A later commits 41, a query restricted to IDs greater than 42 will never discover it.

I would avoid treating an allocation order as a completed prefix. One polling design repeatedly claims committed rows whose publication obligation is still pending, records progress per row, and indexes that pending state. Publication and marking still have an uncertain crash window, so consumers must tolerate duplicate identities. Another design uses a supported transaction-log capture protocol with explicit restart and retention rules; an arbitrary sequence is not that protocol. I would reproduce the two-transaction commit inversion in a database test, then crash the relay around publication. Increasing a fixed overlap window reduces some misses but cannot prove completeness when transaction delays are unbounded.”

**Example, contextual interleaving:** A inserts 41 without committing; B inserts and commits 42; relay records high-water 42; A commits. `WHERE id > 42` misses 41 forever. A row-level pending obligation remains discoverable instead, assuming it is retained until handled.

**Deep dive / verification:** Claiming must coordinate concurrent relays; a locked pending row is not proof of an empty queue. Retention must preserve pending obligations and deduplication history for the supported replay window. Test rollback gaps, very long transactions, relay death and publication success followed by marking failure. Costs include repeated pending-index scans, claims and state updates. A row ID is useful identity, not a trustworthy commit timestamp or position.

**Follow-ups:** *Would timestamps fix it?* Application insertion timestamps can precede commit too. *Can IDs be gapless?* Ordinary PostgreSQL sequence values are not reclaimed on rollback; waiting for every integer can stall forever.

**Primary references:** [PostgreSQL 17 sequence allocation and rollback behavior](https://www.postgresql.org/docs/17/functions-sequence.html), [transaction visibility](https://www.postgresql.org/docs/17/transaction-iso.html). The relay is a proposed protocol, not a sequence guarantee.

---

**8. A service returns HTTP 202 after placing a job in an in-memory executor, then restarts and loses it. What should durable acceptance mean?**

**Say aloud:** “HTTP 202 says processing was accepted but is not complete; the status code itself does not provide a durable queue or promise eventual success. If our product contract promises that an accepted export remains trackable across restarts, acceptance needs a persistent operation record and a durable path for discovering its pending work before we return that promise.

I would expose a stable operation identity and an authorized status endpoint with pending, running and terminal outcomes. A background worker claims work, renews ownership if necessary and records results; recovery finds abandoned pending or running work according to a defined policy. Retries of creation must resolve to the same logical operation when the client has an ambiguous response. Cancellation is a state transition request, not proof an irreversible effect never occurred. I would test process death immediately after acceptance and during completion, checking that status remains meaningful and recovery cannot silently lose or falsely complete the export.”

**Example, contextual API:** Creation commits operation E as pending, then returns 202 with a status URL. The response describes E's current state. If the process dies before dispatch, recovery still discovers E. Download and status both check the caller's authorization; an unguessable ID alone is insufficient.

**Deep dive / verification:** Persisting status and enqueuing elsewhere are two writes; use a durable discovery/outbox protocol rather than assume their atomicity. Define terminal retention, expiration, client polling intervals, failure detail redaction and cleanup ownership. Bound pending count and artifact bytes. Test cancel-versus-complete races with conditional state updates and prevent stale workers from overwriting a newer owner. The RFC supports asynchronous semantics; durability and these transitions are application contracts.

**Follow-ups:** *Must every 202 API promise durability?* No; document the actual acceptance contract. *Can I return success as soon as a worker starts?* Only if success means started; completion needs its own evidence.

**Primary reference:** [RFC 9110 section 15.3.3, 202 Accepted](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3). Durable lifecycle design is an explicit proposal here.

---

**9. A Java endpoint deserializes an object and then checks its type. Why can that validation happen too late?**

**Say aloud:** “Deserialization reconstructs an object graph from bytes. Java's native object serialization can invoke class-specific behavior while rebuilding that graph, before the caller receives a value to check. A gadget chain is a composition of available class behaviors that produces an unintended effect. Checking the root object's type after readObject therefore cannot undo behavior already triggered during reconstruction.

I would avoid native deserialization of untrusted data and use an explicit data schema with bounded fields and no arbitrary class selection. For a constrained legacy protocol, I would apply context-specific class and graph limits before reading objects, reject unknown types, minimize available classes and authenticate the protocol as appropriate. Filters reduce exposure but do not turn every allowed class into safe business input. I would also validate semantics and authorization after decoding, and test rejection before dangerous hooks run. Neither encrypted transport nor a small request body proves that reconstructed behavior and resource use are safe.”

**Example, contextual boundary:** An endpoint calls readObject and then checks `instanceof ExportRequest`. That check is downstream of graph reconstruction. A safer new protocol decodes fixed fields such as export type and date range into a deliberately limited request model, then validates permissions.

**Deep dive / verification:** Set resource limits for total input, arrays, graph depth and references; verify the active filter for each entry point and the treatment of undecided results. Avoid broad package allowlists and arbitrary polymorphic type metadata in replacement formats. Test oversized graphs and rejected classes in isolation. Filtering is defense in depth, not a sandbox or a fixed CPU-time guarantee. No exploit payload is needed for this lesson's acceptance criteria.

**Follow-ups:** *Is JSON automatically safe?* No; unsafe polymorphic configuration and missing bounds can recreate risks. *Is a signed payload enough?* It establishes an origin/integrity claim under its key assumptions, not safe semantics or safe reconstruction code.

**Primary references:** [Java 21 ObjectInputFilter security contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputFilter.html), [OWASP deserialization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html).

---

**10. Two tenants get equal request turns, but one sends hundred-unit jobs and dominates execution. How would cost-aware fair admission differ?**

**Say aloud:** “Fairness needs a unit. Alternating requests gives equal request counts, which can be extremely unequal in CPU, bytes or downstream work. I would define the scarce resource and a defensible job cost, then schedule bounded per-tenant queues using weighted service credits. Deficit round robin is one model: a backlogged tenant accumulates a quantum of credit on visits, and a job runs when its cost fits the credit. Carrying unused credit lets larger admitted jobs eventually become eligible.

For application jobs, estimated cost can be wrong and execution may be non-preemptible, meaning we cannot interrupt and resume it safely. I would bound job size and concurrent work, reconcile estimates with measured usage, and isolate expensive classes when needed. Fair scheduling is separate from hard admission limits and deadlines. I would verify delivered resource shares and oldest-job wait under sustained mixed workloads; equal dequeue counts alone would miss the original problem.”

**Example, contextual scheduler:** Equal-weight tenants have quantum ten units. A's jobs cost one and B's jobs cost twenty. B needs accumulated credit across visits; A must not receive an unlimited batch merely because its jobs are cheap. Idle tenants do not bank unlimited future entitlement.

**Deep dive / verification:** The Linux packet scheduler is a reference algorithm, not a ready-made Java job executor. Packet byte lengths are known; application costs and occupied resources are different. Bound tenant count, queue length, credit arithmetic and per-visit work. Test continuous small jobs alongside the largest permitted job, inaccurate cost estimates and exhausted executor capacity. Credit eligibility does not reserve a thread, guarantee a deadline or provide fleet-wide fairness automatically. Publish queue age and resource use by bounded tenant classes rather than unbounded metric labels.

**Follow-ups:** *Why not strict priority?* Continuous high-priority arrivals can starve lower classes. *Does a semaphore provide fairness by cost?* It limits permits; a separate scheduler must choose work and account for resource demand.

**Primary reference:** [Linux deficit round-robin algorithm](https://man7.org/linux/man-pages/man8/tc-drr.8.html). Its adaptation to bounded application work is a design proposal with different cost assumptions.

---

**11. Routes can include negative rebates. Return a reachable negative-cost cycle as edge IDs, or an empty list. Why is a cycle witness better than a vague shortest-path failure?**

**Say aloud:** “A negative cycle is a directed closed walk with negative total weight. If it is reachable from the source and routes may repeat edges, repeatedly following it makes some route costs decrease without bound. Dijkstra's nonnegative-weight assumption no longer applies. Bellman-Ford instead relaxes edges: it replaces a destination estimate when a reachable predecessor offers a cheaper path.

With n vertices and no reachable negative cycle, n minus one full passes suffice because a cheapest simple path uses at most that many edges. An improvement on pass n therefore identifies reachable negative-cycle influence. I keep the edge responsible for every improvement, walk backward n predecessor edges to enter a cycle, then collect and reverse those edges. Returning edge indices distinguishes parallel edges and lets the caller verify closure, reachability and negative sum. I would bound input size, use long arithmetic and test against an independent small-graph oracle, including negative cycles disconnected from the source.”

**Example:** Edges 0→1 cost 2, 1→2 cost -4 and 2→1 cost 1 yield witness edges for 1→2→1, total -3. A negative cycle in an isolated component must not be reported for source 0. Empty means no reachable negative cycle, not no route.

```java
record RouteEdge(int from, int to, int cost) {}

static List<Integer> negativeCycle(int n, List<RouteEdge> input, int source) {
    Objects.requireNonNull(input, "edges");
    if (n < 1 || n > 200 || input.size() > 10_000
            || source < 0 || source >= n) throw new IllegalArgumentException();
    List<RouteEdge> edges = List.copyOf(input);
    for (RouteEdge e : edges) {
        if (e.from() < 0 || e.from() >= n || e.to() < 0 || e.to() >= n)
            throw new IllegalArgumentException("vertex");
    }
    long[] distance = new long[n];
    Arrays.fill(distance, Long.MAX_VALUE);
    distance[source] = 0;
    int[] previousEdge = new int[n];
    Arrays.fill(previousEdge, -1);
    int changed = -1;
    for (int pass = 0; pass < n; pass++) {
        changed = -1;
        for (int id = 0; id < edges.size(); id++) {
            RouteEdge e = edges.get(id);
            if (distance[e.from()] == Long.MAX_VALUE) continue;
            long candidate = distance[e.from()] + e.cost();
            if (candidate < distance[e.to()]) {
                distance[e.to()] = candidate;
                previousEdge[e.to()] = id;
                changed = e.to();
            }
        }
        if (changed == -1) return List.of();
    }
    int inside = changed;
    for (int i = 0; i < n; i++) inside = edges.get(previousEdge[inside]).from();
    List<Integer> cycle = new ArrayList<>();
    int vertex = inside;
    do {
        int id = previousEdge[vertex];
        cycle.add(id);
        vertex = edges.get(id).from();
    } while (vertex != inside);
    Collections.reverse(cycle);
    return List.copyOf(cycle);
}
```

**Deep dive / verification:** Validation/copy costs O(n+m); relaxation costs O(nm), auxiliary storage O(n+m), including the copied m edges. At most n·m successful relaxations can extend predecessor walks by one int cost each; the admitted two million relaxations keep magnitude well inside long. Do not clamp distances to an arbitrary negative sentinel, which can hide later improvement. The witness contains at most n edges; it need not include the source-to-cycle path. Verify every returned edge against the original ordered edge list, continuity, negative sum and source reachability. Assumption: repeated routes are permitted; a negative cycle is not a license for a real unlimited rebate.

**Follow-ups:** *Must every destination have unbounded cost?* Only destinations reachable after a source-reachable negative cycle. *How can I detect any negative cycle?* Add a super-source with zero edges to all vertices, or use the equivalent all-zero initial distances; that changes the reachability contract.

**Primary reference:** [Princeton authors' Bellman-Ford implementation and negative-cycle discussion](https://github.com/kevin-wayne/algs4/blob/master/src/main/java/edu/princeton/cs/algs4/BellmanFordSP.java). This bounded pass-based implementation is original, rather than their queue-based variant.

---

**12. Find every occurrence of a pattern, including overlapping matches, without restarting comparison at every text position. What does the KMP prefix table remember?**

**Say aloud:** “Knuth-Morris-Pratt, or KMP, reuses comparisons already made. Its prefix table records, for each pattern prefix, the length of its longest proper prefix that is also a suffix. Proper means shorter than the whole prefix. When a mismatch occurs, that table tells us how much matched context can survive without rereading the text from the beginning of a candidate.

I first build the table from the pattern, then scan the text while maintaining the length of the matched pattern prefix. On mismatch I follow shorter valid borders; on a complete match I emit the start index and fall back to the longest border rather than reset to zero. That last step preserves overlapping matches. The total work is linear in text plus pattern length because matched lengths increase incrementally and fallback only spends that accumulated progress. I would specify character and empty-pattern semantics explicitly, then compare all returned indices against a simple direct-search oracle on exhaustive small strings.”

**Example:** Text `aaaaa`, pattern `aaa` returns `[0,1,2]`. Pattern prefix table `[0,1,2]` preserves two matched characters after each full match. Here indices and equality use Java UTF-16 code units, not user-perceived characters or normalized Unicode text.

```java
static List<Integer> occurrences(String text, String pattern) {
    Objects.requireNonNull(text, "text");
    Objects.requireNonNull(pattern, "pattern");
    if (pattern.isEmpty() || text.length() > 1_000_000
            || pattern.length() > 1_000_000) throw new IllegalArgumentException();
    int[] prefix = new int[pattern.length()];
    for (int i = 1, matched = 0; i < pattern.length(); i++) {
        while (matched > 0 && pattern.charAt(i) != pattern.charAt(matched))
            matched = prefix[matched - 1];
        if (pattern.charAt(i) == pattern.charAt(matched)) matched++;
        prefix[i] = matched;
    }
    List<Integer> result = new ArrayList<>();
    for (int i = 0, matched = 0; i < text.length(); i++) {
        while (matched > 0 && text.charAt(i) != pattern.charAt(matched))
            matched = prefix[matched - 1];
        if (text.charAt(i) == pattern.charAt(matched)) matched++;
        if (matched == pattern.length()) {
            result.add(i - pattern.length() + 1);
            matched = prefix[matched - 1];
        }
    }
    return List.copyOf(result);
}
```

**Deep dive / verification:** For text length n, pattern length m and z matches: O(n+m) time, O(m+z) additional storage including results. The one-million-unit bounds are admission choices, not a universal memory budget; boxed result indices and the immutable result copy add constants. Empty text gives no matches; empty pattern is explicitly rejected. Longer patterns naturally produce none. Test nested fallback, overlaps, no matches, equal strings, supplementary characters and unpaired UTF-16 surrogates under the declared code-unit model. For user-language matching, define normalization/case rules and index mapping before substituting this routine.

**Follow-ups:** *Can KMP scan streamed chunks?* Keep prefix table, matched length and a long global position across chunks; define decoding boundaries. *Does linear work mean bounded result memory?* No; a repeated one-character pattern produces one result per text unit, so streaming results may be preferable.

**Primary references:** [Princeton authors' KMP reference](https://github.com/kevin-wayne/algs4/blob/master/src/main/java/edu/princeton/cs/algs4/KMP.java), [Java 21 String UTF-16 indexing](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html). The prefix-function implementation here is original; the reference uses a different automaton representation.

---

**Topic coverage:** Shared byte ownership, coherent concurrent snapshots, JVM class compatibility, Spring factory interception, JPA cache layers, Kafka completion boundaries, sequence-versus-commit ordering, durable asynchronous operations, deserialization trust, cost-aware scheduling, negative-cycle witnesses and overlapping string search.

**Next set builds on:** causal multi-source recovery, bounded reconciliation plans, cancellation after external commitment, and algorithms that return verifiable explanations rather than only scalar results. Revisit earlier sets for foundations; these scenarios add different decision and failure boundaries.
