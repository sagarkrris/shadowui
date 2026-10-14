**Set 8 · 14 October 2026 — Observing failures and preserving identity**

Twelve new scenarios following the 84 questions in Sets 1–7. Reference targets: **Java 21 without preview features**, Spring Framework 6.2 in a Spring Boot 3.5 application, Hibernate ORM 6.6, PostgreSQL 17, and Kafka 4.0. Kubernetes probe behavior follows the linked upstream documentation; validate cluster-specific settings. These are reference assumptions, not latest-version claims. Examples are original illustrations, not personal experience.

Practise each **Say aloud** answer in 45–90 seconds. Stable IDs: **S08-Q01–S08-Q12**, in order. The two Java blocks are executable methods with `java.util.*` and a class wrapper. Other examples are contextual fragments or design sketches, not runnable services.

---

**1. A task submitted to an executor fails, but the thread's uncaught-exception handler records nothing. Where did the failure go?**

**Say aloud:**
“A Future is a handle to an asynchronous result. With the usual ThreadPoolExecutor submit path, the task is wrapped in a FutureTask. That wrapper records a thrown failure rather than letting it escape from the worker. Ignoring the returned Future can therefore hide the failure from the application's normal reporting path.

I would assign an owner to observe completion. Future.get reports task failure through ExecutionException; cancellation and interruption need separate handling. A completion service can collect finished tasks without waiting in submission order. For background work, reporting must include the operation identity and a safe failure category.

A submitted task is not a successful task. Metrics should distinguish admission, completion and failure, and the caller must know whether an asynchronous operation is merely accepted or actually finished.”

