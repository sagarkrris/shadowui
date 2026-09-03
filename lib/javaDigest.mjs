export const JAVA_DIGEST_TRACKS = [
  {
    id: "core-java",
    label: "Core Java",
    icon: "ti-cup",
    description: "Language fundamentals, collections, exceptions, JVM basics, and production coding habits.",
  },
  {
    id: "spring-boot",
    label: "Spring Boot",
    icon: "ti-leaf",
    description: "REST APIs, dependency injection, data access, validation, testing, and operational patterns.",
  },
  {
    id: "concurrency",
    label: "Concurrency",
    icon: "ti-arrows-shuffle",
    description: "Threads, executors, locks, atomics, CompletableFuture, and interview-grade race-condition reasoning.",
  },
  {
    id: "data-sql",
    label: "Data & SQL",
    icon: "ti-database",
    description: "JDBC, transactions, indexes, query plans, JPA pitfalls, and database interview drills.",
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: "ti-sitemap",
    description: "Design patterns, microservices, REST contracts, reliability, observability, and trade-offs.",
  },
];

export const JAVA_INTERVIEW_QA = [
  {
    id: "hashmap-internals-interview",
    section: "Collections",
    question: "How does HashMap work internally?",
    answer: "Think of HashMap as an array of buckets, not as one large linked list. On put(key, value), Java calls key.hashCode(), spreads high bits so poorly distributed hashes still affect the index, and selects a bucket with (capacity - 1) & hash because the table capacity is normally a power of two. If the bucket is empty, a node is stored. If it is occupied, HashMap compares both the hash and equals() to decide whether to replace an existing value or append a collision node. In current OpenJDK implementations, a very crowded bucket can be converted from a linked list into a red-black tree; this protects lookup from degrading indefinitely under collisions. When size exceeds capacity × load factor (0.75 by default), the table grows, usually doubling, and entries are redistributed. During a resize, each node stays at its old index or moves by the old capacity, which avoids recomputing the full hash. A null key is stored in bucket zero. Average put/get/remove is O(1), but a pathological collision chain is O(n), and a treeified bucket is O(log n). These are implementation details, so interview answers should distinguish the HashMap contract from version-specific OpenJDK optimizations. HashMap is not safe for concurrent structural updates; use external locking or a concurrent collection when state is shared.",
    example: "import java.util.HashMap;\nimport java.util.Map;\n\nrecord UserId(long value) {}\n\nMap<UserId, String> orders = new HashMap<>(16, 0.75f);\norders.put(new UserId(42), \"PAID\");\nSystem.out.println(orders.get(new UserId(42))); // PAID\nSystem.out.println(orders.containsKey(new UserId(99))); // false\n\n// The second UserId(42) works because the record supplies stable equals/hashCode.\n// If a mutable key changes after put(), the entry may still exist but become unreachable by get().",
    star: "Situation: our order-read API used a HashMap-backed request cache and intermittently returned a miss immediately after an order was inserted. Task: prove whether the cache, the key, or the database was responsible without adding broad synchronization. Action: captured the key before and after insertion, inspected its hashCode and equals contract, and found that a mutable customer-region field changed after the key was inserted. I replaced the key with an immutable record, added a collision and resize-focused unit test, and documented that shared caches must use ConcurrentHashMap with atomic compute/merge operations. Result: the false misses disappeared in production, cache-hit rate returned to the target, and the team had a reproducible test for the failure mode.",
    followUps: "Walk through put and get for the same key. Why are capacity and load factor trade-offs? What are the treeification thresholds in modern OpenJDK? Why is HashMap unsafe for concurrent writes? What breaks when a key is mutable?",
  },
  {
    id: "hashmap-concurrenthashmap",
    section: "Collections",
    question: "What is the difference between HashMap and ConcurrentHashMap, and when do you use each?",
    answer: "HashMap is a non-thread-safe general-purpose map and is the usual choice when one thread owns the structure or external synchronization already protects it. ConcurrentHashMap supports concurrent reads and updates with strong per-operation thread-safety, does not allow null keys or values, and provides atomic compound operations such as computeIfAbsent and merge. It does not make a multi-step business workflow atomic: get followed by put can still race. Use HashMap for local, isolated state; ConcurrentHashMap for shared mutable lookup state with bounded, fast map operations and a clearly defined lifecycle.",
    example: "counts.merge(word, 1, Integer::sum); // atomic update on ConcurrentHashMap",
    star: "Situation: request threads updated a shared feature-count map and totals varied between runs. Task: preserve each increment without serializing all requests. Action: replaced the unsynchronized HashMap with ConcurrentHashMap and merge, then load-tested contention and added a size bound. Result: lost updates disappeared while unrelated keys continued to progress concurrently.",
    followUps: "Why are nulls forbidden? When is a lock or database transaction still required?",
  },
  {
    id: "volatile-atomicity",
    section: "Multithreading",
    question: "What does volatile guarantee, and why does it not make i++ thread-safe?",
    answer: "volatile guarantees visibility of a variable's latest write and establishes ordering around that variable. i++ is still a read-modify-write sequence: two threads can read the same value, increment it, and overwrite one result. Use AtomicInteger for a single numeric update, a lock when several fields must change together, or a thread-confined design when shared mutation is unnecessary.",
    example: "AtomicInteger count = new AtomicInteger(); count.incrementAndGet();",
    star: "Situation: a metrics counter under-reported during traffic spikes. Task: make increments lossless without adding a global lock. Action: replaced the volatile int with AtomicLong.incrementAndGet and verified counts against request logs under concurrent load. Result: the metric matched the source events and contention remained acceptable.",
    followUps: "When is CAS a poor fit? What is a happens-before relationship?",
  },
  {
    id: "synchronized-lock",
    section: "Multithreading",
    question: "synchronized versus ReentrantLock: what is the difference and when do you use each?",
    answer: "synchronized is concise, automatically releases the monitor, and is a strong default for a small critical section. ReentrantLock is useful when you need timed or interruptible acquisition, tryLock, multiple Conditions, or explicit lock ordering. Whichever you choose, keep the critical section small, protect one named invariant, and release explicit locks in finally. A lock type cannot fix an unclear ownership model.",
    example: "lock.lock(); try { updateState(); } finally { lock.unlock(); }",
    star: "Situation: a worker occasionally waited forever behind a stalled dependency. Task: prevent one blocked path from holding the whole workflow. Action: used tryLock with a deadline, moved I/O outside the lock, and emitted lock-wait metrics. Result: the service failed fast under contention instead of exhausting worker capacity.",
    followUps: "How can lock ordering prevent deadlock? When would a ReadWriteLock help?",
  },
  {
    id: "executor-service",
    section: "Multithreading",
    question: "How do you choose and use ExecutorService safely?",
    answer: "Choose the pool from the workload: bounded CPU pools near available cores, and carefully bounded I/O pools with admission control. Submit tasks, retain or compose their results, propagate deadlines, handle exceptions, and shut the executor down with ownership. Never create an unbounded queue or a new pool per request without a measured reason; queues hide overload until latency and memory fail.",
    example: "try (var executor = Executors.newFixedThreadPool(8)) { Future<Result> f = executor.submit(this::load); }",
    star: "Situation: a service created threads per request and became unstable during a downstream slowdown. Task: cap concurrency while preserving cancellation. Action: introduced a bounded executor, queue policy, timeout, and shutdown hook, then monitored queue age and rejection count. Result: overload became visible and the service stayed responsive while the dependency recovered.",
    followUps: "How do you size a pool? What happens when its queue is full?",
  },
  {
    id: "deadlock-race-condition",
    section: "Multithreading",
    question: "How do you diagnose and prevent race conditions and deadlocks?",
    answer: "A race condition means correctness depends on timing; a deadlock means threads wait in a cycle. Reproduce with stress tests rather than sleeps, define the shared invariant, inspect thread dumps and lock ownership, and reduce shared mutable state. Prevent deadlocks with consistent lock ordering, short critical sections, timed acquisition, and no external calls while holding a lock. Prevent races with ownership, immutability, atomics, or one lock protecting the complete invariant.",
    example: "// Always acquire account locks in ascending account ID order.",
    star: "Situation: transfers occasionally froze two worker threads. Task: make transfers safe under opposite-direction requests. Action: established a deterministic account-lock order, added timeout diagnostics, and stress-tested thousands of transfers. Result: no deadlocks occurred in the soak test and the invariant that money is conserved remained explicit.",
    followUps: "What is thread starvation? How do you test concurrency deterministically?",
  },
  {
    id: "completablefuture",
    section: "Multithreading",
    question: "How do you use CompletableFuture without losing failure and timeout handling?",
    answer: "Compose independent work with thenCombine or allOf, use an explicitly chosen executor for blocking operations, and keep timeout, cancellation, and exception policy visible. exceptionally and handle are different: exceptionally recovers only after failure, while handle receives either result or error. Do not use the common pool for unknown blocking I/O, and remember that a timeout is a policy decision, not proof that the underlying work stopped.",
    example: "user.thenCombine(orders, Profile::new).orTimeout(500, MILLISECONDS)",
    star: "Situation: a profile endpoint waited for three independent services and amplified slowdowns. Task: reduce normal latency while returning a predictable degraded response. Action: composed calls in parallel on a bounded executor, added per-dependency timeouts, and mapped failures to explicit fallback fields. Result: healthy requests improved and slow dependencies no longer held requests indefinitely.",
    followUps: "How does cancellation propagate? Why avoid blocking join inside a pool task?",
  },
  {
    id: "jvm-memory-model",
    section: "JVM",
    question: "Explain heap, stack, metaspace, and garbage collection.",
    answer: "Each thread has a private stack for frames and local references. Objects usually live on the shared heap, while class metadata lives in metaspace. Garbage collection finds objects that are no longer reachable, reclaims or compacts memory, and may pause application threads depending on the collector and workload. Diagnose with allocation rate, live-set after GC, pause time, and heap dumps rather than heap percentage alone.",
    example: "java -Xms512m -Xmx512m -XX:+HeapDumpOnOutOfMemoryError App",
    star: "Situation: p99 latency rose after a release. Task: determine whether GC caused it. Action: correlated JFR allocation, GC pauses, endpoint traces, and a heap histogram; the issue was an unbounded response cache, not collector choice. Result: bounded eviction stabilized the live set and latency.",
    followUps: "What is a memory leak in a managed runtime? How do you choose a collector?",
  },
  {
    id: "jvm-class-loading",
    section: "JVM",
    question: "How does class loading work, and what causes ClassNotFoundException versus NoClassDefFoundError?",
    answer: "A class loader locates bytecode, verifies it, prepares static storage, resolves symbolic references as needed, and initializes the class. ClassNotFoundException is commonly a checked failure while explicitly loading a class by name. NoClassDefFoundError usually means the JVM expected a class that was available or referenced earlier but cannot now be linked or initialized, often because of a packaging or initialization problem.",
    example: "Class.forName(\"com.example.Driver\"); // explicit loading can throw ClassNotFoundException",
    star: "Situation: production failed at startup but tests passed. Task: identify the deployment-only class-loading difference. Action: compared the packaged dependency tree with the runtime image and found a dependency marked compile-only. Result: the packaging rule was corrected and a smoke test validated the artifact itself.",
    followUps: "Why can two class loaders load different versions of the same class?",
  },
  {
    id: "spring-di-lifecycle",
    section: "Spring",
    question: "How does Spring dependency injection and bean lifecycle work?",
    answer: "The application context creates and wires beans from configuration and component metadata. Constructor injection makes required dependencies explicit; the context then applies post-processors, lifecycle callbacks, proxies such as transactions, and finally destruction callbacks. Keep beans stateless where possible, avoid circular dependencies, and remember that a proxy only intercepts calls that pass through the proxy.",
    example: "@Service class OrderService { private final PaymentPort payments; OrderService(PaymentPort payments) { this.payments = payments; } }",
    star: "Situation: a transactional annotation appeared to do nothing. Task: find why rollback was skipped. Action: traced the call and found self-invocation bypassing the Spring proxy; moved the operation to a collaborating bean and added an integration test. Result: rollback behavior matched the documented boundary.",
    followUps: "Why prefer constructor injection? What is the scope of a singleton bean?",
  },
  {
    id: "spring-transactions",
    section: "Spring",
    question: "How do Spring transactions work, and where should @Transactional live?",
    answer: "Spring commonly applies transaction behavior through an AOP proxy around a public service method. The proxy starts, commits, or rolls back according to the configured rules; the database transaction does not automatically include remote calls or non-proxied self-invocations. Put the boundary around a cohesive use case, keep it short, choose propagation and isolation deliberately, and translate persistence failures at the domain boundary.",
    example: "@Transactional public OrderId placeOrder(Command command) { ... }",
    star: "Situation: an order was saved but inventory was not reserved after a timeout. Task: make failure behavior explicit. Action: narrowed the database transaction, added an outbox event for asynchronous reservation, and tested retry/idempotency paths. Result: partial work became observable and safely recoverable.",
    followUps: "What is propagation? Why can a transaction not roll back a remote HTTP call?",
  },
  {
    id: "sql-indexes-transactions",
    section: "SQL",
    question: "How do indexes improve queries, and what are their costs?",
    answer: "An index is an additional ordered or hashed access structure that lets the database find qualifying rows without scanning the whole table. It speeds reads that match its leading columns, but consumes storage and adds work to inserts, updates, and deletes. Inspect the execution plan, selectivity, predicates, join keys, and sort requirements; add the smallest index that supports measured queries.",
    example: "CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at);",
    star: "Situation: customer history queries timed out as data grew. Task: reduce latency without making writes unacceptable. Action: examined EXPLAIN output, added a composite index matching the filter and order, and measured write overhead. Result: reads moved from a table scan to an index-backed plan within the latency target.",
    followUps: "Why does column order matter? When can an index be ignored?",
  },
  {
    id: "sql-isolation-locks",
    section: "SQL",
    question: "What are transaction isolation levels and common anomalies?",
    answer: "Isolation controls which effects of concurrent transactions are visible. Dirty reads observe uncommitted data; non-repeatable reads see a changed row; phantoms see a changed result set. Stronger isolation reduces anomalies but may increase locking, retries, or reduced concurrency. Choose the weakest level that preserves the business invariant, then use constraints and idempotency as additional protection.",
    example: "SET TRANSACTION ISOLATION LEVEL READ COMMITTED;",
    star: "Situation: two checkout requests oversold the last item. Task: preserve inventory correctness under concurrency. Action: added a database constraint and an atomic conditional update, kept the transaction short, and load-tested conflicting requests. Result: one request succeeded and the other received a safe, retryable outcome.",
    followUps: "Optimistic versus pessimistic locking? How do deadlocks appear in SQL?",
  },
  {
    id: "system-design-reliability",
    section: "System Design",
    question: "How do you design a reliable service under dependency failure?",
    answer: "Start with an explicit availability and latency target, then map every dependency and finite resource. Use timeouts, bounded retries with jitter, circuit breaking, bulkheads, idempotency keys, graceful degradation, and observability. A retry is safe only when the operation is idempotent and the downstream can absorb the additional load; otherwise retries amplify an outage.",
    example: "Request deadline → bounded retry budget → circuit breaker → fallback or clear failure",
    star: "Situation: a payment dependency became slow and saturated request threads. Task: keep checkout responsive and avoid duplicate charges. Action: introduced deadlines, idempotency keys, a bounded retry policy, and an asynchronous reconciliation path. Result: the service failed predictably during the incident and no duplicate payment was recorded.",
    followUps: "Where do you apply backpressure? What should an SLO alert contain?",
  },
  {
    id: "system-design-scaling",
    section: "System Design",
    question: "How do you reason about scaling a read-heavy API?",
    answer: "Quantify requests per second, payload size, latency target, consistency requirement, and hot-key distribution before choosing components. Scale stateless application instances horizontally, cache safe reads with bounded TTL/eviction, use replicas carefully, paginate, and protect the origin with rate limits and admission control. Every cache requires an invalidation and stampede strategy.",
    example: "Client → CDN/cache → stateless API → read replica → primary for writes",
    star: "Situation: a product catalog endpoint overloaded the primary database during launches. Task: absorb bursty reads while keeping prices correct. Action: added cache-aside for immutable catalog fields, short TTLs for price data, request coalescing, and replica monitoring. Result: peak database load fell while freshness and invalidation behavior remained explicit.",
    followUps: "How do you handle a hot key? What consistency can the cache provide?",
  },
  {
    id: "concurrency-interrupts",
    section: "Multithreading",
    question: "How should Java code handle interruption and cancellation?",
    answer: "Interruption is a cooperative cancellation signal, not forced thread termination. Blocking methods may throw InterruptedException; catch it only when you can respond, restore the interrupt flag when propagating, and release owned resources. Pass deadlines and cancellation through task boundaries, stop producing new work, and make cleanup idempotent.",
    example: "catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }",
    star: "Situation: shutdown took minutes because workers swallowed interrupts. Task: make termination bounded. Action: restored the flag, propagated cancellation through futures, and added a shutdown deadline with worker metrics. Result: deployments completed within the target window without abandoned work.",
    followUps: "Why is Thread.stop unsafe? How do virtual threads change cancellation design?",
  },
  {
    id: "concurrency-atomics",
    section: "Multithreading",
    question: "When do you use atomics, locks, or thread confinement?",
    answer: "Use thread confinement when state can belong to one request or worker. Use an atomic for one independent variable with a compare-and-set style invariant. Use a lock when several fields must change together or the critical section is easier to reason about than a retry loop. Measure contention and keep ownership visible; choosing a more advanced primitive does not replace a correctness proof.",
    example: "AtomicReference<State> state; // CAS only when the whole state transition is represented",
    star: "Situation: a CAS loop consumed CPU under heavy contention. Task: preserve a multi-field state transition efficiently. Action: replaced the retry loop with a short lock around the complete invariant and measured wait time. Result: CPU fell, correctness was easier to review, and throughput improved.",
    followUps: "What is false sharing? When can LongAdder be better than AtomicLong?",
  },
  {
    id: "jvm-jit-optimizations",
    section: "JVM",
    question: "What does the JIT compiler do, and why can a Java benchmark lie?",
    answer: "The JIT observes hot bytecode and compiles it to optimized machine code using profiling information such as branch frequency and call targets. A benchmark can lie when it includes class loading, warm-up, dead-code elimination, allocation effects, or an unrealistic input distribution. Use a representative harness with warm-up, forks, stable measurement, and a result that the runtime cannot optimize away; profile before drawing conclusions.",
    example: "// Benchmark hot code with JMH rather than timing one System.nanoTime loop.",
    star: "Situation: a proposed optimization looked 10x faster in a local loop. Task: verify whether it would improve production latency. Action: rewrote the test with representative data and JMH, then profiled allocation and branch behavior; the apparent gain was warm-up and dead-code elimination. Result: we shipped the smaller change that improved the real endpoint instead.",
    followUps: "What is escape analysis? Why can a cold startup differ from steady state?",
  },
  {
    id: "jvm-gc-tuning",
    section: "JVM",
    question: "How do you approach GC tuning in production?",
    answer: "Start with a service-level goal—pause time, throughput, or footprint—and collect allocation rate, live-set size, pause distribution, CPU, and latency under representative load. Choose a collector and heap target that fit that evidence, then change one variable at a time. Reduce unnecessary allocation or retention before tuning flags; a larger heap may reduce frequency but cannot fix a leak or an overloaded dependency.",
    example: "JFR + GC logs + endpoint p99 → hypothesis → one flag or code change → controlled comparison",
    star: "Situation: frequent young collections correlated with latency spikes. Task: reduce pauses without hiding memory pressure. Action: used allocation profiling to remove temporary JSON objects and validated a modest heap adjustment in a canary. Result: allocation rate and pause p99 fell, with no increase in old-generation retention.",
    followUps: "How do you distinguish allocation pressure from a retention leak?",
  },
  {
    id: "spring-proxy-self-invocation",
    section: "Spring",
    question: "Why can Spring annotations fail on self-invocation?",
    answer: "Many Spring features—including transactions, caching, and method security—are applied by a proxy. A call from one method to another on the same object uses this directly and bypasses that proxy, so the annotation is never intercepted. Move the operation to a collaborating bean, call through a designed proxy boundary, or use a different mechanism only when the trade-off is explicit; do not rely on obscure proxy self-lookups.",
    example: "orderService.place(); // external proxy call applies @Transactional; this.place() does not",
    star: "Situation: a cache annotation was present but repeated database calls remained. Task: identify why the cache was bypassed. Action: traced the call graph and moved the cached query to a focused read service, then added a test that asserted one repository call. Result: the proxy boundary was clear and the query count stayed bounded.",
    followUps: "What changes with AspectJ weaving? Which methods can Spring proxy reliably?",
  },
  {
    id: "spring-security-boundary",
    section: "Spring",
    question: "How do you secure a Spring API beyond adding an annotation?",
    answer: "Define authentication, authorization, trust boundaries, and failure responses separately. Validate tokens or sessions at the filter boundary, authorize the business action at the service boundary, enforce object-level ownership checks, validate input, and avoid leaking sensitive details in errors or logs. Add tests for missing, expired, malformed, and cross-tenant credentials; a role annotation alone does not prove resource ownership.",
    example: "@PreAuthorize(\"@ownership.canEdit(authentication, #id)\")",
    star: "Situation: a tenant could access another tenant's record by changing an ID. Task: close the object-level authorization gap. Action: added a service-layer ownership check, centralized tenant context, and negative integration tests for cross-tenant IDs. Result: the endpoint enforced both role and resource ownership.",
    followUps: "Where should authorization live? How do you handle service-to-service identity?",
  },
  {
    id: "sql-explain-joins",
    section: "SQL",
    question: "How do you read an execution plan for a slow join?",
    answer: "Check the estimated versus actual row counts, join order, scan type, index usage, sort/hash memory, and the highest-cost node. A plan that scans a large table may be correct if selectivity is low; an index can be worse when most rows qualify. Fix cardinality statistics, predicates, indexes, query shape, or data volume based on evidence, then compare the actual plan after the change.",
    example: "EXPLAIN (ANALYZE, BUFFERS) SELECT ...;",
    star: "Situation: an endpoint slowed after a table crossed millions of rows. Task: identify the real bottleneck rather than add random indexes. Action: compared actual plans and found a stale statistic caused a poor join order; refreshed statistics and added a selective composite index. Result: buffer reads and p95 latency dropped substantially.",
    followUps: "What is a covering index? Why can functions on columns defeat indexes?",
  },
  {
    id: "sql-pagination-consistency",
    section: "SQL",
    question: "Offset versus keyset pagination: when do you use each?",
    answer: "Offset pagination is simple and works for small, mostly static result sets, but deep pages require the database to scan and discard many rows and can shift under concurrent inserts. Keyset pagination uses a stable ordered cursor—such as created_at plus a unique ID—so the next page starts after the last seen key. Use a deterministic order and encode the cursor safely; choose based on navigation needs and consistency expectations.",
    example: "WHERE (created_at, id) < (:lastTime, :lastId) ORDER BY created_at DESC, id DESC LIMIT 50",
    star: "Situation: page 500 of an audit feed timed out and duplicated rows during active writes. Task: make scrolling predictable. Action: introduced keyset cursors with a unique tie-breaker and documented snapshot semantics. Result: page latency stayed stable and users no longer saw duplicate or skipped records during normal inserts.",
    followUps: "How do you expose cursors? What consistency does a long-lived feed need?",
  },
  {
    id: "system-design-consistency",
    section: "System Design",
    question: "How do you choose consistency for a distributed feature?",
    answer: "Start with the invariant that must never be violated, then classify reads as stale-tolerant, read-your-writes, monotonic, or strongly consistent. Strong consistency may require a single writer, quorum, transaction, or synchronous coordination; weaker models can use asynchronous replication, caches, and conflict resolution. State the user-visible trade-off and failure behavior instead of saying a system is simply ‘eventually consistent.’",
    example: "Availability page: stale-tolerant; inventory decrement: strongly guarded; analytics: eventual",
    star: "Situation: a replicated profile read occasionally showed an older email immediately after an update. Task: preserve read-your-writes without making every read synchronous. Action: routed reads with a short-lived session version to the writer or a sufficiently fresh replica. Result: user-visible consistency improved while background traffic remained eventually consistent.",
    followUps: "How do you resolve conflicts? What is the cost of quorum reads?",
  },
  {
    id: "system-design-rate-limiting",
    section: "System Design",
    question: "How would you design a distributed rate limiter?",
    answer: "Define the identity, window, limit, burst policy, and failure mode first. A token bucket supports controlled bursts; a leaky bucket smooths output; a sliding window is intuitive but can cost more state. For multiple instances, use an atomic shared store operation with TTL, accept bounded approximation when appropriate, and decide whether store failure fails open or closed. Return remaining quota and retry timing without exposing sensitive internals.",
    example: "key = tenantId + route; atomic token-bucket update with expiration",
    star: "Situation: a public endpoint was overwhelmed by a small set of clients. Task: protect dependencies while allowing normal bursts. Action: added tenant-and-route token buckets at the edge, atomic updates, response headers, and dashboards for rejects and store errors. Result: abusive traffic was bounded and legitimate clients retained predictable capacity.",
    followUps: "Where should limiting happen? How do you handle clock skew and hot keys?",
  },
  {
    id: "concurrency-threadlocal",
    section: "Multithreading",
    question: "What are ThreadLocal benefits and leak risks?",
    answer: "ThreadLocal gives each thread its own value, which can simplify request context or non-thread-safe helpers when ownership is truly thread-bound. In pooled threads, the thread outlives the request, so stale values can leak across requests or retain large objects. Set context at the boundary and remove it in finally, prefer explicit context passing when practical, and do not confuse ThreadLocal isolation with propagation to child or asynchronous tasks.",
    example: "try { REQUEST_ID.set(id); handle(); } finally { REQUEST_ID.remove(); }",
    star: "Situation: one request occasionally logged another user's correlation ID. Task: find the cross-request state leak. Action: inspected pooled-thread lifecycle and found a ThreadLocal without cleanup; added boundary cleanup and a test that reused the same executor thread. Result: request context was isolated and memory retention fell.",
    followUps: "How does ThreadLocal behave with CompletableFuture? What is InheritableThreadLocal's trap?",
  },
  {
    id: "concurrency-forkjoin",
    section: "Multithreading",
    question: "When is ForkJoinPool or parallelism appropriate?",
    answer: "ForkJoinPool is designed for tasks that can split into smaller CPU-bound tasks and let workers steal work. It is a poor default for blocking I/O because blocked workers reduce available parallelism; use a dedicated bounded executor or virtual threads with downstream admission control instead. Parallel streams also inherit a shared pool and can surprise unrelated work, so measure end-to-end speedup and preserve ordering and exception policy.",
    example: "ForkJoinPool for recursive CPU work; dedicated executor for blocking client calls",
    star: "Situation: a parallel stream improved a local transformation but harmed request latency in production. Task: isolate shared execution resources. Action: moved blocking work to a bounded executor, limited concurrency, and measured queue depth and p99 latency. Result: background processing no longer starved request handling.",
    followUps: "How do work-stealing and queueing differ? What is the common-pool risk?",
  },
  {
    id: "spring-boot-autoconfiguration",
    section: "Spring Boot",
    question: "How does Spring Boot auto-configuration work, and how do you debug it?",
    answer: "Spring Boot evaluates conditional configuration based on the classpath, properties, existing beans, and application context state. Auto-configuration supplies sensible defaults, but user-defined beans or explicit properties can back off those defaults. Debug it with the condition evaluation report, actuator beans/configuration endpoints where safe, startup logs, and a minimal slice test; avoid guessing from annotations alone.",
    example: "--debug prints the auto-configuration condition evaluation report",
    star: "Situation: a production datasource used an unexpected pool setting. Task: identify which configuration won. Action: enabled the condition report in a safe environment, traced property precedence and the auto-config back-off condition, then added a configuration test. Result: the setting became explicit and upgrades no longer changed it silently.",
    followUps: "What is the order of property sources? How do you replace one auto-configured bean safely?",
  },
  {
    id: "spring-boot-observability",
    section: "Spring Boot",
    question: "How do you make a Spring Boot service observable in production?",
    answer: "Expose the smallest safe set of health, metrics, logs, and traces. Separate liveness from readiness, tag metrics with bounded dimensions, propagate trace context, and correlate request IDs without logging secrets. Instrument dependency latency, pool saturation, queue age, retries, and business outcomes; an endpoint returning 200 is not enough evidence that the service is healthy.",
    example: "management.endpoints.web.exposure.include=health,metrics,prometheus",
    star: "Situation: an API was green in uptime checks but users saw timeouts. Task: make the real bottleneck visible. Action: added readiness checks for dependency capacity, trace spans for database and downstream calls, and bounded-cardinality metrics. Result: on-call could identify pool saturation from one dashboard instead of sampling logs manually.",
    followUps: "What should liveness never check? How do you avoid high-cardinality metric explosions?",
  },
  {
    id: "spring-boot-resilience",
    section: "Spring Boot",
    question: "How do you implement resilient outbound calls in Spring Boot?",
    answer: "Set a deadline budget, use a bounded client connection pool, classify retryable failures, and make the operation idempotent before retrying. Add circuit breaking, bulkheads, metrics, and a fallback that preserves correctness rather than fabricating success. Keep remote I/O outside database locks and transactions unless the consistency design explicitly requires coordination.",
    example: "WebClient timeout + retry budget + circuit breaker + idempotency key",
    star: "Situation: a slow partner API exhausted request threads. Task: preserve checkout availability without duplicate side effects. Action: added client deadlines, a bounded bulkhead, idempotency keys, and a pending result with reconciliation. Result: the service degraded safely and partner recovery did not trigger a retry storm.",
    followUps: "Where should retries live? How do you test a circuit breaker?",
  },
  {
    id: "spring-boot-testing",
    section: "Spring Boot",
    question: "When do you use unit, slice, and full integration tests in Spring Boot?",
    answer: "Use unit tests for domain logic and fast feedback, slice tests for a focused web or persistence boundary, and full integration tests for wiring, transactions, serialization, and real infrastructure contracts. Keep external dependencies deterministic with containers or contract doubles, and assert observable behavior rather than Spring internals. The goal is a layered test pyramid, not one huge context test suite.",
    example: "@WebMvcTest for controller behavior; @DataJpaTest for repository behavior",
    star: "Situation: a refactor passed unit tests but broke JSON validation in production. Task: catch boundary regressions earlier. Action: added a controller slice test with real validation and an integration test for the persistence transaction. Result: wiring and contract failures were caught before deployment without slowing every unit test.",
    followUps: "What makes @SpringBootTest slow? How do Testcontainers improve confidence?",
  },
];

