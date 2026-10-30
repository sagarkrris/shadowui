**Set 18 · 29 October 2026 — Testing contracts and publication boundaries**

Reference assumptions: **Java 21 without preview features**, Spring Framework 7.0 caching semantics, Jakarta Persistence 3.2 and Kafka 4.0. Verify provider and framework-managed versions in a real application. These are reference versions, not latest-version recommendations. Primary references checked 29 October 2026.

Stable IDs: **S18-Q01–S18-Q12**, in order. Spoken answers target 45–90 seconds. Examples are original illustrations, not personal experience. Framework, filesystem, broker and security scenarios are contextual designs rather than executed integrations. Q11 contains the only runnable Java block, compiled and tested by its dedicated fixture. Q10 and Q12 are explicitly conceptual reasoning exercises.

---

**1. A concurrent map safely publishes a mutable ArrayList value. Why do later appends still race?**

**Say aloud:** “Safe publication means that readers can see state established before the value was placed into the map. It does not turn that value into a concurrent collection. Two threads can retrieve the same ArrayList and mutate its internal size and storage without a shared coordination rule. Protecting the container and protecting its contents are separate responsibilities.

I would prefer immutable lists replaced through an atomic per-key update, or choose a value structure whose operations fit the required contract. If several operations must happen together, even a concurrent value needs a larger protocol. Copying on each update trades allocation for simple reader ownership, and is unsuitable for an unbounded hot list. I would test competing writers with controlled scheduling, assert no accepted entries disappear, and check that readers cannot modify published snapshots. A successful map lookup alone proves neither deep immutability nor a consistent multi-key snapshot.”

**Example:** Conceptual: publish List.of("A"); replace it atomically with a new immutable list containing A and B. Never append to a shared ArrayList merely because its containing map is concurrent.

**Deep dive / verification:** Copy replacement costs O(k) for k entries. Bound list growth. Null elements need an explicit policy; List.copyOf rejects them. Per-key atomic replacement does not protect a global total.

**Follow-ups:** Would synchronizedList suffice? Individual methods synchronize, but iteration and compound decisions require the documented external locking discipline. Can compute perform network calls? Keep callbacks short and move external effects outside.

**Primary reference:** [Java 21 ConcurrentHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html).

---

**2. A bounded ExecutorCompletionService queue fills. Why can a caller wait forever for completed tasks?**

**Say aloud:** “A completion service separates task execution from collecting finished futures. The queue holds completion notifications, not pending work. Its supplied queue is treated as unbounded: a failed insertion can make a completed task unavailable through the service. Therefore replacing the default queue with a tiny bounded queue is not a safe way to apply backpressure.

I would bound admitted tasks before submission and continuously drain completion results. The default completion queue can then grow only within the deliberately bounded in-flight population. Submission rejection must reduce the count of completions expected, and every accepted task needs a tracked terminal outcome. If result processing is slow, admission must slow too. I would test a burst of completions while the collector pauses, then verify every accepted future is accounted for within a deadline. Queue capacity and executor capacity protect different stages; neither alone establishes end-to-end progress.”

**Example:** Conceptual: admit at most 20 jobs; process one completion before admitting another. Do not submit 10,000 jobs then expect a completion queue of size 20 to block workers safely.

**Deep dive / verification:** Bound both retained results and in-flight work. A completion is not necessarily success: get can reveal failure or cancellation. Cancellation handling must match the actual executor lifecycle.

**Follow-ups:** Can I block in a custom queue add? That changes worker behavior and can introduce deadlocks; prefer admission control. Is take deadline-aware? Use timed poll and an overall deadline.

**Primary reference:** [Java 21 ExecutorCompletionService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorCompletionService.html).

---

**3. An AtomicInteger ticket counter wraps into negative IDs. Did atomicity promise uniqueness forever?**

