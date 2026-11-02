**Set 20 · 2 November 2026 — Identity, progress and constrained scheduling**

Reference assumptions: **Java 21 without preview features**, Spring Framework 7.0 async support in a compatible Spring Boot application, Jakarta Persistence 3.2 and Kafka 4.0 consumer API. These are reference versions, not upgrade recommendations. Primary references checked 2 November 2026; verify actual provider and Boot-managed versions.

Stable IDs: **S20-Q01–S20-Q12**, in order. Spoken answers target 45–90 seconds. Examples are original illustrations, not personal experience. Framework and distributed scenarios are contextual designs, not executed integrations. Q12 is compiled and behaviorally tested Java; other examples are contextual or conceptual.


---

**1. A literal replacement value contains $1 and changes unexpectedly in replaceAll. Which language is interpreting it?**

**Say aloud:** “A regular expression describes what to match; a replacement string has its own small language for inserting captured groups. Quoting the pattern does not quote the replacement. If a customer's literal label contains a dollar sign or backslash, passing it directly as a regex replacement can interpret it as a group reference or fail instead of preserving the label.

I would use String.replace when both operands are literal strings. When regex matching is intentional, I would pass the literal replacement through Matcher.quoteReplacement. I would keep those decisions visible at the call site because pattern escaping and replacement escaping solve different problems. Tests should include dollar signs, backslashes, empty matches and repeated matches. This protects the replacement's meaning; it does not make an expensive or untrusted pattern safe. I would separately bound input and select an appropriate matching algorithm.”

**Example:** Contextual Java: `text.replaceAll("TOKEN", Matcher.quoteReplacement(label))` preserves a literal label such as `$1`. Import java.util.regex.Matcher.

**Deep dive / verification:** Output allocation grows with the resulting text, which can exceed input size. Regex runtime depends on the pattern; no general linear-time guarantee applies. Verify exact output rather than merely absence of exceptions.

**Follow-ups:** Can Pattern.quote replace quoteReplacement? No; it quotes the matching language. Can Matcher be shared concurrently? No; it holds mutable matching state.

**Primary reference:** [Primary documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Matcher.html).

---

**2. A plugin object cannot be cast to an interface with the same fully qualified name. Why can identical names denote different types?**

**Say aloud:** “A class loader defines classes for a runtime namespace. In the JVM, a class is identified by its binary name together with its defining loader. Two copies of an interface loaded independently can therefore be different runtime types even when their source and names match. A cast can fail without either file being corrupt.

I would inspect the defining loaders of the interface expected by the host and the interfaces implemented by the plugin. Shared contracts should normally be loaded through a common parent, while plugin implementation dependencies can remain isolated. I would remove duplicate contract definitions from the isolated loading path and verify delegation policy. Simply renaming jars or catching ClassCastException hides the boundary. I would test two plugins with different private dependencies plus one shared contract, including reload. Loader isolation is useful, but it requires deliberate ownership of every type crossing the boundary.”

**Example:** Conceptual: host loader H defines api.Report; child-first loader P independently defines api.Report. A P implementation is not automatically an H Report.

**Deep dive / verification:** This is runtime identity, not a hash collision or generic erasure issue. Log class name and defining loader; avoid relying on class names alone for compatibility. Initialization failures are a separate problem.

**Follow-ups:** Does identical bytecode fix it? No; defining-loader identity still differs. Should every dependency be shared? No; share boundary contracts and deliberately isolate private implementations.

**Primary reference:** [Primary documentation](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.3).

---

**3. Every worker submits a child task to the same fixed pool and waits. Why can the queue remain nonempty forever?**

**Say aloud:** “Thread starvation occurs when work cannot obtain the execution capacity needed to make progress. If every thread in a fixed pool runs a parent that waits for a queued child in that same pool, no worker remains available to execute the children. No pair of Java monitor locks is required for this dependency deadlock.

I would draw the dependency graph between tasks and execution resources, then inspect thread dumps and queue state. Prefer composing stages without blocking occupied workers, or execute a small child directly when ownership allows it. A separate bounded executor can break this particular cycle, but its own dependencies and admission policy still need analysis. Increasing the pool size only postpones failure when parent concurrency grows with it. I would create a deterministic test that gates all parents before child submission and verifies completion under the revised design, with bounded test cleanup.”

**Example:** Conceptual: two pool threads run two parents; each submits one child and calls get. Both children wait in the queue while both workers wait for results.

**Deep dive / verification:** Queue capacity bounds retained tasks, not dependency safety. Nonblocking composition still needs deadlines, bounded admission and explicit failure handling. Virtual threads do not remove downstream resource cycles.

**Follow-ups:** Would a larger queue help? No; children still need workers. Is CallerRunsPolicy a universal fix? No; it changes execution context and applies only when rejection occurs.