// Give every interview answer the same deep-review scaffold. The core answer
// and STAR story remain topic-specific; these prompts make the reasoning,
// trade-off, testing, and production boundary explicit for every card.
const QA_REVIEW_GUIDANCE = {
  Collections: {
    why: "Name the data-structure invariant first, then trace one operation from input to storage to lookup. Separate the public contract from implementation details that can vary by JDK release.",
    pitfalls: "Do not claim average-case complexity is a guarantee, ignore equals/hashCode or mutability, or use a non-thread-safe collection for shared writes.",
    performance: "Discuss expected complexity, allocation, resizing, contention, and memory overhead; validate assumptions with a representative benchmark rather than a micro-benchmark alone.",
    testing: "Add happy-path, collision/duplicate, empty-input, resize-boundary, mutable-key, and concurrent-access tests where that boundary applies.",
  },
  Multithreading: {
    why: "State the shared invariant and the happens-before or ownership rule that protects it. Then trace cancellation, failure, and overload—not just the successful interleaving.",
    pitfalls: "Do not confuse visibility with atomicity, swallow interruption, hold locks across I/O, or assume a thread pool is an unlimited safety valve.",
    performance: "Cover contention, queue growth, context switching, fairness, backpressure, and pool sizing for the actual CPU/I/O mix.",
    testing: "Use stress and soak tests, deterministic barriers/latches, timeout assertions, thread dumps, and failure-injection tests instead of sleeps as synchronization.",
  },
  JVM: {
    why: "Connect the runtime mechanism to an observable signal: allocation, reachability, class-loader ownership, compilation, pauses, or thread state.",
    pitfalls: "Avoid tuning flags before measuring, treating used heap as a leak, or treating a local benchmark as proof of production behavior.",
    performance: "Discuss latency, throughput, allocation rate, live set, warm-up, CPU, and memory headroom as a service-level trade-off.",
    testing: "Reproduce with representative load, JFR/GC logs/heap histograms, a controlled canary, and a regression test or startup smoke test for the discovered failure mode.",
  },
  Spring: {
    why: "Identify the bean/proxy/transaction boundary and follow one request through configuration, interception, business logic, persistence, and error handling.",
    pitfalls: "Check proxy bypass, bean scope, rollback rules, validation boundaries, hidden remote calls, and configuration that differs between test and production.",
    performance: "Include context startup, connection pools, transaction duration, serialization, thread usage, and downstream latency—not only controller time.",
    testing: "Use focused unit tests plus the smallest slice or integration test that proves proxying, validation, transactions, serialization, and failure behavior.",
  },
  "Spring Boot": {
    why: "Explain which auto-configuration, lifecycle, or boundary is involved, then show how you would verify it with condition reports, logs, metrics, or a focused test.",
    pitfalls: "Do not rely on defaults you have not inspected, broad context tests for every behavior, or annotations without checking the proxy and configuration boundary.",
    performance: "Measure startup, request latency, pool saturation, serialization, downstream calls, and test-context cost before changing framework settings.",
    testing: "Choose unit, slice, contract, or full integration scope deliberately and assert externally visible behavior with deterministic infrastructure.",
  },
  SQL: {
    why: "Translate the business request into predicates, joins, ordering, locking, and consistency requirements; then verify the database's actual execution plan.",
    pitfalls: "Watch for missing indexes, wrong column order, implicit casts, N+1 queries, oversized transactions, offset scans, and assumptions based only on a development dataset.",
    performance: "Discuss selectivity, cardinality, scans versus seeks, sort/hash memory, lock duration, write amplification, and connection-pool pressure.",
    testing: "Test constraints and isolation with concurrent transactions, capture EXPLAIN plans on representative data, and add a latency regression test for the critical query.",
  },
  "System Design": {
    why: "Start with the invariant, SLO, scale, and failure model. Trace the request and data across every boundary, including retries, recovery, and operational ownership.",
    pitfalls: "Do not jump to components before requirements, hide consistency choices, or add retries/caches without an idempotency and invalidation story.",
    performance: "Quantify throughput, tail latency, hot keys, storage growth, network cost, fan-out, backpressure, and the finite resource most likely to saturate.",
    testing: "Use contract tests, load tests, chaos/failure injection, replayable incident drills, and dashboards that prove the stated SLO and recovery behavior.",
  },
};

const QA_ACTION_STEPS = {
  "hashmap-internals-interview": ["Compute and spread the key hash, then select the bucket with the power-of-two index mask.", "Compare hash and equals for replacement or collision insertion; treeify only when collision and capacity thresholds justify it.", "Resize at capacity × load factor and verify the equals/hashCode contract with immutable keys."],
  "hashmap-concurrenthashmap": ["Decide whether the map is thread-confined or shared before choosing a collection.", "For shared counters or caches, use ConcurrentHashMap atomic operations such as merge, compute, or putIfAbsent.", "Test compound workflows separately because per-key atomicity does not make a multi-step business transaction atomic."],
  "volatile-atomicity": ["Use volatile for visibility and ordering of independent state, not for a read-modify-write invariant.", "Replace increments with AtomicInteger/Long or protect a multi-field transition with one lock.", "Stress the interleaving and verify the happens-before edge instead of relying on timing sleeps."],
  "synchronized-lock": ["Name the invariant and the smallest critical section that protects it.", "Use synchronized for simple monitor ownership; choose ReentrantLock only when timeout, interruptibility, Conditions, or explicit ordering is required.", "Release explicit locks in finally and keep blocking I/O outside the critical section."],
  "executor-service": ["Classify work as CPU-bound or blocking I/O and set a bounded concurrency budget.", "Choose queue and rejection behavior deliberately, propagate deadlines, and observe queue age and active workers.", "Own the executor lifecycle and test shutdown, cancellation, saturation, and exception propagation."],
  "deadlock-race-condition": ["Write the shared invariant and list every lock or mutable field involved.", "Capture thread dumps, identify the wait-for cycle or unsafe interleaving, and reproduce it with barriers rather than sleeps.", "Enforce lock ordering or ownership, shorten critical sections, and add a stress/soak regression test."],
  completablefuture: ["Place independent calls on an explicitly bounded executor and compose them instead of blocking each worker.", "Give every dependency a deadline and define fallback, cancellation, and exception semantics.", "Test partial failure and timeout paths, remembering that a timed-out future may not stop the underlying work."],
  "jvm-memory-model": ["Separate thread stacks, heap objects, metaspace, native memory, and direct buffers in the hypothesis.", "Compare allocation rate and post-GC live set with pause and endpoint latency evidence.", "Use JFR, GC logs, histograms, and a heap dump to distinguish allocation pressure from retention."],
  "jvm-class-loading": ["Identify which class loader and artifact should provide the class at the failing boundary.", "Distinguish explicit ClassNotFoundException from linkage or initialization failures reported as NoClassDefFoundError.", "Inspect the packaged dependency tree and runtime image, then add an artifact-level startup smoke test."],
  "spring-di-lifecycle": ["Trace bean discovery, constructor injection, post-processors, proxy creation, initialization, and destruction.", "Keep required dependencies explicit and check scope, circular references, and proxy boundaries.", "Prove lifecycle and proxy behavior with a focused application-context or integration test."],
  "spring-transactions": ["Choose a service method that represents one cohesive use case and make it the transaction boundary.", "Check proxy reachability, propagation, isolation, rollback rules, and transaction duration.", "Keep remote calls outside the database transaction and use an outbox/idempotency strategy for cross-system effects."],
  "sql-indexes-transactions": ["Start from the real predicates, join keys, ordering, selectivity, and expected row count.", "Design the smallest composite index whose leading columns support that access path.", "Compare actual plans and write amplification before and after the index on representative data."],
  "sql-isolation-locks": ["State the invariant and identify which concurrent anomaly can violate it.", "Choose the weakest isolation or locking strategy that preserves that invariant, backed by constraints.", "Run conflicting transactions concurrently and verify retry, deadlock, and rollback behavior."],
  "system-design-reliability": ["Set an SLO and map dependencies, finite resources, and failure propagation paths.", "Apply deadlines, bounded retries with jitter, idempotency, circuit breaking, bulkheads, and graceful degradation at explicit boundaries.", "Exercise dependency failure and confirm alerts, fallback correctness, and recovery behavior."],
  "system-design-scaling": ["Quantify read rate, payload size, hot keys, freshness, and consistency before selecting components.", "Scale stateless workers, cache safe reads with stampede protection, and use replicas with lag visibility.", "Load-test burst traffic and verify invalidation, origin protection, and tail latency."],
  "concurrency-interrupts": ["Treat interruption as a cooperative cancellation signal and define who owns cleanup.", "Restore the interrupt flag when propagating and stop submitting new work after cancellation.", "Test shutdown deadlines, blocked operations, partial completion, and idempotent cleanup."],
  "concurrency-atomics": ["Decide whether state is thread-confined, one independent variable, or a multi-field invariant.", "Use confinement, an atomic CAS, or a lock respectively; do not force a CAS loop onto a contended transition.", "Measure contention and verify linearizable outcomes under stress."],
  "jvm-jit-optimizations": ["Separate cold startup from warmed steady state and identify what the JIT can eliminate or inline.", "Use representative inputs, warm-up, forks, and a consumed result in a JMH benchmark.", "Profile allocation and generated behavior before accepting a benchmark-based optimization."],
  "jvm-gc-tuning": ["Define whether the target is pause time, throughput, footprint, or tail latency.", "Measure allocation rate, live set, pause distribution, CPU, and promotion before changing flags.", "Remove avoidable allocation/retention first, then compare one collector or heap change in a canary."],
  "spring-proxy-self-invocation": ["Determine whether the annotation is implemented by a proxy and whether the call crosses that proxy.", "Move the operation to a collaborating bean or create an explicit aspect boundary.", "Assert interception with an integration test that proves one transaction/cache/security effect."],
  "spring-security-boundary": ["Authenticate at the transport boundary and authorize the business action at the service boundary.", "Enforce object ownership and tenant scope, validate input, and keep sensitive details out of errors and logs.", "Test missing, expired, malformed, role-valid, and cross-tenant credentials."],
  "sql-explain-joins": ["Read actual row counts, join order, scan type, predicate selectivity, and the highest-cost node.", "Fix statistics, sargability, indexes, or query shape according to the measured bottleneck.", "Capture the post-change plan and regression-test latency at production-like cardinality."],
  "sql-pagination-consistency": ["Choose a deterministic ordering with a unique tie-breaker and state the consistency promise.", "Use keyset cursors for deep or changing feeds; reserve offset for shallow navigation where its cost is acceptable.", "Test inserts between pages, duplicate keys, cursor tampering, and end-of-feed behavior."],
  "system-design-consistency": ["Write the invariant and classify reads as stale-tolerant, read-your-writes, monotonic, or strong.", "Choose writer, quorum, transaction, version, or conflict-resolution behavior that matches the user-visible promise.", "Inject replica lag and concurrent updates, then verify the documented failure behavior."],
  "system-design-rate-limiting": ["Define identity, route, window, burst, quota response, and store-failure policy.", "Choose token, leaky, or sliding-window semantics and update shared state atomically with TTL.", "Load-test hot keys, clock skew, distributed instances, legitimate bursts, and limiter-store outages."],
  "concurrency-threadlocal": ["Confirm the context is truly thread-bound and identify the executor or pool that owns the thread.", "Set context at the request boundary and remove it in finally, or pass context explicitly across async work.", "Reuse pool threads in a test to prove no value or large object leaks into the next request."],
  "concurrency-forkjoin": ["Confirm tasks are small, CPU-bound, and splittable before using work stealing.", "Keep blocking I/O off the common pool and bound parallelism for downstream capacity.", "Compare end-to-end latency and throughput with a dedicated executor and sequential baseline."],
  "spring-boot-autoconfiguration": ["Read the condition evaluation report and property precedence for the bean in question.", "Identify whether a user bean or explicit property caused auto-configuration to back off.", "Lock the intended configuration with a minimal slice or startup configuration test."],
  "spring-boot-observability": ["Instrument request, dependency, database, pool, queue, retry, and business outcome signals.", "Separate liveness from readiness and propagate trace context with bounded metric dimensions.", "Run a failure drill and verify one trace and dashboard can locate the bottleneck."],
  "spring-boot-resilience": ["Set an end-to-end deadline and classify errors before enabling retries.", "Use bounded pools, circuit breakers, idempotency keys, and a fallback that does not fabricate success.", "Inject partner timeouts and repeated failures, then verify recovery does not create a retry storm."],
  "spring-boot-testing": ["Put pure business rules in unit tests and boundary behavior in focused slice tests.", "Use full integration tests only for wiring, transactions, serialization, and infrastructure contracts.", "Keep dependencies deterministic with containers or contract doubles and assert observable behavior."],
};

const QA_INTERNALS = {
  "hashmap-internals-interview": "OpenJDK stores nodes in a lazily allocated power-of-two table. The spread hash mixes high bits into low bits, and resize can move a node by exactly the old capacity because only one additional hash bit changes.",
  "hashmap-concurrenthashmap": "ConcurrentHashMap reads are mostly lock-free; updates coordinate at a bin or node level and use volatile/CAS publication. Its atomic methods define the safe boundary, not an entire multi-call workflow.",
  "volatile-atomicity": "A volatile write establishes a happens-before edge to a later read of that variable, but the read and write inside i++ are separate memory actions. AtomicInteger wraps the transition in a CAS loop.",
  "synchronized-lock": "synchronized uses an intrinsic monitor tied to an object. ReentrantLock stores ownership explicitly and exposes timed acquisition, interruptible waits, fairness, and multiple condition queues.",
  "executor-service": "A pool is a state machine of worker count, work queue, rejection policy, and shutdown state. An unbounded queue can keep accepting work while latency and retained task memory grow without limit.",
  "deadlock-race-condition": "Deadlock requires mutual exclusion, hold-and-wait, no preemption, and a cycle. A race is any outcome that changes with interleaving; both require an invariant and a synchronization edge.",
  completablefuture: "CompletableFuture stores a completion and a dependent-stage graph. Non-async continuations may run on the completing thread; async stages use the selected executor or common pool.",
  "jvm-memory-model": "The heap is garbage-collected reachability space; stacks hold per-thread frames; metaspace stores class metadata outside the heap. A leak is still possible when a live root retains objects forever.",
  "jvm-class-loading": "Class identity is the pair of binary name and defining class loader. Linking can fail after loading, which explains why a class can exist in an artifact yet still produce a linkage error at runtime.",
  "spring-di-lifecycle": "Bean post-processors can replace a bean with a proxy before initialization completes. Constructor injection therefore exposes the dependency graph early and makes circular dependencies harder to hide.",
  "spring-transactions": "Spring transaction advice binds a database resource to the current thread through a transaction synchronization manager. A self-call never crosses the proxy, and an HTTP call cannot participate in the database commit protocol.",
  "sql-indexes-transactions": "A B-tree follows leading indexed columns and can also provide ordering or covering data. Each extra index is another structure the database must maintain on writes and vacuum/compaction work.",
  "sql-isolation-locks": "Isolation is implemented with locks, MVCC snapshots, or both. The database may prevent one anomaly while still allowing another, so the business invariant must drive the choice.",
  "system-design-reliability": "Reliability controls form a budget: a timeout bounds occupancy, retries spend more downstream capacity, circuit breakers stop admission, and idempotency makes repetition safe.",
  "system-design-scaling": "Caching moves work from the origin to a faster layer, but introduces freshness and stampede state. Replicas add capacity only when lag and read-after-write behavior are acceptable.",
  "concurrency-interrupts": "Interrupt status is a bit on the Thread object; blocking APIs may clear it while throwing InterruptedException. Restoring it preserves the cancellation signal for the next owner.",
  "concurrency-atomics": "CAS compares a previously observed value and publishes a replacement atomically. Under contention, repeated failed CAS operations can cost more CPU than one short lock.",
  "jvm-jit-optimizations": "The tiered JIT profiles hot methods, inlines calls, eliminates allocations, and may deoptimize when assumptions change. A benchmark must allow warm-up and prevent dead-code elimination.",
  "jvm-gc-tuning": "Collectors track regions or generations and reclaim unreachable objects. Pause behavior depends on allocation rate, live-set size, remembered sets, and CPU available for concurrent work.",
  "spring-proxy-self-invocation": "Proxy-based advice intercepts an external virtual call, not this.method(). The same limitation applies to @Transactional, @Cacheable, and many method-security annotations.",
  "spring-security-boundary": "Authentication establishes a principal; authorization evaluates an action against that principal and the target resource. URL roles cannot replace tenant/object checks in the service layer.",
  "sql-explain-joins": "The optimizer estimates cardinality and chooses join order and algorithms. A stale statistic or non-sargable predicate can make a valid query choose a catastrophically expensive plan.",
  "sql-pagination-consistency": "Keyset pagination turns the last ordered key into a seek predicate, avoiding discarded rows. A unique tie-breaker is required or records can repeat or disappear between pages.",
  "system-design-consistency": "Consistency is a read/write visibility contract, not a database brand. Versions, quorum, single-writer ownership, and conflict resolution are mechanisms for implementing that contract.",
  "system-design-rate-limiting": "A token bucket stores tokens, refill time, and last update; an atomic operation decides admission and TTL prevents abandoned identities from growing state forever.",
  "concurrency-threadlocal": "ThreadLocalMap uses weak references for keys but strong references for values. A pooled thread can therefore retain a large value after the key is collected unless remove() runs.",
  "concurrency-forkjoin": "ForkJoinPool workers use work stealing: idle workers take tasks from another worker's deque. Blocking a worker reduces the parallelism the pool was sized to provide.",
  "spring-boot-autoconfiguration": "Conditions are evaluated against classpath types, properties, and existing beans. A user bean commonly causes auto-configuration to back off, so the winning condition report is more reliable than assumptions.",
  "spring-boot-observability": "Traces connect one request across boundaries, metrics aggregate health, and logs preserve event detail. Bounded labels and propagated trace IDs keep this evidence useful under load.",
  "spring-boot-resilience": "A resilient client composes a deadline, pool, retry policy, circuit state, and idempotency key. Omitting one layer can turn a dependency slowdown into local thread or connection exhaustion.",
  "spring-boot-testing": "Unit tests isolate logic; slice tests load a narrow Spring boundary; full tests prove wiring and infrastructure. Each layer trades execution speed for integration confidence.",
};

