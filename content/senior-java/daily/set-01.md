**Day 1 · 7 October 2026 — Foundations under production pressure**

Twelve new questions, using your [Senior Java Interview Master Guide](/senior-java-interview) as the baseline. Assume **Java 21, without preview features**. Framework assumptions are stated where relevant. All scenarios are illustrative.

Practise each spoken answer in 45–90 seconds, then use the follow-ups to test your understanding.

---

**1. A customer object is used as a `HashMap` key. After changing its region, lookup with that same object fails. Why?**

**Say aloud:**  
“A hash map uses a key’s hash code to locate a bucket, which is a group of candidate entries, and equality to identify the matching key. Equal keys must have equal hash codes. If region participates in those calculations, changing it after insertion breaks the lookup assumptions. The entry remains stored according to its original hash, while the next lookup uses the new hash.

I would define the key using stable identity, such as an immutable customer ID, and keep changing attributes in the value. Synchronizing the map would not solve this identity problem. If mutation is unavoidable, remove the entry before changing the key and then reinsert it. Once mutation has already happened, rebuilding the map from its entries may be needed.”

- **Example:** Insert a key representing `(customerId=42, region="east")`; change region to `"west"`; `get(key)` may return `null` even though iteration still shows the entry.
- **Cost and guarantee:** Expected O(1) lookup with well-distributed hashes and constant-cost equality; occasional resizing costs O(n). Stable keys preserve the lookup contract.
- **Trade-off and failure:** Immutable keys may require separate key objects. Accidentally including changing fields in generated equality recreates the bug.
- **Follow-ups:**  
  “Does `ConcurrentHashMap` fix it?” → No; concurrency protection does not repair mutable identity.  
  “Can unequal objects share a hash?” → Yes; equality resolves collisions.

---

**2. Does `record DeliveryPlan(List<String> stops)` give you an immutable delivery plan?**

**Say aloud:**  
“A record is a concise Java data carrier with generated accessors and value-oriented methods. Its fields are final, meaning the references cannot be reassigned after construction. That does not freeze objects those references point to.

If I store the caller’s mutable list directly, the caller can change the plan later. I would make a defensive copy in the constructor: a copy that prevents the caller’s subsequent structural changes from affecting my object. `List.copyOf` provides an unmodifiable list and rejects null elements.

For strings, this is sufficient because strings themselves are immutable. For mutable stop objects, copying the list still shares those objects, so I would also need immutable stop values or appropriate element copies. Immutability has to cover the reachable state that matters to the contract.”

```java
record DeliveryPlan(List<String> stops) {
    DeliveryPlan {
        stops = List.copyOf(stops);
    }
}
```

- **Cost and guarantee:** Copying n references is O(n) time and space when a copy is needed. Existing suitable immutable lists may be reused.
- **Trade-off and failure:** Copying costs memory; shallow copying fails when elements remain mutable.
- **Follow-ups:** “Copy on every accessor call?” → Unnecessary here. “Allow null stops?” → Define another explicit representation or validation policy.

Java’s exact list guarantees: [Java 21 `List` documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html).

---

**3. A background thread replaces routing configuration while request threads read it. When is `volatile` enough?**

**Say aloud:**  
“`volatile` gives a field visibility and ordering guarantees across threads. It exists because an ordinary shared field does not reliably communicate updates without synchronization. A write to a volatile field happens-before subsequent reads of that field: earlier writes become visible through that publication.

For configuration, I would construct a complete immutable snapshot and assign it to a volatile reference. Each request would read that reference once into a local variable, then use that snapshot throughout its decision. This prevents mixing fields from different configuration versions.

Volatile does not make compound operations atomic. Atomic means an operation acts as one indivisible step relative to competing operations. Two writers that both read, modify, and replace configuration can still overwrite one another’s changes. That requires additional coordination.”

```java
private volatile RoutingConfig current;

// Reader: one snapshot per decision
RoutingConfig snapshot = current;
return routeUsing(snapshot);

// Writer: build fully before publication
current = validatedReplacement;
```

- **Guarantee:** Readers see a safely published snapshot; this does not freeze mutable objects inside it.
- **Cost:** Reference access is constant work; constructing the snapshot depends on its size.
- **Trade-off and failure:** Immutable snapshots simplify reads but allocate on updates. Reading `current` repeatedly can mix versions.
- **Follow-ups:** “Two writers?” → Serialize updates with a lock or use an atomic conditional update. “Does volatile guarantee fairness?” → No.

