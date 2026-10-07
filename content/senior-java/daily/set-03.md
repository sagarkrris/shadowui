**Set 3 · 7 October 2026 · 12 new questions**

Checked against the previous **24 questions**. Baseline: your [Senior Java Interview Master Guide](/senior-java-interview), using **Java 21 without preview features**, with explicit version differences below.

Practise each **Say aloud** answer in 45–90 seconds, then attempt its follow-ups. All scenarios are illustrative.

---

**1. You switch to virtual threads, but 10,000 requests still overwhelm a database with 40 connections. Why?**

**Say aloud:**  
“A virtual thread is a lightweight Java thread scheduled by the JVM onto an operating-system thread. It makes waiting for supported blocking operations cheaper, which helps applications handle many concurrent requests.

It does not create database capacity. With forty connections, thousands of requests can still wait while retaining request data and consuming memory.

I would limit database concurrency and bound how much work the service admits. A semaphore—a counter of available permits—can limit entry to a scarce operation, but unlimited callers waiting for permits still create a backlog.

I would also inspect the Java version. Pinning means a virtual thread cannot release its carrier, the operating-system thread executing it. Java 21 can pin during blocking work inside synchronized code. Java 25 has removed that particular limitation, although other pinning situations remain.”

- **Example:** Permit at most 30 concurrent reporting queries, preserving capacity for other work; reject or time-limit excess demand.
- **Guarantee/cost:** At most 30 participating operations hold permits. Waiting requests still consume memory; release permits in `finally`.
- **Trade-off/failure:** Lower concurrency protects the database but may reject traffic. Virtual threads do not accelerate CPU-intensive computation.
- **Follow-ups:** “Pool virtual threads?” → Generally create one per task; limit the scarce resource. “Replace every `synchronized`?” → No; inspect runtime version and measured blocking.

References: [Java 21 virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html), [Java 25 virtual threads](https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html).

---

**2. Splitting 10.00 into three independently rounded shares produces 9.99. How should Java code preserve the total?**

**Say aloud:**  
“`BigDecimal` represents decimal values with configurable precision and rounding. I would construct amounts from decimal text, because constructing from a double can preserve an earlier binary approximation.

Rounding means choosing a representable amount when the exact result needs more digits. It needs a business rule: how many decimal places are allowed, when rounding occurs, and who receives any remainder.

For ten units divided three ways, independently rounding every share to 3.33 loses one cent. I would calculate the base shares, calculate the remainder against the original total, and distribute it deterministically.

For this two-decimal example, the result could be 3.34, 3.33, and 3.33. The invariant is that allocated amounts sum exactly to the original. Currency and allocation rules belong in the contract; two decimal places are not universal.”

```java
BigDecimal total = new BigDecimal("10.00");
BigDecimal base = total.divide(
        BigDecimal.valueOf(3), 2, RoundingMode.DOWN);
BigDecimal remainder =
        total.subtract(base.multiply(BigDecimal.valueOf(3)));
// base = 3.33; remainder = 0.01
```

- **Guarantee/cost:** O(n) allocation steps for n recipients; arithmetic cost also depends on digit count.
- **Trade-off/failure:** Deterministic remainder allocation preserves totals but needs a fairness rule. Negative amounts need separately defined rounding behavior.
- **Follow-ups:** “Exact division by three?” → Can throw without rounding. “Round each intermediate result?” → Only if required; repeated rounding changes totals.

Reference: [Java 21 `BigDecimal`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html).

---

**3. After `entityManager.merge(detachedOrder)`, you modify `detachedOrder`. Why might the update disappear?**

**Say aloud:**  
“A persistence context is the set of entity objects a JPA entity manager currently tracks. A managed entity belongs to that context; a detached entity represents persisted data but is no longer tracked there.

Merge copies state into a managed instance and returns that instance. It does not generally turn the detached argument into the managed object.

If I modify the original afterward, those later changes are not automatically tracked. I should use the returned object within the transaction.

For API updates, I often prefer loading the managed entity and applying an explicit command containing only allowed changes. Merging a partially populated object is dangerous because ordinary null fields may represent actual replacement state, rather than ‘the caller did not provide this field.’ That distinction belongs in the update contract.”

```java
Order managed = entityManager.merge(detachedOrder);
managed.setDeliveryNote("Leave at reception");
// Run within an appropriate transaction.
```

- **Guarantee/cost:** Dirty checking—detecting managed-object changes—can persist updates at flush or commit. Database work depends on mappings and loaded state.
- **Trade-off/failure:** Merge supports detached workflows but can copy unintended state across a large object graph.
- **Follow-ups:** “Does merge commit?” → No. “What about unfetched lazy fields?” → JPA requires ignoring those during merge; they differ from explicitly populated nulls.

