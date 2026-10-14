**Set 9 · 14 October 2026 — Production diagnosis and the complete SDE-3 interview loop**

An extended set with **28 interview answers**: 20 Java backend scenarios, one coding problem, one low-level design, one high-level design, and five hiring-manager questions.

Reference targets: **Java 21 without preview features**, Spring Framework 6.2 with Spring Boot 3.5, Hibernate ORM 6.6, PostgreSQL 17, Kafka 4.0, and Redis OSS 7.x. The circular-reference question explicitly discusses the historical Boot 2.6 default change. These are named reference versions, not latest-version recommendations. Kubernetes settings must be checked against the deployed cluster.

Stable IDs: **S09-Q01–S09-Q28**, in order. Practise each **Say aloud** answer, then expand through **Root cause → Evidence → Fix → Trade-offs**. Design questions use “root cause” to mean the underlying requirement or invariant; leadership questions use it to explain the situation. Leadership answers are adaptable outlines, not invented personal accomplishments: replace brackets with truthful details and measured results.

The two `java` blocks are executable Java 21 examples with a class wrapper and `java.util.*` imports, tested from this published source. Framework annotations, configuration, SQL, and architecture flows are contextual fragments, not complete deployed systems. Production evidence below is a diagnostic plan, not a claim that these systems were observed here.

---

**1. Core pool size 10, maximum 50, unbounded queue: traffic rises tenfold. How many threads run?**

**Say aloud:** “The pool grows to ten workers under sustained demand, then queues additional work. Maximum 50 does not help because growth beyond core requires the queue to refuse admission. I would prove saturation from active workers, queue age and request latency, then bound admission using the downstream capacity budget.”

- **Root cause:** `ThreadPoolExecutor` creates core workers before queueing; after that it tries the queue before adding non-core workers. An unbounded queue normally accepts everything. Ten is the worker ceiling in this configuration, not a promise of ten simultaneously running CPU instructions; fewer workers may exist under light load.
- **Evidence:** Inspect the effective queue type, `getPoolSize()`, `getActiveCount()`, queue depth/oldest age, completed-task rate, heap retention and p99 latency. Correlate worker stacks with downstream waits to distinguish slow tasks from insufficient CPU.
- **Fix:** Use a measured bounded queue and concurrency limit; reject overload explicitly with a defined retry response and jitter. Set deadlines and observe submitted futures. Size concurrency against CPU and database/API capacity, not merely traffic multiplication.
- **Trade-offs:** Rejection becomes visible; retries can amplify load. `CallerRunsPolicy` slows producers but can block request or event-loop threads and changes where tasks execute. Increasing threads can overload dependencies.
- **Follow-ups:** “Virtual threads?” → They still need bounded admission. “Queue size?” → Derive it from tolerated waiting time and measured throughput.
- **Primary reference:** [Java 21 ThreadPoolExecutor queueing rules](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html).

---

**2. Transfers A→B and B→A hang forever. How do you prove deadlock from a thread dump?**

**Say aloud:** “I would show a cycle in lock ownership, not infer deadlock from slow requests. One thread owns A and waits for B; the other owns B and waits for A. The repair is one globally consistent acquisition order across every transfer path, with the entire balance invariant protected.”

- **Root cause:** Nested acquisition in opposite orders creates circular wait. For monitors, a thread is typically `BLOCKED`; `ReentrantLock` contention often appears as parking/`WAITING`. A thread waiting on network I/O alone is not proof of a Java lock cycle.
- **Evidence:** Capture `jcmd <pid> Thread.print -l` and correlate each “waiting to lock” object ID with the other thread's “locked” ID. For platform-thread monitor/ownable-synchronizer cycles, `ThreadMXBean.findDeadlockedThreads()` can help; it does not cover every distributed or virtual-thread deadlock. Database row-lock cycles require database evidence.
- **Fix:** Acquire canonical account locks by immutable unique account ID, lowest first, everywhere; handle same-account transfers explicitly. Keep validation/debit/credit in the same protected operation, avoid remote calls inside locks, and use database transaction/locking semantics for persisted balances.
- **Trade-offs:** Ordering removes this cycle but does not guarantee fairness or eliminate long waits. Timed `tryLock` needs release of already-held locks and bounded retries; it can introduce livelock. Per-request lock objects do not coordinate shared accounts.
- **Follow-ups:** “Identity hash ordering?” → Collisions need a tie lock. “Across pods?” → JVM locks cannot protect a shared database invariant.
- **Primary reference:** [Java 21 ThreadMXBean deadlock detection](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html).

---

**3. A transactional method catches and logs an exception, yet half-finished writes commit. Why?**

**Say aloud:** “The transaction interceptor usually sees a normal return after the catch, so it has no escaping failure to classify for rollback. I would check both whether a transaction actually exists and whether anything marked it rollback-only. Logging an error does not make a unit of work atomic.”

- **Root cause:** If a proxied transaction is active and no participant/provider marks it rollback-only, swallowed exceptions permit commit. An inner participating transactional call or persistence provider can mark rollback-only despite the catch, producing rollback and possibly `UnexpectedRollbackException` instead.
- **Evidence:** Correlate transaction begin/commit/rollback logs with operation IDs and committed rows, using safe sampling. Inspect proxy boundaries, self-invocation and propagation. Reproduce a failure after the first write, then read through a separate committed transaction; flush is not proof of commit.
- **Fix:** Let the original failure escape through the transactional boundary, or translate and rethrow with deliberate rollback rules. If swallowing is intentional, explicitly mark rollback-only and return a truthful failed outcome. Keep recovery/reporting outside that transaction when it must survive rollback.
- **Trade-offs:** Rethrowing changes the caller's contract. A separate audit transaction adds complexity and connection demand; it cannot atomically commit with the rolled-back work. External effects still need idempotency or an outbox.
- **Follow-ups:** “REQUIRES_NEW?” → It commits independently. “Self-call?” → Default proxy advice may be bypassed.
- **Primary reference:** [Spring transaction annotation and proxy semantics](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/annotations.html).

---

**4. A transactional method throws a checked exception. Does it roll back?**

**Say aloud:** “Under Spring's default rules, RuntimeException and Error trigger rollback; a checked exception normally does not. I would read the effective rollback configuration instead of answering universally, then make the business failure's rollback behavior explicit and verify committed state.”

