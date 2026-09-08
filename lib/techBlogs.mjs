export const TECH_BLOGS = [
  {
    id: "java-8-to-26-evolution",
    title: "From Java 8 to Java 26: How Java Quietly Reinvented Itself",
    category: "Java evolution",
    sourceUrl: "https://medium.com/@sagarkrris/from-java-8-to-java-26-how-java-quietly-reinvented-itself-072c83657db1",
    summary:
      "An original interview note on the Java platform's shift from functional foundations to safer data modeling, structured concurrency, faster startup, and a more capable JVM.",
    lessons: [
      "Java 8 established the functional vocabulary: lambdas, streams, Optional, and default methods made APIs more expressive without abandoning the object model.",
      "Java 9–17 tightened platform boundaries and reduced data-model ceremony through modules, switch expressions, records, sealed types, and pattern matching previews.",
      "Java 21 onward focuses on scale and operability: virtual threads, structured concurrency work, safer native interop, startup improvements, and a steadily more observable runtime.",
    ],
    sections: [
      {
        heading: "Read the timeline as a set of design pressures",
        body: "The releases are easier to remember when grouped by the problem they solve: expressive code, explicit boundaries, compact data, scalable concurrency, and faster platform feedback. The language changes are connected; they are not a random feature list.",
      },
      {
        heading: "The interview-ready mental model",
        body: "For any version, name the pressure, the feature, and the operational consequence. For example: blocking work was expensive per platform thread, so virtual threads make thread-per-request designs practical when the underlying calls can block safely.",
      },
      {
        heading: "What to verify before production adoption",
        body: "Check the supported JDK line, preview versus finalized status, framework compatibility, observability, and rollback plan. A newer feature is valuable only when the deployment baseline and team debugging model can support it.",
      },
    ],
    example:
      "record User(String id, String email) {}\n\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n  executor.submit(() -> fetchProfile(userId));\n}",
    interviewQuestions: [
      "Which Java release changed how you model data, and what boilerplate did it remove?",
      "When do virtual threads improve a service, and when is the bottleneck still the database or downstream dependency?",
      "How would you introduce a newer JDK feature while keeping a safe rollback path?",
    ],
    practice:
      "Pick one service you know. Map its current code to the timeline, then propose one feature upgrade, one compatibility risk, and one metric that would prove the change helped.",
  },
  {
    id: "design-patterns-in-18-minutes",
    title: "Every Important Design Pattern Explained",
    category: "Design patterns",
    summary:
      "A practical tour of the patterns that appear most often in interviews and production code.",
    lessons: [
      "Creational patterns (Factory, Builder) keep object construction readable and replaceable.",
      "Structural patterns (Adapter, Facade, Proxy, Decorator, Composite) control boundaries and composition.",
      "Behavioral patterns (Strategy, Observer, State, Command, Template Method, Iterator, Chain of Responsibility) make change and coordination explicit.",
    ],
    sections: [
      {
        heading: "How to choose a pattern",
        body: "Begin with the change that is expensive today: object construction, an incompatible boundary, a growing conditional, or a workflow with optional steps. Select the smallest pattern that isolates that change; a pattern is a communication tool, not a requirement.",
      },
      {
        heading: "A concrete example",
        body: "A notification service can depend on a Notification interface while a factory creates Email, SMS, or Push implementations. The service owns the workflow and each implementation owns its transport details. Tests can inject a fake without changing the workflow.",
      },
      {
        heading: "Interview lens",
        body: "Explain the problem, the participants, the collaboration, and the trade-off. Mention that Singleton can hide dependencies, Decorator can create deep chains, and Observer needs delivery and lifecycle rules.",
      },
    ],
    example:
      "interface PaymentProcessor { void pay(int cents); }\nfinal class GatewayAdapter implements PaymentProcessor {\n  public void pay(int cents) { gateway.charge(cents / 100.0); }\n}",
    interviewQuestions: [
      "When is composition better than inheritance?",
      "How would you test a factory or observer without real infrastructure?",
    ],
    practice:
      "For each pattern, name the invariant it protects, the coupling it removes, and one case where a plain function would be simpler.",
  },
  {
    id: "learn-low-level-design-from-zero",
    title: "How to Learn Low-Level Design from Zero",
    category: "Low-level design",
    summary:
      "A beginner-friendly progression from requirements to objects, interfaces, trade-offs, and testable designs.",
    lessons: [
      "Start with use cases and constraints; do not jump straight to classes or diagrams.",
      "Model responsibilities, invariants, and collaborations before choosing patterns.",
      "Practice one small domain at a time, then explain extensibility, failure modes, and tests out loud.",
    ],
    sections: [
      {
        heading: "The design loop",
        body: "Clarify actors, commands, queries, constraints, and failure behavior. Then assign one responsibility per object, protect invariants behind methods, and define interfaces at points where a policy may vary.",
      },
      {
        heading: "Example: parking lot",
        body: "Keep ParkingLot responsible for availability, Ticket for the allocation record, and PricingPolicy for fee calculation. A vehicle type is data plus a placement rule; adding an electric vehicle should add a policy, not a conditional in every service.",
      },
      {
        heading: "What good practice looks like",
        body: "Start with a small runnable model, write tests for normal and invalid transitions, draw a sequence for one use case, and refactor only after the responsibilities are visible. Explain alternatives and why you rejected them.",
      },
    ],
    example:
      "interface PricingPolicy { Money price(Duration stay, Vehicle vehicle); }\nfinal class ParkingLot {\n  Ticket enter(Vehicle vehicle) { /* allocate through a placement policy */ }\n}",
    interviewQuestions: [
      "Where should validation live?",
      "How can a new pricing rule be added without changing checkout?",
    ],
    practice:
      "Design a parking lot, split the requirements into policies, and show how a new vehicle type can be added without editing every caller.",
  },
  {
    id: "leetcode-patterns",
    title: "LeetCode Patterns: Recognize the Shape Before the Code",
    category: "DSA",
    summary:
      "A compact pattern-recognition lesson for turning a large problem set into a small set of reusable moves.",
    lessons: [
      "Use two pointers for ordered pair relationships, sliding windows for bounded ranges, and prefix state for repeated subarray questions.",
      "Use a monotonic stack when the next greater or smaller element is the real question.",
      "State the invariant before writing the loop; it is the fastest way to catch an off-by-one error.",
    ],
    sections: [
      {
        heading: "Pattern recognition",
        body: "Read the input and output before naming an algorithm. Ask whether the input is ordered, whether a contiguous range matters, whether a choice can be undone, and whether the answer depends on a previous prefix or suffix.",
      },
      {
        heading: "Worked mental model",
        body: "For a longest-subarray constraint, maintain a window and the smallest state needed to restore validity. For next-greater queries, a monotonic stack removes elements that can never be the answer for a later index.",
      },
      {
        heading: "Proof and complexity",
        body: "Write the invariant in one sentence, identify what moves each pointer, and count pushes and pops rather than assuming nested loops are quadratic. Then test empty input, duplicates, and the smallest boundary.",
      },
    ],
    example:
      "int left = 0;\nfor (int right = 0; right < nums.length; right++) {\n  add(nums[right]);\n  while (!valid()) remove(nums[left++]);\n  best = Math.max(best, right - left + 1);\n}",
    interviewQuestions: [
      "What invariant does your window maintain?",
      "Why is each stack element pushed and popped at most once?",
    ],
    practice:
      "Classify a new problem by input shape, required output, and the state that must survive each iteration.",
  },
  {
    id: "system-design-concepts",
    title: "System Design: The Concepts That Carry Across Interviews",
    category: "System design",
    summary:
      "A reusable mental model for capacity, reliability, data, and operational trade-offs.",
    lessons: [
      "Start with workload estimates and an explicit availability and latency target.",
      "Separate the synchronous user path from asynchronous work, retries, and durable events.",
      "Name the consistency model, cache invalidation rule, hot-key strategy, and observability signals.",
    ],
    sections: [
      {
        heading: "Start with numbers",
        body: "Estimate requests per second, payload sizes, storage growth, read/write ratio, and peak behavior. These numbers determine whether a single service, cache, queue, replica set, or partitioning strategy is justified.",
      },
      {
        heading: "Make the path explicit",
        body: "Describe the synchronous request path first. Move slow or retryable work to a queue, make consumers idempotent, and define what happens when the cache, database, queue, or downstream dependency is unavailable.",
      },
      {
        heading: "Operate the design",
        body: "Choose consistency deliberately, identify hot keys and backpressure, and name dashboards and alerts for latency, errors, saturation, queue lag, and data freshness. Reliability is part of the design, not a final paragraph.",
      },
    ],
    example:
      "POST /feeds/{userId}/items\nwrite primary → publish event → update projections\nread replica/cache → stale-while-revalidate on a miss",
    interviewQuestions: [
      "What breaks first at 10x traffic?",
      "Which operations are safe to retry and why?",
    ],
    practice:
      "For a feed or chat system, explain the read path, write path, failure recovery, and one deliberate trade-off in under five minutes.",
  },
  {
    id: "system-design-handbook",
    title: "System Design Interview Handbook",
    category: "System design",
    summary:
      "A 75-page reference distilled into the checklist you need during a system-design interview.",
    lessons: [
      "Fundamentals: scalability, availability, latency versus throughput, and CAP theorem.",
      "Core building blocks: load balancers, databases, CDNs, message queues, rate limiting, indexes, and caching.",
      "Distributed-system tools: consistent hashing, sharding, and consensus algorithms.",
    ],
    sections: [
      {
        heading: "Fundamentals",
        body: "Scalability is the ability to handle more load; availability is the proportion of time the service can respond; latency is time per request; throughput is completed work per unit time. State the target for each before choosing infrastructure.",
      },
      {
        heading: "Core building blocks",
        body: "Load balancers distribute traffic, databases provide durable state, CDNs move cacheable bytes closer to users, queues smooth bursts, rate limiters protect dependencies, indexes accelerate selective reads, and caches trade freshness for speed.",
      },
      {
        heading: "Distributed coordination",
        body: "Consistent hashing limits key movement when nodes change. Sharding raises capacity but creates routing and rebalancing work. Consensus protocols coordinate a replicated decision; they add latency and operational complexity, so use them only where a shared decision is required.",
      },
      {
        heading: "Interview checklist",
        body: "Requirements → estimates → APIs and data model → high-level components → read/write paths → bottlenecks → failure recovery → consistency and security → observability. Close with the trade-off you would revisit first as traffic grows.",
      },
    ],
    example:
      "capacity = peak_requests_per_second × average_bytes_per_request\nreplicas handle reads; partitioning handles data and write scale;\nqueues absorb bursts but require idempotent consumers and lag alerts.",
    interviewQuestions: [
      "When does caching hurt correctness?",
      "How do you recover after a partition or replica falls behind?",
    ],
    practice:
      "Use this order in an interview: requirements → estimates → API/data model → high-level design → bottlenecks → reliability and observability.",
  },
  {
    id: "production-java-reliability",
    title: "Production Java: From Code to Reliable Service",
    category: "Java engineering",
    summary: "An original course on turning clean Java code into observable, resilient production behavior.",
    lessons: ["Design boundaries around invariants and ownership.", "Treat concurrency, failures, and telemetry as part of the API.", "Optimize from measurements, not intuition."],
    sections: [{ heading: "Course goal", body: "Connect language-level decisions to operational outcomes: safe state, bounded work, useful diagnostics, and predictable recovery." }],
    example: "request → validation → domain service → persistence → event → metrics",
    interviewQuestions: ["How do you make a Java service safe under concurrency?", "What evidence would you collect before optimizing?"],
  },
  {
    id: "api-reliability-playbook",
    title: "API Reliability Playbook",
    category: "Backend architecture",
    summary: "An original course on API contracts, retries, idempotency, backpressure, and safe evolution.",
    lessons: ["Make retry and failure semantics explicit.", "Protect dependencies with budgets and backpressure.", "Version contracts without breaking existing clients."],
    sections: [{ heading: "Course goal", body: "Build APIs that remain understandable and safe when clients retry, dependencies slow down, traffic spikes, or schemas evolve." }],
    example: "client deadline → gateway budget → service timeout → dependency timeout",
    interviewQuestions: ["Which errors are safe to retry?", "How do you roll out a breaking schema change?"],
  },
  {
    id: "technical-interview-communication",
    title: "Technical Interview Communication",
    category: "Interview craft",
    summary: "An original course for explaining decisions clearly under time pressure, from first clarification to final trade-off.",
    lessons: ["Lead with the answer and make assumptions visible.", "Use examples and tests to prove reasoning.", "Close with trade-offs, risks, and what you would measure."],
    sections: [{ heading: "Course goal", body: "Turn correct technical thinking into an answer an interviewer can follow, challenge, and remember." }],
    example: "clarify → propose → justify → test → trade-off → recap",
    interviewQuestions: ["How do you recover when an assumption changes?", "How do you explain a complex system to a non-specialist?"],
  },
  {
    id: "java-concurrency-interviews",
    title: "Java Concurrency Interview Course",
    category: "Java concurrency",
    summary: "A practical course covering visibility, atomicity, locks, executors, CompletableFuture, and production-safe concurrency.",
    lessons: ["Separate visibility, atomicity, and ordering.", "Bound work with the right executor and shutdown policy.", "Explain correctness before performance."],
    sections: [{ heading: "Course goal", body: "Build and explain concurrent Java code that remains correct under races, load, cancellation, and partial failure." }],
    example: "immutable state → bounded executor → explicit cancellation → metrics",
    interviewQuestions: ["When is volatile enough?", "How do you prevent an executor from becoming an unbounded queue?"],
  },
  {
    id: "sql-performance-interviews",
    title: "SQL Performance Interview Course",
    category: "SQL performance",
    summary: "A full interview path for reading query plans, choosing indexes, handling growth, and proving an optimization.",
    lessons: ["Measure the real query with realistic parameters.", "Use selectivity and access patterns to design indexes.", "Balance read speed against write and storage cost."],
    sections: [{ heading: "Course goal", body: "Move from a slow-query symptom to an evidence-backed fix without guessing or hiding correctness problems." }],
    example: "capture → explain → hypothesize → change → benchmark → observe",
    interviewQuestions: ["Why can an index make writes slower?", "How do you detect a plan regression after data growth?"],
  },
  {
    id: "distributed-systems-interviews",
    title: "Distributed Systems Interview Course",
    category: "Distributed systems",
    summary: "A detailed course on clocks, consistency, replication, coordination, retries, and failure-aware design explanations.",
    lessons: ["Assume networks delay, duplicate, and lose messages.", "Make consistency and ownership explicit per operation.", "Design recovery paths, not just happy paths."],
    sections: [{ heading: "Course goal", body: "Develop the vocabulary and reasoning loop needed to explain distributed behavior under partitions and partial failure." }],
    example: "local state → message → duplicate/out-of-order delivery → idempotent convergence",
    interviewQuestions: ["How do you make an at-least-once event handler safe?", "When is eventual consistency acceptable?"],
  },
  {
    id: "behavioral-star-interviews",
    title: "Behavioral Interviews: Evidence-Backed STAR Stories",
    category: "Behavioral interviews",
    summary: "A detailed course for turning projects, incidents, and disagreements into concise, credible interview stories.",
    lessons: ["Anchor every story in a specific decision and measurable outcome.", "Show judgement, collaboration, and learning—not just heroics.", "Prepare follow-ups before the interview."],
    sections: [{ heading: "Course goal", body: "Build a reusable story bank that demonstrates ownership, technical judgement, communication, and growth." }],
    example: "Situation → Task → Action → Result → Learning → follow-up",
    interviewQuestions: ["Tell me about a failure and what changed afterward.", "Describe a disagreement with a teammate."],
  },
  {
    id: "system-design-fundamentals-roadmap",
    title: "System Design Fundamentals: Full Interview Roadmap",
    category: "System design",
    summary: "An original public course organized from fundamentals through networking, APIs, data, distributed systems, deployment, observability, and security.",
    lessons: ["Learn concepts in dependency order.", "Connect every building block to a user-visible trade-off.", "Practice with quizzes, design prompts, and hands-on reasoning."],
    sections: [{ heading: "Course goal", body: "Build a durable system-design mental model from first principles, then apply it to interview-scale architecture problems." }],
    example: "requirements → network → API → data → async work → reliability → operations",
    interviewQuestions: ["How do the pieces of a scalable system fit together?", "Which trade-off would you revisit at 10x traffic?"],
  },
];

