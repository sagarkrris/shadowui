**Set 6 · 12 October 2026 — Contracts, visibility, and algorithmic choices**

Twelve new scenarios following the 60 questions in Sets 1–5. Reference versions: **Java 21 without preview features**, HotSpot 21 with G1, Spring Framework 6.2 (Spring Boot 3.5 context), Jakarta Persistence 3.2, PostgreSQL 17, Kafka 4.0, and HTTP semantics from RFC 9110. These assumptions are explicit compatibility targets, not claims of latest releases. Examples are original illustrations, not personal experience.

Practise each **Say aloud** answer in 45–90 seconds. Stable IDs: **S06-Q01–S06-Q12**, in order. The two Java blocks are executable methods/nested classes with a supplied `java.util.*` import and class wrapper. Other examples describe protocols or faulty fragments, not complete deployable services.

---

**1. A Java API limits a nickname to 20 characters using String.length(). Why can an emoji fail the product's expectation?**

**Say aloud:**
“First I would define what character means in the product contract. Java strings use UTF-16 code units, and length counts those units. A supplementary Unicode code point needs two units. A code point is a Unicode value; it still need not equal one visible character, because combining marks and joined emoji can form a single grapheme cluster, meaning a user-perceived character.

For a code-point limit, I would count code points and truncate at code-point boundaries. For a visible-character limit, I would choose a tested segmentation implementation and specify its Unicode version. For a storage or transport limit, I would separately validate encoded byte size. These are different constraints.

I would test supplementary symbols, combining accents and joined emoji. Normalization policy must be explicit, especially for identifiers; visually similar strings should not silently become interchangeable security identities.”