- **Root cause:** Rollback is decided by effective rules at the intercepted boundary, not simply by the presence of any exception. In Spring 6.2 a configured global `ALL_EXCEPTIONS` default can change the baseline; method-specific rules and provider rollback-only state also matter.
- **Evidence:** Inspect `rollbackFor`, `noRollbackFor`, global transaction configuration and exception inheritance. Force the checked failure after a write through the real proxy; read database state after completion rather than trusting the exception observed by the caller.
- **Fix:** Use a typed rule such as contextual `@Transactional(rollbackFor = PaymentRejectedException.class)` when this business failure must undo writes. Alternatively configure a documented application-wide policy, with tests for exceptions that should still commit.
- **Trade-offs:** Blanket rollback can erase intentional audit or partial-success records; broad pattern rules can match unintended exception names. Retrying a rolled-back operation still requires protection against external effects and uncertain outcomes.
- **Follow-ups:** “Caught checked exception?” → The interceptor may never see it. “Error?” → Rolls back by default, but rollback is not a recovery strategy for resource exhaustion.
- **Primary reference:** [Spring 6.2 rollback rules and global defaults](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/rolling-back.html).

---

**5. Scaling from five pods to twenty makes PostgreSQL refuse connections. Why?**

**Say aloud:** “The pool limit is per pod and often per datasource. Scaling replicas multiplies potential database sessions without increasing database capacity. I would calculate the full connection budget, including rollout overlap and other clients, before reducing pool limits or introducing a pooler.”