**Primary reference:** [Primary documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html).

---

**4. A Spring Async void method fails after its caller returns. Where should the failure contract live?**

**Say aloud:** “Asynchronous invocation separates the caller's return from the worker's eventual outcome. A void return supplies no future through which the caller can observe a later exception. In Spring's proxy-based async support, that exception cannot simply travel back through a call stack that has already returned.

I would choose the contract first. For a request that needs the outcome, return a supported future type and make its consumer observe failure. For background best-effort work, configure an AsyncUncaughtExceptionHandler and record enough safe context for diagnosis. For business-critical accepted work, use durable job state and a recovery protocol rather than assuming an exception handler makes execution reliable. I would test both worker failure and submission rejection; rejection can happen before execution begins. I would also verify the call actually crosses the async proxy and that the application has enabled async support.”

**Example:** Contextual Spring: a proxied `@Async void refreshPreview(long id)` needs an uncaught async exception policy; a CompletableFuture result supports caller observation when consumed.

**Deep dive / verification:** An exception handler is observation, not durable delivery or automatic retry. Bound executor resources and avoid recording secrets in failure context. Test the Boot-managed Spring version and actual executor configuration.

**Follow-ups:** Will a local try/catch around invocation catch later worker failure? No. Does switching to a future make failures visible automatically? Only if someone observes the result.