// Keep the interview guide presentation independent from the larger digest UI.
// A missing entry is intentional: callers can fall back to the source answer.
export function getJavaInterviewAnswerSteps(id) {
  return QA_ACTION_STEPS[id] || [];
}

export function getJavaInterviewInternals(id) {
  return QA_INTERNALS[id] || "";
}

const QA_EXPECTED_OUTPUTS = {
  "hashmap-internals-interview": "PAID\nfalse",
  "hashmap-concurrenthashmap": "count=2 (both increments retained)",
  "volatile-atomicity": "stop=true; counter reaches the exact expected total with AtomicInteger",
  "synchronized-lock": "lock acquisition times out rather than waiting forever",
  "executor-service": "accepted=8; rejected=1; shutdown=true",
  "deadlock-race-condition": "transfers completed=10,000; deadlocks=0; balance conserved",
  completablefuture: "profile response returned with recommendationFallback=true within the deadline",
  "jvm-memory-model": "post-GC live set stabilizes; allocation and pause metrics identify the cause",
  "jvm-class-loading": "ClassNotFoundException at explicit lookup versus NoClassDefFoundError during linkage",
  "spring-di-lifecycle": "bean constructed → post-processed/proxied → initialized → destroyed",
  "spring-transactions": "database changes commit together; remote notification is retried from the outbox",
  "sql-indexes-transactions": "EXPLAIN changes from sequential scan to index-backed lookup",
  "sql-isolation-locks": "one checkout succeeds; the conflicting request receives a safe retryable result",
  "system-design-reliability": "dependency timeout produces a bounded fallback instead of occupied request threads",
  "system-design-scaling": "cache hit served quickly; origin load remains within its budget during a burst",
  "concurrency-interrupts": "worker observes interrupt and exits before the shutdown deadline",
  "concurrency-atomics": "state transition applied once; contention and CPU remain within the measured budget",
  "jvm-jit-optimizations": "warm benchmark stabilizes after forks; cold-start and steady-state numbers are reported separately",
  "jvm-gc-tuning": "pause p99 and allocation rate decrease without increasing post-GC live set",
  "spring-proxy-self-invocation": "repository call count=1 and the cache/transaction advice is observed",
  "spring-security-boundary": "same role: own resource=200; another tenant's resource=403",
  "sql-explain-joins": "actual rows approximate estimates and the expensive join node disappears from the critical path",
  "sql-pagination-consistency": "page latency stays stable and inserts do not duplicate a previously returned row",
  "system-design-consistency": "read-your-writes is guaranteed while unrelated replicas remain eventually consistent",
  "system-design-rate-limiting": "allowed=100; rejected requests receive retry timing and the store remains bounded",
  "concurrency-threadlocal": "request B sees its own correlation ID, never request A's value",
  "concurrency-forkjoin": "CPU transformation improves throughput; blocking calls no longer starve request work",
  "spring-boot-autoconfiguration": "condition report identifies the winning bean and property source",
  "spring-boot-observability": "one trace identifies the slow database span and the dashboard shows pool saturation",
  "spring-boot-resilience": "partner failure returns a pending/fallback result and recovery does not create a retry storm",
  "spring-boot-testing": "fast unit tests catch rules; slice/integration tests catch boundary and wiring regressions",
};

JAVA_INTERVIEW_QA.forEach((entry) => {
  const guidance = QA_REVIEW_GUIDANCE[entry.section] || QA_REVIEW_GUIDANCE["System Design"];
  Object.assign(entry, {
    whyItWorks: guidance.why,
    commonMistakes: guidance.pitfalls,
    performanceNotes: guidance.performance,
    testingNotes: guidance.testing,
    actionSteps: QA_ACTION_STEPS[entry.id] || [],
    internals: QA_INTERNALS[entry.id] || "Trace the runtime mechanism, state transition, and failure boundary rather than memorizing only the API surface.",
    expectedOutput: QA_EXPECTED_OUTPUTS[entry.id] || "The behavior should match the stated contract under normal and failure paths.",
  });
});

export const JAVA_PRODUCTION_SCENARIOS = [
  {
    id: "prod-latency-spike",
    title: "p99 latency suddenly spikes",
    area: "Observability & performance",
    prompt: "At 10:15 UTC, p99 latency for checkout rises from 300 ms to 8 s while traffic is flat. Walk through your response.",
    impact: "Users time out or retry; retries can amplify load and create duplicate work.",
    triage: ["Confirm the alert window, affected endpoint, regions, tenants, and deploy timeline.", "Compare RED signals: request rate, error rate, and duration; then inspect traces for the slow span.", "Correlate CPU, GC, thread/virtual-thread queues, database-pool wait, downstream latency, and retry volume.", "Mitigate safely: pause a bad rollout, reduce optional work, enforce deadlines, or shed excess traffic."],
    diagnosis: "If traces show database-pool wait while database CPU is normal, investigate connection leaks, slow queries, transaction scope, and pool saturation before changing application threads.",
    prevention: "Add endpoint p95/p99 dashboards, pool wait and queue-age alerts, load-test thresholds, query budgets, and a rollback runbook.",
    star: "Situation: checkout p99 grew during a release. Task: restore the SLO without guessing. Action: compared traces and pool metrics, found a new query inside a long transaction, rolled back, then moved the query and added a plan regression test. Result: latency returned to target and the failure mode became observable.",
    followUps: "What would make you roll back immediately? How do you distinguish an app bottleneck from a downstream bottleneck?",
  },
  {
    id: "prod-memory-growth",
    title: "heap grows until containers restart",
    area: "JVM & memory",
    prompt: "A Java service's old-generation baseline rises after every full GC and pods OOM overnight. What do you do end to end?",
    impact: "Restarts cause availability loss and may discard in-flight work; increasing -Xmx only delays failure.",
    triage: ["Confirm live-set growth across multiple GC cycles under comparable traffic.", "Capture JFR, heap histograms, and a heap dump with safe operational controls; compare dominator trees.", "Trace the growing objects to GC roots: static maps, caches, listeners, ThreadLocals, sessions, or unclosed resources.", "Mitigate with a bounded cache, traffic reduction, restart guardrail, or feature flag while preserving evidence."],
    diagnosis: "A retained-object path identifies ownership. For example, a static map keyed by request ID with no eviction is a lifecycle bug, not a collector configuration problem.",
    prevention: "Set cache size/TTL limits, expose entry counts and heap-after-GC, add soak tests, and review ownership for every long-lived collection.",
    star: "Situation: pods restarted nightly from memory growth. Task: prove whether the issue was a leak or normal heap expansion. Action: compared post-GC baselines and a dominator tree, found request metadata retained by a static map, bounded it, and added a soak test. Result: the live set stabilized and restarts stopped.",
    followUps: "What evidence would disprove a leak? How do you protect a heap dump containing sensitive data?",
  },
  {
    id: "prod-deadlock",
    title: "requests hang with no obvious errors",
    area: "Concurrency",
    prompt: "Traffic is healthy but worker threads stop completing. Thread dumps show two lock cycles. Explain your investigation and fix.",
    impact: "Blocked workers exhaust capacity; health checks may pass while user requests hang.",
    triage: ["Check in-flight requests, queue depth, thread states, lock owners, and timeout/error metrics.", "Capture multiple thread dumps seconds apart to confirm a stable cycle rather than a transient wait.", "Map each lock to code and ownership; identify external calls or lock ordering inside the critical sections.", "Break the cycle safely with traffic draining, a rollback, or a targeted feature flag before deploying the permanent fix."],
    diagnosis: "Two code paths acquired account and ledger locks in opposite order. Enforce one global ordering, shorten critical sections, and never call remote services while holding either lock.",
    prevention: "Add timed acquisition diagnostics, lock-wait metrics, stress tests with opposing operations, and a documented lock-order rule.",
    star: "Situation: transfers intermittently froze the worker pool. Task: remove the deadlock without losing money-conservation correctness. Action: used thread dumps to identify opposite lock order, standardized acquisition by ID, and stress-tested conflicting transfers. Result: no cycles occurred in the soak test and the invariant remained explicit.",
    followUps: "How would you distinguish deadlock from thread starvation? Why are sleeps not a valid concurrency test?",
  },
  {
    id: "prod-db-regression",
    title: "database becomes the bottleneck after a data growth event",
    area: "SQL & persistence",
    prompt: "A report endpoint was fast for months, then slows 20x after the table grows tenfold. How do you debug and remediate it?",
    impact: "Long queries consume connections, increase queueing, and can affect unrelated endpoints.",
    triage: ["Compare query latency, rows read, buffer/cache hit rate, connection-pool wait, and database CPU before and after growth.", "Capture the actual execution plan and compare estimated versus actual row counts.", "Check predicates, join order, sort spills, stale statistics, missing composite indexes, and accidental N+1 access.", "Mitigate with pagination, a bounded timeout, read replica or queueing, and a rollback of a query-shape change if needed."],
    diagnosis: "The query filtered by tenant and ordered by timestamp but had only a tenant index; a composite index and keyset pagination removed the large scan and discard.",
    prevention: "Keep representative-volume plan tests, index review with schema changes, query budgets, and alerts on pool wait and rows examined.",
    star: "Situation: audit history pages timed out after growth. Task: restore predictable reads without harming writes. Action: read the actual plan, added a composite index and keyset cursor, and measured write overhead. Result: latency stayed stable at production volume.",
    followUps: "When can an index make a query worse? Why is offset pagination risky at deep pages?",
  },
  {
    id: "prod-downstream-failure",
    title: "third-party dependency is slow or unavailable",
    area: "Reliability",
    prompt: "A payment provider's latency rises and your service starts timing out. Describe the safe response and long-term design.",
    impact: "Unbounded waits consume threads and connections; retries can duplicate charges or amplify the outage.",
    triage: ["Confirm dependency-specific latency, error, timeout, retry, and circuit state; separate provider failure from your own saturation.", "Stop unbounded retries, enforce a request deadline, and inspect idempotency-key coverage.", "Fail gracefully with a clear pending state or queue work for reconciliation; do not claim success without provider confirmation.", "Communicate scope and timeline, preserve correlation IDs, and record the provider incident reference."],
    diagnosis: "The synchronous path treated a timeout as an unknown outcome. The durable fix is idempotent payment commands plus an outbox/reconciliation workflow and bounded concurrency.",
    prevention: "Dependency SLOs, contract tests, timeout budgets, circuit breakers, bulkheads, idempotency, and game-day failure drills.",
    star: "Situation: provider slowness caused duplicate payment attempts. Task: keep checkout safe during unknown outcomes. Action: added idempotency keys, bounded retries, a pending state, and asynchronous reconciliation. Result: customers received a predictable status and duplicate charges stopped.",
    followUps: "When should a circuit breaker open? What does ‘fail open’ versus ‘fail closed’ mean here?",
  },
  {
    id: "prod-bad-deploy",
    title: "error rate rises immediately after deployment",
    area: "Release engineering",
    prompt: "A canary shows 5xx errors within three minutes of a release. What evidence do you gather and what is your rollback decision?",
    impact: "A bad build can spread quickly; delaying rollback to find the root cause increases blast radius.",
    triage: ["Compare canary and control by version, endpoint, region, status code, and request shape.", "Check release diff, feature flags, configuration, dependency migrations, logs, traces, and startup health—not only aggregate 5xx.", "If the regression is version-correlated and customer-impacting, halt rollout and roll back or disable the flag.", "After recovery, reproduce with the failing request, add a regression test, and verify the rollback did not leave schema or data incompatibility."],
    diagnosis: "The release assumed a nullable field was always populated; a real legacy record caused a null dereference. A compatibility test using old data would have caught it.",
    prevention: "Progressive delivery, automated rollback thresholds, backward-compatible migrations, realistic fixtures, and post-deploy smoke tests.",
    star: "Situation: canary 5xx rose after a schema-compatible release. Task: minimize impact and identify the cause. Action: halted rollout, rolled back, reproduced with a legacy record, and added a null-handling regression test. Result: the error rate returned to baseline and the deployment gate now checks historical fixtures.",
    followUps: "When is rollback unsafe? How do you handle an already-run database migration?",
  },
  {
    id: "prod-high-cpu",
    title: "CPU usage is unexpectedly high",
    area: "JVM & runtime",
    prompt: "CPU on several Java pods jumps from 35% to 95%, but request volume is unchanged. How do you investigate without guessing?",
    impact: "CPU saturation increases latency, reduces headroom for traffic bursts, and can trigger throttling that makes the diagnosis worse.",
    triage: ["Confirm whether CPU is application, GC, kernel, or container-throttling time; compare healthy and unhealthy pods.", "Find hot processes and threads with container metrics, thread dumps, JFR, and a short async-profiler or equivalent sample.", "Correlate the hot stack with deployment, input shape, retry loops, serialization, regex, logging, GC allocation, and lock contention.", "Mitigate with rollback or feature flag, rate limits, bounded concurrency, or reduced optional work while preserving a profile."],
    diagnosis: "A new fallback loop retried a malformed downstream response without a delay. The hot stack showed repeated parsing and allocation; fixing the termination condition removed the spin.",
    prevention: "CPU and throttling alerts, profiling during load tests, retry budgets, bounded loops, allocation-rate dashboards, and regression tests for malformed inputs.",
    star: "Situation: CPU saturated with flat traffic after a release. Task: restore headroom and find the cause. Action: compared pod-level CPU with JFR samples, found a tight retry loop on malformed input, disabled the path, fixed termination, and added a bounded-retry test. Result: CPU returned to baseline and the release gate now exercises bad responses.",
    followUps: "How do you distinguish CPU work from GC overhead? What does container CPU throttling look like?",
  },
  {
    id: "prod-microservice-attribution",
    title: "Which microservice or API is causing the incident?",
    area: "Distributed tracing",
    prompt: "The user-facing API is slow, but ten downstream services are involved. How do you identify the responsible service end to end?",
    impact: "Blaming the edge service can lead to unsafe changes while the actual bottleneck remains hidden in a dependency or retry fan-out.",
    triage: ["Start with a trace or correlation ID and compare healthy versus slow requests by route, version, region, and tenant.", "Break total duration into service spans, queue time, database time, network time, and retries; inspect fan-out and critical-path latency.", "Use RED metrics per service and dependency: rate, errors, duration, timeout/retry counts, saturation, and connection-pool wait.", "Confirm causality with a narrow mitigation—disable optional fan-out, route around a version, or reduce concurrency—then watch the trace and SLO."],
    diagnosis: "The edge API was healthy; a recommendation service added three sequential calls and retried each timeout. Trace critical-path spans and retry annotations exposed the amplification.",
    prevention: "Propagate trace context, standardize span names and error attributes, create service-level dashboards, enforce timeout budgets, and alert on retry amplification.",
    star: "Situation: checkout latency was attributed to the gateway by default. Task: identify the true critical path. Action: followed sampled traces and dependency RED metrics, found sequential recommendation calls with nested retries, removed the optional fan-out from checkout, and set a deadline budget. Result: checkout met its SLO even when recommendations degraded.",
    followUps: "What if traces are missing? How do you sample without losing rare slow requests?",
  },
  {
    id: "prod-slow-query",
    title: "One database query takes too long",
    area: "SQL operations",
    prompt: "A query that normally takes 50 ms now takes 12 seconds. Walk through diagnosis, mitigation, and the permanent fix.",
    impact: "Long queries hold connections, create queueing, increase lock duration, and can cascade into application timeouts.",
    triage: ["Capture the exact SQL, bind values, duration, rows returned, caller, transaction age, and database wait event.", "Run an actual execution plan safely; compare estimated and actual rows, scan type, join order, sort/hash spills, and buffer reads.", "Check data growth, stale statistics, locks, index health, parameter sensitivity, N+1 callers, and whether a deployment changed the query shape.", "Mitigate with a timeout, pagination, cancellation, read replica, feature flag, or kill only a confirmed runaway query under the incident policy."],
    diagnosis: "A date filter was wrapped in a function, preventing the existing index from being used; the database scanned the full history table. A sargable predicate and composite index fixed the plan.",
    prevention: "Plan regression tests at representative volume, query-duration and rows-read budgets, slow-query sampling, index review, and safe cancellation policies.",
    star: "Situation: an audit query grew from milliseconds to seconds after data growth. Task: restore predictable performance without hiding the problem. Action: inspected the actual plan, found a non-sargable predicate and missing ordering column, rewrote the predicate, added a composite index, and validated write overhead. Result: the query returned to target at production volume.",
    followUps: "When should you cancel a query? How do locks differ from a poor execution plan?",
  },
  {
    id: "prod-kafka-consumer-lag",
    title: "Kafka consumer lag keeps growing",
    area: "Kafka",
    prompt: "A consumer group's lag grows from zero to millions while producers remain healthy. Walk through diagnosis and recovery.",
    impact: "Events become stale, downstream state falls behind, and an aggressive catch-up can overload databases or APIs.",
    triage: ["Check lag by topic, partition, consumer instance, and timestamp; compare producer rate with consumer throughput.", "Inspect rebalance frequency, poll interval violations, processing latency, deserialization errors, and dead-letter volume.", "Confirm partition skew, hot keys, downstream pool saturation, and whether consumers are blocked on external I/O.", "Mitigate by pausing noncritical producers, scaling within partition count, reducing batch cost, or routing poison messages to a DLQ."],
    diagnosis: "One partition contained a poison event that repeatedly failed before its offset advanced. The consumer needed bounded retries, a DLQ policy, and metrics for processing duration and failure reason.",
    prevention: "Partition-key review, lag and age alerts, idempotent handlers, bounded retries, DLQ replay tooling, and load tests at realistic partition skew.",
    star: "Situation: order events accumulated during a consumer incident. Task: restore processing without duplicating side effects. Action: identified a poison message and partition skew, routed failures to a DLQ, scaled consumers to available partitions, and made the handler idempotent. Result: lag drained safely and replay became an audited operation.",
    followUps: "Why can’t adding consumers always help? What does at-least-once delivery require from a handler?",
  },
  {
    id: "prod-kafka-duplicate-events",
    title: "Kafka events are processed more than once",
    area: "Kafka",
    prompt: "Customers report duplicate notifications after a consumer restart. How do you make the workflow safe?",
    impact: "At-least-once delivery can repeat side effects when a crash happens after the effect but before the offset commit.",
    triage: ["Find the event key, partition, offset, consumer instance, and downstream effect ID for duplicate examples.", "Check commit timing, rebalances, retries, producer acknowledgements, and whether the handler is safe to replay.", "Stop further harm with idempotency or deduplication at the side-effect boundary, not by blindly dropping messages.", "Replay from a controlled offset only after defining ordering, deduplication, and audit behavior."],
    diagnosis: "The email side effect completed, then the process crashed before committing the offset. A durable event ID and unique side-effect constraint make the handler idempotent.",
    prevention: "Stable event IDs, inbox/outbox patterns, unique constraints, explicit delivery semantics, commit metrics, and replay drills.",
    star: "Situation: consumer restarts sent duplicate emails. Task: preserve at-least-once durability without duplicate customer impact. Action: added a durable notification key with a uniqueness constraint before sending, documented commit timing, and replay-tested failures. Result: redelivery remained safe and duplicates were suppressed with an audit trail.",
    followUps: "Exactly-once semantics versus idempotency? How do you preserve ordering per customer?",
  },
  {
    id: "prod-mq-poison-message",
    title: "Message queue poison messages block work",
    area: "MQ & messaging",
    prompt: "A queue repeatedly redelivers one malformed message and starves healthy work. What is your response?",
    impact: "Redelivery loops waste consumers, inflate queue depth, and hide the failure behind generic retry counts.",
    triage: ["Capture message ID, delivery count, payload schema version, consumer exception, and queue age.", "Separate transient dependency failures from permanent validation or deserialization failures.", "Apply a bounded retry count with backoff, then move permanent failures to a quarantine/DLQ with the original metadata.", "Continue healthy work, alert on DLQ rate and oldest-message age, and provide an authorized replay path after correction."],
    diagnosis: "A producer deployed a schema field as a number while the consumer expected a string. Versioned schemas and validation at the boundary prevent the poison loop.",
    prevention: "Schema compatibility checks, DLQ ownership, retry budgets, payload validation, message tracing, and replay runbooks.",
    star: "Situation: a malformed message blocked a fulfillment queue. Task: keep valid orders moving while preserving the failed message. Action: capped redelivery, quarantined the poison message with metadata, fixed the schema compatibility issue, and replayed only after validation. Result: queue age recovered and the failure was fully traceable.",
    followUps: "What belongs in a DLQ? When should a message be discarded?",
  },
  {
    id: "prod-cache-stampede",
    title: "Cache stampede overloads the origin",
    area: "Caching",
    prompt: "A popular cache key expires and database CPU immediately hits 100%. How do you stabilize and fix it?",
    impact: "Many callers miss together and duplicate the same expensive origin request, causing cascading latency.",
    triage: ["Compare hit rate, miss rate, key expiry distribution, origin query rate, and hot-key access patterns.", "Protect the origin with request coalescing, stale-while-revalidate, rate limits, or a temporary TTL extension.", "Verify cache invalidation, serialization cost, eviction policy, and whether one tenant or key dominates traffic.", "Restore normal TTLs gradually and measure origin load, freshness, and error rate."],
    diagnosis: "All instances used the same short TTL and refreshed synchronously. Jittered expiry plus single-flight refresh prevents simultaneous misses.",
    prevention: "TTL jitter, stale serving policy, single-flight refresh, bounded cache memory, hot-key dashboards, and origin load budgets.",
    star: "Situation: a catalog cache expiry overloaded the database. Task: reduce duplicate refreshes without serving unsafe data. Action: enabled stale-while-revalidate, added per-key single-flight refresh and TTL jitter, and monitored freshness. Result: origin load flattened and cache expiry no longer caused an outage.",
    followUps: "When is stale data unacceptable? How do you invalidate multiple cache layers?",
  },
  {
    id: "prod-kubernetes-restarts",
    title: "Kubernetes pods restart or never become ready",
    area: "Kubernetes",
    prompt: "New pods enter CrashLoopBackOff while old pods remain healthy. Explain your investigation and safe rollout response.",
    impact: "Capacity drops during rollout; a bad readiness or configuration change can create a partial outage.",
    triage: ["Inspect pod events, previous container logs, exit codes, probes, resource limits, image digest, config/secret versions, and node pressure.", "Compare the new ReplicaSet with the last healthy revision and reproduce startup with the exact image and environment.", "Pause or roll back the rollout if customer capacity is at risk; do not weaken probes or raise limits without evidence.", "Check whether the failure is application startup, dependency readiness, permission, OOMKilled, or scheduling capacity."],
    diagnosis: "The image expected a secret key renamed in the deployment. The startup exception and ReplicaSet diff showed a configuration contract break.",
    prevention: "Progressive rollouts, startup smoke tests, config schema validation, probe ownership, resource right-sizing, and alerts on restart rate and readiness age.",
    star: "Situation: a rollout created CrashLoopBackOff pods. Task: protect capacity and find the release defect. Action: paused the rollout, compared pod events and previous logs with the healthy ReplicaSet, found a renamed secret key, and added manifest validation. Result: rollback restored capacity and future releases fail before scheduling.",
    followUps: "Readiness versus liveness? How do you investigate OOMKilled?",
  },
  {
    id: "prod-security-incident",
    title: "Suspicious access or credential exposure",
    area: "Security",
    prompt: "Audit logs show a token was used from an unusual location and a tenant boundary may have been crossed. What is your incident plan?",
    impact: "Continuing access can increase data exposure; careless investigation can destroy evidence or leak secrets further.",
    triage: ["Activate the incident path, preserve logs and timestamps, identify affected identities/resources, and restrict access to responders.", "Revoke or rotate the suspected credential, invalidate sessions where appropriate, and add temporary deny rules without erasing evidence.", "Trace authorization decisions, tenant IDs, request IDs, source IP/device signals, and downstream data access.", "Notify the security/privacy owners, scope exposure, remediate the control, and document a verified recovery and communication plan."],
    diagnosis: "A service trusted a client-supplied tenant ID instead of deriving it from the authenticated principal. Authorization must be enforced server-side at the resource boundary.",
    prevention: "Least privilege, server-derived tenant context, secret rotation, immutable audit logs, anomaly detection, negative authorization tests, and tabletop exercises.",
    star: "Situation: an audit alert indicated cross-tenant access. Task: contain exposure while preserving forensic evidence. Action: revoked the credential, restricted the affected route, traced authorization inputs, found trust in a client tenant ID, and added ownership checks and negative tests. Result: access was contained and the control was verified before reopening traffic.",
    followUps: "What evidence must be preserved? How do you decide whether notification is required?",
  },
  {
    id: "prod-docker-image",
    title: "Docker image works locally but fails in production",
    area: "Docker & delivery",
    prompt: "The same service passes local tests but exits immediately in its production container. How do you debug it?",
    impact: "A broken image can block deployment or silently run with incorrect defaults if the failure is hidden by a restart loop.",
    triage: ["Inspect the exact image digest, entrypoint/CMD, exit code, container logs, environment, mounted files, user, architecture, and working directory.", "Run the immutable image locally with production-like environment and read-only filesystem constraints; compare multi-stage build artifacts.", "Check missing runtime dependencies, permissions, signal handling, port binding, and secret/config injection rather than rebuilding from memory.", "Promote the last known-good digest or roll back while preserving the failing image for analysis."],
    diagnosis: "A multi-stage build copied compiled classes but not a runtime resource file; startup failed only under the minimal production image.",
    prevention: "Reproducible pinned builds, image smoke tests, non-root execution, SBOM/vulnerability scanning, health checks, and digest-based rollouts.",
    star: "Situation: a container exited only in production. Task: restore delivery and find the artifact difference. Action: compared image digests and filesystem contents, reproduced with the production command, found a missing runtime resource in the final stage, and added an image smoke test. Result: the corrected immutable image deployed consistently.",
    followUps: "Why pin digests? How should a container handle SIGTERM and graceful shutdown?",
  },
  {
    id: "prod-kubernetes-networking",
    title: "Kubernetes service cannot reach another service",
    area: "Kubernetes networking",
    prompt: "Only one namespace cannot reach an internal API after a deployment. DNS resolves intermittently and some pods connect successfully. How do you debug it?",
    impact: "Partial connectivity creates retries, uneven traffic, and misleading application-level errors.",
    triage: ["Identify source pod, destination service, port, namespace, node, and exact failure: DNS, TCP connect, TLS, or HTTP authorization.", "Check Service selectors and endpoints, pod readiness, NetworkPolicies, CoreDNS health, kube-proxy/CNI events, and recent manifest changes.", "Test from a controlled debug pod with nslookup, getent, curl, and a TCP probe; compare a working namespace and node.", "Mitigate by restoring the last known-good policy or service selector, then validate traffic through the intended service rather than a pod IP."],
    diagnosis: "A NetworkPolicy allowed the namespace label but the new namespace label differed; endpoints were healthy, but policy denied the connection.",
    prevention: "Network contract tests, policy-as-code validation, endpoint/readiness dashboards, DNS alerts, and rollout checks from representative namespaces.",
    star: "Situation: one namespace lost access to an internal API after deployment. Task: restore connectivity without opening the cluster broadly. Action: separated DNS, endpoint, and policy checks, found a label mismatch in NetworkPolicy, corrected the selector, and added a policy test. Result: access recovered with least privilege preserved.",
    followUps: "Service versus Ingress? How do you investigate intermittent DNS failures?",
  },
  {
    id: "prod-kafka-rebalance",
    title: "Kafka consumers continuously rebalance",
    area: "Kafka rebalancing",
    prompt: "Consumer logs show frequent rebalances and lag oscillates. What signals do you inspect and what changes are safe?",
    impact: "Rebalances stop useful processing, duplicate work, and can turn moderate lag into an outage.",
    triage: ["Measure rebalance frequency, time between polls, processing duration, session/heartbeat timeouts, assignment changes, and consumer errors.", "Check whether handlers block on slow I/O, exceed max.poll.interval.ms, crash on poison records, or scale beyond available partitions.", "Stabilize with bounded processing batches, pause/resume, a suitable poll interval, cooperative assignment, or a rollback—never by blindly increasing every timeout.", "After stability, drain lag gradually and verify partition ownership, throughput, and duplicate side-effect safety."],
    diagnosis: "A synchronous downstream call exceeded the poll interval, so the broker considered the consumer dead and reassigned partitions. The durable fix separated polling from bounded processing and added deadlines.",
    prevention: "Consumer-liveness dashboards, max-poll testing, cooperative rebalancing, partition-aware scaling, poison-message handling, and idempotent handlers.",
    star: "Situation: lag repeatedly grew during slow partner responses. Task: stop rebalances while keeping delivery durable. Action: traced poll gaps to blocking calls, bounded work per poll, added deadlines and a DLQ path, and load-tested recovery. Result: assignments stabilized and lag drained without duplicate business effects.",
    followUps: "What is the difference between session timeout and max poll interval? When does cooperative rebalancing help?",
  },
  {
    id: "prod-redis-failure",
    title: "Redis latency or eviction causes an outage",
    area: "Redis & caching",
    prompt: "Redis latency increases and keys begin evicting while the application depends on it for sessions and rate limits. How do you respond?",
    impact: "A cache outage can become an availability or security incident when sessions, limits, or locks fail open unexpectedly.",
    triage: ["Separate command latency, connection-pool wait, CPU, memory, evictions, fragmentation, network, hot keys, and slowlog entries.", "Classify each use: cache, session, rate limit, lock, or durable data; each needs a different failure policy.", "Mitigate by serving safe stale cache, reducing optional traffic, enforcing local limits, or failing closed for security-sensitive controls.", "Check key size/TTL distribution, serialization, pipelining, eviction policy, and whether a hot key or unbounded value caused memory pressure."],
    diagnosis: "A session payload grew without a bound and crowded out rate-limit keys under allkeys-lru. Separate namespaces, bounded payloads, and dedicated capacity are required.",
    prevention: "Memory and eviction alerts, key-size/TTL audits, namespace budgets, hot-key detection, fail-open/closed runbooks, and load tests at realistic cardinality.",
    star: "Situation: Redis evictions caused inconsistent sessions and rate limits. Task: protect access control while restoring service. Action: classified keys by criticality, failed closed for rate limits, moved sessions to bounded values, and isolated capacity. Result: security controls remained enforced and cache pressure stopped cascading.",
    followUps: "When is Redis a source of truth? How do you handle cache stampede and hot keys?",
  },
  {
    id: "prod-cicd-pipeline",
    title: "CI/CD pipeline is green but deployment is unsafe",
    area: "CI/CD",
    prompt: "Tests pass, but the new release fails only after deployment. How do you improve the delivery pipeline end to end?",
    impact: "A green pipeline that misses artifact, configuration, migration, or runtime compatibility failures creates false confidence.",
    triage: ["Verify the exact artifact digest promoted from build to environment; do not rebuild between stages.", "Compare configuration, secrets, feature flags, database schema version, runtime/JDK, architecture, and dependency availability.", "Use canary or progressive rollout with automated SLO gates, startup smoke tests, and a tested rollback path.", "After recovery, add the smallest failing check to the pipeline and verify it against production-like data and infrastructure."],
    diagnosis: "The pipeline rebuilt the image during deployment and omitted a runtime resource present in CI. Immutable promotion and image smoke tests close the gap.",
    prevention: "Immutable artifacts, SBOM/signing, migration compatibility gates, environment parity, progressive delivery, automated rollback, and deployment observability.",
    star: "Situation: CI was green but production pods crashed. Task: remove the build-to-runtime gap. Action: compared image digests and manifests, found a deployment rebuild with a missing resource, switched to immutable promotion, and added a startup smoke test. Result: the pipeline caught the failure before production.",
    followUps: "How do you roll back a schema change? What belongs in a deployment gate versus a runtime alert?",
  },
  {
    id: "prod-distributed-transaction",
    title: "Distributed transaction partially succeeds",
    area: "Distributed transactions",
    prompt: "An order is persisted, but inventory reservation times out and payment status is unknown. How do you design recovery?",
    impact: "A single ACID transaction cannot safely span independent services; pretending it can creates stuck or double-processed orders.",
    triage: ["Record the order, payment command ID, inventory command ID, trace ID, and current state in a durable workflow record.", "Determine which side effects definitely happened versus are unknown; query providers idempotently rather than issuing blind compensations.", "Use an outbox to publish state changes, retries with deadlines, and a saga/state machine with explicit pending, confirmed, failed, and compensating states.", "Provide reconciliation and operator visibility; never report success until the business invariant is confirmed."],
    diagnosis: "The service wrote the order and called payment synchronously without an idempotency key or durable event. A workflow record plus outbox makes retries and recovery safe.",
    prevention: "Idempotency keys, transactional outbox, saga states, reconciliation jobs, invariant checks, timeout budgets, and failure-injection tests.",
    star: "Situation: payment outcome was unknown after inventory timeout. Task: prevent duplicate charges and stuck orders. Action: introduced a durable saga state, idempotent commands, an outbox, and reconciliation for ambiguous results. Result: retries became safe, customer status was honest, and operators could recover without manual database edits.",
    followUps: "Saga choreography versus orchestration? What makes compensation safe when the original action succeeded?",
  },
];