**Say aloud:** “Atomicity means that an operation has one indivisible update point. It does not enlarge an integer or validate business meaning. Java int arithmetic wraps, so incrementing the maximum signed value yields a negative result. Eventually a finite counter repeats values, and a process restart can repeat them much sooner.

I would first define the identifier scope and lifetime: one process execution, one tenant, or durable global identity. For a bounded local sequence, a compare-and-set loop can reject exhaustion before changing the maximum value. For durable IDs I would use a database identity or another explicitly designed allocation scheme, retaining a uniqueness constraint at storage. A wider number postpones exhaustion but does not solve restart or multi-node collisions. I would test near the numeric boundary, concurrent exhaustion, and restart behavior. Atomic operations support a protocol; they do not supply the protocol's identity contract.”

**Example:** Conceptual: state MAX_VALUE-1 admits one last ticket; later callers receive exhaustion. Never allocate a wrapped negative ticket and then attempt to repair it after publication.

**Deep dive / verification:** A CAS retry loop has contention-dependent progress and no fixed per-caller retry bound. Checked arithmetic alone does not persist a counter or coordinate replicas.

**Follow-ups:** Is AtomicLong sufficient? Only with a documented lifetime and restart strategy. Can resetting to zero repair wrap? It creates collisions with still-live tickets.

**Primary reference:** [Java 21 AtomicInteger](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html).

---

**4. A recursive DTO mapper fails on a deeply nested but acyclic document. Why is cycle detection insufficient?**

**Say aloud:** “A cycle revisits an earlier node; depth counts how many unfinished calls are nested. An acyclic chain can still be arbitrarily deep. A recursive mapper keeps one call frame for each level and can overflow the thread stack even when a cycle detector never finds a repeated node. Increasing heap size does not directly remove that call-depth requirement.

I would impose explicit input depth and total-node limits at the trust boundary, then consider an iterative traversal with a bounded explicit work stack. Iteration moves bookkeeping into controlled storage but does not make unlimited input cheap. If shared references are allowed, distinguish a node on the current path from one visited on a different branch. I would test a long chain, a true cycle, a shared child, and an oversized branching tree. Raising the stack limit might postpone failure; it is not a substitute for a resource contract.”

**Example:** Conceptual: a 100,000-node parent-child chain has no cycle. Reject it at the configured maximum depth before recursively constructing its entire DTO graph.

**Deep dive / verification:** Full traversal costs O(V+E) for vertices and references when each is processed once. Track depth separately from visited identity; equality-based tracking can merge distinct nodes incorrectly.

**Follow-ups:** Catch StackOverflowError and retry? Reject excessive input earlier; recovery may itself need stack. Does iteration remove memory limits? No; cap queued nodes and output size.

**Primary reference:** [Java 21 StackOverflowError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StackOverflowError.html).

---

**5. Cacheable(sync=true) stops local duplicate loads. Does it elect one loader across all service replicas?**

**Say aloud:** “A cache miss is a read for which the cache has no stored answer. Synchronized caching asks the selected cache implementation to coordinate competing loads for a key. It is not a universal distributed election guarantee. Ten replicas using independent local caches can still execute ten loads for the same missing key.

I would identify the actual cache provider and its synchronization scope before promising stampede protection. For inexpensive reads, one load per replica may be acceptable. For expensive global work, use a provider-supported distributed protocol or redesign the work as a durable job with explicit ownership and failure recovery. Coordination introduces waiting, timeout and owner-failure behavior that must be specified. I would test concurrent misses within one instance and across instances, including a loader exception. Also verify calls cross the caching proxy. A cache annotation expresses policy; its backing implementation determines important execution guarantees.”

**Example:** Conceptual: replicas A and B each hold an empty local cache. Both may run a loader despite sync=true. A local barrier test alone cannot establish fleet-wide exclusion.

**Deep dive / verification:** Assume Spring Framework 7.0 annotation semantics; verify the deployed provider. Synchronized caching has documented restrictions, including one cache and no unless expression. Cached data still needs expiration and authorization-safe keys.