- **Root cause:** For one datasource, 5×20 permits 100 sessions while 20×20 permits 400. Pools may open lazily or maintain idle minimums; actual usage must be measured. PostgreSQL `max_connections` and reserved slots cap admissions; proxies and managed services can impose additional limits.
- **Evidence:** Check the precise server refusal, `pg_stat_activity` grouped by application/client, pool active/idle/pending counts, acquisition latency, long or idle-in-transaction sessions, effective limits and rolling-deployment surge. Distinguish server rejection from an application pool-acquisition timeout.
- **Fix:** Budget `(peak replicas including surge × pools per replica × pool maximum) + other clients + headroom` within usable capacity. Reduce pool/idle settings and shorten transactions. Consider PgBouncer after checking transaction-pooling compatibility; bound incoming work separately.
- **Trade-offs:** Smaller pools increase wait/rejection. Increasing `max_connections` consumes memory and can worsen contention. Transaction pooling changes session-affinity assumptions, so validate session state, advisory locks and prepared-statement behavior with the actual pooler version/configuration.
- **Follow-ups:** “Autoscaling?” → Couple replica ceilings with the connection budget. “Leak?” → Prove retained checkout ownership; high active counts alone are insufficient.
- **Primary reference:** [PostgreSQL 17 connection limits and reserved slots](https://www.postgresql.org/docs/17/runtime-config-connection.html).

---

**6. Adding Kafka partitions breaks per-customer ordering. Why?**

**Say aloud:** “Kafka orders within a partition. A common keyed partitioner maps a key using the partition count, so increasing that count can move later customer records while older records remain in the previous partition. Consumers can then process those streams concurrently.”

- **Root cause:** A stable customer key is necessary but does not guarantee stable routing across partition-count changes. The actual partitioner may be custom or explicit; inspect it. Concurrent producers and asynchronous consumer side effects can break business order even with unchanged partition routing.
- **Evidence:** Capture safe customer correlation IDs, event sequence, topic/partition/offset and partitioner configuration before/after expansion. Show the same customer's records on two partitions and compare completion times; offsets from different partitions are not globally comparable.
- **Fix:** Plan a routing migration: pause/fence producers, drain prior work and establish a cutover, or move to a new topic with explicit routing epochs. Enforce entity sequence/version checks downstream when business ordering must survive replay and migration. Serialize side effects within each required ordering domain.
- **Trade-offs:** Drain pauses reduce availability; fixed routing limits scaling flexibility. Version buffering requires gap timeouts and retained state. Rejecting stale events is correct only if the business permits that semantics; financial event chains may need full ordered replay.
- **Follow-ups:** “More consumer threads?” → They do not create cross-partition order. “Explicit partition?” → Stable until deliberately remapped, with its own imbalance cost.
- **Primary reference:** [Kafka producer partition selection](https://kafka.apache.org/40/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html).

---

**7. Redis reaches its memory limit and writes fail. Which setting decides that?**

**Say aloud:** “`maxmemory` defines the dataset memory threshold and `maxmemory-policy` controls eviction behavior. With `noeviction`, commands requiring extra memory can fail. A volatile eviction policy can also run out of eligible TTL keys, so I would inspect actual policy and key eligibility.”

- **Root cause:** Policies such as `allkeys-lru` select eviction candidates broadly; `volatile-*` policies select only keys with expiration. Reads and some memory-releasing commands can continue after an allocation-denying error. OS/container OOM termination is a separate failure from Redis enforcing `maxmemory`.
- **Evidence:** Inspect `CONFIG GET maxmemory*` where permitted, `INFO memory`, evicted-key counters, command errors, TTL distribution, RSS and container restart reasons. Leave room for replication/persistence buffers and allocator overhead; dataset limits do not cap all process memory.
- **Fix:** For a disposable cache, choose an appropriate eviction policy and bounded TTL/key sizes; load-test hit ratio and source-database capacity. For authoritative state, retain explicit admission failure and provision capacity or redesign retention rather than silently discarding data.
- **Trade-offs:** Eviction causes misses and possible database stampedes. Raising the limit can trigger host OOM. Changing policy may violate correctness for sessions, locks or durable records; classify key ownership first.
- **Follow-ups:** “TTL alone?” → It controls eligibility/lifetime, not a guarantee of spare memory. “Persistence?” → Does not prevent eviction.
- **Primary reference:** [Redis maxmemory and eviction policies](https://redis.io/docs/latest/develop/reference/eviction/).

---

**8. Logout happens, but a JWT works for another thirty minutes. Why, and what changes?**

**Say aloud:** “A resource server validating only signature, claims and expiry has no knowledge of a client logout. Removing the token from the browser does not revoke another copy. I would define the required revocation delay, revoke refresh capability and choose a server-enforced access-token strategy.”

- **Root cause:** A bearer token remains usable by its holder until rejected by the server. A refresh-token revoke prevents renewal but does not invalidate an already issued access token. Signature validity alone also does not establish issuer, audience, authorization or session freshness.
- **Evidence:** In a secure test, retain the access token, log out, then call the protected endpoint with that token. Verify `exp`, issuer/audience/algorithm enforcement, revocation lookup behavior and cache delay without logging the raw token. Test all service replicas.
- **Fix:** Use short-lived access tokens plus refresh-token rotation/revocation for bounded exposure. For immediate logout, check a denylist by validated `jti` until expiry, a session/token-version record, or introspected opaque tokens. Revoke refresh tokens atomically; define whether logout affects one device or all sessions.
- **Trade-offs:** Revocation introduces state, latency and availability coupling. Fail-open accepts revoked tokens during outages; fail-closed denies valid users. Cache TTL sets revocation delay. Global signing-key rotation is disruptive and too broad for one logout.
- **Follow-ups:** “JWT in a cookie?” → Also address CSRF. “Offline verification?” → Cannot provide immediate server-state revocation without another signal.
- **Primary reference:** [OWASP REST JWT validation and logout denylisting](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#jwt).

---

**9. Spring Boot needs ninety seconds to start; Kubernetes repeatedly restarts it. What is wrong?**

**Say aloud:** “A liveness or startup budget may expire before initialization finishes. Readiness failure removes traffic but does not itself restart a container. I would inspect termination events, then give startup its own measured budget and keep readiness and liveness aligned with different responsibilities.”

- **Root cause:** Without a startup probe, an early liveness probe can fail repeatedly during legitimate initialization. Other causes include OOMKilled, application crashes and wrong probe ports/paths; slow startup alone does not prove probe misconfiguration.
- **Evidence:** Inspect pod events, previous container logs, restart/exit reasons, configured paths/timeouts and startup duration distribution. Trace bean initialization, migrations, CPU throttling and external waits. Verify the health port is reachable from the probe, not only from inside the app.
- **Fix:** Add a contextual startup probe with a budget above measured cold-start tail, for example `periodSeconds: 5` and `failureThreshold: 30` give roughly 150 seconds. Startup success enables liveness/readiness. Keep liveness local to unrecoverable process health and readiness tied to serving capability; bound dependency waits.
- **Trade-offs:** Larger startup budgets delay detection of a permanently stuck process. Dependency-based liveness can cause fleet-wide restarts during a shared outage. Loose readiness can send requests too early; overly strict readiness can remove every replica.
- **Follow-ups:** “initialDelaySeconds only?” → Less adaptive than startup probing. “Migrations?” → Control concurrent execution and timeout separately.
- **Primary reference:** [Kubernetes startup, readiness and liveness probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

---

**10. supplyAsync without an executor: which threads execute the task?**

**Say aloud:** “Normally `ForkJoinPool.commonPool()`. If its parallelism is below two, CompletableFuture uses a new thread for each async task. I would inspect pool settings and worker stacks, then isolate blocking work with an owned executor and explicit admission limits.”

- **Root cause:** The no-executor static `CompletableFuture.supplyAsync` shares execution capacity with other common-pool users. Slow blocking calls can interfere with unrelated parallel computations. Non-async continuations may run on the completing thread; they are not automatically moved to the common pool.
- **Evidence:** Inspect named threads and stacks, common-pool parallelism/queued work, task start delay and downstream latency. Record executor identity and safe trace context. Correlate parallel-stream slowdown with the same pool rather than assuming CPU is saturated.
- **Fix:** Pass an explicit managed executor with concurrency, queue and rejection policy suited to the workload; shut it down through application lifecycle. Virtual threads can suit blocking I/O on Java 21, but bound requests/dependency concurrency and set network deadlines.
- **Trade-offs:** Separate pools consume resources and require lifecycle/context propagation. `orTimeout` or future cancellation alone does not guarantee stopping underlying I/O. More concurrency can starve connection pools; observe completion and exceptional outcomes.
- **Follow-ups:** “thenApply?” → May execute on the completing thread. “thenApplyAsync?” → Uses its selected/default async executor.
- **Primary reference:** [Java 21 CompletableFuture execution and cancellation policies](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**11. A static shared SimpleDateFormat returns wrong dates under load. Why?**

**Say aloud:** “SimpleDateFormat mutates internal calendar and parsing state and is not thread-safe. Sharing it across requests introduces races. I would establish the shared lifetime and replace it with an immutable DateTimeFormatter whose pattern, locale and timezone are explicit.”

- **Root cause:** Concurrent parse/format calls race on mutable state even if callers provide different Date objects. Separately, week-year patterns, lenient parsing and implicit timezones can produce incorrect dates without concurrency; distinguish those defects.
- **Evidence:** Identify static/singleton ownership, mixed request values and output mismatches. Use bounded concurrent tests with a synchronized start and known inputs, plus timezone/year-boundary tests. A clean stress run cannot prove the unsafe formatter safe.
- **Fix:** Prefer `java.time` and immutable `DateTimeFormatter`, with `Locale.ROOT` or the intended locale and a named zone/offset contract. Parse to the matching temporal type and use strict resolution where required. If legacy APIs must remain, confine formatter instances or synchronize every access.
- **Trade-offs:** Migration can change leniency, pattern semantics and timezone behavior; `yyyy`, `uuuu` and `YYYY` differ. Synchronization serializes throughput. ThreadLocal legacy formatters add per-thread memory and cleanup concerns.
- **Follow-ups:** “DateTimeFormatter with Date?” → Convert through Instant and the intended zone. “Thread-safe means valid input?” → No; validation remains necessary.
- **Primary reference:** [SimpleDateFormat synchronization contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/SimpleDateFormat.html#synchronization).

---

**12. Replacing collection code with Stream.toList makes later list.add fail. Why?**

**Say aloud:** “Stream.toList, available since Java 16, returns an unmodifiable list. The migration changed a mutability contract. If later code legitimately appends, I would construct an explicitly mutable ArrayList rather than rely on the implementation returned by another collector.”

- **Root cause:** Structural mutation throws `UnsupportedOperationException`. Unmodifiable does not mean the elements are deeply immutable. `Collectors.toList()` offers no general mutability/type guarantee either, despite common implementations being mutable.
- **Evidence:** Trace the exception to the mutation and review producers/consumers of the list. Reproduce with `Stream.of(1, 2).toList().add(3)`; test removal, sorting and null expectations as well as append.
- **Fix:** Use contextual `stream.collect(Collectors.toCollection(ArrayList::new))` or `new ArrayList<>(stream.toList())` when a mutable result is part of the contract. Otherwise remove downstream mutation and publish a documented immutable snapshot.
- **Trade-offs:** Copying costs allocation and memory. A mutable list needs ownership or synchronization if shared. Neither wrapper protects mutable elements; making the container unmodifiable can still leave aliasing bugs.
- **Follow-ups:** “List.copyOf?” → Also unmodifiable, and rejects null elements. “Java 8?” → Stream.toList does not exist there.
- **Primary reference:** [Java 21 Stream.toList contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html#toList()).

---

**13. Two boxed Long IDs compare equal with == in tests but not production. Why?**

**Say aloud:** “For two Long references, == compares identity. Long.valueOf caches at least values from minus 128 to 127, so small fixtures can accidentally share an object. I would compare values explicitly and cover IDs outside the cached range and nullable cases.”

- **Root cause:** Autoboxing commonly uses `Long.valueOf`. Cached wrappers hide an incorrect identity comparison. If one operand is primitive `long`, unboxing changes the operation to numeric comparison and a null wrapper can throw; inspect operand types.
- **Evidence:** Inspect declared types and compare identity/value separately in a controlled test using small, large and independently allocated wrappers. Production correlation should record safe IDs and branch outcomes, not depend on JVM object identity as domain evidence.
- **Fix:** Use `Objects.equals(a, b)` for nullable wrappers when two nulls should count as equal, or validated primitive IDs when absence is invalid. Define the null policy; a method call `a.equals(b)` is unsafe when a may be null.
- **Trade-offs:** Treating two missing IDs as equal can incorrectly merge entities. Unboxing simplifies numeric logic but requires validation. Value equality alone does not supply tenant scope or authorization.
- **Follow-ups:** “Always false above 127?” → No identity guarantee; never rely on it. “Entity equality?” → Also consider persistence lifecycle and proxies.
- **Primary reference:** [Java 21 Long.valueOf caching contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Long.html#valueOf(long)).

---

**14. A Spring Boot upgrade exposes a circular bean dependency that previously started. What changed?**

**Say aloud:** “Boot 2.6 changed the default to prohibit circular references. That can expose an existing cycle that earlier setter or field injection happened to resolve. I would verify the actual upgrade and bean graph, then separate responsibilities rather than depend on partial initialization.”

- **Root cause:** A depends on B and B on A during construction/initialization. Some historical singleton setter cycles could use early references; constructor cycles generally cannot be resolved that way. An unrelated Boot upgrade can introduce a different graph change, so 2.6 is a specific historical explanation, not a universal diagnosis.
- **Evidence:** Read the failure's bean dependency chain, old/new dependency versions, active profiles and effective `spring.main.allow-circular-references`. Map each edge to its injection point; inspect initialization callbacks and proxy requirements.
- **Fix:** Move orchestration to a third service or extract the responsibility both services need. Contextual `spring.main.allow-circular-references=true` may restore older resolution for eligible cycles temporarily; it cannot resolve every constructor/proxy cycle. Use lazy providers only when deferred lookup is intentional.
- **Trade-offs:** Refactoring changes responsibility boundaries and requires regression coverage. Lazy lookup can move failure to the first request. Allowing cycles preserves initialization-order fragility and complicates testing.
- **Follow-ups:** “@Lazy everywhere?” → Hides dependencies and shifts failure. “Events?” → Useful for decoupling only with explicit delivery and transaction semantics.
- **Primary reference:** [Spring Boot 2.6 circular-reference change](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes#circular-references-prohibited-by-default).

---

**15. An @Value field is null inside the constructor. Why?**

**Say aloud:** “Field injection happens after construction, so the constructor sees the field's Java default value. I would inject the configuration into the constructor parameter or use validated configuration properties, making required state available when the object is created.”

- **Root cause:** The object must exist before Spring can populate annotated fields. Direct `new` outside the container bypasses injection entirely. A missing required placeholder commonly causes managed startup failure later rather than explaining a constructor's null field.
- **Evidence:** Confirm container ownership and inspect constructor/field injection points. In a focused context test, compare the constructor-observed field with its post-injection value. Check active property sources and precedence without dumping secrets.
- **Fix:** Contextual constructor signature: `Client(@Value("${client.endpoint}") String endpoint)` assigns a final field and validates it. For related properties, prefer a typed, validated configuration object. Initialization that truly requires post-injection resources belongs in a lifecycle callback with clear failure handling.
- **Trade-offs:** Moving validation to startup can prevent deployment when configuration is missing; that is often desirable but needs a clear error. Default values can mask misconfiguration. Avoid network work in constructors, which creates slow and fragile startup.
- **Follow-ups:** “final field?” → Constructor injection supports it. “Unit test?” → Pass configuration explicitly; no container is needed for pure logic.
- **Primary reference:** [Spring @Value constructor injection](https://docs.spring.io/spring-framework/reference/6.2/core/beans/annotation-config/value-annotations.html).

---

**16. list.remove during a for-each loop throws ConcurrentModificationException on one thread. How?**

**Say aloud:** “ConcurrentModificationException does not require multiple threads. An enhanced for-loop uses an iterator; directly removing from ArrayList changes structural modification state behind that iterator. I would use iterator.remove or removeIf under the appropriate ownership contract.”

- **Root cause:** Fail-fast iterators compare structural modification counts on later iterator operations. Detection is best-effort and may not happen for every position, so code that sometimes avoids the exception is still invalid. Replacing an element is distinct from adding/removing structure.
- **Evidence:** Inspect the iterator stack and all mutations, including helpers invoked inside the loop. Reproduce with several positions and list sizes. Distinguish an actual shared-write race from same-thread invalidation.
- **Fix:** Use contextual `for (Iterator<Item> it = list.iterator(); it.hasNext();) { if (expired(it.next())) it.remove(); }`, or `list.removeIf(this::expired)` when suitable. Shared lists still require synchronization or a designed concurrent collection/snapshot strategy.
- **Trade-offs:** CopyOnWriteArrayList makes frequent writes expensive and its iterators do not support removal. A snapshot can be stale. Holding a lock during expensive predicates can block other requests; define mutation ownership first.
- **Follow-ups:** “Catch and retry?” → Does not repair the iteration contract. “Streams?” → Do not structurally mutate the source while traversing it.
- **Primary reference:** [ArrayList fail-fast iterator contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html).

---

**17. Both the try body and close throw in try-with-resources. Which exception reaches the caller?**

**Say aloud:** “The body exception remains primary; close failures are attached as suppressed exceptions. Resources close in reverse declaration order. I would preserve the primary stack and inspect suppressed failures, because cleanup problems can explain leaked or incomplete resources.”

- **Root cause:** Try-with-resources preserves failure from the main operation while still attempting cleanup. If the body succeeds and close fails, a close exception becomes primary instead; later close failures can be suppressed on it. Initialization failure closes resources already initialized.
- **Evidence:** Inspect `getSuppressed()` or full stack traces, checking whether logging truncates them. Reproduce body-plus-close, successful-body-plus-close and multiple-resource cases. Correlate failures with safe resource identities and ownership.
- **Fix:** Use try-with-resources for owned AutoCloseable resources; log/propagate the complete failure chain rather than replacing it with a generic cleanup exception. Make resource wrappers' close behavior deliberate and avoid closing resources borrowed from another owner.
- **Trade-offs:** Close can block and needs resource-specific deadlines. Suppressed failures can be overlooked by abbreviated logs. A successful close is not proof a remote operation committed; recover through that operation's contract.
- **Follow-ups:** “finally also throws?” → It can replace earlier failure; avoid it. “Two closes fail?” → Reverse order determines which is primary when the body succeeded.
- **Primary reference:** [Java try-with-resources and suppressed exceptions](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html).

---

**18. saveAll of ten thousand entities sends ten thousand individual INSERTs. Why?**

**Say aloud:** “saveAll is not a promise of one bulk SQL statement or JDBC batching. Hibernate needs batching configuration, compatible identifier generation and a suitable flush pattern. I would count driver batch executions and round trips; ten thousand SQL log lines alone do not prove ten thousand network calls.”

- **Root cause:** JDBC batching groups statements while still inserting each entity. `hibernate.jdbc.batch_size` must be enabled; Hibernate's IDENTITY insert path disables insert batching. Interleaved statement shapes, per-row flushes and driver behavior also affect batching. Existing entities can take merge/update paths.
- **Evidence:** Check identifier strategy, effective batch configuration, transaction boundaries, Hibernate statistics and driver batch calls under safe profiling. Measure round trips, elapsed time, memory and locks; test duplicate/constraint failure and distinguish SQL rendering from transport.
- **Fix:** Where appropriate, use sequence-based identifiers, contextual `hibernate.jdbc.batch_size=50` and `hibernate.order_inserts=true`. Flush/clear in chunks to bound the persistence context. Inspect PostgreSQL JDBC `reWriteBatchedInserts` separately; consider JDBC/native bulk ingestion for a different lifecycle contract.
- **Trade-offs:** Identifier migration affects schema and allocation compatibility. Flush/clear detaches entities; chunk transactions sacrifice all-or-nothing semantics across the entire import. Batches change failure diagnostics and can retain locks longer. Never silently ignore failed rows.
- **Follow-ups:** “@BatchSize?” → Controls fetching, not JDBC insert batching. “One transaction?” → Bounds atomicity, not statement count.
- **Primary reference:** [Hibernate 6.6 JDBC batching](https://docs.hibernate.org/orm/6.6/userguide/html_single/#batch).

---

**19. Disabling open-in-view causes LazyInitializationException. Why, and what fixes it?**

**Say aloud:** “The view or serializer is touching an unfetched association after the persistence context is closed. Open-in-view previously allowed that late access, often hiding extra queries. I would fetch the response's required data inside a service transaction and return DTOs with a measured query plan.”

- **Root cause:** A detached entity cannot initialize a lazy proxy/collection without the owning session. The transaction/session boundary no longer spans rendering. Marking all relationships eager substitutes another potentially large query problem.
- **Evidence:** Trace the lazy-access stack, service transaction boundary, executed queries and response serializer. Test with open-in-view disabled and count queries for one and many parents; verify optional/empty relationships and pagination.
- **Fix:** Fetch only required associations with a deliberate fetch join/entity graph, or project directly to DTOs; map while the service's read transaction is active. For to-many pagination, consider paging IDs first then fetching details, rather than paginating a multiplying collection join.
- **Trade-offs:** Fetch joins can multiply rows; multiple collections can explode data volume. DTO projections require maintenance but define a clear contract. Longer transactions hold connections/snapshots; enabling open-in-view again moves query cost into rendering and can hide N+1 access.
- **Follow-ups:** “Read-only transaction?” → Does not automatically fetch relationships. “Background task?” → Pass IDs/DTOs, not session-bound entities.
- **Primary reference:** [Hibernate 6.6 fetching and lazy associations](https://docs.hibernate.org/orm/6.6/userguide/html_single/#fetching).

---

**20. One Redis Cluster node runs at full CPU while others are idle. What is happening?**

**Say aloud:** “I would distinguish one hot key from many hot slots and from an expensive command. Redis Cluster assigns each key to one slot owner; adding nodes does not split a single key's workload. Hash tags can also concentrate many otherwise different keys on one node.”

- **Root cause:** A popular key, skewed key distribution or a shared `{tag}` can concentrate requests. Slow scripts/commands and persistence/replication work are alternative CPU causes. Equal slot counts do not imply equal request load.
- **Evidence:** Compare per-node command rate/latency, CPU, `SLOWLOG`, latency diagnostics, key sizes and slot ownership. Use bounded sampling, such as approved hot-key tools; `--hotkeys` needs LFU policy. Avoid unrestricted production MONITOR or full scans on an overloaded node.
- **Fix:** Rebalance hot slots for multi-key skew; shard a splittable logical key with controlled hash tags, or use local caching/read replicas for permitted stale reads. Reduce expensive commands and cache stampedes. A write-heavy indivisible key needs a different data model or explicit admission limit.
- **Trade-offs:** Splitting keys changes atomicity and cross-slot operation compatibility. Replicas introduce staleness and do not distribute primary writes. Local caches increase invalidation complexity; resharding adds migration load and routing redirects.
- **Follow-ups:** “More nodes?” → Helps distributed keys, not one key. “Hash tag?” → Keeps keys colocated for multi-key operations at an imbalance cost.
- **Primary reference:** [Redis Cluster slots and hash tags](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/).

---

**21. Coding: longest continuous subarray with absolute difference at most limit.**

**Say aloud:** “A valid window has max minus min no greater than limit. I maintain decreasing maximum and increasing minimum index deques. When invalid, I advance the left edge and expire old indices. Each index enters and leaves each deque once, giving linear time. I widen arithmetic before subtracting.”

- **Root cause:** Recomputing extrema for every candidate window costs quadratic work. A monotonic deque removes values that can never become the relevant extreme before a newer, more extreme value leaves the window. Validity is hereditary under removing elements, which justifies sliding the left edge.
- **Evidence:** For `[8,2,4,7]` and limit 4, the answer is 2; for `[10,1,2,4,7,2]` and limit 5, it is 4. Prove results against an independent brute-force scan on small exhaustive inputs. In a service, measure input sizes, allocation and latency; never diagnose complexity from one timing sample.
- **Fix:** Store indices to expire exact positions, preserve input, reject null, return 0 for a negative limit or empty input, and compute `(long) max - min` to avoid int overflow.
- **Trade-offs:** O(n) worst-case auxiliary space and boxed-index allocations with ArrayDeque; a primitive deque reduces allocation at implementation cost. A TreeMap multiset is simpler for additional order statistics but costs O(n log n). Input limits still matter.

```java
static int longestWithinLimit(int[] values, int limit) {
    Objects.requireNonNull(values, "values");
    if (limit < 0) return 0;
    Deque<Integer> max = new ArrayDeque<>();
    Deque<Integer> min = new ArrayDeque<>();
    int left = 0, best = 0;
    for (int right = 0; right < values.length; right++) {
        while (!max.isEmpty() && values[max.peekLast()] <= values[right]) max.removeLast();
        while (!min.isEmpty() && values[min.peekLast()] >= values[right]) min.removeLast();
        max.addLast(right);
        min.addLast(right);
        while ((long) values[max.peekFirst()] - values[min.peekFirst()] > limit) {
            left++;
            while (!max.isEmpty() && max.peekFirst() < left) max.removeFirst();
            while (!min.isEmpty() && min.peekFirst() < left) min.removeFirst();
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

At right=2 in the first example, the surviving valid window is `[2,4]`; appending 7 forces left forward until `[4,7]` remains. Duplicates use the newest extreme index, which expires no earlier than the removed equal index. Since limit is nonnegative after the early return, a one-element window is always valid and the deques cannot become empty during the subtraction loop.

- **Follow-ups:** “Return the range?” → Store left/right whenever best improves and define tie behavior. “Streaming?” → Retain only the active window; define index width and input lifetime.
- **Primary reference:** [Java ArrayDeque operations](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html); deque correctness and oracle cases above are original reasoning.

---

**22. LLD: implement a Twitter-like feed with follow, unfollow, posts, customization and ranking.**

**Say aloud:** “I would first define visibility, ranking and tie rules. My interview implementation uses an in-memory follow graph, immutable posts, query-time visibility and two ranking strategies. Synchronization gives each operation a coherent snapshot; production needs authenticated identities, persistence, bounded retrieval and stronger pagination.”

- **Root cause:** Personalized retrieval combines graph membership with a stable ordering and user preferences. A concurrent map alone cannot protect the compound graph/post/snapshot invariant. Unfollow must affect subsequent feed reads, and customization must be applied before selecting the top results.
- **Evidence:** Test follow idempotence, self posts, unfollow, muted authors, empty users, equal ranking values and concurrent posts. In production trace candidate retrieval versus ranking time, result provenance, visibility lag and p99 latency; use offline relevance judgments and controlled experiments for ranking quality.
- **Fix:** The model below supports newest-first or liked-first ranking, a deterministic ID tie-breaker, optional topic filter and muted authors. IDs provide logical creation order within this instance. Likes are a fixed score supplied at post creation for the exercise; there is no live like service. Followees' complete retained histories are visible; self-unfollow is a no-op. All posts are public. Validate/authenticate actor IDs at a production API boundary, and enforce block/privacy/deletion policy before returning candidates.
- **Trade-offs:** This model scans P retained posts and sorts C visible candidates in O(P + C log C), using O(C) temporary space. It has unbounded retained history, one coarse lock and no durability; suitable for an interview, not internet scale. Production can use per-author indexes plus a k-way merge for chronology, or hybrid fan-out: push ordinary authors and pull celebrity posts. Ranking needs a bounded candidate policy whose relevance loss is measurable.

```java
static final class NewsFeed {
    enum Ranking { NEWEST, LIKED }
    record Post(long id, long author, String topic, String text, int likes) {}
    private final Map<Long, Set<Long>> follows = new HashMap<>();
    private final List<Post> posts = new ArrayList<>();
    private long sequence;

    private static void user(long id) {
        if (id <= 0) throw new IllegalArgumentException("user ID must be positive");
    }
    synchronized void follow(long actor, long author) {
        user(actor); user(author);
        if (actor != author) follows.computeIfAbsent(actor, ignored -> new HashSet<>()).add(author);
    }
    synchronized void unfollow(long actor, long author) {
        user(actor); user(author);
        Set<Long> authors = follows.get(actor);
        if (authors != null) authors.remove(author);
    }
    synchronized Post post(long author, String topic, String text, int likes) {
        user(author);
        Objects.requireNonNull(topic, "topic");
        Objects.requireNonNull(text, "text");
        if (topic.isBlank() || text.isBlank() || likes < 0) throw new IllegalArgumentException("invalid post");
        long id = Math.incrementExact(sequence);
        Post post = new Post(id, author, topic, text, likes);
        posts.add(post);
        sequence = id;
        return post;
    }
    synchronized List<Post> feed(long actor, int limit, Ranking ranking,
                                 Set<Long> muted, String topic) {
        user(actor);
        if (limit < 0) throw new IllegalArgumentException("negative limit");
        Objects.requireNonNull(ranking, "ranking");
        Set<Long> muteSnapshot = Set.copyOf(Objects.requireNonNull(muted, "muted"));
        Set<Long> authors = follows.getOrDefault(actor, Set.of());
        Comparator<Post> order = Comparator.comparingLong(Post::id).reversed();
        if (ranking == Ranking.LIKED) {
            order = Comparator.comparingInt(Post::likes).reversed().thenComparing(order);
        }
        List<Post> visible = new ArrayList<>();
        for (Post post : posts) {
            if ((post.author() == actor || authors.contains(post.author()))
                    && !muteSnapshot.contains(post.author())
                    && (topic == null || topic.equals(post.topic()))) visible.add(post);
        }
        visible.sort(order);
        return List.copyOf(visible.subList(0, Math.min(limit, visible.size())));
    }
}
```

Runnable usage with the same wrapper: create `NewsFeed`, call `follow(1, 2)`, `post(2, "java", "A post", 3)`, then `feed(1, 10, NewsFeed.Ranking.NEWEST, Set.of(), null)`. The returned snapshot cannot be structurally changed and Post fields are immutable. Callers must not concurrently mutate a supplied HashSet while it is being copied; an immutable preference set is the supported input. Empty results and zero limits are valid.

For a production extension, separate FollowRepository, PostRepository and FeedService; introduce a RankingStrategy only when algorithms have genuinely different behavior. Use idempotency keys on posting and a stable snapshot/cursor with an ordering tuple. A changing liked score cannot support stable pages without freezing a ranking snapshot or defining weaker pagination semantics. Cached fan-out feeds must recheck current unfollow/privacy/deletion policy under the stated freshness contract.

- **Follow-ups:** “Celebrity?” → Avoid massive write fan-out with a hybrid pull path. “Personalization?” → Start with explainable preference filters; version learned models and assess bias/relevance.
- **Primary reference:** [Java immutable list snapshots](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection)); architecture and domain policy here are original design choices.

---

**23. HLD: design real-time stock alerts above or below a threshold.**

**Say aloud:** “I would define an alert as a crossing rather than notify on every matching tick. Prices are normalized, sequenced by symbol and durably streamed to evaluators. An atomic state transition records a deduplicated notification intent; delivery workers retry with bounded backoff and an explicit duplicate-delivery contract.”

- **Root cause:** Price streams can duplicate, arrive out of order, skip intervals or disconnect. A stateless `price > threshold` check floods users while the condition remains true. Price truth, alert state and external notification delivery have different consistency boundaries.
- **Evidence:** Track feed freshness, sequence gaps, ingest-to-evaluate-to-deliver latency, per-symbol lag, trigger/duplicate rates, retry age and provider failures. Reconcile sampled alerts against archived source ticks using the same rule version. An absent alert can mean no crossing, delayed processing, missing ticks, disabled policy or failed delivery; trace each stage.
- **Fix:** Define strict ABOVE as `previous <= T && current > T`, and strict BELOW as `previous >= T && current < T`; equality does not itself trigger. Use integer minor units or BigDecimal with an explicit instrument scale, never binary floating-point for threshold identity. A first observed price initializes state without triggering under this chosen contract; offer a separate “notify immediately if already matching” option. Identify symbol by exchange/instrument, not ambiguous ticker text.
- **Trade-offs:** Strict crossing can miss an excursion absent from the received data. Latest-value coalescing is safe only when alerts depend on current state, not every observed crossing. Hysteresis/cooldown reduces flapping but suppresses otherwise legitimate crossings; expose it as product policy. Exactly-once internal intent does not establish exactly-once email/SMS delivery.

Contextual data flow, with arrows indicating record movement rather than distributed atomicity:

```text
Market feed
↓
Normalize, validate, sequence
↓
Durable stream (instrument key)
↓
Evaluators ← versioned rule index
↓
Atomic state + notification outbox
↓
Delivery workers → providers
↓
Status, retry, dead-letter

Alert API
↓
Alert DB + change outbox
↓
Versioned rule index → evaluators
```

**Contracts and storage:** Alert API provides create/update/disable/list with authenticated user ownership, threshold, direction, repeat policy and channel consent. Persist an alert ID, monotonic rule version, status and timestamp. Each accepted tick has instrument, source epoch, sequence and event time. Maintain last accepted sequence/price and alert-side state; reject replayed older sequences within the same epoch. A provider reconnect/reset needs an explicit new epoch and reconciliation, not a blind numeric comparison. Edits version the rule and reinitialize its baseline; replay under the old version must not create a new-version alert. Disable stops future intent creation; define whether already queued notifications are cancelled, and check state at dispatch if cancellation is promised. Define the in-flight boundary explicitly: a provider request already accepted before disable cannot reliably be recalled.

**State transitions:** At T=100, ABOVE receives 99→101→102→100→101: two crossings, on the second and fifth prices, under repeat mode without cooldown. Duplicate sequence 2 at 101 creates no extra intent. A stale sequence 1 arriving after sequence 2 is ignored. For a one-shot alert, the first trigger changes ACTIVE→TRIGGERED atomically and later prices cannot retrigger it. Rule update, disable and price evaluation must compare the same rule version atomically, so an obsolete evaluator cannot resurrect a disabled alert.

**Durability:** Serialize each instrument's tick application, or use compare-and-set on its last sequence plus alert version/state. Commit processed-event identity, alert transition and a notification intent with a unique key `(alertId, ruleVersion, sourceEpoch, triggeringSequence)` in one database transaction; then acknowledge stream progress. A crash before commit permits replay; a crash after commit but before acknowledgment hits the uniqueness guard. Outbox delivery acknowledges only after provider response and records retry state. If the provider accepts a request but its response is lost, resending can duplicate delivery: use a stable provider idempotency key if supported, otherwise document at-least-once delivery and reconcile uncertain outcomes. Retain dedupe identities through the allowed replay horizon; deleting them early restores duplicates.

**Scale and failure handling:** Ask for instruments, users, alerts, updates/second, peak symbol skew, freshness target and delivery channels before sizing. Partition by instrument for price order; shard a hot instrument's rule evaluation by alert ID only while preserving tick order in each shard. An ordered threshold index can select boundaries crossed between old and new prices in O(log A + M), where A is active rules for the symbol and M matches, instead of scanning all A every tick. Keep rule-change ordering/version checks correct across index updates. Rate-limit users/channels, bound backlog and fan-out, reserve capacity for popular stocks and prioritize freshness alarms. During feed gaps, mark state stale and reconcile; do not promise alerts for movements that were never received. A failover must preserve version/sequence fencing.

- **Follow-ups:** “Kafka exactly once?” → Does not encompass an external provider. “A sudden 90→110?” → Triggers ABOVE 100 once on that accepted transition. “Stock split?” → Define corporate-action adjustment and threshold rebasing explicitly.
- **Primary references:** [Kafka 4.0 delivery semantics](https://kafka.apache.org/40/design/design/#message-delivery-semantics), [PostgreSQL 17 unique constraints](https://www.postgresql.org/docs/17/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS). Crossing, indexing and business policy above are original design choices, not vendor guarantees.

---

**24. Hiring manager: tell me about your most complex project.**

**Say aloud:** “On [real project], the difficulty was [specific interacting constraints], not just code volume. I owned [scope], compared [alternatives] against [requirements], and staged [change] with [rollback]. We measured [baseline and outcome]. The main trade-off was [cost], and I changed [decision] after [evidence].”

- **Root cause:** Explain why the previous system could not meet the requirement: a consistency boundary, scaling bottleneck, migration constraint or unclear ownership. Name stakeholders, constraints and your individual decisions; separate your contribution from team work.
- **Evidence:** Bring truthful latency/error/cost measurements, architecture decisions, rollout milestones or customer outcomes. Explain the measurement window and confounders. When details are confidential, use anonymized proportions or system shapes rather than inventing numbers.
- **Fix:** Walk through the hardest decision, implementation boundaries, coordination, failure recovery and staged adoption. Explain what you personally changed, how you validated it, and how the team maintained it after launch.
- **Trade-offs:** Discuss added operational complexity, time-to-market, consistency/availability or maintenance cost. Include what you would change with hindsight and the signal that would justify it.
- **Follow-ups:** “What went wrong?” → Own one real mistake and the correction. “Why not simpler?” → Compare against the actual constraints.

---

**25. Hiring manager: how did you handle conflict?**

**Say aloud:** “We disagreed about [real decision] because we weighted [requirements] differently. I restated both concerns, gathered [evidence] and agreed a decision criterion with the owner. We chose [option], documented its risks and reviewed [result]. I supported the decision once made and reopened it only when new evidence mattered.”

- **Root cause:** Distinguish technical uncertainty, competing priorities and interpersonal misunderstanding. Describe the competing positions fairly; avoid making the story about an unreasonable colleague.
- **Evidence:** Use decision constraints, benchmark results, incident history, prototypes or customer requirements. Identify what evidence changed your own view, not only how you persuaded others.
- **Fix:** Establish shared goals and the accountable decision-maker, time-box a comparison, document the choice and escalate respectfully if the risk exceeds your authority. Follow through on the adopted plan.
- **Trade-offs:** Consensus can delay a needed decision; quick escalation can damage trust. A reversible experiment costs time but can resolve uncertainty. Escalate serious correctness or integrity concerns with facts rather than suppressing them to preserve agreement.
- **Follow-ups:** “You lost?” → Explain how you delivered and tracked the risk. “Still unresolved?” → Use the agreed decision process and deadline.

---

**26. Hiring manager: describe critical feedback from your manager.**

**Say aloud:** “My manager said [actual observable behavior] was causing [impact]. I asked for examples and agreed a measurable change. I applied [specific habit/process], checked in after [period], and used [feedback or outcome] to judge progress. The lesson was [what changed in how I work].”

- **Root cause:** Explain a real gap, such as late risk communication, oversized changes or insufficient delegation. Avoid a disguised strength. Separate intent from the impact others experienced.
- **Evidence:** Use examples, review-cycle data, missed handoffs or stakeholder feedback before and after the change. Do not claim a feedback loop improved solely because you felt more confident.
- **Fix:** Agree a behavior you can control: earlier risk updates, smaller deliverables, design checkpoints or explicit delegation. Ask for follow-up feedback and show how you sustained the change without needing reminders.
- **Trade-offs:** More checkpoints can consume time or become micromanagement; smaller increments can add coordination. Calibrate frequency and preserve autonomous decision-making while addressing the actual gap.
- **Follow-ups:** “Unfair feedback?” → Clarify with concrete examples while remaining open to impact. “Relapse?” → Describe the mechanism that catches it early.

---

**27. Hiring manager: describe an on-call incident you owned.**

**Say aloud:** “During [actual incident], users saw [impact]. I helped establish [roles], stopped the immediate harm with [reversible mitigation], and tested [hypothesis] using [evidence]. We restored [service objective], then fixed [cause] and verified [prevention]. I distinguish mitigation from the final repair and state what remained uncertain.”

- **Root cause:** Build a timeline and explain the causal chain: trigger, failed invariant, missing protection and blast radius. Do not reduce the incident to one person's mistake or declare root cause before evidence supports it.
- **Evidence:** Use alerts, traces, deployments, saturation/error metrics and recovery checks, preserving timestamps and safe correlation IDs. Check data integrity as well as traffic recovery. Reconcile ambiguous operations before replaying them.
- **Fix:** Prioritize user safety and bounded rollback/load shedding, communicate facts and next update time, preserve evidence, then test the causal repair. Assign prevention actions with owners and measurable verification. Explain your own authority and actions honestly.
- **Trade-offs:** Rollback may conflict with schema changes; retries can worsen overload or duplicate effects. Emergency patches reduce review time, so keep them small and reversible. Preventive work competes with roadmap capacity; prioritize by recurrence risk and impact.
- **Follow-ups:** “No clear root cause?” → State confidence and the next discriminating experiment. “Success?” → Include integrity, backlog drain and monitoring, not only HTTP 200s.

---

**28. Hiring manager: how have you mentored others?**

**Say aloud:** “A teammate wanted to improve [specific skill]. We agreed [goal], paired on [real task], and I gradually shifted decisions to them. I gave feedback on reasoning and reviewed outcomes using [evidence]. Success meant they could own [scope] independently, not that they followed my implementation.”

- **Root cause:** Identify the learner's goal and obstacle: domain understanding, debugging strategy, design trade-offs or confidence. Do not assume a junior engineer needs the same support for every skill; ask and observe.
- **Evidence:** Use independent ownership, quality of design reasoning, reduced repeated assistance or the mentee's feedback over time. Credit their work. Counts of meetings or code reviews alone do not demonstrate growth.
- **Fix:** Make a small plan, model your reasoning, provide scoped practice with guardrails, give timely specific feedback and gradually withdraw support. Create reusable documentation when repeated questions reveal a team-level gap.
- **Trade-offs:** Pairing consumes delivery capacity; taking over solves today's issue while blocking learning. Too little oversight can expose production risk. Adjust task scope and checkpoints to the learner's demonstrated readiness.
- **Follow-ups:** “Mentoring failed?” → Explain how you changed your approach. “Senior mentee?” → Mentorship can exchange domain expertise without a hierarchy.

---

**Practice checkpoint:** For each production prompt, state the invariant, name one observation that could disprove your first diagnosis, propose the smallest repair and describe its failure mode. For the design rounds, make policy decisions explicit before drawing components. For leadership, replace every bracket with a real example and be ready to explain the evidence behind the claimed result.