- **Example:** `Future<?> f = pool.submit(() -> { throw new IllegalStateException("invalid job"); });` requires completion observation.
- **Guarantee/cost:** `get()` can wait; use an owned deadline. Task failure is distinct from submission rejection.
- **Trade-off/failure:** Unobserved futures lose operational evidence; logging alone does not recover work.
- **Follow-ups:** “execute?” → An escaping exception can reach the worker's uncaught handler. “afterExecute?” → Inspect a completed Future as well as the throwable.
- **Primary references:** [Java 21 ExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html), [ThreadPoolExecutor failure observation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#afterExecute(java.lang.Runnable,java.lang.Throwable)).

---

**2. A unique constraint on (`tenant_id`, `external_ref`) still permits several rows with a missing reference. Is uniqueness broken?**

**Say aloud:**
“SQL NULL represents missing or unknown information. PostgreSQL 17 unique constraints normally treat null values as distinct, so repeated tenant IDs with null external references can coexist. The constraint is enforcing its declared semantics; the business rule may be different.

I would first decide whether an absent reference means independent unlinked records or one shared slot per tenant. If the reference is mandatory, enforce NOT NULL as well as uniqueness. If absence itself must be unique, PostgreSQL offers UNIQUE NULLS NOT DISTINCT. Tenant identity should also be mandatory.

Before adding the constraint, inspect and reconcile existing conflicts. Keep the invariant in the database, since two application prechecks can both pass concurrently. Translate a constraint conflict into a defined domain outcome, and verify null behavior when moving to a different database.”

- **Example:** `UNIQUE NULLS NOT DISTINCT (tenant_id, external_ref)` permits one null reference per non-null tenant.
- **Guarantee/cost:** Database enforcement covers concurrent writers; index maintenance adds write work.
- **Trade-off/failure:** Conflating “unassigned” with one shared identity can reject valid records.
- **Follow-ups:** “Empty string?” → A concrete value, not null. “Portability?” → Check the target database's semantics.
- **Primary reference:** [PostgreSQL 17 unique and not-null constraints](https://www.postgresql.org/docs/17/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS).

---

**3. A cached product lookup uses only productId, while tenant identity comes from request context. How can valid database queries still leak data?**

**Say aloud:**
“A cache key is the identity used to reuse a previous result. Spring's default key generator derives that identity from method arguments. It does not automatically include tenant context or every other input that influences the method.

If two tenants use product 42, the second request can hit the first tenant's entry and skip the correctly scoped database query entirely. I would make trusted tenant identity an explicit input and include it in the key. Other representation inputs, such as locale or price tier, also belong there when they change the result.

The key and the query must use the same validated scope. I would test requests from different tenants with overlapping IDs and warm caches. Authorization still needs enforcement before returning cached data; cache partitioning alone does not establish access rights.”

- **Example:** `loadProduct(trustedTenantId, productId)` uses both arguments; ensure eviction targets the same compound identity.
- **Guarantee/cost:** Correct keys isolate reuse; more dimensions increase cardinality and memory use.
- **Trade-off/failure:** A tenant supplied without membership validation remains unsafe.
- **Follow-ups:** “Shared cache name?” → Avoid unrelated methods producing colliding keys. “Permission changes?” → Revalidate access under the required freshness contract.
- **Primary reference:** [Spring Framework 6.2 cache key generation](https://docs.spring.io/spring-framework/reference/6.2/integration/cache/annotations.html#cache-annotations-cacheable-default-key).

---

**4. Kafka reports a producer delivery timeout. Can the application safely conclude that the record was never appended?**

**Say aloud:**
“An acknowledgment is evidence returned by the broker. If that evidence is delayed or lost, the producer can fail to observe success even when a write occurred. A timeout is therefore an uncertain outcome, not a universal proof that the record is absent.

Kafka's delivery timeout bounds reporting after send returns, including batching and retriable delivery work. It differs from the blocking limit for metadata or buffer availability during send. I would align those budgets with the caller's contract and inspect the actual callback or Future result.

Producer idempotence protects against duplicate appends from supported producer retries. It does not make a new application submission of the same business event globally unique. Keep a stable event identity, reconcile uncertain delivery, and make downstream business effects tolerate duplicates when the application may resubmit.”

- **Example:** Event `dispatch-731` times out; resubmitting creates a new send even if the original arrived.
- **Guarantee/cost:** `delivery.timeout.ms >= request.timeout.ms + linger.ms`; deadlines trade waiting against uncertainty.
- **Trade-off/failure:** Blind resend can duplicate business effects; blind discard can lose them.
- **Follow-ups:** “acks=all?” → Stronger acknowledgment condition, still subject to uncertainty. “Transactions?” → Separate Kafka commit outcomes from external database effects.
- **Primary reference:** [Kafka 4.0 producer configuration](https://kafka.apache.org/40/configuration/producer-configs/).

---

**5. Login sets an authenticated flag on the existing anonymous session. Why can that enable session fixation?**

**Say aloud:**
“Session fixation means an attacker arranges for a victim to use a session identifier the attacker already knows. If authentication upgrades that same identifier into a privileged session, the attacker may reuse it without knowing the victim's password.

I would renew the identifier at authentication and other privilege increases, and ensure the old identifier cannot access the authenticated session. Use the framework's supported session mechanism and preserve only approved anonymous state, such as a validated shopping cart. Do not carry attacker-controlled security attributes across the transition.

Secure and HttpOnly cookies protect transport and script access, but they do not replace identifier renewal. Tests should retain the old cookie, perform login, then confirm that the old identifier lacks authenticated access. Also cover concurrent requests, logout invalidation and privilege elevation.”

- **Example:** Anonymous ID A becomes authenticated ID B; requests with A cannot read B's account.
- **Guarantee/cost:** Renewal breaks reuse of the fixed ID; session-store transitions must work across replicas.
- **Trade-off/failure:** Copying all anonymous attributes can preserve malicious state.
- **Follow-ups:** “SameSite?” → Helps constrain cross-site cookie sending; not a complete fixation defense. “Logout?” → Invalidate server-side state.
- **Primary reference:** [OWASP session renewal and fixation prevention](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#renew-the-session-id-after-any-privilege-level-change).

---

**6. An aggregation endpoint receives 50,000 item IDs and submits one task per item. How would you keep partial results bounded and meaningful?**

**Say aloud:**
“Fan-out means one request creates several downstream operations. A bounded worker pool limits running threads, but submitting every item can still retain an enormous queue and result set. I would cap request size and maintain a small window of outstanding operations, submitting another only as one finishes.

A completion service supplies finished futures, so a slow early item need not block collection of later results. I would attach the original item identity and represent success, failure and timeout explicitly. If response order matters, place results into their original positions after collection.

Use one overall deadline, with shorter transport budgets where necessary. On expiry, stop admission and request cancellation of owned work. Partial results need a documented product contract; silently converting failed prices into zero would be a correctness bug.”

- **Example:** At most 16 items outstanding; each result is `{itemId, status, value}` rather than an unlabeled number.
- **Guarantee/cost:** O(window) outstanding state; storing all accepted results remains O(n). Streaming can bound retention further.
- **Trade-off/failure:** Cancellation is cooperative; reserve downstream capacity and avoid assuming side effects were undone.
- **Follow-ups:** “Bound completion queue?” → Failed queue adds can lose retrievable completions. “Rejected submission?” → Mark it explicitly and clean up owned work.
- **Primary reference:** [Java 21 ExecutorCompletionService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorCompletionService.html).

---

**7. JSON serialization accesses a lazy Hibernate association after the service transaction ends. Should every association become eager?**

**Say aloud:**
“A lazy association delays loading related data until it is accessed. Hibernate needs an available persistence context, the session that manages entity state, to initialize data that has not been fetched. After that context closes, serialization may throw LazyInitializationException.

I would define the response shape and fetch only its required data while the service still owns the transaction. Map it into a response DTO, a separate data transfer object, before leaving that boundary. A projection or deliberate fetch plan can make the query cost visible.

Making every relationship eager replaces a lifecycle problem with uncontrolled loading. Keeping a session open through serialization can hide database access in presentation code. I would test with that convenience disabled and verify both the returned fields and the actual queries under realistic data volumes.”

- **Example:** Build `OrderSummary(id, customerName)` inside the service; the serializer receives no lazy entity proxy.
- **Guarantee/cost:** Materialized DTO fields need no later session access; fetching still costs queries and memory.
- **Trade-off/failure:** Large collection fetches can multiply rows; bound the response and choose its fetch plan.
- **Follow-ups:** “readOnly transaction?” → Not a promise to initialize every association. “Entity graph?” → A use-case fetch plan, not an authorization policy.
- **Primary reference:** [Hibernate 6.6 fetching guidance](https://docs.hibernate.org/orm/6.6/userguide/html_single/#best-practices-fetching).

---

**8. A scheduleAtFixedRate heartbeat runs once, throws, and never runs again. Why did a healthy executor stop that schedule?**

**Say aloud:**
“A periodic schedule represents a series of executions. For Java's ScheduledExecutorService, an execution that throws terminates that series and suppresses later executions. The executor itself may remain healthy and run other jobs.

I would inspect the returned ScheduledFuture and record the last successful heartbeat time. Expected transient failures can be handled inside the task with a defined continuation policy. Unexpected invariant failures should remain visible and may justify terminating the schedule; catching every Throwable and pretending success would conceal a broken job.

Fixed rate targets a cadence based on the initial schedule. Fixed delay waits after an execution finishes. Neither guarantees precise timing under load. For one fixed-rate task, a slow execution makes later executions late rather than concurrently running that same periodic task.”

- **Example:** If a one-second task takes three seconds, its own executions do not overlap; separate schedules may overlap.
- **Guarantee/cost:** A failed series becomes done exceptionally; successful periodic `get()` never returns normally.
- **Trade-off/failure:** Automatic continuation can repeatedly overload a failing dependency.
- **Follow-ups:** “Fixed delay on failure?” → Also suppresses later executions. “Fleet singleton?” → Local scheduling does not establish distributed ownership.
- **Primary reference:** [Java 21 ScheduledExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ScheduledExecutorService.html).

---

**9. A database outage makes every service fail liveness checks and restart continuously. What did the health contract get wrong?**

**Say aloud:**
“Liveness asks whether restarting this container can repair its local condition. Readiness asks whether it should currently receive service traffic. Startup probes allow initialization to finish before the other probes act. These signals answer different operational questions.

A shared database outage usually cannot be repaired by restarting every client. Putting that dependency into liveness can create a restart storm, lose useful state and add connection pressure when the database recovers. I would reserve liveness for recoverable local failure and define readiness from the service's actual ability to serve its promised contract.

If useful degraded responses remain possible, making every replica unready may worsen availability. Decide that behavior explicitly, use bounded probe work, and test dependency loss and recovery under load rather than only checking an idle happy path.”

- **Example:** Database unavailable: process remains live; readiness depends on whether its promised endpoints can still function.
- **Guarantee/cost:** Failed readiness removes normal Service routing eligibility; it does not itself restart the container or instantly drain existing connections.
- **Trade-off/failure:** Shared dependency probes can remove the entire fleet from service.
- **Follow-ups:** “Slow startup?” → Startup probe budget. “Probe connection load?” → Bound time, frequency and resource use.
- **Primary reference:** [Kubernetes liveness, readiness and startup probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/).

---

**10. A TreeSet ordered only by priority drops different jobs with equal priority. Which identity rule controls membership?**

**Say aloud:**
“A comparator defines ordering and returns zero when it considers two values equivalent. TreeSet uses that comparison to decide membership. If two different jobs have the same priority and the comparator examines nothing else, the set treats them as one element even if equals says they differ.

I would choose the intended identity first. For immutable job values, a comparator covering priority and every remaining equality field can preserve distinct values and the Set contract. If job ID alone defines identity while priority changes, a map keyed by ID plus a separately maintained ordering structure may fit better.

Comparison must be transitive and safe at numeric boundaries. Subtracting priorities can overflow; Integer.compare avoids that. Do not mutate fields that determine ordering while an element remains in the tree, because its stored position will no longer match comparisons.”

- **Example:** For `record Job(int priority, long id)`, compare priority, then ID; equality and comparison now agree.
- **Guarantee/cost:** TreeSet add, remove and contains are O(log n); comparison cost also matters.
- **Trade-off/failure:** Adding only an ID tie-breaker is insufficient if equals includes other fields.
- **Follow-ups:** “PriorityQueue?” → Can hold ties; iteration is not sorted. “Mutable priority?” → Remove before change, then reinsert under owned synchronization.
- **Primary reference:** [Java 21 TreeSet contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html).

---

**11. Return one longest strictly increasing subsequence as input indices. Why is the array of smallest tails not itself the answer?**

**Say aloud:**
“A subsequence preserves input order but may skip elements. For each possible length, I track the smallest ending value achieved so far and the index that supplied it. A smaller tail leaves at least as much room for future extensions.

For each value, binary search finds the first tail greater than or equal to it. Replacing that tail preserves the best extension opportunity; using greater than or equal prevents equal values from extending a strictly increasing sequence. The tails can come from incompatible histories, so returning those values directly is unsafe.

I also record a predecessor index when processing each element. Following predecessors from the last tail reconstructs one valid optimal sequence in reverse. Multiple optimal answers are acceptable. The method leaves the caller's array untouched, returns empty indices for empty input, and rejects null.”

- **Example:** For `[3, 4, 1, 2, 5]`, indices `[2, 3, 4]` select `[1, 2, 5]`; `[0, 1, 4]` is also optimal.

```java
static int[] increasingIndices(int[] values) {
    Objects.requireNonNull(values, "values");
    int n = values.length, length = 0;
    int[] tails = new int[n], previous = new int[n];
    Arrays.fill(previous, -1);
    for (int i = 0; i < n; i++) {
        int lo = 0, hi = length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (values[tails[mid]] < values[i]) lo = mid + 1;
            else hi = mid;
        }
        if (lo > 0) previous[i] = tails[lo - 1];
        tails[lo] = i;
        if (lo == length) length++;
    }
    int[] result = new int[length];
    int at = length == 0 ? -1 : tails[length - 1];
    for (int pos = length - 1; pos >= 0; pos--) {
        result[pos] = at;
        at = previous[at];
    }
    return result;
}
```

- **Guarantee/complexity:** O(n log(n+1)) time, O(n) auxiliary space and up to O(n) output. Input must remain unchanged during the call; caller must budget array memory.
- **Trade-off/failure:** No lexicographically smallest answer guarantee. Nondecreasing sequences require a different binary-search boundary.
- **Follow-ups:** “Count optimal sequences?” → Length/tail state alone discards counts. “Only length?” → Predecessor/output storage is unnecessary.
- **Reasoning:** The minimal-tail invariant and predecessor construction are algorithmic arguments; the published method is checked against exhaustive subsequence enumeration.

---

**12. Search a rotated nondecreasing array with duplicate values. Why can binary search degrade to linear time?**

**Say aloud:**
“A rotated sorted array takes a nondecreasing sequence and moves a prefix to the end. With distinct values, one side of a binary-search interval can be identified as sorted, allowing us to discard about half the candidates.

Duplicates weaken that evidence. When the left, middle and right values are equal and the middle is not the target, those endpoint values cannot identify which side contains the rotation. We can safely discard both endpoints because neither equals the target, but that may remove only two positions.

Otherwise, determine which half is sorted and test whether the target lies inside that half's value bounds. Maintain an interval that still contains any remaining possible match. Return any matching index, not necessarily the first. Validate the rotation contract outside the search when accepting arbitrary untrusted arrays; checking it costs linear time.”

- **Example:** `[1, 1, 1, 0, 1]` contains 0 at index 3; equal endpoints require cautious narrowing.

```java
static int rotatedIndex(int[] values, int target) {
    Objects.requireNonNull(values, "values");
    int lo = 0, hi = values.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (values[mid] == target) return mid;
        if (values[lo] == values[mid] && values[mid] == values[hi]) {
            lo++;
            hi--;
        } else if (values[lo] <= values[mid]) {
            if (values[lo] <= target && target < values[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (values[mid] < target && target <= values[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

- **Guarantee/complexity:** Empty input returns -1; null is rejected. O(log n) with distinct values, O(n) worst case with duplicates, O(1) auxiliary space. No mutation; input must stay stable during the call.
- **Trade-off/failure:** Arbitrary unsorted input is outside the contract; the method does not validate or sort it.
- **Follow-ups:** “First index?” → This method has no first-occurrence guarantee. “All equal, absent target?” → Repeated endpoint removal gives linear work.
- **Reasoning:** Interval preservation proves safe elimination; exhaustive sorted arrays, rotations and linear membership scans check the implementation independently.

---

**Topic coverage:** S08-Q01 executor failure observation; Q02 nullable uniqueness; Q03 tenant cache identity; Q04 producer acknowledgment uncertainty; Q05 session fixation; Q06 bounded fan-out and labeled partial results; Q07 persistence/serialization boundaries; Q08 periodic task termination; Q09 health-probe contracts; Q10 comparator membership; Q11 increasing-subsequence reconstruction; Q12 duplicate-aware rotated search. Cumulative coverage: **96 scenarios across eight sets**.

**Next set:** Build on explicit outcomes and identity with stream collector conflicts, JVM class initialization failure, query timeout versus transaction recovery, Kafka partition expansion, secure password migration, and directed graph structure. Continue sequential numbering as Set 9 even if another run occurs today; do not repeat these scenarios by changing nouns.