Reference: [Jakarta Persistence 3.2 merge semantics](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2#merging-detached-entity-state).

---

**4. A Spring Boot service starts successfully with a negative timeout and an impossible retry configuration. Where should validation happen?**

**Say aloud:**  
“I would validate configuration during startup, before accepting requests. External configuration is deployment-supplied input, so parsing it successfully does not prove it is meaningful.

Configuration binding converts properties into a typed object. In Spring Boot, I would register a configuration-properties class and enable validation using `@Validated`, with a compatible validation implementation available.

Individual constraints handle required values and simple bounds. Cross-field validation checks relationships—for example, whether the intended attempt durations and waiting periods fit within the operation’s total budget.

I would distinguish missing values from deliberate defaults. A required timeout should not silently become zero. I would also report the invalid property clearly without exposing credentials. Failing startup makes a bad deployment visible instead of allowing intermittent request failures.”

- **Example:** `attemptTimeout=800 ms`, `attempts=3`, `totalBudget=1 s` conflicts with a policy promising three full attempts.
- **Guarantee/cost:** Checks configuration at initialization; it does not prove a remote dependency is available. Cost scales with validated properties.
- **Trade-off/failure:** Strict validation prevents unsafe operation but can block rollout. Refreshed configuration needs validation again.
- **Follow-ups:** “Nested settings?” → Apply cascading validation with `@Valid`. “Validate a duration?” → Check required presence and positive/range semantics explicitly.

Reference: [Spring Boot configuration validation](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.validation).

---

**5. You invalidate a cache after every database update. How can an old value still reappear?**

**Say aloud:**  
“In cache-aside, the application checks the cache first, reads the database on a miss, and stores the result. It reduces database reads, but reading and filling the cache are separate operations.

A reader can fetch the old database value, pause, and then resume after a writer commits a new value and invalidates the cache. That reader now installs the old value after invalidation.

Expiration limits how long that installed value remains, but does not remove the race. For stronger protection, I could maintain a generation number, meaning a version of the cache’s validity. A reader records the generation before loading and installs its result only if that generation is still current.

The comparison and installation must be atomic. The writer must advance the generation reliably, and the generation must survive deletion of the cached value.”

- **Example:** Reader loads price 80 → writer commits 90 and invalidates → reader caches 80.
- **Guarantee/cost:** Generation checks reject fills crossing a completed generation change. They do not make database commit and invalidation atomic.
- **Trade-off/failure:** Expiration is simpler but permits stale reads. Stronger coordination adds metadata, operations, and recovery requirements.
- **Follow-ups:** “Delete twice?” → Reduces some races but is not a proof. “Strict current price required?” → Validate against authoritative data at purchase time.

---

**6. An order commits to the database, but publishing its Kafka event fails. How do you avoid losing the event?**

**Say aloud:**  
“I would use a transactional outbox: a database table containing events that must be published. It exists to close the failure gap between changing database state and notifying another system.

The order and its outbox event are inserted in the same database transaction. Either both commit or neither does. A separate relay reads committed events and publishes them to Kafka.

The relay must tolerate retries. If publication succeeds and the relay crashes before recording completion, it may publish the same event again. Each event therefore needs a stable identifier, and consumers must handle duplicates.

This guarantees a durable publication obligation alongside the order, not instantaneous delivery. I would monitor the oldest unpublished event and backlog size, and define recovery for events that repeatedly fail.”

```text
Database transaction: insert order + insert outbox event → commit
Relay: read committed event → publish → record completion
```

- **Guarantee/cost:** One additional durable record per event. Eventual publication requires a recovering relay, available infrastructure, and retained events.
- **Trade-off/failure:** Adds storage and operational work; duplicate delivery remains possible.
- **Follow-ups:** “Publish first?” → Could publish an order that later rolls back. “Relay options?” → Poll the table or use change-data capture, which reads committed database changes.

Reference: [Debezium outbox documentation](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html).

---

**7. A Kafka event changes `amount_cents` into `amount_micros` while keeping the same Protobuf field number. Why is that dangerous?**

**Say aloud:**  
“A schema defines a message’s fields and meaning. Protocol Buffers encode fields using numeric identifiers, so keeping the same field number and integer type can allow old software to parse new bytes successfully.

That is binary compatibility, but it is not semantic compatibility: the receiver may interpret the number using the wrong unit. A consumer expecting cents could calculate an amount ten thousand times too large.

I would introduce a new field number, retain the old meaning, and deploy consumers that understand both representations before changing producers. During transition, precedence and consistency rules must be explicit.

I would also test historical events, because Kafka consumers may replay data written before the deployment. Once a field is removed, its number should be reserved so it cannot later acquire a different meaning.”

```proto
int64 amount_cents = 1;          // Existing meaning retained
optional int64 amount_micros = 2; // New representation
```

- **Guarantee/cost:** Additive binary evolution helps mixed versions parse messages; business compatibility still requires agreement.
- **Trade-off/failure:** Dual representations increase payload and validation complexity. Conflicting values need a defined response.
- **Follow-ups:** “Absent versus zero?” → Explicit presence distinguishes them. “Convert through JSON?” → Unknown-field preservation differs; test that path separately.

Reference: [Official Protobuf evolution guidance](https://protobuf.dev/programming-guides/proto3/#updating).

---

**8. How would you rotate an outbound API credential across 100 service instances without an outage?**

**Say aloud:**  
“Credential rotation replaces a secret used to authenticate a service. It limits the lifetime of exposed credentials, but distributed instances do not all change at exactly the same moment.

For routine rotation, I would create a second credential while the provider still accepts the first. I would distribute the new secret through controlled secret storage, update clients, and verify that every instance is using the new version.

Some clients capture credentials when constructed, so updating a file or environment source may not update existing clients. Those clients need safe replacement, with old work allowed to finish where appropriate.

After confirming adoption and accounting for in-flight requests, I would revoke the old credential. I would track credential version identifiers, never secret values. A confirmed compromise may require immediate revocation even if that causes temporary failures.”

- **Example:** Provider accepts K1 and K2 → instances adopt K2 → old requests drain → revoke K1.
- **Guarantee/cost:** Overlap supports a gradual transition only if the provider permits concurrent credentials. Work scales with clients and instances.
- **Trade-off/failure:** Longer overlap improves availability but extends exposure. A forgotten instance fails after revocation.
- **Follow-ups:** “Provider allows one key?” → Coordinate cutover or use a supported intermediary. “Rollback after compromise?” → Do not restore the compromised secret.

Reference: [OWASP secrets lifecycle guidance](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).

---

**9. Transfers from account A to B and B to A occasionally freeze. CPU usage is low. How do you investigate and prevent this?**

**Say aloud:**  
“A deadlock occurs when operations form a waiting cycle with no path to progress. Here, one transfer may hold A’s lock while waiting for B, while another holds B’s lock while waiting for A.

I would inspect thread stacks and lock ownership to confirm the cycle. Low CPU supports a waiting hypothesis, but is not enough to establish deadlock.

To prevent this two-lock cycle, every transfer should acquire account locks in the same global order, such as ascending immutable account ID. The ordering must be total: distinct accounts cannot tie without another ordering rule. Lock objects must also be shared consistently.

For Java 21, traditional management APIs detect certain platform-thread deadlocks but do not cover virtual threads. A negative detector result therefore cannot rule out every application waiting cycle.”

```text
A → B: lock smaller ID → lock larger ID → transfer
B → A: lock smaller ID → lock larger ID → transfer
```

- **Guarantee/cost:** Consistent ordering prevents cycles among locks following that order. Waiting time remains unbounded.
- **Trade-off/failure:** Ordering simplifies reasoning but requires discipline across all paths. Other locks can reintroduce cycles.
- **Follow-ups:** “Same account?” → Treat as a defined no-op or validation error. “Does locking make transfer rollback automatic?” → No; validate before mutation and define failure handling.

Reference: [Java 21 thread-management coverage](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html).

---

**10. An endpoint waits for 20 downstream calls. Each finishes within 200 ms 99% of the time. Will the endpoint meet that threshold 99% of the time?**

**Say aloud:**  
“No. Fan-out means one request launches several downstream operations. When every result is required, completion depends on the slowest operation, so slow-tail behavior becomes more visible.

Assuming the calls are independent and start together, the probability that all twenty finish within two hundred milliseconds is 0.99 raised to the twentieth power, about 81.8 percent. Roughly 18.2 percent of requests would wait longer, even before local overhead.

Independence is only a simplifying assumption. Shared infrastructure creates correlated delays, so I would measure the combined endpoint directly.

I would question whether all twenty results are necessary, combine calls where possible, and define which results may be omitted or served from older data. A deadline bounds waiting policy, but returning partial data requires an explicit product contract.”

- **Example:** A dashboard can omit optional recommendations; a financial total may require every component.
- **Guarantee/cost:** Twenty calls create twenty units of downstream work. Parallelism reduces elapsed time relative to serial execution, not total work.
- **Trade-off/failure:** Partial responses improve availability but may mislead users unless clearly represented.
- **Follow-ups:** “Perfectly correlated calls?” → The independence calculation no longer applies. “Duplicate slow calls?” → May reduce latency but increases load and requires safe repeatability.

---

**11. Find the longest contiguous sequence containing at most `k` distinct integers. Explain why your solution is linear.**

**Say aloud:**  
“I would use a sliding window: a contiguous range whose left and right boundaries move through the array. A frequency map records how many times each value occurs inside that range.

For each new right-hand element, I increment its frequency. If the number of distinct values exceeds k, I advance the left boundary, decrementing frequencies and removing values whose frequency reaches zero.

Once the window is valid, I update the best length. Shrinking cannot introduce a new distinct value, so moving left eventually restores the constraint.

Although the code contains a loop inside a loop, each element enters once and leaves at most once. The total number of boundary movements is linear. With expected constant-time map operations, total runtime is expected O(n). I would define zero, negative k, and empty-input behavior explicitly.”

```java
// Imports: java.util.HashMap, java.util.Objects
static int longestAtMostKDistinct(int[] values, int k) {
    Objects.requireNonNull(values, "values");
    if (k < 0) throw new IllegalArgumentException("negative k");
    if (k == 0) return 0;

    var counts = new HashMap<Integer, Integer>();
    int left = 0;
    int best = 0;

    for (int right = 0; right < values.length; right++) {
        counts.merge(values[right], 1, Integer::sum);

        while (counts.size() > k) {
            int removed = values[left++];
            int remaining = counts.get(removed) - 1;
            if (remaining == 0) counts.remove(removed);
            else counts.put(removed, remaining);
        }

        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

- **Example:** `[4, 4, 7, 9, 7, 7]`, `k=2` → **4**, from `[7, 9, 7, 7]`.
- **Complexity/guarantee:** Expected O(n) time; O(min(n, k+1)) map entries, including temporary expansion.
- **Trade-off/failure:** Frequencies require extra memory. A set alone cannot tell whether removing one occurrence eliminates a value.
- **Follow-ups:** “Exactly k distinct?” → Update the answer only when the valid window contains k. “Return the range?” → Save its boundaries when improving the best length.

---

**12. You receive integer readings continuously. How can you maintain the kth-largest reading without storing everything?**

**Say aloud:**  
“I would maintain a minimum heap containing at most k readings. A heap is a data structure that keeps its smallest element readily accessible while supporting efficient insertion and removal.

The invariant is that it contains the largest k readings seen so far, counting duplicates. Until it reaches size k, I insert everything. After that, a new reading replaces the smallest retained reading only if it is larger.

The heap’s smallest value is then the kth-largest overall: exactly k retained readings are at least that large, and discarded readings cannot improve the retained group.

This uses memory proportional to k rather than the stream length. Before k readings arrive, the answer is unavailable. I would also clarify whether duplicates count, because kth-largest distinct value is a different requirement.”

```java
// Imports: java.util.Objects, java.util.PriorityQueue
// Batch wrapper around the same streaming update rule.
static int kthLargest(int[] values, int k) {
    Objects.requireNonNull(values, "values");
    if (k < 1 || k > values.length) {
        throw new IllegalArgumentException("invalid rank");
    }

    var largest = new PriorityQueue<Integer>();

    for (int value : values) {
        if (largest.size() < k) {
            largest.offer(value);
        } else if (value > largest.peek()) {
            largest.poll();
            largest.offer(value);
        }
    }
    return largest.peek();
}
```

- **Example:** `[8, 3, 8, 2, 10]`, `k=3` → **8**; duplicates occupy separate ranks.
- **Complexity/guarantee:** O(n log(k+1)) total time, O(k) space, O(1) answer lookup after enough readings.
- **Trade-off/failure:** Excellent for insertion-only streams. If old readings expire, discarded values may become relevant again.
- **Follow-ups:** “Need all readings sorted?” → This heap does not retain enough information. “Increase k later?” → Cannot recover discarded readings without another data source.

Java operation costs: [Java 21 `PriorityQueue`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html).

---

**Today’s coverage:** Virtual-thread capacity; decimal allocation; JPA managed versus detached state; Spring configuration validation; stale cache fills; transactional outbox; Kafka message evolution; credential rotation; deadlock diagnosis; fan-out latency; sliding windows; heap-based selection.

**Next day’s progression:** Generics variance, class-loader retention, business constraints spanning database rows, JPA relationship ownership, circuit-breaker recovery, Kafka ownership during rebalancing, server-side request forgery, and binary-search/deque coding.

The ledger now records **36 distinct questions across three sets**. Code examples were reviewed but not executed.