- **Example:** `"A😀".length()` is 3, while `codePointCount(0, length())` is 2. An accent composed from `e` plus a combining mark is two code points, often one visible character.
- **Guarantee/cost:** Code-point counting is O(n) in UTF-16 units; boundary-aware truncation avoids splitting a valid surrogate pair.
- **Trade-off/failure:** Code-point counts do not implement grapheme limits. Decide whether malformed surrogate sequences are rejected at ingress.
- **Follow-ups:** “Database limit?” → Check byte/character semantics and encoding separately. “Equality?” → Exact Java equality is not a normalization or human-identity policy.
- **Primary references:** [Java 21 String contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html), [Unicode text segmentation](https://www.unicode.org/reports/tr29/).

---

**2. A queue worker catches InterruptedException, logs it, and continues. Why does shutdown sometimes never complete?**

**Say aloud:**
“Interruption is a cooperative request for a thread to change course; it is not a forced stop or transaction rollback. An interruptible blocking operation can throw InterruptedException and clear the thread's interrupt status. If the worker logs that exception and resumes its loop, it may discard the only shutdown signal.

At a worker boundary that owns its lifecycle, I would end the loop and release owned resources in finally. At a lower-level method, I would usually propagate the exception. If the signature cannot propagate it, I would restore the status and return an explicit failure so the caller can stop. Restoring the status and immediately blocking again can create a repeated-exception loop.

CPU-bound work needs periodic cancellation checks; network calls need their own timeout and cancellation contracts. Shutdown must stop admission and await termination with a deadline, then report remaining work honestly.”

- **Example:** Worker boundary: `catch (InterruptedException stop) { Thread.currentThread().interrupt(); return; }`, with owned cleanup in `finally`.
- **Guarantee/cost:** `isInterrupted()` observes without clearing; `Thread.interrupted()` observes and clears. Polling every b work units bounds detection in work units, not wall-clock time.
- **Trade-off/failure:** Interrupted work may already have effects. Do not blindly retry it or interrupt borrowed shared threads.
- **Follow-ups:** “shutdownNow?” → Best-effort interruption, not proof of completion. “Noninterruptible I/O?” → Use the transport's documented timeout/close mechanism.
- **Primary reference:** [Java 21 Thread interruption](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html#interrupt()).

---

**3. A G1 service starts allocating large byte arrays and suffers Full GC despite apparently free heap. What evidence would you seek?**

**Say aloud:**
“G1 divides the heap into regions. A humongous object is an object larger than half a region; it needs contiguous regions. Free bytes spread across the heap may therefore be insufficient for a particular large allocation. This is a different diagnosis from simply having too many retained business objects.

I would correlate allocation sizes and rate with region size, humongous-region counts, concurrent collection activity and Full GC causes. GC logs and an allocation profile can show whether a new buffering path repeatedly creates these arrays. I would reproduce using representative payload sizes before tuning.

The first design option is bounded streaming or chunking if the operation permits it. A region-size or heap change is an experiment with memory and pause trade-offs. I would measure throughput and tail latency, and preserve native-memory headroom rather than increasing heap until the container fails.”

- **Example:** With 2 MiB regions, arrays whose total object size exceeds 1 MiB enter the humongous category; headers count toward size.
- **Guarantee/cost:** This is a HotSpot 21 G1 allocation rule, not a universal collector rule. Chunking can bound buffer memory by chunk size plus in-flight chunks.
- **Trade-off/failure:** Streaming may change retry or random-access semantics. Larger regions can waste space; tuning alone may conceal unbounded buffering.
- **Follow-ups:** “Proof of a leak?” → No; inspect retention separately. “Pause target?” → A goal, not a maximum-latency guarantee.
- **Primary references:** [HotSpot 21 G1 allocation overview](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html), [G1 tuning and fragmentation](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-garbage-collector-tuning.html).

---

**4. PostgreSQL ignores an index on status after most shipments become DELIVERED. Is the planner broken?**

**Say aloud:**
“Selectivity means the fraction of rows a predicate matches. If delivered shipments are most of the table, an index scan may require many scattered table accesses; a sequential scan can be cheaper. The existence of an index does not prove it is the best access path.

I would inspect the actual query, bound parameters, row distribution and statistics. On safe representative data, EXPLAIN ANALYZE with BUFFERS compares estimated and actual rows and shows execution and buffer activity. It executes the query, so writes and expensive reads need controlled handling. Large estimate errors suggest stale statistics or correlated columns; accurate estimates with high work suggest a query or index design issue.

For a tenant's recent pending shipments, a composite or partial index might match the real predicate and ordering better. I would verify the resulting plan and write overhead rather than forcing index use globally.”

- **Example:** `WHERE tenant_id = :tenant AND status = 'PENDING' ORDER BY created_at DESC LIMIT 50` is a different workload from returning every delivered shipment.
- **Guarantee/cost:** Plans are cost estimates, not complexity or runtime promises. Count scanned rows, buffers, sorting and returned rows.
- **Trade-off/failure:** Extra indexes cost storage and write work. Parameterized predicates may prevent proving a partial-index condition.
- **Follow-ups:** “ANALYZE?” → Refreshes statistics. “Only estimated plans?” → Useful routing evidence, but no measured execution proof.
- **Primary references:** [PostgreSQL 17 EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html), [partial-index predicates](https://www.postgresql.org/docs/17/indexes-partial.html).

---

**5. Two browser tabs overwrite each other's profile edits. How would an ETag and If-Match prevent a lost update?**

**Say aloud:**
“An ETag is an opaque validator for a representation. I would return a strong validator with the profile and require an If-Match condition on a state-changing request. A strong validator distinguishes representations without the weak equivalence allowed by a weak ETag. If the supplied version no longer matches, the server rejects the update, normally with 412 Precondition Failed.

The comparison and write must share one atomic database operation or correctly locked transaction. Checking the validator, then saving separately, still has a race. I would bind the validator to the selected resource and ensure every relevant writer advances its version. Authentication and object authorization remain required.

The client should retrieve the current representation and offer a deliberate merge after conflict. Blindly retrying with the new validator defeats the protection. This prevents stale replacement; it does not deduplicate a creation or guarantee retries have no effects.”

- **Example:** `UPDATE profile SET name=:name, version=version+1 WHERE tenant_id=:tenant AND id=:id AND version=:expected`; one affected row wins, zero triggers scoped conflict/not-found handling.
- **Guarantee/cost:** One atomic version predicate closes the check/write race. Cost depends on the database access path.
- **Trade-off/failure:** Define representation variants and version coverage. `If-Match: *` checks existence, not that the caller read the current version.
- **Follow-ups:** “Weak ETag?” → If-Match uses strong comparison. “Missing condition?” → Enforce and document the API's precondition policy.
- **Primary reference:** [RFC 9110 If-Match](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match).

---

**6. A singleton Spring service injects a prototype report builder, yet requests share the same builder. Why?**

**Say aloud:**
“Bean scope controls how the container obtains instances. A singleton is normally one instance per bean definition per container; a prototype creates an instance when requested from the container. Ordinary dependency injection into a singleton happens when that singleton is built. It therefore captures one prototype instance, rather than requesting a fresh one for each later business call.

I would make the builder stateless if possible. If each operation needs mutable construction state, I would inject an ObjectProvider and obtain a prototype inside the operation, or use a clear application factory. Request scope is another choice only when its lifecycle matches the work, including asynchronous boundaries.

I would also assign cleanup ownership. Spring does not automatically run destruction callbacks for prototype instances after handing them out. Obtaining new objects solves instance sharing; it does not automatically solve resource leaks, downstream capacity or safe publication.”

- **Example:** A singleton holds `ObjectProvider<ReportBuilder>`; each operation calls `getObject()` when ReportBuilder is configured as prototype, uses it locally and closes resources it owns.
- **Guarantee/cost:** A provider respects the target scope; it does not make singleton targets fresh. Prototype creation incurs construction/dependency cost per acquisition.
- **Trade-off/failure:** Avoid hidden per-call database/client construction. Do not capture the newly acquired builder back into a shared field.
- **Follow-ups:** “Scoped proxy?” → Resolves against the active scope; verify invocation semantics. “New manually?” → Bypasses container injection and lifecycle.
- **Primary references:** [Spring bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html), [Spring 6.2 ObjectProvider](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/ObjectProvider.html).

---

**7. An order editor removes a line item, but the row survives. Should cascade REMOVE fix it?**

**Say aloud:**
“Cascade REMOVE propagates removal of the parent entity to related entities. Removing one child from a relationship is a different operation. For a privately owned order line, orphanRemoval can schedule removal when that line leaves the relationship. The delete occurs at flush, when pending persistence changes are synchronized with the database, rather than necessarily at the collection call.

I would load the managed order in a transaction, validate that the requested line belongs to it, and use a domain removal operation that keeps both sides consistent. Then I would flush, clear the persistence context and reload to verify the stored outcome. Clearing removes managed-state shortcuts from that verification.

Orphan removal fits exclusive ownership, not shared catalog products or reparenting workflows. I would model those separately. New, detached or already removed targets have different semantics, so replacing a detached collection is not a reliable universal deletion recipe.”

- **Example:** A managed order's `lines` relationship has `orphanRemoval=true`; removing line L updates the collection and clears L's order reference through a domain method. The product referenced by L remains shared.
- **Guarantee/cost:** Portable orphan deletion is applied at flush; SQL count depends on mapping/provider. Do not assume deletion order or reassign an orphan elsewhere.
- **Trade-off/failure:** Accidental collection replacement can delete owned data. Validate IDs and authorization before changing relationships.
- **Follow-ups:** “Delete parent?” → Orphan removal also cascades parent removal. “Shared child?” → Use an explicit association lifecycle instead.
- **Primary reference:** [Jakarta Persistence 3.2 relationship removal semantics](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

---

**8. A Kafka dashboard stops seeing new records behind an open transaction. How can read_committed explain the delay?**

**Say aloud:**
“Kafka transactions group writes, and can include consumed offsets, into a commit-or-abort outcome within Kafka. A read_committed consumer filters aborted transactional records. It also reads only up to the last stable offset, which is limited by the earliest still-open transaction in that partition. Later records can therefore wait even when their own producer has finished.

I would inspect transaction age, producer health, broker transaction limits and the consumer isolation setting before blaming an idle consumer. Transactions should be bounded units of work, not remain open across slow unrelated business calls. Aborting or timing out a transaction resolves its visibility boundary, subject to broker progress.

Switching to read_uncommitted changes correctness: it can expose records that are later aborted. It is not a harmless latency fix. Kafka atomicity also does not cover an external database update unless a separate coordination design accounts for that boundary.”

- **Example:** An open transaction begins at partition offset 40; a later committed write at 41 can remain unavailable to read_committed polling until the earlier transaction resolves.
- **Guarantee/cost:** Visibility is partition-based. Commit coordination and retained open transactions add latency; this is not a fixed-time bound.
- **Trade-off/failure:** `read_uncommitted` is the documented default in Kafka 4.0; configure explicitly when committed-only processing is required.
- **Follow-ups:** “Nontransactional records?” → Delivered in read_committed too, but still subject to its stable-offset boundary. “External HTTP effects?” → Not rolled back by Kafka abort.
- **Primary reference:** [Kafka 4.0 isolation.level](https://kafka.apache.org/40/configuration/consumer-configs/#isolation.level).

---

**9. A service certificate rotates successfully on the server, but older clients cannot connect. What changes when the issuing CA also rotates?**

**Say aloud:**
“TLS authenticates a peer through certificate validation, including a chain to a trusted certificate authority, or CA, and the intended hostname. A new valid server certificate can still fail if its issuer is absent from a client's trust store or the server presents an incomplete intermediate chain. Certificate validity alone does not prove client compatibility.

For a planned CA transition, I would distribute overlapping old and new trust anchors first, verify adoption across actual client populations, then switch server identity. I would test fresh handshakes, because pooled connections can hide trust failures. After the overlap window and dependency audit, I would remove old trust deliberately.

For mutual TLS, both client and server trust directions require coordination. I would monitor expiration and validation failures without logging private keys. Disabling verification is not a recovery design; an urgent compromise may require revocation and loss of availability.”

- **Example:** Trust distribution: `{CA-A} → {CA-A, CA-B}`; only after clients adopt it, serve identity signed by CA-B; later remove CA-A when safe.
- **Guarantee/cost:** Correct trust does not bypass hostname, validity or key-usage checks. Rollout work scales with client populations, not just server replicas.
- **Trade-off/failure:** Overlap broadens accepted issuers temporarily. Pinning and trust-store reload behavior require explicit testing.
- **Follow-ups:** “Same CA, new leaf?” → Check chain, hostname and pinned identity. “Existing sockets?” → They do not prove the next handshake succeeds.
- **Primary reference:** [OWASP TLS certificate and trust guidance](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html).

---

**10. Adding one cache shard remaps most keys with hash(key) modulo shardCount. How would rendezvous placement change the transition?**

**Say aloud:**
“Rendezvous placement assigns each key a deterministic score for every node and chooses the highest-scoring node. Every client needs the same stable node identifiers, scoring function and deterministic tie-breaking. When a node is added, a key moves only if that node beats its previous winner; scores for the existing nodes do not change.

For equally weighted nodes and an ideal uniform score model, adding one node to n nodes moves an expected one over n plus one fraction of keys. That is a model assumption, not a promise for a poor hash function or real workload skew. A removed node moves its assigned keys while other winners stay stable.

Placement does not migrate data or establish exclusive ownership. I would plan bounded cache warming, membership rollout and failure handling. For durable writes, stale membership needs an authoritative routing or ownership protocol; consistent placement alone cannot prevent split ownership.”

- **Example:** Scores for key K are A=20, B=70. Add C=40: K stays on B. If C=90: it moves to C. Use fixed scores, not random numbers on each request.
- **Guarantee/cost:** Naive placement is O(n) scores per key and O(n) membership storage. Only the new candidate can change an existing winner on addition, with stable tie-breaking.
- **Trade-off/failure:** Unequal node capacity requires a vetted weighted scheme. Hot keys remain hot regardless of uniform key counts.
- **Follow-ups:** “Different membership views?” → Can disagree on the owner. “Replicas?” → Rank candidates, then separately design durability and failover.
- **Primary reference:** [HRW algorithm description in an IETF author draft](https://datatracker.ietf.org/doc/html/draft-mohanty-bess-weighted-hrw-00). This draft is algorithm background, not a ratified standard; the expected movement fraction follows from symmetry under the stated ideal model.

---

**11. As undirected network links arrive, return the component count after each link. How would union-find handle duplicates and cycles?**

**Say aloud:**
“Union-find maintains disjoint sets, each represented by a root. Initially every vertex is its own component. For each arriving link, I find both roots. If they differ, I attach the smaller tree beneath the larger and decrement the component count. If the roots already match, the edge changes no connectivity, including duplicate links and self-links.

Path compression shortens future root searches by redirecting nodes toward the root. Together with union by size, this gives near-constant amortized operations; amortized means the bound applies across a sequence, not every individual call. The count remains correct because only a merge of different components reduces it.

I would validate all endpoint IDs and specify that vertices are numbered densely and the graph is undirected. This supports additions, not arbitrary deletions or shortest paths. For those requirements I would choose a different representation rather than overextend the data structure.”

```java
static int[] componentsAfterLinks(int vertices, int[][] links) {
    Objects.requireNonNull(links);
    if (vertices < 0) throw new IllegalArgumentException("negative vertices");
    for (int[] edge : links) {
        Objects.requireNonNull(edge);
        if (edge.length != 2 || edge[0] < 0 || edge[0] >= vertices
                || edge[1] < 0 || edge[1] >= vertices)
            throw new IllegalArgumentException("invalid link");
    }
    DisjointSets sets = new DisjointSets(vertices);
    int[] result = new int[links.length];
    int count = vertices;
    for (int i = 0; i < links.length; i++) {
        if (sets.merge(links[i][0], links[i][1])) count--;
        result[i] = count;
    }
    return result;
}

static final class DisjointSets {
    private final int[] parent;
    private final int[] size;
    DisjointSets(int n) {
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    private int root(int x) {
        while (x != parent[x]) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    boolean merge(int a, int b) {
        int ra = root(a), rb = root(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int swap = ra; ra = rb; rb = swap; }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }
}
```

- **Example:** Four vertices, links `(0,1),(1,0),(2,2),(1,2)` produce `[3,3,3,2]`; vertex 3 remains isolated.
- **Guarantee/cost:** V vertices and E links: O(V + E α(V+1)) amortized time, where α is the extremely slowly growing inverse Ackermann function; O(V+E) auxiliary/output space. Full input validation is O(E).
- **Trade-off/failure:** Inputs remain unchanged and must not mutate concurrently. Zero vertices accept only an empty link sequence. Deletions need rebuilding or a different algorithm.
- **Follow-ups:** “Cycle detection?” → A failed merge identifies an edge whose endpoints already connect. “Directed graph?” → This does not compute directed reachability or strongly connected components.

---

**12. An unlimited voucher system needs the fewest vouchers for an exact amount. Why can largest-first greedy fail?**

**Say aloud:**
“Greedy means making the locally best choice without reconsidering it. For arbitrary denominations, taking the largest first can use more vouchers than a different combination. Dynamic programming stores solutions to smaller amounts and builds the optimal answer from them.

I define best[a] as the fewest vouchers forming amount a, with zero needing none and other amounts initially unreachable. For each amount in ascending order, I try every positive denomination that fits. Its candidate is one plus the best result for the remaining amount. Positive values ensure every dependency is smaller and already solved. An optimal solution's last voucher leaves an optimal smaller solution; otherwise replacing that remainder would improve the whole solution.

This computes the minimum count, not the number of combinations. Time depends on the numeric amount, so I would bound it at an API boundary. Large amounts or limited inventory need a different contract and algorithm.”

```java
static int fewestVouchers(int amount, int[] values) {
    Objects.requireNonNull(values);
    if (amount < 0 || amount == Integer.MAX_VALUE)
        throw new IllegalArgumentException("unsupported amount");
    for (int value : values)
        if (value <= 0) throw new IllegalArgumentException("nonpositive value");
    int[] best = new int[amount + 1];
    Arrays.fill(best, Integer.MAX_VALUE);
    best[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int value : values) {
            if (value <= a && best[a - value] != Integer.MAX_VALUE)
                best[a] = Math.min(best[a], best[a - value] + 1);
        }
    }
    return best[amount] == Integer.MAX_VALUE ? -1 : best[amount];
}
```

- **Example:** Values `[1,3,4]`, amount 6: greedy uses `4+1+1`; optimum is `3+3`, so return 2. Values `[4,6]`, amount 5 returns -1.
- **Guarantee/cost:** For amount A and D denominations: O(A·D + A + D) time including initialization/validation, O(A) space. This is pseudo-polynomial: A may be much larger than its digit count.
- **Trade-off/failure:** Duplicate denominations affect work, not the result. Zero amount returns 0 after validation. Practical memory/work budgets must be much lower than the integer limit; no input mutation or concurrent mutation allowed.
- **Follow-ups:** “Return the vouchers?” → Store a predecessor denomination for each reachable amount. “Bounded stock?” → Track remaining counts through an appropriate bounded-knapsack formulation.

---

**Topic coverage:** S06-Q01 Unicode contracts; Q02 cooperative interruption; Q03 G1 allocation fragmentation; Q04 query-plan selectivity; Q05 HTTP conditional updates; Q06 Spring scope and cleanup; Q07 JPA private-child removal; Q08 Kafka transaction visibility; Q09 TLS trust migration; Q10 shard placement; Q11 incremental connectivity; Q12 minimum-count dynamic programming.

**Next set builds on:** Java overload resolution and API evolution, concurrent ABA state changes, JPA batch write boundaries, Kafka poison-record policies, authorization caching, clock assumptions in rate limiting, and trie or string dynamic-programming coding. Continue with Set 7 even if another run occurs on 12 October; introduce distinct failure scenarios rather than repeat this set.