const COURSE_CHAPTERS = {
  "java-8-to-26-evolution": [
    { title: "1. Java 8: functional foundations", lesson: "Lambdas, streams, Optional, and default methods made behavior composable and let interfaces evolve without forcing every implementation to change.", walkthrough: "Start with an imperative loop, extract the transformation and filtering steps, then check whether a stream improves the boundary or only hides simple control flow.", diagram: "lambda → stream pipeline → explicit absence → evolvable interface", example: "users.stream().filter(User::active).map(User::email).toList()", exercise: "Rewrite one collection-heavy method and explain why a loop may still be clearer.", quiz: "Which part of the design benefits from composition, and where would a stream be unnecessary?" },
    { title: "2. Java 9–11: platform boundaries", lesson: "Modules made dependencies and exports explicit, var reduced local noise, and the modern HTTP Client gave applications a standard asynchronous and HTTP/2-capable boundary. Java 11 then provided a durable LTS baseline.", walkthrough: "Trace a request from a module export through an HTTP client call and identify the boundary where compatibility and timeout policy belong.", diagram: "module boundary → local inference → HttpClient → LTS baseline", example: "HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()", exercise: "Choose one package boundary that should be exported and one that should remain internal.", quiz: "What does a module boundary make visible that a classpath-only application can hide?" },
    { title: "3. Java 12–14: clearer language", lesson: "Switch expressions, text blocks, helpful null-pointer diagnostics, and preview features reduced ceremony while keeping the language careful about compatibility.", walkthrough: "Convert a branching assignment to a switch expression, then test exhaustiveness and the error message produced by a null path.", diagram: "expression → exhaustive branch → readable literal → diagnosable failure", example: "var label = switch (status) { case READY -> \"ready\"; case FAILED -> \"failed\"; };", exercise: "Replace one nested conditional while preserving the default and invalid states.", quiz: "Which cases must be covered before a switch expression can be trusted?" },
    { title: "4. Java 15–17: compact data models", lesson: "Records, sealed classes, and pattern matching previews made data shape and permitted variation explicit. Java 17 turned that direction into a widely adopted LTS foundation.", walkthrough: "Model a closed result hierarchy with a record for data and a sealed interface for allowed variants, then pattern-match at the boundary.", diagram: "record → sealed hierarchy → pattern match → LTS adoption", example: "sealed interface Result permits Success, Failure\nrecord Success(String value) implements Result {}", exercise: "Replace a DTO plus manual equality with a record and list the compatibility checks.", quiz: "When is a sealed hierarchy better than an open interface?" },
    { title: "5. Java 18–20: concurrency runway", lesson: "UTF-8 became predictable by default, while virtual threads, structured concurrency, and record-pattern work previewed a simpler model for high-concurrency services.", walkthrough: "Compare one platform thread per request with one virtual thread per blocking task and locate the real limit: CPU, connection pool, or downstream service.", diagram: "predictable text → cheap waiting → scoped tasks → preview feedback", example: "try (var executor = Executors.newVirtualThreadPerTaskExecutor()) { executor.submit(task); }", exercise: "Name one blocking call that is safe to move to a virtual thread and one resource that still needs a bound.", quiz: "What bottleneck remains after thread creation becomes cheap?" },
    { title: "6. Java 21: production-scale concurrency", lesson: "Java 21 made virtual threads and pattern matching practical LTS tools, alongside sequenced collections and other APIs that make common intent easier to express.", walkthrough: "Trace a request fan-out, propagate its deadline, and show where structured ownership prevents orphaned work.", diagram: "virtual threads → structured work → explicit deadline → LTS service", example: "try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n  var profile = executor.submit(() -> loadProfile(id)).get();\n}", exercise: "Design a bounded fan-out and explain cancellation when one child fails.", quiz: "Why do virtual threads not remove the need for backpressure?" },
    { title: "7. Java 22–24: platform acceleration", lesson: "Unnamed variables remove ceremony, Stream Gatherers support richer pipelines, the Foreign Function and Memory API offers safer native interop, and newer class-file tooling improves platform work.", walkthrough: "Identify which code is accidental ceremony, which pipeline shape is genuinely custom, and where native memory ownership must be made explicit.", diagram: "unnamed value → custom gatherer → safe native boundary → class-file tooling", example: "var result = stream.gather(Gatherers.windowFixed(100)).toList();", exercise: "Sketch a native interop boundary and list ownership, lifetime, and failure checks.", quiz: "Which part of this era is a language convenience versus a runtime/platform capability?" },
    { title: "8. Java 25–26: runtime feedback loop", lesson: "The latest era continues reducing context overhead and startup cost through scoped values, constructor and source-file improvements, AOT caching, modern HTTP transport, and a leaner platform surface. Verify exact status against the shipped JDK before adoption.", walkthrough: "Separate finalized APIs from previews and date-sensitive release notes, then choose one upgrade metric such as startup time, allocation, or p95 latency.", diagram: "scoped context → AOT cache → HTTP/3 transport → leaner runtime", example: "measure baseline → enable one feature → compare startup / p95 / CPU → keep rollback ready", exercise: "Write a JDK upgrade experiment with a compatibility gate and rollback trigger.", quiz: "What evidence would prove a newer runtime helped this service rather than merely changed it?" },
  ],
  "system-design-fundamentals-roadmap": [
    ["1. Course roadmap", "Learn in order: foundations, networking, APIs, communication, caching, databases, scaling, architecture, distributed systems, operations, and security.", "roadmap → prerequisites → integrated design"],
    ["2. Scalability and availability", "Separate capacity from uptime. Remove single points of failure, define targets, and choose vertical or horizontal scaling from workload and state.", "load → capacity → redundancy → failover"],
    ["3. Latency, throughput, and bandwidth", "Latency is time per operation, throughput is completed work, and bandwidth is transfer capacity. Tail latency and queueing often dominate user experience.", "request → queue → service time → response"],
    ["4. Consistency and CAP", "During partitions, choose which reads or writes may wait, fail, or be stale. State the consistency contract per operation instead of labeling an entire system.", "partition → consistency choice → user behavior"],
    ["5. Networking fundamentals", "Understand IP, TCP/UDP, HTTP/HTTPS, DNS, proxies, and checksums well enough to trace a request and explain where latency or failure enters.", "client → DNS → connection → HTTP → service"],
    ["6. Load balancing", "Use health checks, connection draining, and a routing policy. DNS and anycast can distribute regions, while service-level balancing distributes instances.", "user → DNS/anycast → LB → healthy instance"],
    ["7. API design and security", "Choose REST, GraphQL, or gRPC from client and latency needs. Define idempotency, authn/authz, token/session handling, and safe error contracts.", "client → gateway → authenticated API → domain"],
    ["8. Real-time and asynchronous communication", "Choose polling, WebSockets, SSE, webhooks, queues, pub/sub, or CDC from delivery, ordering, fan-out, and replay requirements.", "event → broker → consumers → retry/DLQ"],
    ["9. Caching and CDNs", "Choose cache-aside, read/write-through, or write-behind deliberately. Define TTL, invalidation, stampede protection, warming, and privacy boundaries.", "request → CDN → cache → source of truth"],
    ["10. Database choices", "Relational, document, key-value, wide-column, graph, time-series, search, and vector stores optimize different access patterns. Start from queries and invariants.", "access pattern → data model → storage engine"],
    ["11. Database internals", "B-trees favor ordered reads, LSM trees favor write-heavy workloads, and durability depends on logs, flushing, replication, and recovery semantics.", "write → log/memtable → durable files → read"],
    ["12. Read and write scaling", "Use indexes, query plans, replicas, denormalization, materialized views, pooling, partitioning, compression, and sharding only when measurements justify complexity.", "hot query → measure → targeted scale technique"],
    ["13. Storage systems", "Block, file, and object storage expose different access and durability models. Erasure coding trades compute for durable capacity in distributed storage.", "bytes → storage abstraction → durability/availability"],
    ["14. Architecture patterns", "Monoliths, microservices, serverless, event-driven, hexagonal, CQRS, and event sourcing are trade-offs in ownership, deployment, and consistency—not maturity levels.", "domain boundary → deployment boundary → data boundary"],
    ["15. Microservices patterns", "Service discovery, gateways, BFFs, sidecars, circuit breakers, bulkheads, strangler migrations, and service meshes address different coupling and failure pressures.", "caller → gateway → service → dependency"],
    ["16. Distributed systems", "Expect partitions, split brain, pauses, clock skew, duplicates, and reordering. Use heartbeats, logical clocks, consensus, gossip, or CRDTs only for a stated need.", "node → message delay/failure → convergence"],
    ["17. Distributed transactions", "Avoid two-phase coordination when an outbox or Saga can preserve business correctness. Make compensations, idempotency, and recovery visible.", "local commit → event → step/compensation"],
    ["18. Scale data structures and processing", "Bloom filters, sketches, geospatial indexes, Merkle trees, batch/stream processing, warehouses, lakehouses, and streaming engines solve scale-specific problems.", "large data → compact structure/pipeline → query"],
    ["19. Deployment and observability", "Use rolling, blue-green, canary, flags, safe migrations, immutable artifacts, logs, metrics, traces, dashboards, and runbooks to make change reversible.", "commit → progressive rollout → signal → rollback"],
    ["20. Security and integrated design", "Protect transport and storage, manage secrets and passwords, enforce RBAC/SSO, then present one complete design with assumptions, failure paths, metrics, and trade-offs.", "identity → policy → encrypted data → audited operation"],
  ].map(([title, lesson, example]) => ({ title, lesson, example, exercise: `Apply ${title.replace(/^\d+\.\s*/, "").toLowerCase()} to a service you are designing and name one failure mode.`, quiz: `What decision does ${title.replace(/^\d+\.\s*/, "").toLowerCase()} make explicit in an interview?` })),
  "java-concurrency-interviews": [
    { title: "1. The three concurrency guarantees", lesson: "Visibility means a thread sees another thread's write; atomicity means an operation cannot be observed halfway; ordering controls which effects become visible first. Volatile helps visibility and ordering, not compound atomicity.", example: "volatile boolean stopped; // visibility\ncount++ is still read → add → write", exercise: "Explain why volatile int is not enough for a shared counter." },
    { title: "2. Locks and immutability", lesson: "Prefer immutable values and narrow critical sections. Choose synchronized or Lock from the invariant and cancellation needs, not from habit.", example: "synchronized (lock) { balance = balance.subtract(amount); }", exercise: "Find the race in a check-then-act withdrawal operation." },
    { title: "3. Executors and backpressure", lesson: "An executor has worker capacity, queue capacity, rejection behavior, and lifecycle. Unbounded queues hide overload until latency and memory fail.", example: "new ThreadPoolExecutor(4, 8, 30, SECONDS, new ArrayBlockingQueue<>(100))", exercise: "Choose a rejection policy for an interactive API and justify it." },
    { title: "4. Futures and cancellation", lesson: "CompletableFuture composes asynchronous work, but cancellation, timeouts, and exception propagation must be explicit. A timeout does not always stop the underlying I/O.", example: "future.orTimeout(500, MILLISECONDS).exceptionally(this::fallback)", exercise: "Design a two-call fan-out with one deadline and partial fallback." },
    { title: "5. Deadlocks and diagnostics", lesson: "Avoid inconsistent lock ordering and blocking while holding locks. Diagnose with thread dumps, lock ownership, queue depth, and contention metrics.", example: "always acquire account locks in ascending accountId order", exercise: "Trace a two-lock deadlock and propose the smallest safe fix." },
    { title: "6. Interview review", lesson: "State the invariant, identify the shared state, select the synchronization boundary, and discuss throughput, fairness, shutdown, and failure behavior.", example: "invariant → boundary → executor → cancellation → measurement", exercise: "Explain a concurrent cache in five minutes." },
  ],
  "sql-performance-interviews": [
    { title: "1. Capture the real problem", lesson: "Record SQL text, parameters, rows returned, duration, frequency, and the data distribution. A query that is fast for one parameter can be slow for another.", example: "query + bind values + actual rows + p95 duration", exercise: "List the evidence you need before adding an index." },
    { title: "2. Read an execution plan", lesson: "Follow scan choice, estimated versus actual rows, join order, sort, and spill. A plan is a hypothesis about cost; compare it with runtime evidence.", example: "index seek → nested loop → lookup → sort", exercise: "Identify a cardinality-estimate error and its likely consequence." },
    { title: "3. Index design", lesson: "Index columns used for selective filters, joins, and ordering in a useful prefix. Avoid indexes that duplicate existing access paths or have poor selectivity.", example: "INDEX (tenant_id, created_at DESC)", exercise: "Choose a composite index for tenant-scoped recent orders." },
    { title: "4. Query shape", lesson: "Keep predicates sargable, avoid accidental functions on indexed columns, select only needed fields, and paginate with a stable key for large result sets.", example: "WHERE created_at >= ? instead of DATE(created_at) = ?", exercise: "Rewrite an offset-heavy pagination query as keyset pagination." },
    { title: "5. Growth and contention", lesson: "Data volume, skew, locks, connection pools, and replica lag change the plan. Consider partitioning, archival, batching, and read/write separation only when evidence supports them.", example: "hot tenant → partition or isolate workload", exercise: "Explain why a query regressed after a tenfold data increase." },
    { title: "6. Prove the fix", lesson: "Benchmark representative parameters, compare p95 and resource cost, verify correctness, and monitor after rollout. Every index has write and storage cost.", example: "before/after plan + latency + CPU + write amplification", exercise: "Define a safe rollout and rollback for a new index." },
  ],
  "distributed-systems-interviews": [
    { title: "1. Failure is normal", lesson: "Messages can be delayed, duplicated, reordered, or lost; nodes can pause; clocks can disagree. Design contracts that remain safe under those conditions.", example: "delivery = at-least-once; handler = idempotent", exercise: "Enumerate failures for a payment event pipeline." },
    { title: "2. Ownership and consistency", lesson: "Give each piece of state an owner and choose consistency per operation. Strong consistency costs coordination; eventual consistency needs convergence and conflict rules.", example: "profile writes: primary; feed reads: eventually consistent replica", exercise: "Choose consistency for inventory reservation versus analytics." },
    { title: "3. Replication and lag", lesson: "Replicas improve availability and read scale but introduce lag, failover, and stale-read behavior. Expose a freshness contract to callers.", example: "read-your-writes token routes a user to the primary briefly", exercise: "Handle a replica that falls behind during a traffic spike." },
    { title: "4. Idempotency and deduplication", lesson: "Use a stable operation key, record the result, and make retries return the same outcome. Deduplicate at the boundary where side effects occur.", example: "(merchantId, requestId) UNIQUE → one charge", exercise: "Prevent duplicate email or payment side effects." },
    { title: "5. Coordination and leader election", lesson: "Consensus helps replicas agree on a decision such as a leader or configuration. Keep the coordinated state small and define behavior when a quorum is unavailable.", example: "lease expiry + fencing token prevents an old leader writing", exercise: "Explain the stale-leader failure and fencing fix." },
    { title: "6. Presenting the design", lesson: "Walk through one request, one dependency failure, recovery, observability, and the first bottleneck at 10x scale. Name the trade-off you intentionally accepted.", example: "path → failure → mitigation → recovery → metric", exercise: "Present a notification system and defend its delivery guarantee." },
  ],
  "behavioral-star-interviews": [
    { title: "1. Build a story bank", lesson: "Collect stories for ownership, conflict, failure, ambiguity, mentoring, and delivery. One story can answer several prompts when the emphasis changes.", example: "story bank: incident, migration, disagreement, mentoring, missed target", exercise: "List six projects and the competency each demonstrates." },
    { title: "2. Situation and Task", lesson: "Set the context in two sentences: system, users, impact, and your responsibility. Avoid team-wide narration that hides your role.", example: "p99 doubled for checkout; I owned the dependency investigation", exercise: "Rewrite a project description into a concrete situation and task." },
    { title: "3. Action with judgement", lesson: "Describe what you decided, what alternatives you rejected, how you collaborated, and how you reduced risk. Use ‘I’ for your contribution and ‘we’ for shared outcomes.", example: "hypothesis → experiment → reversible mitigation → review", exercise: "Add one trade-off and one collaboration detail to a story." },
    { title: "4. Result and learning", lesson: "Quantify the outcome when possible: latency, errors, cost, delivery time, or adoption. End with what you changed in your practice or system.", example: "p95 -38%; added regression alert and runbook", exercise: "Turn a vague success claim into a measurable result." },
    { title: "5. Follow-up handling", lesson: "Expect questions about disagreement, failure, alternatives, and what you would do differently. Answer directly, then connect back to evidence.", example: "answer → evidence → lesson → next step", exercise: "Prepare follow-ups for a failed launch story." },
    { title: "6. Practice and calibration", lesson: "Time stories to 90 seconds, record yourself, remove irrelevant setup, and ask a peer to repeat the decision and outcome. Clarity is the quality bar.", example: "90 sec story → 30 sec follow-up → concise recap", exercise: "Deliver one story and score specificity, ownership, evidence, and learning." },
  ],
  "production-java-reliability": [
    { title: "1. Ownership and invariants", lesson: "Put business rules next to the state they protect. Expose commands rather than mutable fields so invalid transitions are difficult to express.", example: "order.cancel() validates status before mutation", exercise: "List the invariant before and after a payment capture." },
    { title: "2. Concurrency boundaries", lesson: "Choose immutable values where possible, isolate shared state, and define the atomic unit. An executor is a resource with a queue, limit, and shutdown contract.", example: "boundedExecutor.submit(task) rejects when full", exercise: "Explain two concurrent updates to the same account." },
    { title: "3. Persistence and transactions", lesson: "Keep transactions cohesive and short. Translate persistence failures at the domain boundary and never assume a remote call shares the local transaction.", example: "transaction { save(order); save(outboxEvent); }", exercise: "Design a retry-safe outbox publisher." },
    { title: "4. Error handling", lesson: "Separate client errors, transient dependency errors, and programmer defects. Preserve a safe user message while keeping a correlation id for diagnosis.", example: "400 validation | 409 conflict | 503 retryable dependency", exercise: "Choose retry behavior for three failure classes." },
    { title: "5. Observability", lesson: "Instrument the contract: latency, error rate, saturation, queue lag, and freshness. Logs should explain a decision without leaking secrets.", example: "traceId + route + status + duration + dependencyMs", exercise: "Pick one dashboard and one alert for a slow dependency." },
    { title: "6. Performance review", lesson: "Profile allocation, CPU, locks, I/O, and database plans under representative load. Optimize the bottleneck, then verify the user-visible metric improved.", example: "measure → hypothesis → smallest change → benchmark", exercise: "Explain why a microbenchmark can disagree with production latency." },
  ],
  "api-reliability-playbook": [
    { title: "1. Contract first", lesson: "Define resources, validation, pagination, authorization, and error shapes before implementation. Stable semantics matter more than clever endpoints.", example: "PUT /payments/{id} + Idempotency-Key", exercise: "Design a create endpoint safe to repeat after a timeout." },
    { title: "2. Timeouts and budgets", lesson: "Every request needs a deadline propagated to downstream calls. A child timeout must be shorter than the remaining caller budget.", example: "caller 2s → service 1.5s → database 800ms", exercise: "Set budgets for a three-hop request." },
    { title: "3. Retries and idempotency", lesson: "Retry only transient failures, add jitter, cap attempts, and make the operation idempotent with a key or deduplication record.", example: "same key + same intent → same result", exercise: "Prevent duplicate fulfillment after a lost response." },
    { title: "4. Backpressure", lesson: "Bound queues, connections, concurrency, and payload sizes. When capacity is exhausted, reject or degrade deliberately instead of timing out everything.", example: "queue full → 429/503 + Retry-After", exercise: "Choose a shed-load policy for an expensive report." },
    { title: "5. Safe evolution", lesson: "Prefer additive fields, tolerant readers, dual writes, and compatibility windows. Remove old behavior only after clients migrate.", example: "add → observe → migrate → deprecate → remove", exercise: "Roll out a renamed field without breaking old clients." },
    { title: "6. Incident playbook", lesson: "Stabilize first with a reversible action, then gather evidence, mitigate, recover, and document prevention. Every dependency needs an explicit degraded mode.", example: "impact → mitigation → diagnosis → recovery → prevention", exercise: "Walk through a queue backlog and name the first safe actions." },
  ],
  "technical-interview-communication": [
    { title: "1. Clarify the problem", lesson: "Restate the goal, ask for constraints, identify the user and success metric, and call out assumptions before proposing a solution.", example: "What is peak load? What must be strongly consistent?", exercise: "Ask five clarifying questions for a URL shortener." },
    { title: "2. Lead with a mental model", lesson: "Give a one-sentence answer first, then explain the mechanism. Use a small example before discussing edge cases.", example: "A cache is a faster copy with a freshness policy.", exercise: "Explain CAP theorem in three sentences." },
    { title: "3. Show the proof", lesson: "For algorithms, state the invariant and complexity. For systems, trace one request and one failure. For code, name the test that catches the bug.", example: "invariant → transition → boundary → complexity", exercise: "Defend a sliding-window solution without reading code." },
    { title: "4. Discuss alternatives", lesson: "Name one reasonable alternative, why it might win, and why the current choice fits the constraints.", example: "SQL for transactions; document store for flexible aggregates", exercise: "Compare polling and events for notifications." },
    { title: "5. Handle changing requirements", lesson: "Restate what changed, identify the affected boundary, and adapt locally before rewriting everything.", example: "new requirement → impacted contract → smallest adaptation", exercise: "Adapt a single-region design to multi-region reads." },
    { title: "6. Close strongly", lesson: "Summarize the design, trade-off, risk, and next measurement. A concise close makes the answer feel complete.", example: "decision → trade-off → risk → metric → next step", exercise: "Give a five-minute design answer and finish with three metrics." },
  ],
  "design-patterns-in-18-minutes": [
    { title: "1. Choosing a pattern", lesson: "Name the recurring design pressure first: construction, incompatible interfaces, behavior selection, or lifecycle. Choose the smallest abstraction that isolates that pressure.", example: "Client → interface → replaceable implementation", exercise: "Take a large conditional and identify the behavior that could become a Strategy." },
    { title: "2. Creational patterns", lesson: "Factory centralizes a family decision; Builder makes optional construction steps readable; Singleton should be rare because global access hides dependencies.", example: "new User.Builder(requiredName).timezone(zone).build()", exercise: "Compare a Builder with a telescoping constructor and list the validation boundary." },
    { title: "3. Structural patterns", lesson: "Adapter translates an existing contract, Facade simplifies a subsystem, Proxy controls access or loading, Decorator adds behavior, and Composite treats trees uniformly.", example: "PaymentProcessor adapter → external gateway", exercise: "Design a facade for publishing a video and identify which services remain hidden." },
    { title: "4. Behavioral patterns", lesson: "Strategy swaps an algorithm, Observer broadcasts events, State models transitions, Command captures an action, and Chain of Responsibility passes a request through handlers.", example: "RoutePlanner(strategy).buildRoute(start, end)", exercise: "Choose between Observer and a durable queue for an order-shipped workflow." },
    { title: "5. Composition and testing", lesson: "Prefer composition when behavior varies independently. Inject collaborators at boundaries, test each policy in isolation, and keep integration tests for wiring and delivery guarantees.", example: "Service(new FakeClock(), new InMemoryRepository())", exercise: "Write the test seams for a decorator chain and a factory-created dependency." },
    { title: "6. Interview design review", lesson: "Explain participants, collaboration, invariant, trade-off, and the change the pattern makes safe. Also explain when you would not use it.", example: "problem → participants → interaction → trade-off → test", exercise: "Present one pattern in two minutes, then defend its complexity and failure modes." },
  ],
  "learn-low-level-design-from-zero": [
    { title: "1. Requirements before classes", lesson: "Identify actors, commands, queries, constraints, lifecycle, and failure behavior. Ambiguous requirements create accidental complexity later.", example: "Actor → use case → domain rule → observable result", exercise: "Write functional and quality requirements for a parking lot." },
    { title: "2. Responsibilities and invariants", lesson: "Give each object one cohesive responsibility and guard its invariants behind methods. Do not expose mutable collections or allow invalid transitions.", example: "ticket.close(exitTime) validates state before mutation", exercise: "List the invariants for a library loan and decide which object owns each one." },
    { title: "3. Interfaces and policies", lesson: "Introduce an interface where a policy varies—pricing, placement, notification, or persistence. Keep stable orchestration code dependent on that interface.", example: "PricingPolicy.price(stay, vehicle)", exercise: "Add a weekend pricing policy without changing checkout." },
    { title: "4. Modeling relationships", lesson: "Use composition for ownership, associations for collaboration, and inheritance only for a true substitutable type. Draw a sequence for one important use case.", example: "ParkingLot → PlacementPolicy → Slot", exercise: "Explain whether VehicleType should be an enum, subtype, or policy input." },
    { title: "5. State, errors, and concurrency", lesson: "Make lifecycle states explicit, return safe domain errors, and decide who owns locks or atomicity when multiple callers race. Avoid hidden shared mutable state.", example: "AVAILABLE → HELD → OCCUPIED → RELEASED", exercise: "Handle two drivers claiming the last available slot concurrently." },
    { title: "6. Testing and evolution", lesson: "Start with domain tests, add contract tests at interfaces, then integration tests for adapters. New requirements should result in a small, local change.", example: "given state + command → expected state + events", exercise: "Refactor a conditional-heavy design and explain the before/after coupling." },
  ],
  "leetcode-patterns": [
    { title: "1. Complexity and invariants", lesson: "Start every solution by naming the input size, the target complexity, and the invariant that remains true after each loop iteration. This turns code generation into a proof-driven process.", example: "Invariant: every element left of `left` has already been ruled out for the current answer.", exercise: "For a two-sum problem, explain why sorting changes the problem and how the two pointers preserve correctness." },
    { title: "2. Hash maps and prefix state", lesson: "Use a map when the answer depends on a value seen earlier. Prefix sums turn repeated range totals into constant-time differences; storing the earliest index often maximizes the later window.", example: "prefix += value; if (firstIndex.containsKey(prefix - target)) best = Math.max(best, i - firstIndex.get(prefix - target));", exercise: "Solve longest subarray with sum k and test negative values, zeros, and an empty input." },
    { title: "3. Two pointers", lesson: "Two pointers work when movement is monotonic: sorted arrays, partitions, or a left/right boundary that only advances. Prove why moving one pointer cannot skip a better answer.", example: "while (left < right) { if (sum < target) left++; else right--; }", exercise: "Compare a sorted two-sum solution with a hash-map solution and state the memory trade-off." },
    { title: "4. Sliding windows", lesson: "Maintain a contiguous window with add, shrink, and record operations. The loop is linear when each element enters and leaves at most once.", example: "while (!valid(window)) remove(nums[left++]); best = Math.max(best, right - left + 1);", exercise: "Build the window for longest substring without repeats and identify the exact condition that triggers shrinking." },
    { title: "5. Stacks and monotonic stacks", lesson: "A stack models nested work; a monotonic stack answers next-greater or next-smaller questions by discarding candidates that can never win later.", example: "while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) answer[stack.pop()] = nums[i]; stack.push(i);", exercise: "Trace daily temperatures and count how many times each index is pushed and popped." },
    { title: "6. Binary search on an answer", lesson: "Binary search is not limited to locating a value. If feasibility is monotonic, search the smallest or largest answer that satisfies a predicate.", example: "if (canFinish(mid)) high = mid; else low = mid + 1;", exercise: "Define a monotonic predicate for minimum ship capacity and prove its boundary behavior." },
    { title: "7. Trees, graphs, and traversal state", lesson: "DFS carries path state; BFS carries distance layers; visited state prevents repeated work. Choose recursion, an explicit stack, or a queue based on depth and memory limits.", example: "queue.add(start); while (!queue.isEmpty()) for (Node next : neighbors(queue.remove())) visit(next);", exercise: "Explain when topological sorting is valid and how a cycle is detected." },
    { title: "8. Dynamic programming and review", lesson: "Define a state, transition, base case, and evaluation order. Optimize memory only after the recurrence is correct, then review with adversarial boundaries and a complexity proof.", example: "dp[i] = Math.max(dp[i - 1], dp[i - 2] + value[i]);", exercise: "Turn a recursive Fibonacci recurrence into bottom-up DP and then into O(1) space." },
  ],
  "system-design-concepts": [
    { title: "1. Requirements and workload", lesson: "Separate functional requirements from quality attributes. Estimate peak requests, object sizes, retention, read/write ratio, and geographic distribution before drawing components.", example: "storage/day = writes_per_second × average_record_bytes × 86,400", exercise: "Estimate storage and bandwidth for a photo-sharing service at 10 million daily uploads." },
    { title: "2. APIs and data ownership", lesson: "Define commands, queries, identity, pagination, idempotency keys, and ownership boundaries. A clear API prevents accidental coupling between services.", example: "PUT /payments/{id} with Idempotency-Key makes a retry safe.", exercise: "Design APIs for creating, reading, and deleting a user notification while preserving authorization." },
    { title: "3. Partitioning and replication", lesson: "Replication improves read capacity and availability; partitioning spreads data and writes. Both introduce lag, routing, rebalancing, and consistency decisions.", example: "partition = hash(tenantId) % shardCount; route reads to replicas only when staleness is acceptable.", exercise: "Choose a partition key for a multi-tenant event stream and explain the hot-tenant failure mode." },
    { title: "4. Caching and CDNs", lesson: "Cache only data with a clear freshness and invalidation policy. Define TTL, stale behavior, stampede protection, and what happens when the cache is empty or wrong.", example: "request → CDN → service cache → database; single-flight refill prevents a thundering herd.", exercise: "Design cache invalidation for a user's profile after an update." },
    { title: "5. Queues and event-driven work", lesson: "Queues absorb bursts and decouple slow consumers. At-least-once delivery means handlers must be idempotent, poison messages need a dead-letter path, and lag needs an alert.", example: "write transaction + outbox row → publisher → queue → idempotent consumer", exercise: "Explain how to retry a failed email without sending duplicates." },
    { title: "6. Reliability and failure recovery", lesson: "Design timeouts, bounded retries with jitter, circuit breakers, load shedding, graceful degradation, backups, and a recovery objective. Mitigation should be safer than diagnosis.", example: "timeout < caller deadline; retry only transient errors; cap attempts and emit a retry metric.", exercise: "Walk through a database outage and identify the user-visible behavior at each layer." },
    { title: "7. Security and observability", lesson: "Apply authentication, authorization, encryption, rate limits, audit logs, and safe handling of secrets. Instrument latency, errors, saturation, freshness, and trace correlation.", example: "requestId + tenantId + route + status + latency (without tokens or personal data)", exercise: "Choose four alerts for a queue-backed API and explain the action each alert triggers." },
    { title: "8. Capacity review", lesson: "Close the design by identifying the first bottleneck at 10x load, the migration or rebalancing plan, and the trade-off you would revisit. A design is complete when it can be operated and changed.", example: "traffic growth → shard split → dual-write validation → cutover → rollback window", exercise: "Present the design in five minutes, then defend one consistency and one cost decision." },
  ],
  "system-design-handbook": [
    ...[
      ["1. Scalability", "Scale vertically for simplicity, horizontally for capacity, and partition state when one node is no longer enough. Distinguish stateless compute from stateful storage."],
      ["2. Availability", "Availability is a user-visible contract. Remove single points of failure, define failover, and state what degraded behavior is acceptable."],
      ["3. Latency vs throughput", "Latency is time for one operation; throughput is completed work per unit time. Batching can raise throughput while increasing tail latency."],
      ["4. CAP theorem", "During a network partition, a distributed system must choose whether to reject or serve potentially stale data. State the consistency decision per operation."],
      ["5. Load balancers", "Distribute traffic with health checks, connection draining, and a routing policy. Beware uneven sessions, hot tenants, and retry amplification."],
      ["6. Databases", "Choose relational or non-relational storage from access patterns, transaction needs, and evolution cost. Index only selective, supported queries."],
      ["7. CDN", "Place cacheable, immutable or versioned content near users. Define purge, expiry, origin protection, and privacy boundaries."],
      ["8. Message queues", "Queues smooth bursts and isolate failures. Consumers need idempotency, ordering rules, visibility timeouts, and dead-letter handling."],
      ["9. Rate limiting", "Protect a service with token bucket, leaky bucket, or fixed/sliding windows. Decide whether limits apply per user, tenant, credential, or route."],
      ["10. Database indexes", "An index accelerates reads by maintaining an additional access structure, but costs write work and storage. Verify selectivity and query plans."],
      ["11. Caching", "Caching trades freshness and complexity for speed. Document ownership, invalidation, TTL, stampede protection, and stale-read behavior."],
      ["12. Consistent hashing", "A ring maps keys to nodes while minimizing movement during membership changes. Virtual nodes improve balance; rebalancing still needs capacity planning."],
      ["13. Database sharding", "Sharding increases write and storage capacity but complicates joins, transactions, migrations, and hot-key handling. Choose a stable shard key."],
      ["14. Consensus algorithms", "Consensus lets replicas agree on a value despite failures. It is useful for leadership or configuration, not as a default for every business write."],
    ].map(([title, lesson]) => ({ title, lesson, example: "Interview move: define the contract, name the failure mode, and state the trade-off before selecting a technology.", exercise: `Explain ${title.toLowerCase()} for a service you have built or can model.` })),
  ],
};