**Follow-ups:** Can a lock replace durable idempotency? No; retries after owner failure still need effect-level protection. Does self-invocation intercept? Default proxy mode does not intercept internal calls.

**Primary reference:** [Spring synchronized caching](https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html).

---

**6. A single-result JPA lookup starts throwing after historical duplicates appear. Should the DAO silently select the first row?**

**Say aloud:** “A single-result query states a cardinality expectation: at most one matching result, with an exception when the single-result contract is violated. Selecting the first row changes that expectation into an arbitrary choice. If an account lookup accidentally matches historical and current records, hiding the duplicate can route a write to the wrong record.

I would clarify whether the business key is unique across all history or only within the current scope. Encode the appropriate tenant and lifecycle predicates, enforce the corresponding database invariant where possible, and repair existing data deliberately. If choosing the newest record is truly the business rule, specify a total ordering with a deterministic tie-breaker rather than relying on storage order. I would test absent, single, duplicate, historical and cross-tenant results. The query's exception is evidence of a broken expectation, not permission to guess which entity the user intended.”

**Example:** Conceptual: externalRef=R matches one archived account and one active account. A current-account command must explicitly select the authorized current scope and reject multiple current matches.

**Deep dive / verification:** Jakarta Persistence 3.2 getSingleResult throws NoResultException or NonUniqueResultException as applicable; these exceptions alone do not mark the transaction for rollback. Application/framework policy may differ. Index and inspect the scoped query.

**Follow-ups:** Is getSingleResultOrNull safer? It handles absence, not multiple results. Can DISTINCT repair duplicates? It can remove repeated result identities, not choose between distinct business entities.