---

**4. An executor has eight core threads and a maximum of 64, yet its queue grows while only eight threads work. What happened?**

**Say aloud:**  
“An executor manages worker threads and pending tasks. In `ThreadPoolExecutor`, the queue policy determines when the pool grows. Once the core workers exist, it normally tries to queue new tasks before creating additional workers. With an unbounded queue, queuing keeps succeeding, so the configured maximum does not normally help.

I would first measure task duration and the downstream service’s capacity. Then I would choose bounded workers and a bounded queue, plus an explicit rejection policy. Backpressure means slowing or refusing incoming work when capacity is exhausted; it exists to stop overload becoming unlimited memory growth.

A queue absorbs a short burst, but it cannot fix sustained excess demand. I would also enforce deadlines so requests do not wait until their results are already useless.”

- **Example:** Eight workers, maximum 64, bounded queue of 100: growth beyond eight becomes possible when the queue fills.
- **Guarantee/cost:** Pending queue occupancy is bounded; completion time is not. More workers consume resources and may overload dependencies.
- **Failure/trade-off:** Running rejected work on the submitting thread slows submissions but can block a latency-sensitive caller.
- **Follow-ups:** “Larger queue?” → More burst absorption, more waiting. “More threads?” → Only if dependencies can sustain them.

Verified behavior: [Java 21 `ThreadPoolExecutor`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html).

---

**5. JVM heap usage keeps rising. How do you distinguish a memory leak from normal allocation?**

**Say aloud:**  
“The heap holds Java objects. Garbage collection reclaims objects that are no longer reachable from live application state. A memory leak in Java usually means objects remain reachable even though the application no longer needs them.

I would compare memory behavior under equivalent workloads and examine the amount still retained after relevant collection cycles. A sawtooth pattern can be normal: allocation raises usage, collection lowers it. A rising retained baseline is stronger evidence of retention, but it can also reflect a growing legitimate workload.

Next, I would identify which object types are accumulating and inspect their retaining paths—the references keeping them alive. For example, a static map storing every completed request is a concrete explanation. I would fix its ownership or retention policy before attempting garbage-collector tuning.”

- **Example:** A completed-request map grows by 10,000 entries per hour because nothing removes entries.
- **Cost/guarantee:** Retaining n request objects requires space proportional to their combined reachable size. Collection cannot reclaim strongly reachable entries.
- **Trade-off and failure:** Bounded retention reduces memory but may remove useful history. Heap inspection can be expensive; reproduce with representative load where possible.
- **Follow-ups:**  
  “High allocation but stable retained heap?” → Investigate temporary-object creation and collection overhead.  
  “Process memory grows while heap stays stable?” → Investigate non-heap memory and other process resources.

---

**6. In a Spring Boot service, `importAll()` calls its own `@Transactional importOne()`. A checked exception leaves partial data. Explain both risks.**

**Say aloud:**  
“A transaction groups database changes so they commit or roll back together. In Spring’s default proxy mode, a proxy is a wrapper around a managed service that applies transaction behavior when calls pass through it.

A method calling another method on the same object bypasses that wrapper. Therefore, the inner annotation does not establish its requested transaction boundary. An existing outer transaction may still apply.

The second issue is rollback policy. Under Spring’s traditional defaults, unchecked exceptions and errors trigger rollback, while checked exceptions do not automatically do so. Configuration can change that.

I would put the intended database operation behind a managed service boundary, choose whether each item or the whole import is atomic, and configure rollback for the relevant checked exception explicitly.”

- **Example:** Another service calls `importService.importOne(...)`, annotated with `@Transactional(rollbackFor = ImportException.class)`.
- **Guarantee:** Atomicity covers participating transactional database changes, not an already-sent email.
- **Trade-off/failure:** Whole-import transactions hold resources longer; per-item transactions permit partial completion.
- **Follow-ups:** “Exception swallowed?” → Normal return may allow commit. “Spring 6.2+?” → Global all-exception rollback configuration is available; inspect actual settings.

Source: [Spring transaction annotations](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html).

---

**7. A page of 50 orders executes 51 database queries when order lines are accessed. How would you fix it without breaking pagination?**