const DSA_20_PATTERNS = [
  ["Prefix Sum", "Precompute cumulative state so range queries and target-sum checks become constant-time lookups.", "prefix[right + 1] - prefix[left]"],
  ["Two Pointers", "Move monotonic boundaries to reduce pair and partition searches from quadratic to linear time.", "left < right → adjust the pointer that cannot produce the target"],
  ["Sliding Window", "Maintain a valid contiguous range while adding on the right and removing from the left.", "expand → shrink until valid → record best"],
  ["Fast & Slow Pointers", "Use different pointer speeds to find cycles, middles, and meeting points.", "slow = slow.next; fast = fast.next.next"],
  ["Linked List In-place Reversal", "Reverse links with constant extra space by preserving the next node before rewiring.", "next = curr.next; curr.next = prev"],
  ["Frequency Counting", "Trade space for time with a map or bounded array of occurrence counts.", "freq.put(value, freq.getOrDefault(value, 0) + 1)"],
  ["Monotonic Stack", "Keep candidates ordered so each element is pushed and popped once for next-greater or span queries.", "pop while current breaks the stack order"],
  ["Bit Manipulation", "Use binary identities such as x ^ x = 0 and n & (n - 1) to encode compact state.", "(n & (n - 1)) == 0 checks a power of two"],
  ["Top K Elements", "Maintain a heap of size k instead of sorting every value when only extremes matter.", "min-heap size k retains the k largest values"],
  ["Overlapping Intervals", "Sort by start, then merge or schedule using the relationship between the current end and next start.", "overlap when currentEnd >= nextStart"],
  ["Modified Binary Search", "Search rotated data or a monotonic predicate by proving which half remains viable.", "sorted half + target bounds choose the next interval"],
  ["Binary Tree Traversal", "Choose preorder, inorder, or postorder based on whether work belongs before, between, or after children.", "inorder(BST) visits values in sorted order"],
  ["Depth-First Search (DFS)", "Explore one branch deeply while carrying path state and a visited invariant.", "visit → recurse on unvisited neighbors → backtrack"],
  ["Breadth-First Search (BFS)", "Process distance layers with a queue; the first visit is shortest in an unweighted graph.", "queue of frontier nodes → next level"],
  ["Shortest Path", "Use Dijkstra for non-negative weights and choose a relaxation strategy that matches edge constraints.", "dist[next] = min(dist[next], dist[node] + weight)"],
  ["Matrix Traversal", "Treat a grid as an implicit graph with explicit boundary and direction checks.", "four directions + visited prevents revisiting cells"],
  ["Backtracking", "Make a choice, explore, and undo it to enumerate constrained combinations without leaking state.", "choose → recurse → unchoose"],
  ["Prefix Search (Trie)", "Store characters along shared paths for fast prefix lookup and autocomplete.", "root → character edges → terminal marker"],
  ["Greedy", "Make a locally optimal choice only when an exchange or dominance argument proves global optimality.", "sort by finish time → take the next compatible interval"],
  ["Dynamic Programming Patterns", "Define state, transition, base case, and order when subproblems overlap.", "dp[state] = best/count of smaller states"],
].map(([name, lesson, example]) => ({
  title: name,
  lesson,
  example,
  whenToUse: `Use ${name} when the input has a recognizable ${name.toLowerCase()} structure and a direct brute-force approach repeats work.`,
  walkthrough: `Walk a small example by hand: identify the state, apply one transition at a time, verify the invariant after each transition, and finish by checking the boundary case.`,
  practiceProblems: `Practice set: one easy recognition problem, one medium implementation problem, and one variation that breaks the naive assumption.`,
  diagram: `input → ${name} state → invariant → answer`,
  exercise: `Solve one ${name} problem, state the invariant, and explain the O(?) time and space bounds.`,
  quiz: `When is ${name} the right shape, and what edge case breaks a naive implementation?`,
}));
COURSE_CHAPTERS["leetcode-patterns"] = DSA_20_PATTERNS;