**Primary reference:** [Jakarta Persistence 3.2 query contracts](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

---

**7. Kafka heartbeats continue while processing blocks. Can max.poll.interval.ms still force a rebalance?**

**Say aloud:** “Heartbeats tell the group coordinator that a member is reachable. Poll progress is a separate signal that the application is making progress. With ordinary dynamic group membership, exceeding the maximum interval between polls can cause the member to leave the group even when background heartbeats were healthy. A long-running handler therefore cannot rely solely on a generous session timeout.

I would measure worst-case processing time for an admitted batch, reduce batch work or move processing behind bounded per-partition ownership, and keep consumer calls on their designated thread. Raising the poll interval trades slower stuck-member detection for more processing time; it does not fix a hung dependency. Any asynchronous design must commit only completed contiguous progress and reject stale owner completions after reassignment. I would force a handler stall and observe assignment changes and replay. Static membership changes the timing, so I would verify the configured protocol before predicting recovery latency.”

**Example:** Conceptual: a dynamic member polls at t=0, then processes for six minutes with a five-minute max poll interval. Healthy heartbeats alone do not make that batch safe from reassignment.

**Deep dive / verification:** Kafka 4.0 assumptions. For a non-null group.instance.id, exceeding max poll interval stops heartbeats and reassignment waits for session timeout rather than occurring immediately. Bound outstanding records and effect retries.

**Follow-ups:** Does pause replace poll? No; continue polling while paused. Can I commit the fetched batch immediately? That risks skipping unfinished effects after a crash.

**Primary reference:** [Kafka 4.0 consumer configuration](https://kafka.apache.org/40/configuration/consumer-configs/).

---

**8. A configuration writer overwrites a file while readers reload it. How can partial publication be prevented?**

**Say aloud:** “A file existing at a path does not mean its contents are complete. Truncating a shared file and writing it gradually lets another process observe an empty or partial configuration. Atomic publication means readers see a complete old version or a complete new version at the publication boundary.

I would write and validate a temporary file on the same filesystem, then request an atomic move into the publication location where the provider supports the required semantics. If atomic replacement is unavailable, I would fail explicitly or use immutable versioned files with an independently safe version-selection protocol. I would not silently fall back to copy-and-delete while claiming atomicity. Concurrent writers need coordination or version checks to prevent lost updates. Tests should repeatedly reload during publication and inject write and move failures. Atomic visibility is separate from crash durability, which requires filesystem-specific synchronization and recovery design.”

**Example:** Conceptual protocol:
```text
write unique temporary version -> validate complete contents
request supported atomic publication -> reload chosen complete version
on failure: retain previous valid version; report failure
```

**Deep dive / verification:** Java 21 ATOMIC_MOVE support is provider-specific; replacement of an existing target is implementation-specific with this option. Other copy options are ignored for an atomic move. Do not assume REPLACE_EXISTING universally repairs this.

**Follow-ups:** Does close prove power-loss durability? No. Can two writers use one temp name? Use unique names plus explicit publication ownership; otherwise they can overwrite each other.

**Primary reference:** [Java 21 Files.move contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**9. A malicious username inserts fake success entries into application logs. What makes logging an input boundary?**

**Say aloud:** “Log injection means untrusted input changes the structure or interpretation of an audit record. A username containing a newline can make a plain-text log appear to contain an additional trusted event. Parameterized logging avoids some formatting mistakes, but it does not automatically sanitize every downstream text format or viewer.

I would use structured records with a real encoder, validate or encode control characters for the chosen sink, and keep event type, outcome and actor identity in separate fields. Bound field size and avoid recording tokens or unnecessary personal data. Correlation identifiers supplied by clients remain untrusted and should not overwrite server-generated identity. I would send newline, delimiter and oversized inputs through the complete ingestion and display pipeline, then verify one event remains one event. Logging should preserve useful evidence without letting the requester manufacture authority or exhaust the log budget.”

**Example:** Conceptual: the display name contains a newline followed by payment=SUCCESS. The stored event must still identify a failed login and encode that display name as data.

**Deep dive / verification:** Encoding costs O(k) for a bounded field of k characters. Structured JSON is useful only if downstream tooling preserves its structure. Protect log access and define behavior when the sink is unavailable.

**Follow-ups:** Can we remove all user input? Keep necessary bounded context while minimizing sensitive data. Does escaping HTML solve text logs? Encoding must match the actual output context.

**Primary reference:** [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

---

**10. A retry protocol passes happy-path tests. How would a state-machine model expose an illegal success after a crash?**

**Say aloud:** “A state machine describes allowed states and the commands that change them. A model-based test compares an implementation with a simpler reference model after sequences of commands, rather than testing each method only in isolation. For a durable job, acceptance, execution and completion are different states, and a restart must recover from persisted evidence.

I would define invariants before generating histories: acknowledged jobs remain recoverable, completed jobs have durable outcome evidence, and retries cannot produce two business effects. Then generate short histories containing duplicate requests, crash boundaries, timeouts and restart. The model should describe durable facts independently of the implementation's internal classes. For a failing history, shrink it to the smallest sequence that preserves the failure. I would retain that history as a regression. Passing generated tests gives bounded evidence, not proof of every concurrent schedule; real storage and transport fault tests still matter.”

**Example:** Original reasoning model: accept -> persist pending -> acknowledge -> restart -> execute -> persist result. A model rejects acknowledge -> crash -> no recoverable job, even if the normal completion path works.

**Deep dive / verification:** For c command choices and maximum length d, exhaustive histories grow exponentially, O(c^d). Use small exhaustive models, reproducible random seeds and explicit scheduler control. This is a conceptual test design, not an executed distributed system.

**Follow-ups:** Can the model copy the production code? That risks reproducing the same mistake; model observable promises. What about external effects? Model an independent effect ledger and include ambiguous outcomes.

**Primary reference:** [Java atomic-operation scope as a boundary example](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html).

---

**11. Return the next lexicographically larger integer permutation in place. How do duplicates affect the pivot?**

**Say aloud:** “Lexicographic order compares sequences at their first different position. The next permutation must keep the longest possible prefix unchanged and increase the remaining part by the smallest amount. I scan from the right to find the first element smaller than its successor. Everything after that pivot is nonincreasing, so that suffix is already its largest arrangement.

I swap the pivot with the rightmost suffix element strictly larger than it, which is the smallest available increase because of the suffix order. Reversing the suffix then makes the remainder minimal. Strict comparisons are essential with duplicate values. If no pivot exists, I reverse the entire array to its smallest arrangement and return false to signal wraparound. Empty and singleton arrays also return false. I would verify against independently enumerated, sorted distinct permutations, including duplicates and extreme integers, rather than test only a few increasing inputs.”

**Example:** For [1,3,2], pivot 1 swaps with 2, then suffix reversal yields [2,1,3]. For [2,2,1], return false and leave [1,2,2]. Java 21 runnable code follows.

**Deep dive / verification:** O(n) time and O(1) extra storage; mutates input by contract. Null throws NullPointerException. Compare values directly rather than subtracting them, avoiding comparison overflow. The proof uses suffix ordering, not a library permutation API.

**Follow-ups:** Why rightmost larger? It is the smallest larger suffix value. Are equal-value arrangements repeated? Each step advances to the next distinct value sequence; wraparound is explicit.

**Primary reference:** [Java 21 array comparison API for verification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

```java
public final class NextPermutation {
    public static boolean advance(int[] values) {
        java.util.Objects.requireNonNull(values, "values");
        int pivot = values.length - 2;
        while (pivot >= 0 && values[pivot] >= values[pivot + 1]) pivot--;
        if (pivot >= 0) {
            int successor = values.length - 1;
            while (values[successor] <= values[pivot]) successor--;
            swap(values, pivot, successor);
        }
        for (int left = pivot + 1, right = values.length - 1; left < right; left++, right--) {
            swap(values, left, right);
        }
        return pivot >= 0;
    }
    private static void swap(int[] values, int a, int b) {
        int previous = values[a];
        values[a] = values[b];
        values[b] = previous;
    }
}
```

---

**12. Choose the fewest inspection times hitting every closed availability interval. Why choose the earliest finishing endpoint?**

**Say aloud:** “An inspection time hits an interval when it lies between that interval's endpoints, including both endpoints. We want a minimum-size set of times covering every interval. I sort intervals by their right endpoint. For the earliest-ending interval not yet covered, I choose its right endpoint and skip every interval containing that point.

The exchange argument explains optimality: every valid solution must choose some point inside the earliest-ending interval. Moving that chosen point right to this interval's end cannot lose coverage of any remaining interval that it previously hit, because those intervals end no earlier. Repeating this replacement gives an optimal solution with our greedy choices. Closed endpoints matter: touching intervals can share one inspection time. I would reject reversed or null intervals, leave the caller's input unchanged, and test the chosen times against a brute-force optimum over small integer endpoints. Empty input returns no times.”

**Example:** Conceptual algorithm: sort a copy by end; for each interval, choose end only if there is no chosen point or the latest point is less than start. [1,3], [2,5], [3,7] all share point 3; [4,4] then requires another point.

**Deep dive / verification:** O(n log n) sorting time and O(n) storage for copied input/output. Use comparator comparisons rather than endpoint subtraction. Open or half-open intervals require a revised proof and representation; do not reuse closed-endpoint logic blindly.

**Follow-ups:** Is this interval merging? No; merging reports unions, while this returns a minimum hitting set. What if inspections have unequal prices? This greedy proof no longer establishes minimum cost.

**Primary reference:** [Java 21 sorting API; exchange proof derived here](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**Topic coverage:** Mutable value ownership, completion accounting, finite atomic counters, JVM recursion depth, cache coordination scope, JPA cardinality, Kafka poll progress, atomic filesystem publication, log integrity, state-machine testing, permutations and interval hitting sets.

**Next set builds on:** independent evidence for recovery protocols, evolving durable state machines, and algorithms that return verifiable optimality witnesses. Continue sequential set numbering even on the same date.