const MICROSERVICE_PATTERN_DETAILS = {
  "Bounded contexts and service decomposition": { definition: "A bounded context is a boundary around a business vocabulary, model, and set of invariants.", howItWorks: "Discover capabilities and ownership with domain events and team boundaries, then expose only a small API between contexts.", advantages: "Independent change, clearer ownership, and fewer accidental dependencies.", disadvantages: "Wrong boundaries create chatty calls, duplicated data, and expensive distributed workflows.", whenToUse: "Use when a business capability needs independent ownership or scaling; keep a modular monolith when it does not.", interview: "How did you choose a service boundary? What signal would tell you the boundary is wrong?", star: "Situation: a shared order module caused releases for checkout, shipping, and refunds to block one another. Task: separate ownership without breaking the customer flow. Action: mapped business invariants, extracted Orders and Payments seams, and published versioned events. Result: teams deployed independently and cross-module regressions fell because each service owned its rules.", codeSketch: "record OrderPlaced(UUID orderId, UUID customerId) {}" },
  "Database per service": { definition: "Each service owns its persistence model and other services access it through a contract, never direct table joins.", howItWorks: "Write local data in a local transaction, publish an event or expose a query API, and build consumer-side projections when needed.", advantages: "Autonomy, schema freedom, and isolated scaling or recovery.", disadvantages: "Cross-service queries and transactions become explicit design work.", whenToUse: "Use when service ownership and independent deployment matter; avoid it as a slogan for tiny modules.", interview: "How do you handle a report that needs data from three service databases?", star: "Situation: reporting queries against another team's tables made schema changes risky and caused lock contention. Task: remove the coupling while keeping the report useful. Action: defined an event contract and built a read projection owned by Reporting. Result: the source schema evolved independently and report latency became predictable.", codeSketch: "// Shipping consumes OrderPlaced; it does not SELECT from Orders DB" },
  "API Gateway and Backend-for-Frontend": { definition: "A gateway is an edge entry point; a BFF is a client-specific edge API that composes or reshapes responses.", howItWorks: "Authenticate, route, rate-limit, and aggregate at the edge while keeping business rules in owning services.", advantages: "Simpler clients, centralized edge policy, and client-specific payloads.", disadvantages: "A gateway can become a bottleneck or a hidden distributed monolith.", whenToUse: "Use for common edge concerns or genuinely different client needs, not to hide poor service boundaries.", interview: "Which logic belongs in a gateway and which must remain in a domain service?", star: "Situation: mobile clients made five sequential calls to render one dashboard. Task: reduce startup latency without moving business rules to the edge. Action: added a mobile BFF that authenticated once and composed bounded read calls in parallel with a deadline. Result: dashboard requests used one client round trip and p95 latency improved while service ownership stayed intact.", codeSketch: "Mono.zip(profileClient.get(), alertsClient.get()).map(Dashboard::new)" },
  "Service discovery and configuration": { definition: "Discovery maps a logical service name to healthy runtime instances; configuration supplies environment-specific behavior.", howItWorks: "Register instances, health-check them, resolve a name at request time, and validate configuration at startup.", advantages: "Elastic deployment, failover, and environment portability.", disadvantages: "Another control-plane dependency and more failure modes during startup or lookup.", whenToUse: "Use when instances scale or move dynamically; static service endpoints may be enough for a small deployment.", interview: "What happens if discovery is unavailable or returns stale instances?", star: "Situation: manually configured hostnames broke after autoscaling and caused intermittent checkout failures. Task: make routing resilient to instance churn. Action: introduced logical service discovery, health-aware resolution, startup configuration validation, and fallback alerts. Result: deployments stopped requiring endpoint edits and failed instances were removed from rotation automatically.", codeSketch: "URI payments = serviceRegistry.resolve(\"payments\");" },
  "Saga for distributed transactions": { definition: "A saga is a sequence of local transactions connected by messages, with compensation for failures.", howItWorks: "Commit one local step, emit a command/event for the next step, record state, and run compensating actions on timeout or rejection.", advantages: "No global lock, local ownership, and progress across independent databases.", disadvantages: "Temporary inconsistency, compensation complexity, and difficult debugging.", whenToUse: "Use for long-running business workflows; do not force a saga onto a single service transaction.", interview: "How do you make a compensation idempotent and safe to retry?", star: "Situation: checkout needed inventory, payment, and shipping across separate databases. Task: avoid a distributed lock while preventing paid orders without stock. Action: implemented an orchestrated saga with idempotent steps, explicit state, timeout handling, and release-inventory compensation. Result: partial failures became recoverable and operations could see exactly which step was pending.", codeSketch: "Order -> ReserveInventory -> AuthorizePayment -> ConfirmOrder" },
  "Transactional outbox": { definition: "The outbox stores an event beside the state change so a committed change cannot silently lose its message.", howItWorks: "Insert business rows and an outbox row in one transaction; a publisher polls or streams the outbox and marks delivery progress.", advantages: "Reliable publication without a distributed transaction.", disadvantages: "At-least-once delivery, duplicate handling, cleanup, and publisher lag.", whenToUse: "Use whenever a local database change must produce an external event reliably.", interview: "Why must consumers be idempotent if the publisher retries?", star: "Situation: an order commit occasionally succeeded while its broker publish failed, leaving downstream services unaware. Task: guarantee that committed orders eventually emitted an event. Action: wrote the order and outbox record in one transaction, added retrying publication, deduplication keys, and lag metrics. Result: event loss disappeared and duplicate delivery became harmless.", codeSketch: "transaction(() -> { order.save(); outbox.save(new OrderPlaced(order.id())); });" },
  "CQRS and read models": { definition: "CQRS separates command-side decisions from query-side representations optimized for reading.", howItWorks: "Validate commands against the write model, emit facts, and asynchronously update one or more projections.", advantages: "Fast tailored reads and independent scaling of read workloads.", disadvantages: "Eventual consistency, projection rebuilds, and duplicated models.", whenToUse: "Use when read and write shapes or scale differ materially; a single model is simpler otherwise.", interview: "How does a projection recover after missing events or a schema change?", star: "Situation: order writes were simple but customer history queries joined too many tables and timed out. Task: improve reads without weakening write invariants. Action: kept commands on the authoritative model and built a versioned history projection with replay support. Result: read latency dropped and the projection could be rebuilt after schema changes.", codeSketch: "OrderPlaced event -> CustomerOrderHistoryProjection" },
  "API composition": { definition: "An aggregator calls multiple services and composes their responses at a query boundary.", howItWorks: "Fan out in parallel with a deadline, correlate results, define partial-data behavior, and cap the fan-out.", advantages: "One client request and no shared database.", disadvantages: "Latency amplification, partial failures, and aggregator coupling.", whenToUse: "Use for read-oriented screens with bounded fan-out and clear degradation rules.", interview: "How do you set the deadline when three downstream calls share one user SLO?", star: "Situation: a dashboard endpoint called three services sequentially and breached its latency SLO. Task: reduce latency while making partial failure safe. Action: composed calls in parallel, budgeted deadlines, returned explicit unavailable sections, and capped fan-out. Result: healthy p95 latency improved and one degraded dependency no longer blanked the entire dashboard.", codeSketch: "CompletableFuture.allOf(account, alerts, orders)" },
  "Circuit breaker, timeout, and retry": { definition: "These resilience patterns bound waiting, stop repeated calls to a failing dependency, and retry only safe work.", howItWorks: "Set a deadline, classify errors, apply bounded exponential backoff with jitter, and open the circuit after a failure threshold.", advantages: "Protects threads and downstream systems while making failure behavior predictable.", disadvantages: "Bad retry policy can amplify outages; open circuits can hide recovery if probes are wrong.", whenToUse: "Use for remote calls with explicit idempotency and fallback behavior.", interview: "Which errors should never be retried, and how do you prevent a retry storm?", star: "Situation: a slow payment provider consumed request threads until our service became unhealthy. Task: keep checkout responsive and avoid retry amplification. Action: set a strict timeout, retried only idempotent failures with jitter, opened a circuit, and exposed dependency metrics. Result: thread exhaustion stopped and customers received a clear retry-later response during the provider outage.", codeSketch: "@TimeLimiter @Retry(name=\"payments\") @CircuitBreaker(name=\"payments\")" },
  "Bulkhead and queue-based load leveling": { definition: "Bulkheads isolate capacity; bounded queues smooth bursts without allowing unlimited memory growth.", howItWorks: "Give workloads separate pools or limits, reject or defer when full, and monitor queue depth and age.", advantages: "One noisy workload cannot consume every worker or connection.", disadvantages: "Lower total utilization and an explicit rejection path to design.", whenToUse: "Use when workloads have different priority, latency, or resource profiles.", interview: "What is your policy when the queue is full?", star: "Situation: background report jobs saturated the same executor used by customer requests. Task: stop batch work from taking down interactive traffic. Action: split pools, bounded the report queue, rejected excess jobs with a user-visible status, and alerted on queue age. Result: API latency stayed within SLO during report bursts and overload became measurable.", codeSketch: "new ThreadPoolExecutor(8, 8, 0, MILLISECONDS, new ArrayBlockingQueue<>(100))" },
  "Consumer-driven contract testing": { definition: "Consumers publish executable expectations that providers verify before release.", howItWorks: "Version contracts, run provider verification in CI, and treat additive versus breaking changes deliberately.", advantages: "Fast compatibility feedback without fragile full-environment end-to-end tests.", disadvantages: "Contract maintenance and false confidence if important behavior is not captured.", whenToUse: "Use for independently deployed APIs and events with multiple consumers.", interview: "How do you evolve a field without breaking an older consumer?", star: "Situation: a provider removed a response field and discovered the break only after deployment. Task: catch compatibility failures before release. Action: added consumer-driven contracts to CI, required provider verification, and made additive changes backward-compatible. Result: breaking API changes were caught during pull requests instead of production rollout.", codeSketch: "consumer.get(\"/orders/42\").willRespondWith(200).body(orderContract)" },
  "Strangler migration and modular monolith": { definition: "Strangler migration replaces one capability at a time; a modular monolith keeps boundaries without network overhead.", howItWorks: "Put a stable seam in front of a legacy capability, route a slice to the new implementation, compare behavior, and remove the old path gradually.", advantages: "Small reversible steps and lower migration risk.", disadvantages: "Temporary duplication, routing complexity, and two implementations to reconcile.", whenToUse: "Use when extracting from a legacy system; choose a modular monolith when independent deployment is not yet justified.", interview: "What makes an extraction seam safe and reversible?", star: "Situation: a legacy search module slowed every release but a full rewrite was too risky. Task: extract it without a big-bang migration. Action: introduced an anti-corruption seam, shadowed reads, compared results, and shifted traffic behind a feature flag with rollback. Result: Search became independently deployable while the legacy path remained available during verification.", codeSketch: "router.route(\"/search\", featureFlag.useNewSearch() ? newSearch : legacySearch)" },
};