const INDUSTRY_DESIGN_PATTERNS = [
  ["Factory Method", "Create one product behind a stable method so callers do not depend on concrete classes.", "Notification channels, parsers, payment providers.", "Do not hide a simple constructor behind a factory with no variation."],
  ["Abstract Factory", "Create families of related objects that must work together.", "Cloud-specific storage, UI themes, database drivers.", "Keep the family small; otherwise configuration becomes opaque."],
  ["Builder", "Assemble a valid object step by step when options are numerous.", "Immutable requests, configuration, test fixtures.", "Validate required fields at build time."],
  ["Adapter", "Translate an incompatible interface into the contract your code owns.", "Legacy gateway, third-party SDK, old data format.", "Keep translation at the boundary, not throughout the domain."],
  ["Facade", "Expose a small workflow API over a complicated subsystem.", "Checkout, video publishing, onboarding.", "Do not turn the facade into a god object."],
  ["Proxy", "Stand in front of an object to control access, loading, caching, or remoting.", "Lazy images, authorization, remote clients.", "Make latency and failure behavior visible to callers."],
  ["Decorator", "Add behavior by wrapping an object without changing its class.", "Logging, retries, tracing, compression.", "Avoid deep, order-sensitive wrapper chains."],
  ["Composite", "Treat a tree of individual and group objects through one interface.", "File systems, UI components, rule groups.", "Define behavior clearly for empty groups."],
  ["Strategy", "Swap an algorithm behind a common contract.", "Pricing, routing, validation, ranking.", "Use a function when there is no meaningful object state."],
  ["Observer", "Notify multiple listeners when a subject changes.", "UI events, domain notifications, metrics hooks.", "Define listener lifecycle, ordering, and error isolation."],
  ["State", "Represent lifecycle-specific behavior as explicit state objects or transitions.", "Orders, workflows, connection states.", "Keep illegal transitions impossible or explicitly rejected."],
  ["Command", "Represent an action as an object that can be queued, retried, logged, or undone.", "Jobs, audit trails, transactional actions.", "Do not add serialization complexity without a need to persist actions."],
  ["Template Method", "Fix an algorithm skeleton while allowing safe variation in steps.", "Import pipelines, request processing.", "Prefer composition when variation is frequent or cross-cutting."],
  ["Chain of Responsibility", "Pass a request through handlers until one handles or rejects it.", "Middleware, authorization, validation, support escalation.", "Make ordering and the unhandled case explicit."],
  ["Mediator", "Centralize collaboration so many peers do not depend directly on each other.", "Workflow coordination, UI widgets, chat rooms.", "Keep the mediator cohesive instead of making it a hidden god object."],
  ["Repository", "Separate domain logic from persistence access through a collection-like interface.", "Aggregates, test doubles, storage migrations.", "Do not leak query-specific persistence details into the domain."],
  ["Unit of Work", "Track related changes and commit them as one consistency boundary.", "Batch updates, ORM sessions, transactional workflows.", "Define conflict, retry, and rollback behavior."],
  ["Dependency Injection", "Provide collaborators from outside so policy and infrastructure can vary independently.", "Services, adapters, clocks, feature flags.", "Keep object graphs understandable; injection is not a substitute for design."],
].map(([name, intent, use, caution]) => ({ name, intent, use, caution }));