**Say aloud:**  
“This is the N-plus-one query problem: one query loads the parent records, then one additional query per parent loads related data. Lazy loading means delaying related-data retrieval until access; it can avoid unnecessary work, but here it creates many database round trips.

I would verify the actual queries, then design retrieval around the response. One option is first paging ordered order IDs, then fetching those orders and their lines in a second query. I would restore the first query’s ordering explicitly.

A fetch join retrieves an association alongside its parent. However, fetching a collection multiplies result rows, so combining that with pagination can produce costly in-memory limiting in Hibernate. I would avoid treating a collection fetch join as a universal one-query fix.”

- **Example:** Fetch 50 IDs ordered by creation time and ID; fetch associated lines using those IDs.
- **Cost:** Usually two data queries, plus a count query if requested; materialization still scales with returned orders and lines.
- **Trade-off/failure:** Two reads can observe intervening changes; define required consistency.
- **Follow-ups:** “Set everything eager?” → May still cause extra queries. “Huge line collections?” → Bound or separately page them.

Reference: [Hibernate 7.0 query guide](https://docs.hibernate.org/orm/7.0/querylanguage/html_single/).

---

**8. A client times out while creating a booking and retries. How do you prevent a second booking?**

**Say aloud:**  
“A timeout means the client did not receive a result; it does not prove the server failed. Idempotency means repeating the same logical operation does not repeat its intended effect.

I would accept a client-generated operation key, scoped to the authenticated customer and operation type. In the same database transaction, I would record that key, create the booking, and save the outcome. A uniqueness constraint—a database rule rejecting duplicate key values—arbitrates concurrent requests.

I would also store a request fingerprint, a stable representation or digest of the meaningful request fields. Reusing a key with different input should fail rather than return an unrelated result. Once the original transaction commits, a retry can return the saved outcome. This design’s guarantee applies to the local transactional work; remote side effects need their own coordination.”

- **Example:** Customer 17 sends key `book-8f2` twice with identical room and dates; both receive booking 901.
- **Guarantee/cost:** One committed local effect per retained scoped key. Storage grows with retained operations; database lookup cost depends on the index.
- **Trade-off and failure:** Expiring keys saves space but limits the retry window. A separate “check then insert” without database uniqueness races.
- **Follow-ups:**  
  “Two requests arrive together?” → Let the database arbitrate; return/retry according to the winning transaction’s outcome.  
  “Response lost after commit?” → Return the stored result.

---

**9. A Kafka consumer updates a database and crashes before committing its offset. What happens, and what would you design?**

**Say aloud:**  
“A Kafka partition is an ordered portion of a topic, and an offset identifies a record’s position within it. A committed consumer offset records where that consumer group should resume.

If the database commit succeeds but the offset commit does not, the record can be processed again. That is the duplicate-processing window associated with at-least-once handling.

For a local database update, I would insert a unique processed-event ID and apply the business change in the same database transaction. A repeated event then produces no second business change. Only after successful database processing would I advance the Kafka offset.

Kafka transactions can coordinate Kafka records and offsets, but do not automatically include an arbitrary external database. I would state the exact system boundary before claiming exactly-once behavior.”

- **Example:** Event `inventory-adjustment-72` is recorded with its stock update; replay encounters the existing event ID.
- **Guarantee:** Duplicate database effects are prevented within the retained-ID scope; handler execution may repeat.
- **Trade-off/failure:** Deduplication costs storage. Committing offsets first risks skipping unfinished work.
- **Follow-ups:** “Parallel processing?” → Advance only past completed earlier records. “Dedup insert fails?” → Roll back appropriately before handling the duplicate.

Reference: [Kafka 4.0 delivery semantics](https://kafka.apache.org/40/design/design/).

---

**10. A service completes 200 requests per second with average response time of 150 ms. How many requests are in progress, and what does that tell you?**

**Say aloud:**  
“Little’s Law relates average work in a system to throughput multiplied by average time in that system. It helps connect observed traffic to concurrency rather than guessing from thread counts.

Here, 200 requests per second multiplied by 0.15 seconds gives 30 requests in the system on average. The measurement boundary matters: if response time includes queue waiting, those 30 include queued requests.

That does not mean 30 worker threads or 30 database connections is the correct configuration. Requests may wait without occupying those particular resources, and averages hide bursts. I would measure how long each scarce resource is actually held, test under representative load, and leave measured headroom. The relationship assumes a stable flow; it is not a promise that an overloaded system’s queue will stop growing.”

- **Example:** If every request holds one database connection for 40 ms, average connection occupancy is approximately `200 × 0.04 = 8`.
- **Guarantee:** An average relationship under consistent boundaries and stable conditions; no worst-case latency guarantee.
- **Trade-off and failure:** Extra capacity costs money; excessive parallelism can slow the database. Underprovisioning causes queuing.
- **Follow-ups:**  
  “Latency doubles at the same throughput?” → Average in-progress work doubles.  
  “Can this size the pool alone?” → No; validate variability and saturation experimentally.

---

**11. A user is logged in and has the `USER` role. Why is `GET /invoices/123` still potentially unsafe?**

**Say aloud:**  
“Authentication establishes who the caller is. Authorization decides what that caller may do. A role can grant access to an invoice endpoint without granting access to every invoice.

I would enforce object-level authorization, meaning a permission decision about the specific requested invoice. In a system serving multiple customer organizations, called tenants, the query should be scoped using the authenticated caller’s permitted tenant and any required ownership rules.

The server must verify that scope; a tenant ID supplied by the client is not proof of membership. For an unauthorized invoice, I would return a policy-consistent response that does not unnecessarily reveal whether it exists. I would test access between users and tenants. Unpredictable invoice IDs can reduce guessing, but they do not replace permission checks.”

- **Example:** Look up invoice 123 within the caller’s verified tenant, then apply any finer permission rule.
- **Guarantee/cost:** Enforces the chosen access policy when applied on every relevant path; query cost depends on indexing.
- **Trade-off/failure:** Central rules improve consistency but must express domain exceptions. Unscoped caches can leak results despite correct queries.
- **Follow-ups:** “Administrator?” → Explicit broader permission. “Update operation?” → Enforce scope in the mutation too.

Reference: [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

---

**12. Count contiguous subarrays whose sum equals `k`. Values may be negative. Explain and implement the solution.**

**Say aloud:**  
“A subarray is a contiguous section of an array. I would use prefix sums: running totals from the beginning. They let me calculate a section’s sum by subtracting the total before it from the total at its end.

If the current total is `s`, I need to know how many earlier totals equal `s minus k`. Each occurrence identifies a different valid starting position, so I store frequencies rather than just remembering whether a total occurred.

I seed total zero with frequency one to represent the position before the array starts. For each value, I update the total, count matching earlier totals, and only then record the current total. That ordering avoids counting an empty subarray when `k` is zero. Unlike a usual shrinking-window approach, this works with negative numbers.”

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

static long countSubarrays(int[] values, int k) {
    Objects.requireNonNull(values, "values");

    Map<Long, Long> frequencies = new HashMap<>();
    frequencies.put(0L, 1L);

    long prefix = 0;
    long count = 0;

    for (int value : values) {
        prefix += value;
        count += frequencies.getOrDefault(prefix - k, 0L);
        frequencies.merge(prefix, 1L, Long::sum);
    }
    return count;
}
```

- **Example:** `[1, -1, 1]`, `k = 1` → **3**: the first element, the last element, and the entire array.
- **Complexity:** Expected O(n) time with well-distributed hashing; O(n) additional space.
- **Guarantee/failure:** Handles negatives, repeated totals, and an empty array. Using `int` for totals or the answer risks overflow; `long` handles the bounds of an `int[]`.
- **Trade-off:** Extra memory buys a single-pass solution; enumerating all start/end pairs costs O(n²) time.
- **Follow-ups:**  
  “Why not a set?” → Repeated totals represent different valid starts.  
  “All zeros, length n?” → `n × (n + 1) / 2` valid subarrays when `k = 0`.  
  “Why not sliding window?” → Negative values destroy the monotonic relationship between expanding the window and increasing its sum.

The code is illustrative and has not been executed in this run.

---

**Today’s coverage:** Core Java identity and immutability; concurrency visibility and executor overload; JVM retention; Spring transactions; JPA/Hibernate query design; microservice idempotency; Kafka replay; capacity estimation; authorization; prefix-sum coding.

**Tomorrow’s progression:** Move from individual guarantees to interacting operations: multi-field concurrency, cancellation, concurrent database updates, pagination during writes, retry budgets, and event ordering, with more coding practice.