// Original study material organized around the same practical skills a Java and
// Spring developer needs. It intentionally summarizes concepts rather than
// reproducing any third-party book text.
export const JAVA_SPRING_STUDY_PATHS = [
  {
    id: "java-starter-foundations",
    title: "Java Starter Foundations",
    level: "Beginner",
    eyebrow: "Start here · language essentials",
    description: "A friendly foundation for learning how Java programs run, think, make decisions, organize data, and recover from mistakes before moving into frameworks.",
    lessons: [
      { title: "JDK, JVM, and your first program", outcome: "Know the difference between writing Java source, compiling bytecode, and the JVM running that bytecode on a machine.", mentalModel: "Think of Java as a translated play: you write the script, the compiler translates it, and the JVM performs the same translated script on many stages.", example: "javac Hello.java produces Hello.class; java Hello asks the JVM to run that class.", recall: "Which part translates source code, and which part runs bytecode?", drill: "Create a HelloWorld program, compile it from the terminal, then change one line and run it again." },
      { title: "Variables, types, and expressions", outcome: "Store numbers, text, true/false values, and object references with types that explain the data's meaning.", mentalModel: "A variable is a labelled box. The type tells you what may safely go into that box and what operations make sense.", example: "int quantity = 3; and String productName = \"Book\" represent different kinds of information.", recall: "Should this value be a primitive value or a reference to an object, and why?", drill: "Model a shopping item using variables for name, quantity, price, and inStock; print a readable summary." },
      { title: "Decisions, loops, and methods", outcome: "Use if statements to choose, loops to repeat, and methods to name a small reusable piece of work.", mentalModel: "A method is a labelled recipe; a loop repeats a recipe; a condition chooses which recipe to use.", example: "A checkout method can reject an order when quantity is less than one before calculating its total.", recall: "What input does this method need, what result should it return, and what condition changes its path?", drill: "Write a method that returns pass or fail from a score, then call it for five different scores." },
      { title: "Classes, objects, and encapsulation", outcome: "Model related state and behavior together while protecting invalid changes through methods and validation.", mentalModel: "A class is a blueprint; an object is one built house. Encapsulation keeps the electrical wiring behind safe walls.", example: "A BankAccount owns its balance and exposes deposit(amount) instead of allowing any code to set the balance directly.", recall: "What data should this object protect, and which actions may safely change it?", drill: "Create a BankAccount with deposit and withdraw methods that reject invalid amounts." },
      { title: "Strings, arrays, and collections", outcome: "Choose String for text, arrays for fixed-size indexed data, and collection types when size or operations need flexibility.", mentalModel: "An array is a row of numbered lockers; a List is a flexible queue; a Map is a phone book from key to value.", example: "Use a List for shopping items and a Map when you need to find a product by ID.", recall: "Do I need an index, uniqueness, insertion order, or lookup by key?", drill: "Store five names in a List, remove one safely, then build a Map from name to score." },
      { title: "Exceptions and debugging", outcome: "Read stack traces, distinguish normal validation from exceptional failure, and make a failure useful to the caller.", mentalModel: "An exception is a fire alarm: it carries the problem up the building until someone who can respond handles it.", example: "Parsing an invalid number may throw NumberFormatException; user input can be checked before parsing to give a friendly message.", recall: "Can I prevent this failure at the boundary, recover from it here, or should I let it reach a caller?", drill: "Deliberately trigger a NumberFormatException, read its stack trace, then add input validation." },
      { title: "Interfaces and polymorphism", outcome: "Program to a shared capability so one implementation can be replaced without rewriting the caller.", mentalModel: "An interface is a wall socket standard: different appliances work because they agree on the same connection shape.", example: "A PaymentGateway interface lets CheckoutService use a test fake or a real provider.", recall: "What capability does this caller need, independent of the concrete implementation?", drill: "Create a Notifier interface with EmailNotifier and ConsoleNotifier implementations." },
      { title: "Java 8+ functional style", outcome: "Use lambdas, streams, and Optional for clear data transformations without hiding side effects or control flow.", mentalModel: "A stream is a conveyor belt: items pass through small transformations until one terminal operation collects or acts on the result.", example: "orders.stream().filter(Order::isPaid).map(Order::total) describes selecting paid orders and extracting totals.", recall: "Is this stream transforming data cleanly, or hiding an external side effect that should be explicit?", drill: "Filter a list of scores to passing values, double them, and collect the result without mutating the source list." },
    ],
  },
  {
    id: "effective-java-practice",
    title: "Effective Java Practice",
    level: "Intermediate → Senior",
    eyebrow: "Java design and reliability",
    description: "Build dependable Java APIs through clear contracts, value semantics, resource safety, and intentional concurrency.",
    lessons: [
      { title: "Create objects deliberately", outcome: "Choose constructors, static factories, builders, and dependency injection based on validation, readability, and API evolution.", mentalModel: "An object is a real-world thing with rules. A good creation method makes it impossible to create a broken version of that thing.", example: "Money.of(10, USD) is clearer and safer than passing unlabelled values into a long constructor.", recall: "What rule should this object enforce the moment it is created?", drill: "Design an immutable Money value with validation and a named factory for each supported currency." },
      { title: "Define value semantics", outcome: "Implement equals, hashCode, comparison, and immutability so objects remain safe in collections and caches.", mentalModel: "A HashMap is a library shelf: equals says whether two book labels mean the same book; hashCode says which shelf to check first.", example: "Two UserId values containing the same ID should compare equal even when created separately.", recall: "If this value changes after I put it in a map, can the map still find it?", drill: "Explain why mutating a HashMap key after insertion breaks lookup, then replace it with an immutable key." },
      { title: "Use generics as a contract", outcome: "Apply bounded wildcards to express producers, consumers, and type-safe reusable APIs.", mentalModel: "Generics are labels on containers: they tell Java what may enter and leave, preventing a wrong item from reaching runtime.", example: "A List<Integer> can be read as numbers, but it should not accept an arbitrary Number such as 2.5.", recall: "Is this method taking values out, putting values in, or both?", drill: "Write a copy method that accepts a source producer and a destination consumer without unchecked casts." },
      { title: "Handle failures and resources", outcome: "Separate recoverable conditions from programmer errors; preserve causes and close resources reliably.", mentalModel: "A resource is like a borrowed room key: whoever borrows it owns returning it, even when the work fails.", example: "try-with-resources closes a file stream on both the happy path and an exception path.", recall: "Who owns closing this resource, and what useful failure can the caller act on?", drill: "Refactor a file-processing method to use try-with-resources and return a domain-specific failure." },
      { title: "Make concurrency explicit", outcome: "Protect invariants with ownership, immutability, locks, or atomics, and document lifecycle and cancellation.", mentalModel: "Concurrent code is several people editing one whiteboard. Decide who may edit which part and how they take turns.", example: "A concurrent map protects one operation, but a separate get followed by put is still two competing steps.", recall: "What fact must stay true even when two requests arrive together?", drill: "Identify the race in a check-then-act cache update and replace it with an atomic map operation." },
    ],
  },
  {
    id: "spring-framework-foundations",
    title: "Spring Framework Foundations",
    level: "Beginner → Intermediate",
    eyebrow: "Application structure and dependency injection",
    description: "Learn how Spring assembles an application, manages boundaries, and keeps web, business, and persistence concerns separate.",
    lessons: [
      { title: "Model dependencies with the container", outcome: "Use constructor injection, component boundaries, configuration, and profiles without hiding dependencies.", mentalModel: "Spring is a careful assembler: you name the parts and their connections, then it builds the object graph for you.", example: "A CheckoutService receives a PaymentGateway in its constructor instead of creating one itself.", recall: "If I replaced this dependency for a test, where would I plug in the fake?", drill: "Wire a notification service behind an interface and swap its implementation with a profile-specific configuration." },
      { title: "Keep request flow clean", outcome: "Use controllers for HTTP concerns, services for business workflows, and repositories for persistence operations.", mentalModel: "Think of a restaurant: the controller takes the order, the service decides how to prepare it, and the repository fetches or stores ingredients.", example: "A controller reads JSON; a service decides whether checkout is allowed; a repository saves the order.", recall: "Is this code translating HTTP, making a business decision, or talking to storage?", drill: "Split a checkout endpoint so validation, orchestration, and database access have one clear home each." },
      { title: "Validate at the edge", outcome: "Turn untrusted request input into valid commands and map domain failures to stable HTTP responses.", mentalModel: "The API boundary is an airport security gate: reject invalid input before it enters the system.", example: "An empty email returns a clear 400 response instead of causing a database error later.", recall: "What must be true before this request is safe for the service layer?", drill: "Add bean validation to a create-user request and return a consistent error response without exposing a stack trace." },
      { title: "Design transaction boundaries", outcome: "Place transactions around business consistency operations and understand proxies, propagation, and rollback rules.", mentalModel: "A transaction is an all-or-nothing receipt: every related database change succeeds together or none of them count.", example: "Create an order and reserve inventory in one transaction so a failed reservation does not leave a paid-looking order.", recall: "Which business operation must never be half finished?", drill: "Explain why a self-invoked transactional method is not intercepted and redesign the workflow safely." },
      { title: "Test the right slice", outcome: "Use unit tests for decisions, focused integration tests for wiring and data behavior, and a small number of endpoint tests.", mentalModel: "Tests are questions at different zoom levels: unit tests ask about one decision; integration tests ask whether real parts work together.", example: "Test discount calculation without Spring, then test that a repository query returns the expected rows.", recall: "What is the smallest test that could prove this behavior?", drill: "Choose the smallest test type that proves a controller validation rule, a service policy, and a repository query." },
    ],
  },
  {
    id: "spring-boot-production",
    title: "Spring Boot Production Path",
    level: "Intermediate → Senior",
    eyebrow: "APIs, data, testing, and operations",
    description: "Turn a well-structured Spring application into a production-ready service with explicit configuration, observability, and safe delivery.",
    lessons: [
      { title: "Understand Boot conventions", outcome: "Use starters and auto-configuration productively while knowing when explicit configuration is necessary.", mentalModel: "Spring Boot is a prepared kitchen: common equipment arrives ready to use, but you can still replace a tool when your recipe needs it.", example: "Adding a web starter gives you an embedded server and MVC defaults without manually creating every bean.", recall: "What did Boot configure for me, and what assumption is it making?", drill: "Trace how a datasource is configured from properties to a running bean, then override one setting deliberately." },
      { title: "Build resilient REST APIs", outcome: "Design resource-oriented endpoints, stable status codes, pagination, idempotency, and useful error contracts.", mentalModel: "An API is a promise between two programs. A stable response lets the other program recover without guessing.", example: "A payment request uses an idempotency key so a network retry does not charge twice.", recall: "If the caller retries this request, what happens and how will it know?", drill: "Design POST and retry behavior for a payment request so a client retry cannot create a duplicate charge." },
      { title: "Persist with intent", outcome: "Use transactions, projections, fetch planning, and indexes while watching for N+1 queries and unsafe pagination.", mentalModel: "A database query is a trip to a warehouse: fetch exactly the boxes needed and count how many trips you make.", example: "A list page that loads 50 orders then each customer separately has an N+1 query problem.", recall: "How many queries run for one request, and which fields does the screen really need?", drill: "Diagnose an N+1 query from logs and compare a projection with a fetch join for a paged API." },
      { title: "Secure and test the service", outcome: "Apply authentication, authorization, input validation, and tests that prove both permitted and forbidden paths.", mentalModel: "Authentication asks who is at the door; authorization asks which rooms that person may enter.", example: "A logged-in user may still receive 403 when requesting another user's account data.", recall: "Who is calling, what are they allowed to do, and how do I prove the forbidden path fails?", drill: "Write the test cases for an endpoint that a user may read only when it belongs to their account." },
      { title: "Operate and deliver safely", outcome: "Use health checks, metrics, logs, tracing, graceful shutdown, timeouts, and deployment checks to make failures diagnosable.", mentalModel: "Production signals are a car dashboard: they do not drive the car, but they tell you where to look before a small problem becomes a breakdown.", example: "A rising timeout rate plus a slow dependency span points to a downstream issue rather than an application CPU problem.", recall: "What signal tells me users are hurting, and what signal helps me find why?", drill: "Define the four signals and one alert you would use to detect a failing downstream dependency." },
    ],
  },
  {
    id: "microservices-patterns",
    title: "Microservices Design Patterns",
    level: "Senior",
    eyebrow: "Distributed systems · Java and Spring Boot",
    description: "A pattern-by-pattern guide for deciding when microservices help, how services communicate, and how to handle distributed failure and consistency.",
    lessons: [
      { title: "Bounded contexts and service decomposition", outcome: "Split services around business capabilities and ownership boundaries rather than technical layers or database tables.", mentalModel: "A service is a team-sized shop with its own vocabulary and decisions; a boundary is useful when it protects ownership.", example: "Orders owns order status; Payments owns payment authorization; neither reaches into the other's tables.", recall: "What business rule would become clearer or safer if this boundary owned it?", drill: "Decompose an online shop into bounded contexts and write one invariant each context must protect." },
      { title: "Database per service", outcome: "Give each service control of its data model and expose information through APIs or events instead of shared-table coupling.", mentalModel: "Each service has its own notebook. Sharing a notebook looks easy until two teams rewrite the same page differently.", example: "Shipping reads an OrderPlaced event rather than joining the Orders database directly.", recall: "Who owns this data, and what contract can other services rely on?", drill: "Find three shared-table dependencies and replace each with an API or domain event." },
      { title: "API Gateway and Backend-for-Frontend", outcome: "Centralize edge concerns and shape responses for clients without putting business ownership into a giant proxy.", mentalModel: "The gateway is a hotel front desk: it routes guests and applies entry rules, but it does not run every department.", example: "A mobile BFF combines a profile and notification summary while Profile remains the owner of profile rules.", recall: "Is this edge concern common to clients, or is it business logic that belongs inside a service?", drill: "Design gateway routes, authentication checks, and a BFF response for a mobile dashboard." },
      { title: "Service discovery and configuration", outcome: "Locate healthy service instances and externalize environment-specific configuration without baking topology into code.", mentalModel: "Discovery is a current phone book; configuration is the address card that changes between home, staging, and production.", example: "A service resolves the Payments logical name to healthy instances instead of hard-coding a host and port.", recall: "What happens when an instance disappears or configuration is invalid?", drill: "List startup validation, health checks, and fallback behavior for a service client." },
      { title: "Saga for distributed transactions", outcome: "Coordinate local transactions with events or an orchestrator, and define compensating actions when a later step fails.", mentalModel: "A saga is a travel itinerary: each booking is local, and cancellation steps undo earlier bookings when the whole trip cannot finish.", example: "Order creation reserves inventory, then payment; a payment failure releases the reservation.", recall: "What is the compensating action, and is it actually reversible?", drill: "Draw a choreography and an orchestration version of an order workflow, including timeout paths." },
      { title: "Transactional outbox", outcome: "Persist a domain change and its outgoing event in one local transaction, then publish the event asynchronously and idempotently.", mentalModel: "The outbox is a mailbox beside the ledger: write the business change and the message together, then a courier delivers the message later.", example: "OrderService commits OrderPlaced and an outbox row; a publisher retries delivery until the broker accepts it.", recall: "What prevents a committed database change from losing its event?", drill: "Define outbox schema, polling/CDC ownership, retry policy, and duplicate-event handling." },
      { title: "CQRS and read models", outcome: "Separate write decisions from read projections when query shape, scale, or consistency needs justify the extra model.", mentalModel: "One notebook records authoritative decisions; another is arranged for fast lookup and can be rebuilt from events.", example: "Checkout writes an Order aggregate while a read model serves a paginated customer history.", recall: "What consistency delay can the user tolerate, and how will the read model catch up?", drill: "Choose a command model and projection for an order history screen, including rebuild behavior." },
      { title: "API composition", outcome: "Combine responses from multiple services at a query boundary while controlling fan-out, partial failure, and latency.", mentalModel: "Composition is a coordinator calling several specialists, then presenting one answer to the customer.", example: "A dashboard aggregator calls Account and Alerts in parallel with a deadline and returns partial data when Alerts is unavailable.", recall: "What is the fan-out, deadline, and partial-response policy?", drill: "Sketch parallel calls, timeout budgets, and a degraded response for a three-service dashboard." },
      { title: "Circuit breaker, timeout, and retry", outcome: "Fail fast when a dependency is unhealthy and retry only bounded, idempotent operations with backoff and jitter.", mentalModel: "A circuit breaker is an electrical safety switch: stop sending current to a failing appliance until a cautious test succeeds.", example: "A payment client times out at 800 ms, retries one idempotent request, then opens the circuit after repeated failures.", recall: "Should this operation be retried, and what user-visible fallback is safe?", drill: "Set a timeout budget, retry limit, jitter, open/half-open rules, and metrics for one dependency." },
      { title: "Bulkhead and queue-based load leveling", outcome: "Isolate scarce resources and absorb bursts with bounded queues, explicit rejection, and backpressure.", mentalModel: "A ship's bulkheads stop one flooded room from sinking the whole ship; queues do the same for workload spikes.", example: "Report generation has its own bounded executor so a slow export cannot exhaust request threads.", recall: "Which resource must be protected, and what happens when its queue is full?", drill: "Partition thread pools for API and background work and define rejection and alert thresholds." },
      { title: "Consumer-driven contract testing", outcome: "Verify that provider changes preserve the request/response contracts consumers actually depend on without requiring fragile end-to-end environments.", mentalModel: "A contract is a shared testable promise, not a document someone hopes both teams remember.", example: "The Orders provider verifies the fields a Shipping consumer requires before publishing a release.", recall: "Which consumer expectation would break if this field changed or disappeared?", drill: "Write a contract for one REST endpoint, including an additive field and a breaking change." },
      { title: "Strangler migration and modular monolith", outcome: "Move capabilities incrementally behind stable seams, keeping a modular monolith as a valid destination when distribution adds more cost than value.", mentalModel: "Strangling is replacing one room at a time while the building stays open; a modular monolith keeps the rooms separate without adding roads between buildings.", example: "Extract Search behind an API while Orders remains modular and deploys as one application.", recall: "What measurable pain requires a separate deployment or scaling boundary?", drill: "Choose one extraction seam, define the anti-corruption layer, and name the rollback plan." },
    ],
  },
].map((path) => path.id === "microservices-patterns"
  ? { ...path, lessons: path.lessons.map((lesson) => ({ ...lesson, ...(MICROSERVICE_PATTERN_DETAILS[lesson.title] || {}) })) }
  : path);

export const JAVA_QUICK_REFERENCE = [
  { id: "types-and-equality", level: "Beginner → Intermediate", title: "Types, Strings, and Equality", category: "Java Basics", points: ["Use == for primitive values; use equals for object value comparison.", "String is immutable; repeated concatenation in a loop usually belongs in StringBuilder.", "equals and hashCode must agree when objects are used as map keys."], quiz: "Why can two separately created strings contain the same text but fail a == comparison?", answer: "== compares references for objects; equals compares the value when String's implementation is used." },
  { id: "collections", level: "Beginner → Senior", title: "Collections Decision Sheet", category: "Collections", points: ["List preserves order and allows duplicates; Set models uniqueness; Map looks up a value by key.", "ArrayList is a strong default for indexed reads; ArrayDeque is useful for queue and stack behavior.", "HashMap needs stable keys and is not a substitute for a concurrent map."], quiz: "Which collection would you choose for unique usernames with fast membership checks?", answer: "HashSet, assuming usernames have correct equals/hashCode behavior." },
  { id: "exceptions", level: "Beginner → Senior", title: "Exceptions and Resource Safety", category: "Exceptions", points: ["Validate expected bad input at the boundary; reserve exceptions for exceptional or failed operations.", "Preserve the original cause when translating an exception into a domain error.", "try-with-resources closes AutoCloseable resources even when the body throws."], quiz: "What is the safest default for a file stream that must always be closed?", answer: "Use try-with-resources and keep the stream declared in its resource header." },
  { id: "threads", level: "Intermediate → Senior", title: "Threads and Shared State", category: "Concurrency", points: ["A thread is an execution path; an executor manages a reusable pool of worker threads.", "volatile provides visibility, not atomicity for compound operations such as count++.", "Prefer cancellation, deadlines, and bounded queues over unbounded background work."], quiz: "Why is count++ unsafe when two threads update the same plain int?", answer: "It is a read-modify-write sequence; the threads can read the same old value and lose one update." },
  { id: "spring-core", level: "Beginner → Intermediate", title: "Spring Core Annotations", category: "Spring", points: ["@Component registers a discoverable bean; @Configuration declares bean-producing configuration.", "Constructor injection makes required dependencies visible and easy to replace in tests.", "@Qualifier selects a named bean when several implementations share an interface."], quiz: "Why is constructor injection usually easier to test than field injection?", answer: "The test can provide the dependency directly, and the object cannot exist without its required collaborators." },
  { id: "spring-boot-api", level: "Intermediate → Senior", title: "Spring Boot API Checklist", category: "Spring Boot", points: ["Keep controllers thin: translate HTTP at the edge and delegate business decisions to services.", "Use stable error responses, validation, pagination, and idempotency for retried requests.", "Measure request latency, error rate, traffic, and saturation before tuning."], quiz: "Where should a business transaction normally begin: controller, service, or repository?", answer: "At the service operation representing one business consistency boundary." },
];

// Scalable original catalog: each topic becomes a small tutorial card with a
// mental model, a practical cue, and a next exercise. Keeping the topic index
// as data makes it possible to expand coverage without duplicating UI code.
const JAVA_CATALOG_SEEDS = [
  ["JDK vs JRE vs JVM", "Basics", "Beginner"], ["Primitive types", "Basics", "Beginner"], ["Wrapper classes", "Basics", "Beginner"], ["Casting and promotion", "Basics", "Beginner"], ["Operators", "Basics", "Beginner"], ["Control flow", "Basics", "Beginner"], ["Methods and parameters", "Basics", "Beginner"], ["Packages and imports", "Basics", "Beginner"], ["Access modifiers", "OOP", "Beginner"], ["Constructors", "OOP", "Beginner"], ["Inheritance", "OOP", "Beginner"], ["Composition", "OOP", "Intermediate"], ["Abstract classes", "OOP", "Intermediate"], ["Interfaces", "OOP", "Beginner"], ["Polymorphism", "OOP", "Intermediate"], ["Enums", "OOP", "Beginner"], ["Records", "Modern Java", "Intermediate"], ["Sealed classes", "Modern Java", "Intermediate"], ["String immutability", "Strings", "Beginner"], ["StringBuilder", "Strings", "Beginner"], ["Regular expressions", "Strings", "Intermediate"], ["Arrays", "Collections", "Beginner"], ["ArrayList", "Collections", "Beginner"], ["LinkedList", "Collections", "Intermediate"], ["HashSet", "Collections", "Beginner"], ["TreeSet", "Collections", "Intermediate"], ["HashMap", "Collections", "Beginner"], ["TreeMap", "Collections", "Intermediate"], ["PriorityQueue", "Collections", "Intermediate"], ["ArrayDeque", "Collections", "Intermediate"], ["equals and hashCode", "Collections", "Intermediate"], ["Comparable and Comparator", "Collections", "Intermediate"], ["Generics", "Generics", "Intermediate"], ["Wildcards and PECS", "Generics", "Intermediate"], ["Type erasure", "Generics", "Senior"], ["Checked exceptions", "Exceptions", "Beginner"], ["Unchecked exceptions", "Exceptions", "Beginner"], ["try-with-resources", "Exceptions", "Intermediate"], ["Custom exceptions", "Exceptions", "Intermediate"], ["Lambda expressions", "Java 8+", "Intermediate"], ["Functional interfaces", "Java 8+", "Intermediate"], ["Stream pipelines", "Java 8+", "Intermediate"], ["Collectors", "Java 8+", "Intermediate"], ["Optional", "Java 8+", "Intermediate"], ["Date and time API", "Java 8+", "Beginner"], ["Modules", "Java 9+", "Senior"], ["Files and Paths", "I/O", "Intermediate"], ["Serialization boundaries", "I/O", "Senior"], ["Threads", "Concurrency", "Intermediate"], ["Executors", "Concurrency", "Intermediate"], ["synchronized and locks", "Concurrency", "Senior"], ["Atomics and CAS", "Concurrency", "Senior"], ["CompletableFuture", "Concurrency", "Senior"], ["Virtual threads", "Java 21", "Senior"], ["JDBC basics", "Data", "Intermediate"], ["PreparedStatement", "Data", "Intermediate"], ["Transactions", "Data", "Senior"], ["Indexes and query plans", "Data", "Senior"], ["Spring IoC", "Spring", "Beginner"], ["Spring beans", "Spring", "Beginner"], ["Spring profiles", "Spring", "Intermediate"], ["Spring MVC", "Spring", "Intermediate"], ["Spring validation", "Spring", "Intermediate"], ["Spring Security", "Spring", "Senior"], ["Spring Data JPA", "Spring Boot", "Intermediate"], ["Spring Boot configuration", "Spring Boot", "Beginner"], ["Actuator and observability", "Spring Boot", "Senior"], ["Resilience patterns", "Spring Boot", "Senior"], ["Testing Spring applications", "Spring Boot", "Intermediate"], ["Class loading", "JVM", "Senior"], ["Heap and stack", "JVM", "Intermediate"], ["Garbage collection", "JVM", "Senior"], ["JFR diagnostics", "JVM", "Senior"], ["JIT compilation", "JVM", "Senior"], ["Memory leaks", "JVM", "Senior"], ["Assertions", "Testing", "Beginner"], ["JUnit test design", "Testing", "Beginner"], ["Mocks and stubs", "Testing", "Intermediate"], ["Property-based testing", "Testing", "Senior"], ["Testcontainers", "Testing", "Senior"], ["SOLID principles", "Design", "Intermediate"], ["Builder pattern", "Design", "Intermediate"], ["Factory pattern", "Design", "Intermediate"], ["Strategy pattern", "Design", "Intermediate"], ["Observer pattern", "Design", "Intermediate"], ["Decorator pattern", "Design", "Intermediate"], ["Dependency inversion", "Design", "Senior"], ["REST resource design", "Architecture", "Intermediate"], ["Idempotency", "Architecture", "Senior"], ["Timeouts and retries", "Architecture", "Senior"], ["Circuit breakers", "Architecture", "Senior"], ["Event-driven design", "Architecture", "Senior"], ["Big-O reasoning", "Algorithms", "Beginner"], ["Two pointers", "Algorithms", "Beginner"], ["Sliding window", "Algorithms", "Intermediate"], ["Binary search", "Algorithms", "Beginner"], ["Recursion", "Algorithms", "Beginner"], ["Dynamic programming", "Algorithms", "Intermediate"], ["Graph traversal", "Algorithms", "Intermediate"], ["Topological sorting", "Algorithms", "Senior"], ["Union-find", "Algorithms", "Senior"], ["Range queries", "Algorithms", "Senior"],
];