function enrichChapter(chapter, index) {
  const whenToUse = chapter.whenToUse || "Use this pattern when its input shape matches the chapter problem and a brute-force approach repeats work.";
  const practiceProblems = chapter.practiceProblems || "Practice set: one recognition problem, one implementation problem, and one variation that breaks the naive assumption.";
  const walkthrough = chapter.walkthrough || "Work through this chapter in three passes: first explain the idea in plain language, then trace the example with a small input, and finally test the boundary case that could invalidate the assumption.";
  return {
    ...chapter,
    lesson: `${chapter.lesson} When to use: ${whenToUse}`,
    whenToUse,
    diagram: chapter.diagram || `input → ${chapter.title.replace(/^\d+\.\s*/, "")} → verified output`,
    walkthrough,
    example: `${chapter.example}\n\nWalkthrough prompt: ${walkthrough}`,
    practiceProblems,
    exercise: `${chapter.exercise} Practice set: ${practiceProblems}`,
    quiz: chapter.quiz || `What invariant or contract must remain true after completing ${chapter.title.replace(/^\d+\.\s*/, "").toLowerCase()}?`,
    order: index + 1,
  };
}

export function listTechBlogs() {
  return TECH_BLOGS.map((blog) => ({ ...blog, patterns: blog.id === "design-patterns-in-18-minutes" ? INDUSTRY_DESIGN_PATTERNS : [], chapters: (COURSE_CHAPTERS[blog.id] || []).map(enrichChapter) }));
}