**Primary reference:** [Primary documentation](https://docs.spring.io/spring-framework/reference/integration/scheduling.html).

---

**5. A child uses orphanRemoval and is moved between parents before flush. Why is this a fragile reparenting protocol?**

**Say aloud:** “Orphan removal expresses private lifecycle ownership: removing a child from its owning relationship can cause deletion at flush. It is appropriate when that child should cease to exist without its parent. Moving the same entity to another parent is a different domain operation, and portable application code must not rely on reassigning an entity that has been orphaned.

I would clarify whether the child is a privately owned value-like component or an independently movable entity. For a movable assignment, choose a mapping and explicit command that update the owning foreign key while keeping both in-memory sides consistent. For a privately owned line item, removal may mean deletion and a new line may be created under the destination with explicit identity semantics. I would test flushed database state and rollback under the actual provider. A collection that looks right in memory is not proof that the resulting SQL preserves identity.”

**Example:** Conceptual: moving order line L from order A to B is not equivalent to deleting L and creating another line when external references must remain valid.

**Deep dive / verification:** Persistence 3.2 defines orphan-removal semantics and portability restrictions. Do not depend on a provider-specific flush order to rescue an ambiguous lifecycle. Lock/version the business invariant where concurrent moves are possible.

**Follow-ups:** Is cascade REMOVE identical? No; parent removal and relationship disassociation are different triggers. Can updating only the inverse collection move the foreign key? No; the owning side controls it.

**Primary reference:** [Primary documentation](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

---

**6. A management endpoint calls seek on a KafkaConsumer while its owner polls. Why is synchronizing just the endpoint insufficient?**

**Say aloud:** “A Kafka consumer has mutable connection, position and group state and is not generally thread-safe. Protecting only an administrative method with a lock does nothing if the polling thread does not follow the same synchronization protocol. Concurrent seek and poll also create a semantic problem: the administrator needs to know exactly which work belongs before and after the position change.

I would keep consumer operations on one owner thread and send it bounded control commands. That owner can pause affected processing, account for in-flight work, apply a validated seek and report the resulting position. Kafka's wakeup method is a documented exception useful for interrupting a blocking owner operation, but it is not permission to invoke arbitrary consumer methods concurrently. I would test commands arriving during poll, shutdown and rebalance. Authorization and auditing also matter because repositioning can repeat or skip business effects.”

**Example:** Conceptual: endpoint enqueues a reposition request; owner handles it between polls. Specify whether completed effects are replayed and which offset is committed after the command.

**Deep dive / verification:** Bound the command queue and return explicit rejection or pending status. A seek changes fetch position, not previous database effects or automatically the committed restart position.

**Follow-ups:** Can workers process payloads concurrently? Yes, with consumer operations confined and completion tracking. Can wakeup close the consumer? No; the owner should handle wakeup and close in its lifecycle.

**Primary reference:** [Primary documentation](https://kafka.apache.org/40/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html).

---

**7. A signed pagination token still works after the user loses access. What did token integrity fail to establish?**

**Say aloud:** “Integrity means the token has not been modified without detection. Authorization means the current caller is allowed to perform this request. A signed continuation token can preserve a cursor and filters while saying nothing about whether access has since been revoked. Treating the signature as permanent permission confuses these contracts.

I would authenticate the current request, verify the token's integrity and expiry, bind its purpose and tenant context, and enforce current authorization on every page query. The token should carry only the state needed for traversal; sensitive cursor contents may also require confidentiality. I would test reuse by another tenant, revoked membership, changed filters and malformed tokens. If a product intentionally grants a delegated capability, that is a separate explicit security contract with scope and revocation policy. A convenient pagination implementation should not silently invent such a capability.”

**Example:** Conceptual: token says tenant T, after invoice 84. Verify caller still belongs to T and apply the same row-level permission predicate as on page one.

**Deep dive / verification:** Token verification cost depends on the cryptographic scheme; query cost depends on indexing. Limit token size before parsing, handle key rotation, and avoid disclosing protected identifiers in error messages.

**Follow-ups:** Does encryption replace authorization? No; hiding fields does not grant current permission. Must a token contain roles? Prefer current policy evaluation; embedded roles can become stale.

**Primary reference:** [Primary documentation](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

---

**8. A restored service reuses old request IDs and another service discards new commands as duplicates. How should recovery preserve identity?**

**Say aloud:** “Deduplication remembers operation identities so retries do not repeat effects. A restore can move a local counter backward while another service keeps its newer history. Newly issued commands can then collide with old IDs and be incorrectly treated as already completed. Data recovery must include the identity namespace shared with other systems.

I would define an operation ID independent of a rollback-prone local counter, or allocate a new recovery generation through a mechanism that cannot itself roll back into the old namespace. Existing retries must retain their original IDs; only genuinely new commands use new identities. I would inventory deduplication stores, retention windows and external effects before reopening writes. In a drill, restore only one participant while leaving downstream history intact. Restoring every component together hides this split-history failure. Random identifiers reduce collision probability but do not replace correct retry ownership or durable mapping.”

**Example:** Original protocol: downstream remembers command generation G, sequence 500. Restore local sequence 450; new operations must not reuse G/451 through G/500.

**Deep dive / verification:** This is a derived distributed recovery design, not a framework guarantee. Verify uniqueness, stable retry identity and retention independently. A generation stored only in the restored backup does not solve the problem.

**Follow-ups:** Can deleting the downstream dedup table repair it? It can replay old effects; reconcile first. Is timestamp alone unique? Clock rollback and concurrent issuance defeat that assumption.

**Reasoning basis:** The model, counterexample and correctness argument are derived here; they are not a library or framework guarantee.

---

**9. An API changes an optional field from absent to explicit null. Why can this break a rolling release?**

**Say aloud:** “A wire contract describes meaning as well as syntax. For an update API, an absent field can mean leave unchanged, while explicit null can mean clear the value. A serializer upgrade that emits nulls instead of omitting them can therefore change business behavior even though both payloads are valid JSON.

I would document three states where needed: absent, supplied value and explicit removal. Use a request representation that preserves presence until validation and domain mapping finish. A plain nullable field often collapses absent and null into the same Java state. I would exercise old clients against new servers and new clients against old servers, including replayed persisted requests. Reject unsupported removal rather than silently converting it to an empty string. This is especially important during rolling upgrades and retries, because equivalent-looking messages may be interpreted by different versions before the rollout completes.”

**Example:** Original API design: `{}` preserves displayName; `{"displayName":null}` clears it only if removal is allowed. These are explicitly chosen application semantics, not universal JSON rules.

**Deep dive / verification:** Validate lengths and allowed transitions after presence decoding. Preserve intent through DTO-to-command mapping and persisted retry payloads. Test authorization for clearing sensitive fields separately.

**Follow-ups:** Can Optional alone preserve all three states? Not without explicit presence handling in the binding contract. Is adding a default harmless? Only when every supported reader and persisted request agrees on its meaning.

**Primary reference:** [RFC 7396 JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7396) defines one standardized absent/null distinction. This example chooses its own application contract; ordinary JSON alone does not impose update semantics.

---

**10. A queue reports low average delay while one tenant waits forever. Which progress promise is missing?**

**Say aloud:** “Starvation means some eligible work never receives service even while the system makes aggregate progress. Average delay over completed jobs excludes the jobs still waiting, so a scheduler can look healthy while repeatedly preferring newer or higher-priority work. Throughput and fairness are separate promises.

I would measure oldest eligible age and wait distributions by bounded workload class, including unfinished jobs. Then define a policy: priority with aging, reserved capacity, or admission limits that make a maximum wait feasible under stated load assumptions. Aging gradually raises waiting work's priority, but cannot promise a deadline if arrivals exceed capacity indefinitely. I would test a sustained high-priority stream plus an older low-priority job and inspect when it actually starts. Per-tenant labels must remain bounded in telemetry. The goal is an explicit progress contract and evidence for it, rather than a low average that ignores the stranded work.”

**Example:** Original scheduling exercise: one low-priority job waits behind a continuous high-priority stream. Add a stated aging rule and simulate bounded arrival rates plus overload.

**Deep dive / verification:** A priority heap costs O(log n) per insertion/removal; changing effective priorities requires a correct update strategy. Fair start opportunities do not guarantee equal completion times for different job costs.

**Follow-ups:** Will FIFO always meet deadlines? No; long jobs can block short urgent ones. Can aging guarantee bounded delay under unlimited overload? No; admission and capacity assumptions are necessary.

**Reasoning basis:** The model, counterexample and correctness argument are derived here; they are not a library or framework guarantee.

---

**11. Find the minimum simultaneous rooms for half-open meetings. Why must an end be processed before an equal start?**

**Say aloud:** “A half-open interval includes its start and excludes its end. A meeting ending at ten therefore shares a room with one beginning at ten. I would count active intervals with a sweep: create start and end events, sort them by time, and process ends before starts at equal times. The largest active count is the required number of rooms.

Every simultaneously active meeting needs a distinct room, so that peak is a lower bound. Assigning a freed room whenever available achieves the same bound, which establishes optimality for interchangeable rooms without setup time. I would reject reversed intervals and ignore zero-length intervals under the stated empty-interval interpretation. Test touching endpoints, duplicates, nested meetings and negative time coordinates against an independent overlap oracle. The sweep gives the count; returning actual room assignments requires retaining identities and reusable room IDs. Changing to closed intervals changes the tie rule.”

**Example:** Conceptual: [1,3), [3,5), [2,4) need two rooms, not three. [2,2) occupies no time in this model.

**Deep dive / verification:** O(n log n) time and O(n) event storage. Compare timestamps directly rather than subtracting them in a comparator, which can overflow. Setup/cleanup durations must be included before applying this model.

**Follow-ups:** Why do starts first fail? They count touching meetings as overlapping. Are room-specific equipment constraints covered? No; compatibility introduces a different assignment problem.

**Reasoning basis:** The model, counterexample and correctness argument are derived here; they are not a library or framework guarantee.

---

**12. Schedule independent integer-duration jobs on exactly two identical workers with minimum finish time. Why is longest-first only a heuristic?**

**Say aloud:** “The finish time is the larger of the two worker loads. With independent jobs, no setup costs and no preemption, choosing which jobs go to the first worker determines the entire schedule. Longest-first is a useful heuristic but does not always find the best partition. For small total duration, I would compute exactly which subset sums are reachable.

Start with only sum zero reachable. For each job, update reachable sums backward so that job is used at most once. Choose the largest reachable sum at most half the total; its complement is the other load. This is optimal because moving the smaller load closer to half minimizes the larger load. I would compare against exhaustive assignments on small inputs and test zero durations, one job and skewed workloads. The method is pseudo-polynomial: its cost depends on numeric total, not just the number of jobs. Large totals need another explicitly bounded strategy.”

**Example:** Java 21 below returns only the optimum finish time. Durations [8,7,6,5,4] admit 15/15; longest-first yields 17/13 with usual least-loaded placement. Input is preserved.

**Deep dive / verification:** O(nS) time and O(S) storage for total S; reject negative values and totals above 1,000,000 before allocation. Empty input returns zero; null throws. No dependency or machine-compatibility constraints are modeled. Reconstruction needs extra decision information.

**Follow-ups:** Why backward updates? Forward updates could reuse the current job. Is this polynomial in input bits? No; binary-encoded large durations make S much larger than input length.

**Reasoning basis:** The model, counterexample and correctness argument are derived here; they are not a library or framework guarantee.

```java
public final class TwoWorkers {
    public static int minimumFinish(int[] durations) {
        java.util.Objects.requireNonNull(durations, "durations");
        long total = 0;
        for (int duration : durations) {
            if (duration < 0) throw new IllegalArgumentException("negative duration");
            total += duration;
            if (total > 1_000_000) throw new IllegalArgumentException("total too large");
        }
        int sum = (int) total;
        boolean[] reachable = new boolean[sum / 2 + 1];
        reachable[0] = true;
        for (int duration : durations) {
            for (int s = sum / 2; s >= duration; s--) {
                reachable[s] |= reachable[s - duration];
            }
        }
        for (int s = sum / 2; s >= 0; s--) {
            if (reachable[s]) return sum - s;
        }
        throw new AssertionError("zero is reachable");
    }
}
```

---

**Topic coverage:** Replacement syntax, JVM loader identity, executor dependency starvation, Spring async outcomes, JPA lifecycle portability, Kafka consumer ownership, token authorization, recovery namespaces, wire presence semantics, scheduler progress, sweep-line optimality and exact two-worker scheduling.

**Next set builds on:** proofs of bounded waiting under explicit admission assumptions, compatibility tests across recovery generations, and scheduling with dependencies or heterogeneous workers. Continue sequential set numbering even on the same date.