// Individually authored flagship chapters. The long tail keeps scalable coverage,
// while these high-value topics receive hand-written explanations and runnable examples.
export const JAVA_EDITORIAL_CHAPTERS = {
  "HashMap": {
    walkthrough: "HashMap is a bucketed index: hash the key, choose a bucket, then use equals to distinguish collisions. The contract fails when a key's fields change after insertion.",
    example: "record UserId(String value) {}\nvar orders = new HashMap<UserId, String>();\norders.put(new UserId(\"u-7\"), \"paid\");\nSystem.out.println(orders.get(new UserId(\"u-7\"))); // paid",
    output: "paid",
    diagram: "key.hashCode() → bucket index → equals() collision check → value",
    benchmark: "Compare HashMap and a linear scan at 1k/100k/1M keys; report lookup p95 and resize allocations.",
    mistakes: "Mutable keys, inconsistent equals/hashCode, assuming insertion order, and using HashMap for shared concurrent mutation.",
  },
  "Generics": {
    walkthrough: "Generics move type checks to compilation. Read List<? extends Number> as a producer and List<? super Integer> as a consumer; the wildcard is a boundary, not decoration.",
    example: "static double sum(List<? extends Number> values) {\n  return values.stream().mapToDouble(Number::doubleValue).sum();\n}",
    output: "A List<Integer> and List<Double> can both be summed without casts.",
    diagram: "type parameter → compiler check → erased bytecode → safe API boundary",
    benchmark: "Compare a generic collection API with a raw-type version using compiler warnings and allocation profiles.",
    mistakes: "Using raw types, confusing extends/super, and expecting runtime access to T after type erasure.",
  },
  "Stream pipelines": {
    walkthrough: "A stream is a lazy pipeline: intermediate operations describe work, and a terminal operation triggers it. Keep state out of lambdas and choose a collector that preserves the required ordering and grouping semantics.",
    example: "var totals = orders.stream()\n    .filter(Order::isPaid)\n    .collect(Collectors.groupingBy(Order::customerId, Collectors.summingInt(Order::amount)));",
    output: "A Map<CustomerId, Integer> containing paid totals.",
    diagram: "source → filter/map → grouping/reduction → terminal result",
    benchmark: "Use JMH to compare a stream and loop on realistic data; include allocation and parallel-stream overhead.",
    mistakes: "Reusing a consumed stream, side effects in map/peek, accidental quadratic work, and parallelizing tiny workloads.",
  },
  "Executors": {
    walkthrough: "ExecutorService separates task submission from thread ownership. A production pool needs bounded capacity, a rejection policy, deadlines, and an explicit shutdown owner.",
    example: "try (var pool = Executors.newFixedThreadPool(4)) {\n  var future = pool.submit(() -> inventory.reserve(42));\n  System.out.println(future.get(300, MILLISECONDS));\n}",
    output: "A bounded task completes or fails within the caller's deadline.",
    diagram: "caller → bounded queue → worker pool → result/deadline",
    benchmark: "Load 1/4/16/64 workers and record throughput, queue age, rejection count, and tail latency.",
    mistakes: "Creating pools per request, unbounded queues, swallowed exceptions, and forgetting shutdown/cancellation.",
  },
  "Virtual threads": {
    walkthrough: "Virtual threads make blocking I/O cheap by parking the task rather than dedicating an OS thread. They do not make CPU work faster or remove downstream limits.",
    example: "try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n  var future = executor.submit(() -> httpClient.send(request));\n  System.out.println(future.get());\n}",
    output: "Many concurrent blocking tasks with modest platform-thread usage.",
    diagram: "many virtual tasks → carrier threads → blocking I/O parks task → resume",
    benchmark: "Compare platform and virtual threads under blocking I/O; watch pinning, connection pools, CPU, and downstream saturation.",
    mistakes: "Using virtual threads for CPU saturation, retaining ThreadLocal state, or ignoring connection-pool limits.",
  },
  "Spring IoC": {
    walkthrough: "Spring IoC makes object construction a container responsibility. Constructor injection exposes required collaborators and lets a test build the service without reflection or hidden global state.",
    example: "@Service\nfinal class BillingService {\n  private final PaymentPort payments;\n  BillingService(PaymentPort payments) { this.payments = payments; }\n}",
    output: "The service has a complete dependency graph before its first method call.",
    diagram: "configuration → ApplicationContext → constructor injection → proxied bean",
    benchmark: "Measure startup and bean creation in a representative context; remove accidental component scanning before tuning.",
    mistakes: "Field injection, circular dependencies, stateful singletons, and assuming annotations apply to self-invocation.",
  },
  "Spring Security": {
    walkthrough: "Secure an API in layers: authenticate at the filter boundary, authorize the action, and enforce resource ownership inside the service. A role check alone does not prove tenant access.",
    example: "@PreAuthorize(\"@ownership.canEdit(authentication, #orderId)\")\npublic void cancel(UUID orderId) { /* domain rule */ }",
    output: "An authenticated user can act only on resources they are allowed to change.",
    diagram: "request → authentication → authorization → ownership check → domain action",
    benchmark: "Exercise missing, expired, malformed, and cross-tenant credentials; measure security-filter latency and audit completeness.",
    mistakes: "Trusting client roles, leaking authorization details, missing object-level checks, and logging tokens.",
  },
  "Transactions": {
    walkthrough: "A transaction protects one local consistency boundary. Put it around the service use case, keep it short, and remember that an HTTP call or message publish is outside the database transaction.",
    example: "@Transactional\npublic OrderId place(OrderCommand command) {\n  var order = orders.save(Order.create(command));\n  outbox.save(OrderPlaced.from(order));\n  return order.id();\n}",
    output: "The order and its outbox event commit atomically in one database transaction.",
    diagram: "service use case → DB transaction → domain row + outbox row → async delivery",
    benchmark: "Measure lock time, commit latency, deadlocks, and retry rate under concurrent writes.",
    mistakes: "Remote calls inside long transactions, self-invocation bypassing proxies, and assuming rollback undoes external side effects.",
  },
  "Spring Data JPA": {
    walkthrough: "JPA maps an object graph to SQL, but the persistence context and fetch plan determine the real cost. Start with the query shape, not the entity diagram.",
    example: "@Query(\"select o from Order o join fetch o.lines where o.id = :id\")\nOptional<Order> findWithLines(UUID id);",
    output: "One deliberate query loads the order and required lines instead of an accidental N+1 sequence.",
    diagram: "repository method → JPQL/SQL → persistence context → mapped aggregate",
    benchmark: "Assert query counts and compare cold/warm p95 latency for lazy, fetch-join, and projection variants.",
    mistakes: "Open-session-in-view dependency, unbounded entity graphs, N+1 queries, and exposing entities directly as API payloads.",
  },
  "Garbage collection": {
    walkthrough: "GC reclaims unreachable objects; it cannot fix unbounded retention. Diagnose allocation rate, live set, pause distribution, and heap dumps before changing collector flags.",
    example: "-Xms512m -Xmx512m -Xlog:gc*:file=gc.log:time,uptime,level,tags",
    output: "A GC log you can correlate with endpoint latency and allocation bursts.",
    diagram: "allocation → young collection → promotion/old collection → reclaimed live set",
    benchmark: "Use JFR and GC logs to compare allocation reduction versus heap/collector tuning under the same load.",
    mistakes: "Tuning from heap percentage alone, hiding leaks with a larger heap, and ignoring post-GC live-set growth.",
  },
  "Microservices Design Patterns": {
    walkthrough: "Microservice patterns are boundary decisions: ownership, communication, consistency, and failure handling. Choose distribution only when independent scaling or ownership repays its operational cost.",
    example: "Order service → transactional outbox → broker → Inventory/Payment consumers (idempotent handlers)",
    output: "A workflow that remains observable and recoverable when one service or message delivery fails.",
    diagram: "bounded context → contract → local transaction → event/retry/compensation",
    benchmark: "Test failure injection, duplicate delivery, lag, and recovery time—not only the happy-path request latency.",
    mistakes: "Shared databases, synchronous chains without deadlines, distributed transactions by hope, and extracting services before ownership is clear.",
  },
};

function buildTutorialEditorialContent(title, category, level) {
  const lower = title.toLowerCase();
  const family = category === "Collections"
    ? { walkthrough: `Trace one insertion, lookup, and mutation for ${title}; then compare the operation's contract with the collection's ordering and equality rules.`, example: `var values = new java.util.ArrayList<String>();\nvalues.add("${title}");\nSystem.out.println(values);`, diagram: "input → hash/order rule → collection state → lookup result", benchmark: "Measure lookup/insertion under 10, 1k, and 1M elements; record allocation and p95 latency." }
    : category === "Concurrency"
      ? { walkthrough: `Model ${title} as a shared-state problem: name the invariant, identify the happens-before edge, and stress the smallest critical section.`, example: `var executor = java.util.concurrent.Executors.newFixedThreadPool(2);\nexecutor.submit(() -> System.out.println("${title}"));\nexecutor.shutdown();`, diagram: "producer → handoff/synchronization → worker → visible result", benchmark: "Run a contention test with 1, 2, 8, and 32 workers; track throughput, queue age, and CPU." }
      : category === "Spring" || category === "Spring Boot"
        ? { walkthrough: `Start at the HTTP or application boundary for ${title}, follow dependency injection into the service, and identify the transaction, validation, and observability boundary.`, example: `@Service\nclass ExampleService {\n  void apply() { /* ${title} */ }\n}`, diagram: "request → controller → service boundary → repository/dependency", benchmark: "Load-test normal and dependency-slow paths; compare p50/p95 latency, error rate, and database calls." }
        : category === "JVM"
          ? { walkthrough: `Use a small Java program to observe ${title}, then verify the claim with JFR, GC logs, a heap histogram, or a class-loading trace instead of intuition.`, example: `public static void main(String[] args) {\n  System.out.println("Observe: ${title}");\n}`, diagram: "source → bytecode → runtime/JIT/GC → observable behavior", benchmark: "Warm up before measuring; compare allocation rate, pause time, CPU, and steady-state latency." }
          : category === "Algorithms"
            ? { walkthrough: `Write the invariant for ${title} before coding, trace it on an empty input and an adversarial input, then state time and space complexity.`, example: `for (int left = 0; left < input.length; left++) {\n  // maintain the ${title} invariant\n}`, diagram: "input constraints → invariant → state transition → answer", benchmark: "Use inputs at 10², 10⁴, and 10⁶ scale; verify both complexity and allocation behavior." }
            : category === "Testing"
              ? { walkthrough: `For ${title}, separate the behavior under test from collaborators, assert the observable contract, and include one regression case for the most likely failure.`, example: `@Test\nvoid ${lower.replace(/[^a-z0-9]+/g, "_")}() {\n  // arrange → act → assert\n}`, diagram: "fixture → action → observable result → regression protection", benchmark: "Track test runtime, flake rate, mutation score, and whether the test fails for the intended defect." }
              : category === "Architecture" || category === "Data"
                ? { walkthrough: `Draw the boundary for ${title}, identify ownership and failure behavior, then decide what must be synchronous, durable, idempotent, or eventually consistent.`, example: `interface ${title.replace(/[^A-Za-z0-9]/g, "")}Port {\n  Result execute(Command command);\n}`, diagram: "caller → contract/boundary → owner → durable or observable outcome", benchmark: "Measure correctness under retries and dependency failure, not only the happy-path response time." }
                : { walkthrough: `Explain ${title} from first principles, trace a minimal example line by line, then change one input to reveal the edge case that the abstraction protects.`, example: `// ${title}\nString result = "trace the state";\nSystem.out.println(result);`, diagram: "input → rule → state change → output", benchmark: "Compare a small, readable implementation with the naive alternative using representative inputs." };
  return {
    ...family,
    explanation: `${family.walkthrough} This ${level.toLowerCase()} chapter treats ${title} as a concrete decision, not a vocabulary word.`,
    mistakes: `Avoid the ${title} trap of copying a happy-path snippet without checking ownership, failure behavior, compatibility, and measurable cost.`,
    interviewAnswer: `A strong answer defines ${title}, demonstrates the chapter example, explains the invariant or boundary, names when not to use it, and closes with the benchmark signal that would change the decision.`,
    productionNote: `Ship ${title} with a bounded resource policy, useful logs/metrics, a test for the failure path, and a documented compatibility assumption.`,
    exercise: `Implement the example for ${title}, add an adversarial case, and explain the diagram and benchmark result in a 90-second review.`,
  };
}

export const JAVA_TUTORIAL_CATALOG = JAVA_CATALOG_SEEDS.map(([title, category, level], index) => ({
  id: `catalog-${index + 1}`,
  title,
  category,
  level,
  summary: `${title} explained with the smallest useful mental model, a Java/Spring usage boundary, and a production-aware example.`,
  memoryHook: `Remember ${title} by asking: what problem does it solve, what promise does it make, and what mistake does it prevent?`,
  practice: `Write one small ${title} example, test its happy path and one failure case, then explain the trade-off aloud.`,
  ...buildTutorialEditorialContent(title, category, level),
  ...(JAVA_EDITORIAL_CHAPTERS[title] || {}),
  howToThink: `Ask which problem ${title} removes, which invariant must remain true, and what evidence would show that the choice is working under realistic load.`,
  author: "InterviewIQ Java Editorial Team",
  reviewedAt: "2026-08-27",
  javaVersions: category === "Modern Java" || category === "Java 21" ? "17–21" : "8+",
  relatedTopics: JAVA_CATALOG_SEEDS.filter(([relatedTitle, relatedCategory]) => relatedCategory === category && title !== relatedTitle).slice(0, 3).map(([relatedTitle]) => relatedTitle),
  editorialStatus: JAVA_EDITORIAL_CHAPTERS[title] ? "curated" : "topic-aware",
}));

export function slugifyJavaTutorial(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getJavaTutorialBySlug(slug) {
  return JAVA_TUTORIAL_CATALOG.find((tutorial) => slugifyJavaTutorial(tutorial.title) === String(slug || "").toLowerCase()) || null;
}

export const JAVA_VERSION_TOPIC_GUIDE = [
  { version: "Java 8", topics: "lambdas, functional interfaces, streams, Optional, java.time", focus: "expressive data transformations and safer date handling" },
  { version: "Java 9", topics: "modules, collection factories, private interface methods", focus: "stronger boundaries and smaller runtime images" },
  { version: "Java 10–11", topics: "var, new String/File APIs, HTTP Client", focus: "less ceremony without losing readable types" },
  { version: "Java 12–16", topics: "switch expressions, text blocks, records preview", focus: "clearer expressions and data carriers" },
  { version: "Java 17", topics: "sealed classes, records, pattern matching", focus: "explicit domain hierarchies and modern modeling" },
  { version: "Java 18–20", topics: "UTF-8 default, pattern matching, virtual-thread previews", focus: "incremental language and runtime improvements" },
  { version: "Java 21", topics: "virtual threads, sequenced collections, record patterns", focus: "high-concurrency services and concise pattern matching" },
  { version: "Java 22+", topics: "current language/runtime evolution", focus: "verify release notes and preview status before production use" },
];

export const JAVA_PROGRAM_EXAMPLES = [
  "Reverse a string", "Count character frequency", "Remove duplicates while preserving order", "Sort employees by multiple fields", "Implement a bounded queue", "Build an LRU cache", "Validate balanced brackets", "Merge overlapping intervals", "Find top-K elements", "Implement binary search", "Traverse a tree", "Find a shortest graph path", "Read and summarize a file", "Parse CSV safely", "Call a REST endpoint", "Persist with JDBC", "Build a Spring REST endpoint", "Write a transaction test", "Add retry with backoff", "Measure a concurrent counter", "Implement a custom immutable value", "Build a generic copy utility", "Create a command-line argument parser", "Group records with streams", "Implement pagination", "Map validation errors", "Write a Spring profile configuration", "Secure an endpoint by role", "Detect an N+1 query", "Add a health indicator", "Implement a circuit breaker policy", "Design an idempotency key store", "Capture a thread dump", "Compare GC logs", "Benchmark a hot method", "Write a parameterized JUnit test", "Stub an external gateway", "Use Testcontainers for a database", "Implement a trie", "Find connected components", "Topologically order tasks",
].map((title, index) => ({ id: `program-${index + 1}`, title, level: index < 4 ? "Beginner" : index < 12 ? "Intermediate" : "Intermediate → Senior", prompt: `Implement ${title} in Java, explain the invariant, state time and space complexity, and add at least three edge-case tests.` }));

export const JAVA_QUIZ_BANK = JAVA_TUTORIAL_CATALOG.slice(0, 48).map((topic, index) => ({ id: `quiz-${index + 1}`, topic: topic.title, question: `What is the main problem solved by ${topic.title}, and what is one situation where you would avoid it?`, answer: `${topic.title} is useful only when its stated contract matches the problem; explain the input assumptions, output guarantee, and trade-off before choosing it.` }));

export const JAVA_DIGEST_ARTICLES = [
  {
    id: "senior-java-contracts",
    trackId: "core-java",
    collection: "senior-refresher",
    title: "Senior Java: Contracts, Value Types, and Boundaries",
    level: "Senior",
    readMinutes: 8,
    format: "Refresher",
    summary: "Use types to make invalid states harder to represent, keep values immutable, and make failure semantics explicit at service boundaries.",
    learn: [
      "Choose records for transparent immutable values and classes when lifecycle or identity matters.",
      "Validate at boundaries so downstream code receives valid domain values.",
      "Apply PECS and Optional deliberately at API boundaries without leaking implementation details.",
    ],
    questions: [
      "When would you choose a record over a class?",
      "How does PECS make a public API more flexible?",
      "When is Optional the wrong modeling choice?",
    ],
  },
  {
    id: "java-21-virtual-threads",
    trackId: "concurrency",
    collection: "senior-refresher",
    title: "Java 21: Virtual Threads and Structured Concurrency",
    level: "Senior",
    readMinutes: 10,
    format: "Java 21",
    summary: "Use virtual threads for high-concurrency blocking I/O after checking downstream capacity; treat structured concurrency as a preview API in Java 21.",
    learn: [
      "Separate I/O wait scalability from CPU-bound throughput and downstream capacity limits.",
      "Define request deadlines, cancellation, and load-test criteria before changing an execution model.",
      "Confirm build and runtime support before using preview APIs such as StructuredTaskScope in Java 21.",
    ],
    questions: [
      "Where do virtual threads help, and where do they not?",
      "How can virtual threads reveal a database bottleneck?",
      "What changes when a structured-concurrency API is preview?",
    ],
  },
  {
    id: "jvm-evidence-led-diagnostics",
    trackId: "core-java",
    collection: "senior-refresher",
    title: "JVM Diagnostics: Memory, GC, and Evidence",
    level: "Senior",
    readMinutes: 9,
    format: "Production Debugging",
    summary: "Investigate heap, allocation, pauses, threads, CPU, and latency together; tune only after collecting runtime evidence.",
    learn: [
      "Distinguish retention leaks, allocation pressure, resource leaks, and ordinary heap growth.",
      "Use JFR, heap histograms, dominator trees, and request telemetry to find a retaining path.",
      "Change one JVM or lifecycle variable at a time and validate with a controlled soak or load test.",
    ],
    questions: [
      "How do you investigate a suspected memory leak?",
      "Why is a rising heap not enough evidence of a leak?",
      "Which signals would you correlate with a p99 latency increase?",
    ],
  },
  {
    id: "concurrency-ownership-cancellation",
    trackId: "concurrency",
    collection: "senior-refresher",
    title: "Concurrency: Ownership, Happens-Before, and Cancellation",
    level: "Senior",
    readMinutes: 11,
    format: "Deep Dive",
    summary: "Design around ownership, immutable messages, and task lifecycles; establish visibility deliberately and make cancellation cooperative.",
    learn: [
      "Name the shared-state invariant and the happens-before relationship that protects it.",
      "Use locks for multi-field invariants and atomics for small independent updates, then test under contention.",
      "Propagate deadlines, preserve interrupt status, close owned resources, and avoid sleep-based concurrency tests.",
    ],
    questions: [
      "Why does volatile not make a read-modify-write sequence atomic?",
      "When is a lock clearer than CAS?",
      "What makes cancellation reliable rather than merely requested?",
    ],
  },
  {
    id: "bounded-concurrent-collections",
    trackId: "concurrency",
    collection: "senior-refresher",
    title: "Concurrent Collections, Queues, and Backpressure",
    level: "Senior",
    readMinutes: 9,
    format: "Systems Practice",
    summary: "Concurrent collections protect their own operations, not a business invariant; bounded queues make overload policy explicit.",
    learn: [
      "Use compute, merge, or putIfAbsent when the map operation must be atomic.",
      "Keep slow or recursive external work out of ConcurrentHashMap callbacks.",
      "Define queue bounds, rejection or deferral policy, deadlines, and depth/age/rejection metrics.",
    ],
    questions: [
      "Why can get followed by put still be incorrect on ConcurrentHashMap?",
      "What should happen when a work queue is full?",
      "Why does a queue move pressure instead of removing it?",
    ],
  },
  {
    id: "stream-collection-boundaries",
    trackId: "core-java",
    collection: "senior-refresher",
    title: "Collections and Streams: Correctness Before Convenience",
    level: "Senior",
    readMinutes: 8,
    format: "Refresher",
    summary: "Choose collections for access, ordering, memory, and concurrency needs; keep stream transformations pure, bounded, and readable.",
    learn: [
      "Keep HashMap keys immutable and define equality, ordering, and cache bounds deliberately.",
      "Avoid remote I/O and external mutation inside stream operations or forEach callbacks.",
      "Prefer an explicit loop when retries, resource ownership, progress, or diagnostics make control flow clearer.",
    ],
    questions: [
      "Why can a HashMap lookup fail after insertion?",
      "When would you avoid streams?",
      "Why is parallelStream not a general performance switch?",
    ],
  },
  {
    id: "hashmap-internals",
    trackId: "core-java",
    title: "HashMap Internals Before an Interview",
    level: "Mid",
    readMinutes: 9,
    format: "Deep Dive",
    summary: "Review hashing, buckets, collisions, resizing, treeification, equals/hashCode contracts, and fail-fast iteration.",
    learn: [
      "Explain how keys move from hashCode to bucket index.",
      "Describe collision handling and why Java 8 introduced tree bins.",
      "Name mutable-key, equals/hashCode, and concurrent-modification traps.",
    ],
    questions: [
      "Why can a mutable key break lookups after insertion?",
      "What happens when many keys land in the same bucket?",
      "Why is HashMap not safe for concurrent writes?",
    ],
  },
  {
    id: "spring-controller-service-repository",
    trackId: "spring-boot",
    title: "Controller, Service, Repository Boundaries",
    level: "Junior-Mid",
    readMinutes: 7,
    format: "Tutorial",
    summary: "Build clean Spring Boot request flow boundaries without letting DTOs, entities, and business rules blur together.",
    learn: [
      "Keep controllers thin and request/response focused.",
      "Put workflow decisions in services and persistence concerns in repositories.",
      "Map validation errors and domain failures without leaking stack traces.",
    ],
    questions: [
      "Where should transaction boundaries live?",
      "When is a service method too large?",
      "Should controllers return entities directly?",
    ],
  },
  {
    id: "executor-service",
    trackId: "concurrency",
    title: "ExecutorService and CompletableFuture",
    level: "Senior",
    readMinutes: 11,
    format: "Interview Drill",
    summary: "Practice async execution, pool sizing, cancellation, exception handling, timeouts, and composition trade-offs.",
    learn: [
      "Choose a pool strategy based on CPU-bound vs I/O-bound work.",
      "Use CompletableFuture composition without blocking every stage.",
      "Explain cancellation, timeout, and exception propagation clearly.",
    ],
    questions: [
      "What can go wrong with an unbounded queue?",
      "When would you prefer allOf over chaining?",
      "How do you avoid thread starvation in async code?",
    ],
  },
  {
    id: "jpa-n-plus-one",
    trackId: "data-sql",
    title: "JPA N+1 Query Debugging",
    level: "Mid-Senior",
    readMinutes: 8,
    format: "Debugging",
    summary: "Spot N+1 queries, reason about fetch joins, entity graphs, pagination limits, and when to write explicit SQL.",
    learn: [
      "Read logs to count query fan-out.",
      "Use fetch joins or entity graphs deliberately.",
      "Explain when ORM convenience hurts performance or correctness.",
    ],
    questions: [
      "Why can fetch joins break pagination?",
      "How would you prove an N+1 issue exists?",
      "When is a projection better than loading entities?",
    ],
  },
  {
    id: "circuit-breaker-retry-timeout",
    trackId: "architecture",
    title: "Timeouts, Retries, and Circuit Breakers",
    level: "Senior",
    readMinutes: 10,
    format: "System Design",
    summary: "Design dependency calls that fail predictably using timeouts, bounded retries, backoff, idempotency, and observability.",
    learn: [
      "Set timeouts based on user SLOs and downstream behavior.",
      "Avoid retry storms with budgets, jitter, and circuit breakers.",
      "Tie resilience decisions to metrics, traces, and alerts.",
    ],
    questions: [
      "When should you not retry?",
      "How does idempotency change retry safety?",
      "What would you graph to detect dependency failure?",
    ],
  },
  {
    id: "java-17-modernization",
    trackId: "core-java",
    title: "Modern Java 17 Interview Checklist",
    level: "Mid",
    readMinutes: 6,
    format: "Checklist",
    summary: "Refresh records, sealed classes, pattern matching, var, streams, optionals, and practical migration talking points.",
    learn: [
      "Use records for immutable data carriers, not domain behavior shortcuts.",
      "Explain sealed classes as a controlled hierarchy tool.",
      "Balance streams with readability and debugging needs.",
    ],
    questions: [
      "When is Optional a poor field type?",
      "What problem do records solve?",
      "How do sealed classes help maintainability?",
    ],
  },
];

export const JAVA_DIGEST_ROADMAPS = [
  {
    id: "java-backend-14-day",
    title: "14-Day Java Backend Interview Sprint",
    audience: "Java/Spring roles",
    days: [
      "Core Java collections, equality, exceptions, and generics",
      "Streams, optionals, records, and modern Java trade-offs",
      "Concurrency fundamentals and executor interview questions",
      "Spring Boot REST, validation, errors, and layering",
      "Transactions, JPA mappings, SQL indexes, and N+1 debugging",
      "Design patterns in backend workflows",
      "Mock round: Java + Spring mixed drill",
    ],
  },
  {
    id: "senior-java-architecture",
    title: "Senior Java Architecture Loop",
    audience: "Senior engineer rounds",
    days: [
      "API contracts, backwards compatibility, and versioning",
      "Timeouts, retries, idempotency, and dependency isolation",
      "Caching, data ownership, CQRS, and consistency trade-offs",
      "Observability, incident response, and rollout strategy",
      "System design mock with Java service implementation details",
    ],
  },
];

export const JAVA_DIGEST_VERSION = "2026.08";

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function buildJavaDigestCompetencySummary({ progress = {}, selectedTrackId = "all" } = {}) {
  const tracks = selectedTrackId === "all"
    ? JAVA_DIGEST_TRACKS
    : JAVA_DIGEST_TRACKS.filter((track) => track.id === selectedTrackId);

  const completedTopics = new Set(Array.isArray(progress.completedTopics) ? progress.completedTopics : []);
  const masteredTopics = new Set(Array.isArray(progress.masteredTopics) ? progress.masteredTopics : []);

  const trackCards = tracks.map((track) => {
    const articles = JAVA_DIGEST_ARTICLES.filter((article) => article.trackId === track.id);
    const completed = articles.filter((article) => completedTopics.has(article.id)).length;
    const mastered = articles.filter((article) => masteredTopics.has(article.id)).length;

    return {
      id: track.id,
      label: track.label,
      completed,
      total: articles.length,
      mastery: percent(mastered, articles.length),
      coverage: percent(completed, articles.length),
    };
  });

  const totalTopics = trackCards.reduce((sum, track) => sum + track.total, 0);
  const totalCompleted = trackCards.reduce((sum, track) => sum + track.completed, 0);
  const averageMastery = trackCards.length
    ? Math.round(trackCards.reduce((sum, track) => sum + track.mastery, 0) / trackCards.length)
    : 0;

  return {
    version: JAVA_DIGEST_VERSION,
    selectedTrackId,
    masteryScore: averageMastery,
    completedTopics: totalCompleted,
    totalTopics,
    competencyTracks: trackCards,
  };
}

export const FRESHER_DSA_PLAYBOOK = {
  framework: [
    "Restate the problem: identify the input, output, allowed operations, and what must be optimized.",
    "Start with a small example and write the expected state after each meaningful step.",
    "Read the constraints before choosing an algorithm; they usually eliminate most approaches.",
    "Name the pattern and invariant in plain language before writing Java code.",
    "Design the Java representation: arrays for bounded numeric data, maps for lookup, queues/stacks for order, and graphs for relationships.",
    "Trace normal, boundary, duplicate, empty, and maximum-size cases; then state time and memory complexity.",
    "Only after the solution works, improve constants, simplify code, and prepare likely interviewer follow-ups.",
  ],
  constraintMap: [
    { limit: "n <= 20", choice: "Complete search, bitmask, or backtracking", reason: "Exponential work can be acceptable when the state space is deliberately small." },
    { limit: "n <= 1,000", choice: "O(n^2), O(n^2 log n), or dynamic programming", reason: "Quadratic tables and pair checks may fit depending on the time limit." },
    { limit: "n <= 100,000", choice: "O(n), O(n log n), or graph traversal", reason: "Prefer sorting, hashing, two pointers, heaps, or linear graph routines." },
    { limit: "n >= 1,000,000", choice: "Near-linear scan with compact memory", reason: "Avoid object-heavy structures, nested loops, and recursion depth risk." },
    { limit: "Many queries or updates", choice: "Prefix sums, Fenwick tree, segment tree, or offline ordering", reason: "Precompute or maintain structure instead of rescanning each range." },
  ],
  patterns: [
    { name: "Hashing", recognize: "Need counts, membership, complements, or first/last occurrence.", approach: "Store the information needed to answer the current item in O(1) expected time.", java: "HashMap, HashSet, or an int frequency array when the value range is bounded.", complexity: "Usually O(n) time and O(n) memory.", starter: "Two Sum, Valid Anagram, Longest Consecutive Sequence", followUp: "What changes if memory is limited or deterministic ordering is required?" },
    { name: "Two Pointers", recognize: "The array is sorted, or a left/right boundary can move without backtracking.", approach: "Move the pointer that can still improve the invariant; prove each pointer moves at most n times.", java: "int left/right indices and long for sums.", complexity: "Usually O(n) after sorting, with O(1) extra space.", starter: "Two Sum II, Remove Duplicates, Container With Most Water", followUp: "Why is moving this pointer safe, and what breaks when the array is unsorted?" },
    { name: "Sliding Window", recognize: "A contiguous range must satisfy a changing condition.", approach: "Expand right, repair the condition from the left, and record the best valid window.", java: "Two indices plus HashMap/HashSet or a frequency array.", complexity: "O(n) when each index enters and leaves once.", starter: "Longest Substring Without Repeating Characters, Minimum Size Subarray Sum", followUp: "Is the condition monotonic enough for a window, or do you need prefix sums?" },
    { name: "Binary Search", recognize: "The answer space or predicate has a false-to-true boundary.", approach: "Define a monotonic feasibility function, then find the first true value.", java: "long low/high and overflow-safe midpoint low + (high - low) / 2.", complexity: "O(log n) predicate calls; total cost depends on the predicate.", starter: "First Bad Version, Search in Rotated Array, Capacity to Ship Packages", followUp: "What are the low/high invariants and why is the predicate monotonic?" },
    { name: "Stack / Monotonic Stack", recognize: "Need nearest greater/smaller values or must undo the most recent unresolved choice.", approach: "Keep unresolved candidates in a stack and remove dominated values once.", java: "ArrayDeque<Integer>; never use Stack for new code.", complexity: "Usually O(n) amortized.", starter: "Valid Parentheses, Daily Temperatures, Largest Rectangle in Histogram", followUp: "What does each stack entry mean, and why can it be discarded permanently?" },
    { name: "Heap / Priority Queue", recognize: "Repeatedly need the smallest/largest available item while data changes.", approach: "Add candidates as they become eligible and remove stale or consumed entries.", java: "PriorityQueue with Comparator.comparingLong or explicit comparators.", complexity: "O(n log k) for a size-k heap in common problems.", starter: "Kth Largest Element, Merge K Sorted Lists, Meeting Rooms II", followUp: "What belongs in the heap, and how do you handle stale entries?" },
    { name: "Greedy", recognize: "A locally best choice can preserve feasibility and an exchange argument can prove it.", approach: "Sort or prioritize choices, state the invariant, and actively search for counterexamples.", java: "Arrays.sort plus a comparator, or PriorityQueue.", complexity: "Often O(n log n) due to sorting.", starter: "Activity Selection, Jump Game, Merge Intervals", followUp: "Give an exchange argument or explain why DP is required instead." },
    { name: "Dynamic Programming", recognize: "Subproblems repeat and the answer can be expressed by a small state.", approach: "Define state, base case, transition, iteration order, and final answer before coding.", java: "Primitive arrays with a sentinel; use long for counts and sums.", complexity: "Number of states multiplied by transitions, with possible space compression.", starter: "Climbing Stairs, House Robber, Coin Change, Longest Increasing Subsequence", followUp: "Can the state be reduced, and what changes if values are negative or unbounded?" },
    { name: "BFS / DFS", recognize: "Need reachability, layers, components, cycles, or a path in a graph/grid.", approach: "Choose BFS for shortest unweighted distance and DFS for exploration or postorder reasoning.", java: "ArrayDeque for BFS/iterative DFS and boolean[] visited.", complexity: "O(V + E) with adjacency lists.", starter: "Number of Islands, Clone Graph, Course Schedule", followUp: "What is the graph representation and how do you reconstruct the path?" },
    { name: "Prefix Sum / Range Structure", recognize: "Many range queries or updates would repeatedly scan the same values.", approach: "Precompute static information or maintain a structure that merges intervals.", java: "long[] prefix, Fenwick tree, or iterative segment tree.", complexity: "O(1), O(log n), or O(log n) per query depending on structure.", starter: "Range Sum Query, Subarray Sum Equals K, Dynamic Range Sum", followUp: "Which operation is associative, and are updates point-based or range-based?" },
  ],
  edgeCases: [
    "Empty input, one element, and the smallest valid target.",
    "All values equal, all values negative, duplicates, and already sorted or reverse-sorted input.",
    "Integer overflow, long sums, negative values, zero, and impossible answers.",
    "Disconnected graphs, self-loops, cycles, repeated edges, and unreachable nodes.",
    "Window boundaries, inclusive versus exclusive indices, and off-by-one transitions.",
    "Maximum constraints, recursion depth, memory allocation, and slow input/output.",
  ],
  debugging: [
    "Compile early and keep the first implementation small.",
    "Print or inspect the invariant state on the smallest failing example, not the whole program.",
    "Compare brute force against the optimized solution on random tiny inputs.",
    "Check index movement, update order, stale heap entries, and visited-state timing.",
    "Remove debugging output, rerun boundary cases, then state why the fix preserves correctness.",
  ],
  practiceLadder: [
    { level: "Level 1 · Foundations", goal: "Build confidence with direct scans and maps.", problems: "Two Sum · Valid Anagram · Best Time to Buy and Sell Stock · Valid Parentheses" },
    { level: "Level 2 · Linear Patterns", goal: "Learn pointer movement and window invariants.", problems: "Two Sum II · Longest Substring Without Repeating Characters · Product Except Self · Daily Temperatures" },
    { level: "Level 3 · Search and Greedy", goal: "Translate constraints into predicates and proofs.", problems: "Binary Search · Search in Rotated Array · Merge Intervals · Jump Game · Koko Eating Bananas" },
    { level: "Level 4 · Recursion and DP", goal: "Define states and transitions without memorizing code.", problems: "Subsets · Combination Sum · House Robber · Coin Change · Word Break" },
    { level: "Level 5 · Graphs and Ranges", goal: "Model relationships and repeated queries efficiently.", problems: "Number of Islands · Course Schedule · Clone Graph · Network Delay Time · Range Sum Query" },
    { level: "Level 6 · Interview Simulation", goal: "Solve unfamiliar problems with a 35-minute explanation and follow-ups.", problems: "One timed problem per pattern, followed by a brute-force comparison, complexity proof, and one constraint variation." },
  ],
};

export const CSES_JAVA_PARTS = [
  {
    id: "basic-techniques",
    part: "I",
    title: "Basic Techniques",
    summary: "The Java contest toolkit: fast I/O, complexity, sorting, data structures, search, greedy, DP, amortized analysis, range queries, and bit operations.",
    chapters: [
      {
        id: "introduction-java",
        chapter: 1,
        title: "Introduction",
        sections: ["Programming language setup", "Input and output", "Working with numbers", "Math helpers", "Contest routine"],
        javaDrills: ["FastScanner with BufferedInputStream", "StringBuilder output batching", "long-first arithmetic", "gcd/lcm/modPow utilities"],
        templateFocus: "Reusable Main class, FastScanner, modular helpers, and overflow-safe arithmetic.",
        complexityCheckpoint: "Before coding, map input limits to the largest acceptable complexity.",
      },
      {
        id: "time-complexity-java",
        chapter: 2,
        title: "Time Complexity",
        sections: ["Calculation rules", "Complexity classes", "Estimating efficiency", "Maximum subarray sum"],
        javaDrills: ["Constraint-to-complexity table", "Kadane with long sums", "Nested-loop simplification", "recursion depth risk checks"],
        templateFocus: "Method comments that state n, complexity, and memory before implementation.",
        complexityCheckpoint: "Explain why O(n log n) fits but O(n^2) fails for 2e5 input.",
      },
      {
        id: "sorting-java",
        chapter: 3,
        title: "Sorting",
        sections: ["Sorting theory", "Java sorting APIs", "Binary search", "Binary search on answer"],
        javaDrills: ["Arrays.sort for primitives", "Comparator.comparing without subtraction", "lower_bound style loop", "feasibility predicate design"],
        templateFocus: "Overflow-safe comparator plus first-true binary search template.",
        complexityCheckpoint: "Know when sorting changes a problem from quadratic scanning to linear/two-pointer scanning.",
      },
      {
        id: "data-structures-java",
        chapter: 4,
        title: "Data Structures",
        sections: ["Dynamic arrays", "Set structures", "Map structures", "Iterators and ranges", "Priority queues"],
        javaDrills: ["ArrayList vs int[]", "HashSet/TreeSet choice", "HashMap frequency table", "PriorityQueue min/max heap", "ArrayDeque for stack/queue"],
        templateFocus: "Frequency map, TreeMap navigation, heap of int[] pairs, and deque-based stack.",
        complexityCheckpoint: "State expected vs worst-case lookup and why ordered maps cost O(log n).",
      },
      {
        id: "complete-search-java",
        chapter: 5,
        title: "Complete Search",
        sections: ["Generating subsets", "Generating permutations", "Backtracking", "Pruning", "Meet in the middle"],
        javaDrills: ["bitmask subset loop", "boolean[] used permutation", "recursive backtracking with undo", "split-and-combine sums"],
        templateFocus: "Backtracking skeleton with choose, recurse, unchoose, and pruning guard.",
        complexityCheckpoint: "Turn 2^40 into 2 * 2^20 using meet-in-the-middle.",
      },
      {
        id: "greedy-java",
        chapter: 6,
        title: "Greedy Algorithms",
        sections: ["Coin-style choices", "Scheduling", "Tasks and deadlines", "Minimizing sums", "Compression intuition"],
        javaDrills: ["sort by ending time", "exchange argument narration", "PriorityQueue for local optimum", "counterexample hunting"],
        templateFocus: "Sort events by comparator, sweep once, and maintain the greedy invariant.",
        complexityCheckpoint: "Defend the greedy choice; do not just say it feels optimal.",
      },
      {
        id: "dynamic-programming-java",
        chapter: 7,
        title: "Dynamic Programming",
        sections: ["Coin problem", "LIS", "Grid paths", "Knapsack", "Edit distance", "Counting tilings"],
        javaDrills: ["state-transition-base-answer format", "memo arrays with sentinel", "iterative tabulation", "space compression"],
        templateFocus: "dp[state] definition before code, then transition loops in Java arrays.",
        complexityCheckpoint: "Show how state count times transition cost gives total complexity.",
      },
      {
        id: "amortized-analysis-java",
        chapter: 8,
        title: "Amortized Analysis",
        sections: ["Two pointers", "Nearest smaller elements", "Sliding window minimum"],
        javaDrills: ["left/right pointer invariant", "monotonic stack", "monotonic deque", "each index enters and leaves once proof"],
        templateFocus: "ArrayDeque<Integer> templates for monotonic stack and sliding window.",
        complexityCheckpoint: "Explain why nested-looking pointer movement is still O(n).",
      },
      {
        id: "range-queries-java",
        chapter: 9,
        title: "Range Queries",
        sections: ["Static queries", "Fenwick tree", "Segment tree", "Sparse table basics"],
        javaDrills: ["prefix sums", "Fenwick point update/range sum", "iterative segment tree", "min/max associative merge"],
        templateFocus: "Fenwick and segment tree classes using one-based and iterative indexing.",
        complexityCheckpoint: "Choose prefix sum, Fenwick, segment tree, or sparse table from update/query requirements.",
      },
      {
        id: "bit-manipulation-java",
        chapter: 10,
        title: "Bit Manipulation",
        sections: ["Representation", "Bit operations", "Representing sets", "Bit optimizations", "Bitmask DP"],
        javaDrills: ["1L shifts", "mask subset iteration", "Integer.bitCount", "lowbit", "visited masks"],
        templateFocus: "long masks for up to 63 bits and int masks for compact DP states.",
        complexityCheckpoint: "Know the n threshold where 2^n subset DP is realistic.",
      },
    ],
  },
  {
    id: "graph-algorithms",
    part: "II",
    title: "Graph Algorithms",
    summary: "Graph representations, traversals, shortest paths, trees, spanning trees, directed graphs, strong connectivity, tree queries, paths, circuits, flows, and cuts in Java.",
    chapters: [
      {
        id: "graph-basics-java",
        chapter: 11,
        title: "Basics of Graphs",
        sections: ["Terminology", "Representation", "Adjacency lists", "Weighted edges"],
        javaDrills: ["ArrayList<Integer>[]", "ArrayList<int[]>[]", "edge list arrays", "0-based vs 1-based normalization"],
        templateFocus: "Graph builder helpers for directed, undirected, and weighted graphs.",
        complexityCheckpoint: "Traversal is O(V + E) only when adjacency representation is chosen correctly.",
      },
      {
        id: "graph-traversal-java",
        chapter: 12,
        title: "Graph Traversal",
        sections: ["DFS", "BFS", "Connected components", "Bipartite check"],
        javaDrills: ["iterative DFS", "ArrayDeque BFS", "visited/component arrays", "parent reconstruction"],
        templateFocus: "Queue BFS and iterative stack DFS to avoid Java stack overflow on large inputs.",
        complexityCheckpoint: "Each vertex and edge should be processed a constant number of times.",
      },
      {
        id: "shortest-paths-java",
        chapter: 13,
        title: "Shortest Paths",
        sections: ["Bellman-Ford", "Dijkstra", "Floyd-Warshall"],
        javaDrills: ["PriorityQueue<long[]>", "stale state skip", "negative edge detection", "all-pairs matrix"],
        templateFocus: "Dijkstra with long distances and stale priority queue entry guard.",
        complexityCheckpoint: "Pick BFS, Dijkstra, Bellman-Ford, or Floyd-Warshall from weights and graph size.",
      },
      {
        id: "tree-algorithms-java",
        chapter: 14,
        title: "Tree Algorithms",
        sections: ["Tree traversal", "Diameter", "Longest paths", "Binary trees"],
        javaDrills: ["two BFS diameter", "tree DP", "parent/depth arrays", "postorder accumulation"],
        templateFocus: "Tree adjacency plus parent-aware DFS/BFS templates.",
        complexityCheckpoint: "Trees have n - 1 edges, so most full-tree routines should be O(n).",
      },
      {
        id: "spanning-trees-java",
        chapter: 15,
        title: "Spanning Trees",
        sections: ["Kruskal", "Union-find", "Prim"],
        javaDrills: ["DSU path compression", "union by size", "sort edge list", "PriorityQueue Prim"],
        templateFocus: "DSU class and Kruskal MST template.",
        complexityCheckpoint: "Kruskal is dominated by sorting edges: O(E log E).",
      },
      {
        id: "directed-graphs-java",
        chapter: 16,
        title: "Directed Graphs",
        sections: ["Topological sorting", "DAG DP", "Successor paths", "Cycle detection"],
        javaDrills: ["Kahn's algorithm", "DFS color states", "DP over topo order", "binary lifting successors"],
        templateFocus: "Indegree queue for topological order and cycle detection.",
        complexityCheckpoint: "Topo-based DP only works on DAGs; first prove or detect acyclicity.",
      },
      {
        id: "strong-connectivity-java",
        chapter: 17,
        title: "Strong Connectivity",
        sections: ["Kosaraju", "SCC condensation", "2SAT model"],
        javaDrills: ["reverse graph", "finish order", "component ids", "implication graph basics"],
        templateFocus: "Kosaraju with iterative traversal for large directed graphs.",
        complexityCheckpoint: "SCC algorithms are linear in vertices plus edges.",
      },
      {
        id: "tree-queries-java",
        chapter: 18,
        title: "Tree Queries",
        sections: ["Ancestors", "Subtrees and paths", "Lowest common ancestor", "Offline ideas"],
        javaDrills: ["binary lifting table", "Euler tin/tout", "subtree range mapping", "path query decomposition"],
        templateFocus: "LCA preprocessing with up[k][v], depth, tin, and tout arrays.",
        complexityCheckpoint: "Preprocess once, then answer each LCA query in O(log n).",
      },
      {
        id: "paths-circuits-java",
        chapter: 19,
        title: "Paths and Circuits",
        sections: ["Eulerian paths", "Hamiltonian paths", "De Bruijn sequences", "Knight's tours"],
        javaDrills: ["degree conditions", "Hierholzer stack", "bitmask Hamiltonian DP", "backtracking with pruning"],
        templateFocus: "Euler path construction and DP over subsets for Hamiltonian variants.",
        complexityCheckpoint: "Euler is linear; Hamiltonian is usually exponential.",
      },
      {
        id: "flows-cuts-java",
        chapter: 20,
        title: "Flows and Cuts",
        sections: ["Ford-Fulkerson", "Disjoint paths", "Maximum matching", "Path covers"],
        javaDrills: ["residual graph", "Dinic BFS levels", "DFS blocking flow", "bipartite matching transform"],
        templateFocus: "Dinic edge class with reverse edges and long capacities.",
        complexityCheckpoint: "Only introduce flow when constraints and reduction justify the heavier template.",
      },
    ],
  },
  {
    id: "advanced-topics",
    part: "III",
    title: "Advanced Topics",
    summary: "Math, combinatorics, matrices, probability, games, strings, square-root methods, advanced segment trees, geometry, and sweep line techniques in Java.",
    chapters: [
      {
        id: "number-theory-java",
        chapter: 21,
        title: "Number Theory",
        sections: ["Primes and factors", "Modular arithmetic", "Equations", "Other results"],
        javaDrills: ["sieve", "factorization", "modPow", "mod inverse", "gcd extended"],
        templateFocus: "long-based modular helpers and sieve arrays.",
        complexityCheckpoint: "Know O(n log log n) sieve and O(sqrt n) trial division bounds.",
      },
      {
        id: "combinatorics-java",
        chapter: 22,
        title: "Combinatorics",
        sections: ["Binomial coefficients", "Catalan numbers", "Inclusion-exclusion", "Burnside", "Cayley"],
        javaDrills: ["factorials modulo MOD", "nCr precompute", "inclusion-exclusion masks", "counting proof sketches"],
        templateFocus: "factorial and inverse factorial precomputation.",
        complexityCheckpoint: "Separate precomputation cost from per-query cost.",
      },
      {
        id: "matrices-java",
        chapter: 23,
        title: "Matrices",
        sections: ["Operations", "Linear recurrences", "Graphs and matrices"],
        javaDrills: ["matrix multiply modulo", "fast exponentiation", "transition matrix", "path count powers"],
        templateFocus: "O(k^3 log n) matrix exponentiation with long modulo arithmetic.",
        complexityCheckpoint: "Use matrices when recurrence index n is huge and state size is small.",
      },
      {
        id: "probability-java",
        chapter: 24,
        title: "Probability",
        sections: ["Calculation", "Events", "Random variables", "Markov chains", "Randomized algorithms"],
        javaDrills: ["expected value DP", "double precision checks", "state transition probabilities", "Monte Carlo caveats"],
        templateFocus: "double[] DP for expectation and probability transitions.",
        complexityCheckpoint: "Track precision and state count; probability DP still follows state-transition cost.",
      },
      {
        id: "game-theory-java",
        chapter: 25,
        title: "Game Theory",
        sections: ["Game states", "Nim", "Sprague-Grundy"],
        javaDrills: ["xor invariant", "winning/losing DP", "mex computation", "grundy memoization"],
        templateFocus: "Grundy number memo table and mex with boolean seen array.",
        complexityCheckpoint: "Define game states and transitions before applying Nim shortcuts.",
      },
      {
        id: "string-algorithms-java",
        chapter: 26,
        title: "String Algorithms",
        sections: ["Terminology", "Trie", "String hashing", "Z-algorithm"],
        javaDrills: ["char[] processing", "Trie node arrays", "rolling hash", "Z array", "prefix-function comparison"],
        templateFocus: "Z-algorithm and rolling hash using long/mod pairs.",
        complexityCheckpoint: "Most string preprocessing here should be O(n).",
      },
      {
        id: "sqrt-algorithms-java",
        chapter: 27,
        title: "Square Root Algorithms",
        sections: ["Combining algorithms", "Integer partitions", "Mo's algorithm"],
        javaDrills: ["block decomposition", "query ordering", "add/remove pointers", "frequency arrays"],
        templateFocus: "Mo's algorithm comparator by block and right endpoint.",
        complexityCheckpoint: "Sqrt decomposition trades simple updates/queries for about O((n + q) sqrt n).",
      },
      {
        id: "segment-trees-revisited-java",
        chapter: 28,
        title: "Segment Trees Revisited",
        sections: ["Lazy propagation", "Dynamic trees", "Data structures", "Two-dimensionality"],
        javaDrills: ["lazy range add", "range min/sum", "implicit tree nodes", "2D compression"],
        templateFocus: "Lazy segment tree with push, pull, update, and query.",
        complexityCheckpoint: "Use lazy propagation when range updates and range queries both matter.",
      },
      {
        id: "geometry-java",
        chapter: 29,
        title: "Geometry",
        sections: ["Points and lines", "Polygon area", "Distance functions", "orientation"],
        javaDrills: ["Point long class", "cross product", "orientation test", "shoelace area", "distance squared"],
        templateFocus: "long cross products for exact integer geometry predicates.",
        complexityCheckpoint: "Avoid double unless the problem genuinely needs continuous precision.",
      },
      {
        id: "sweep-line-java",
        chapter: 30,
        title: "Sweep Line Algorithms",
        sections: ["Intersection points", "Closest pair", "Convex hull"],
        javaDrills: ["event sorting", "TreeSet active set", "coordinate compression", "monotonic hull"],
        templateFocus: "Event object comparator and active ordered set management.",
        complexityCheckpoint: "Sweep line usually means sort events, then maintain an ordered active structure.",
      },
    ],
  },
];

export const CSES_JAVA_TRACKS = CSES_JAVA_PARTS.flatMap((part) =>
  part.chapters.map((chapter) => ({
    ...chapter,
    part: part.part,
    partTitle: part.title,
    difficulty: chapter.chapter <= 4 ? "Starter" : chapter.chapter <= 10 ? "Core" : chapter.chapter <= 20 ? "Graph" : "Advanced",
    focus: `${part.title}: ${chapter.sections.join(", ")}.`,
    handbookThemes: chapter.sections,
    javaFocus: chapter.javaDrills,
    interviewSignals: [
      chapter.complexityCheckpoint,
      `Can implement ${chapter.title.toLowerCase()} in Java with the right data structures.`,
      "Can explain the invariant, edge cases, and complexity without reading code.",
    ],
    pitfalls: [
      "Choosing a heavier algorithm before checking constraints.",
      "Ignoring Java performance details like I/O, object churn, overflow, or recursion depth.",
      "Skipping the proof or invariant that makes the technique interview-ready.",
    ],
    javaTemplate: chapter.templateFocus,
  }))
);

const CSES_CHAPTER_DETAILS = {
  "time-complexity-java": {
    explanation:
      "Time complexity is the habit of predicting whether an algorithm will finish before you code it. The input size tells you the budget. If n is 200,000, a quadratic loop does about 40,000,000,000 pair checks, which is far beyond a normal contest or interview time limit. An n log n approach does roughly 200,000 * 18 comparisons, around 3.6 million core operations, so sorting, heap work, divide-and-conquer, or binary-search-based approaches become realistic.",
    reasoning:
      "The important move is to ignore machine-specific details first and count how many times the dominant operation runs. A single pass is O(n). Sorting is O(n log n). Checking every pair is O(n^2). Trying every subset is O(2^n). Once you know the rough operation count, you choose the simplest algorithm that fits the constraints.",
    javaApproach:
      "In Java, this matters even more because object allocation, recursion depth, Scanner input, and repeated string concatenation can add overhead. Prefer primitive arrays, buffered input, StringBuilder output, and iterative loops when the input is large.",
    workedExample:
      "For maximum subarray sum, the brute-force idea checks every start and end index, which is O(n^2). Kadane's algorithm keeps the best sum ending at the current position and updates it in one pass, so it is O(n). The interview-ready explanation is: at each index, either extend the previous subarray or start fresh here.",
    codeSketch: [
      "long best = Long.MIN_VALUE;",
      "long current = 0;",
      "for (long x : a) {",
      "  current = Math.max(x, current + x);",
      "  best = Math.max(best, current);",
      "}",
    ].join("\n"),
    stepByStep: [
      "Read the constraints first, not the sample input.",
      "Estimate the dominant loop count: one loop, nested loops, sorting, subset search, or graph traversal.",
      "Translate the count into a rough operation budget.",
      "Pick the simplest algorithm that fits, then check memory and Java overhead.",
    ],
    interviewAnswer:
      "I first use the constraints to eliminate impossible approaches. For n = 200,000, O(n^2) is around 40 billion pair checks, so I would look for O(n), O(n log n), or sometimes O(n sqrt n). Then I confirm the implementation details: primitive arrays, buffered input, long arithmetic, and no avoidable object churn.",
    commonMistakes: [
      "Saying O(n log n) is better without explaining the scale difference.",
      "Counting every line instead of identifying the dominant operation.",
      "Forgetting that Java recursion, Scanner, and object-heavy loops can fail even when the Big-O looks acceptable.",
    ],
    practiceTasks: [
      "Given n = 2e5, classify which of O(n), O(n log n), O(n sqrt n), O(n^2), and O(2^n) are plausible.",
      "Convert maximum subarray from O(n^2) brute force to O(n) Kadane and explain the invariant.",
      "Take a nested loop and decide whether it is truly O(n^2) or amortized O(n).",
    ],
  },
  "sorting-java": {
    explanation:
      "Sorting is often the step that creates order from chaos. After sorting, equal values sit together, smaller values come before larger values, and many pair or interval problems become one scan, two pointers, or binary search. The cost is O(n log n), so it is usually acceptable for up to a few hundred thousand or even a million elements.",
    reasoning:
      "A strong interview answer explains what sorting buys you. It may let you greedily take the earliest finishing interval, find complements with two pointers, remove duplicates, or binary search the first feasible answer.",
    javaApproach:
      "Use Arrays.sort for primitive arrays. For objects, use Comparator.comparingInt or Integer.compare instead of subtraction, because a - b can overflow. If the answer depends on original positions, store pairs such as int[]{value, index}.",
    workedExample:
      "For two-sum in a sorted array, keep one pointer at the left and one at the right. If the sum is too small, move left forward. If it is too large, move right backward. Each pointer moves at most n times.",
    codeSketch: [
      "Arrays.sort(a);",
      "int l = 0, r = a.length - 1;",
      "while (l < r) {",
      "  long sum = (long) a[l] + a[r];",
      "  if (sum == target) break;",
      "  if (sum < target) l++; else r--;",
      "}",
    ].join("\n"),
  },
  "dynamic-programming-java": {
    explanation:
      "Dynamic programming is for problems where the same smaller decisions appear again and again. Instead of recomputing them, define a state, compute each state once, and reuse it. A good DP explanation always names the state, transition, base case, iteration order, and final answer.",
    reasoning:
      "The difference between guessing and understanding DP is the state definition. For example, dp[i] might mean the best answer using the first i items, or dp[sum] might mean the number of ways to build a sum. Once the state meaning is clear, the loops usually follow.",
    javaApproach:
      "Use arrays when states are numeric and bounded. Fill impossible values with a sentinel such as INF. Use long for counts and sums. Prefer iterative DP for large input because Java recursion may hit StackOverflowError.",
    workedExample:
      "For coin DP, dp[sum] can store the minimum coins needed for that sum. Initialize dp[0] = 0, then try each transition dp[sum - coin] + 1.",
    codeSketch: [
      "long[] dp = new long[target + 1];",
      "Arrays.fill(dp, INF);",
      "dp[0] = 0;",
      "for (int sum = 1; sum <= target; sum++)",
      "  for (int coin : coins)",
      "    if (sum >= coin) dp[sum] = Math.min(dp[sum], dp[sum - coin] + 1);",
    ].join("\n"),
  },
  "shortest-paths-java": {
    explanation:
      "Shortest path algorithms answer the question: what is the cheapest way to reach each node? The correct algorithm depends on edge weights. Unweighted graphs use BFS. Non-negative weighted graphs use Dijkstra. Negative edges require Bellman-Ford-style reasoning. Small dense graphs can use Floyd-Warshall for all-pairs distances.",
    reasoning:
      "The interview trap is applying Dijkstra everywhere. Dijkstra assumes once the smallest tentative distance is popped, it will not become cheaper later. Negative edges break that assumption.",
    javaApproach:
      "Store distances as long, use PriorityQueue<long[]> for Dijkstra, and skip stale queue entries when the popped distance is not equal to dist[node]. Build adjacency as ArrayList<int[]>[] for typical weighted graph problems.",
    workedExample:
      "In Dijkstra, each relaxation asks: can going through the current node improve the neighbor's distance? If yes, update the distance and push the new state into the priority queue.",
    codeSketch: [
      "PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(x -> x[0]));",
      "pq.add(new long[]{0, source});",
      "while (!pq.isEmpty()) {",
      "  long[] cur = pq.poll();",
      "  if (cur[0] != dist[(int) cur[1]]) continue;",
      "  // relax neighbors",
      "}",
    ].join("\n"),
  },
  "range-queries-java": {
    explanation:
      "Range query structures exist because repeatedly scanning a subarray is too slow. Prefix sums handle static sum queries. Fenwick trees handle point updates plus prefix sums. Segment trees handle broader associative operations such as min, max, sum, gcd, or custom merges.",
    reasoning:
      "Choose the smallest structure that supports the operations. If values never change, prefix sums are simpler than Fenwick. If only sums change by point updates, Fenwick is smaller than a segment tree. If you need range min with updates, segment tree becomes worth it.",
    javaApproach:
      "Fenwick trees are usually one-based. Segment trees can be iterative with an array of size 2*n or recursive with 4*n. Use long for sums.",
    workedExample:
      "A Fenwick update climbs to larger responsible ranges by adding the lowbit. A query descends by removing the lowbit, collecting the ranges that exactly cover the prefix.",
    codeSketch: [
      "void add(int i, long delta) {",
      "  for (; i <= n; i += i & -i) bit[i] += delta;",
      "}",
      "long sum(int i) {",
      "  long ans = 0;",
      "  for (; i > 0; i -= i & -i) ans += bit[i];",
      "  return ans;",
      "}",
    ].join("\n"),
  },
};

function buildDefaultCsesChapterDetail(chapter) {
  const sections = chapter.sections.join(", ");
  const drills = chapter.javaDrills.join(", ");
  return {
    explanation: `${chapter.title} covers ${sections}. The goal is not to memorize names, but to recognize the pattern in a problem statement, choose the right Java data structures, and explain the invariant that makes the solution correct.`,
    reasoning: `Start by asking what changes and what stays true after each step. Then connect the operation to the needed complexity: traversal, sorting, logarithmic updates, state transitions, or exponential search when constraints are small.`,
    javaApproach: `In Java, practice this chapter with ${drills}. Pay attention to primitive arrays versus collections, long arithmetic, buffered I/O, and whether recursion is safe for the expected input size.`,
    workedExample: `A useful practice path is: solve one tiny example by hand, name the invariant, write the Java template, then test edge cases such as empty input, one element, duplicates, disconnected nodes, overflow, or impossible states depending on the chapter.`,
    codeSketch: chapter.templateFocus,
    stepByStep: [
      "Restate the problem in one sentence and mark the input limits.",
      "Identify the operation pattern: lookup, ordering, traversal, range query, state transition, or optimization.",
      "Choose the simplest Java structure that supports that operation efficiently.",
      "Write the invariant before code, then test edge cases after code.",
    ],
    interviewAnswer: `This chapter is about recognizing when ${chapter.title.toLowerCase()} is the right tool, choosing a Java-friendly implementation, and explaining the complexity from the number of states, edges, updates, queries, or iterations involved.`,
    commonMistakes: [
      "Jumping to a template before explaining why it fits.",
      "Ignoring constraints that make a simpler approach sufficient.",
      "Using Java collections or recursion in a way that adds avoidable overhead.",
    ],
    practiceTasks: [
      `Implement one ${chapter.title.toLowerCase()} template in Java from memory.`,
      "Dry-run the template on a three-to-five element example.",
      "Explain the invariant, complexity, and two edge cases out loud.",
    ],
  };
}

export function getCsesJavaChapterDetail(chapter) {
  const base = buildDefaultCsesChapterDetail(chapter);
  return { ...base, ...(CSES_CHAPTER_DETAILS[chapter.id] || {}) };
}

export function getJavaDigestTrack(trackId) {
  return JAVA_DIGEST_TRACKS.find((track) => track.id === trackId) || JAVA_DIGEST_TRACKS[0];
}

export function listJavaDigestArticles(trackId = "all") {
  if (!trackId || trackId === "all") return JAVA_DIGEST_ARTICLES;
  return JAVA_DIGEST_ARTICLES.filter((article) => article.trackId === trackId);
}

export function listJavaSeniorRefresherArticles() {
  return JAVA_DIGEST_ARTICLES.filter((article) => article.collection === "senior-refresher");
}

export function getCsesJavaTrack(trackId) {
  const normalizedId = String(trackId || "").trim();
  return CSES_JAVA_TRACKS.find((track) => track.id === normalizedId) || CSES_JAVA_TRACKS[0];
}

export function buildCsesJavaPracticePrompt(trackId) {
  const track = getCsesJavaTrack(trackId);

  return [
    `Teach me this Java-only competitive programming track: ${track.title}.`,
    `Focus: ${track.focus}`,
    `Difficulty: ${track.difficulty}.`,
    `Java curriculum topic themes: ${track.handbookThemes.join(", ")}.`,
    `Java implementation focus: ${track.javaFocus.join("; ")}.`,
    `Interview signals: ${track.interviewSignals.join("; ")}.`,
    `Common pitfalls: ${track.pitfalls.join("; ")}.`,
    `Detailed chapter explanation: ${getCsesJavaChapterDetail(track).explanation}`,
    `Reasoning path: ${getCsesJavaChapterDetail(track).reasoning}`,
    "Return a direct polished study answer, not an interviewer prompt.",
    "Do not greet the user. Do not ask the user to implement something first.",
    "Use plain text math only: O(log n), O(1), 2 * 10^9, gcd(a, b), a mod b. Do not use LaTeX syntax like $, \\mathcal, \\cdot, \\gcd, or \\pmod.",
    "Use original explanations and Java examples only.",
    "Include: mental model, when to use it, Java template walkthrough, complexity, edge cases, and two practice problems.",
  ].join("\n");
}

export function buildJavaDigestGeneratedTopicPrompt(query, profile = {}) {
  const topic = String(query || "").trim();
  if (!topic) return "";

  const profileLines = [
    profile?.position ? `Target role: ${profile.position}` : "",
    profile?.experience ? `Experience: ${profile.experience}` : "",
    profile?.stack ? `Tech stack: ${profile.stack}` : "",
  ].filter(Boolean);

  return [
    `Generate a fresh, polished, interview-ready explanation for this searched topic: ${topic}.`,
    profileLines.length ? `Candidate context: ${profileLines.join("; ")}.` : "Candidate context: unknown, so calibrate for a mid-level software engineering interview.",
    "The answer must be understandable first, then interview-ready.",
    "Use up-to-date Java/backend/interview best practices where relevant. If the topic is version-sensitive, say what version or assumption you are using.",
    "When the topic overlaps with DSA or algorithms, add competitive-programming depth: complexity analysis, invariants, edge cases, proof intuition, and greedy, DP, search, graph, range-query, or bit-manipulation framing where relevant.",
    "Return a direct polished answer, not a mock interview prompt. Do not greet the user. Do not ask the user to implement something before teaching the topic.",
    "Use clean Markdown only. Use normal bullets with '-'. Avoid LaTeX syntax and dollar math. Write O(log n), O(1), 2 * 10^9, gcd(a, b), and a mod b as plain text.",
    "Format exactly with these sections:",
    "**Direct Answer**",
    "**Simple Mental Model**",
    "**Interview-Ready Answer**",
    "**Key Points**",
    "**Example / Code**",
    "**Common Mistakes**",
    "**STAR Story / How to Frame It**",
    "**Follow-up Questions**",
    "**Competitive Programming / DSA Angle**",
    "**60-Second Revision**",
    "In **STAR Story / How to Frame It**, give a concrete Situation, Task, Action, and measurable Result; if no project context is known, provide a clearly labeled example the candidate can personalize.",
    "Keep it practical, concise, and calibrated to the candidate's experience.",
  ].join("\n");
}

export function buildJavaDigestCoachPrompt(articleId) {
  const article = JAVA_DIGEST_ARTICLES.find((item) => item.id === articleId);
  if (!article) return "";

  const track = getJavaDigestTrack(article.trackId);
  return [
    `Coach me through this Java Digest topic: ${article.title}.`,
    `Track: ${track.label}. Level: ${article.level}. Format: ${article.format}.`,
    `Summary: ${article.summary}`,
    `Learning goals: ${article.learn.join("; ")}.`,
    `Interview questions to cover: ${article.questions.join("; ")}.`,
    "Teach it like a practical backend interview prep session with examples, traps, and a short quiz.",
  ].join("\n");
}

export function buildJavaDigestMockPrompt(articleId) {
  const article = JAVA_DIGEST_ARTICLES.find((item) => item.id === articleId);
  if (!article) return "";

  const track = getJavaDigestTrack(article.trackId);
  return [
    `Run a focused Java interview mock on ${article.title}.`,
    `Track: ${track.label}. Difficulty: ${article.level}.`,
    `Ask one question at a time from these themes: ${article.questions.join("; ")}.`,
    "Score each answer for correctness, depth, trade-offs, and communication. Include follow-up pressure when the answer is vague.",
  ].join("\n");
}

export function buildJavaDigestRoadmapPrompt(roadmapId) {
  const roadmap = JAVA_DIGEST_ROADMAPS.find((item) => item.id === roadmapId);
  if (!roadmap) return "";

  return [
    `Turn this Java Digest roadmap into a personalized prep plan: ${roadmap.title}.`,
    `Audience: ${roadmap.audience}.`,
    `Plan outline: ${roadmap.days.join("; ")}.`,
    "Adapt it to my current profile, add daily practice tasks, mock prompts, weak-spot review, and measurable checkpoints.",
  ].join("\n");
}
