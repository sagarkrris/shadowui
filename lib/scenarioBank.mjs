export const SCENARIO_BANK_TRACKS = [
  {
    key: "java",
    label: "Java",
    icon: "ti-cup",
    description: "Core Java, JVM, concurrency, Spring Boot, testing, and design-pattern scenarios.",
  },
  {
    key: "database",
    label: "Database",
    icon: "ti-database",
    description: "Scenario drills for PostgreSQL, MySQL, MongoDB, and Redis.",
  },
];

export const RECENT_SCENARIO_BANK_ROUNDS = [
  "All",
  "Recruiter",
  "Coding",
  "System Design",
  "Behavioral",
  "Hiring Manager",
  "Bar Raiser",
];

export const RECENT_SCENARIO_BANK_LEVELS = ["All", "Junior", "Mid", "Senior", "Staff+"];

export const DATABASE_ENGINES = [
  { key: "postgresql", label: "PostgreSQL", family: "relational" },
  { key: "mysql", label: "MySQL", family: "relational" },
  { key: "mongodb", label: "MongoDB", family: "document" },
  { key: "redis", label: "Redis", family: "cache" },
];

export const SCENARIO_BANK_DIFFICULTIES = ["Beginner", "Mid", "Senior"];
export const SCENARIO_BANK_MODES = ["Learn", "Timed Drill", "Mock Interview"];
export const SCENARIO_BANK_STORAGE_KEY = "interviewiq:scenario-bank:v1";

const SCENARIO_BANK_STORAGE_VERSION = 1;
const SCENARIO_VARIANT_MULTIPLIER = 8;

const JAVA_TOPICS = [
  { key: "core-java", label: "Core Java" },
  { key: "collections", label: "Collections" },
  { key: "streams", label: "Streams" },
  { key: "concurrency", label: "Concurrency" },
  { key: "jvm", label: "JVM" },
  { key: "exceptions", label: "Exceptions" },
  { key: "generics", label: "Generics" },
  { key: "spring-boot", label: "Spring Boot" },
  { key: "testing", label: "Testing" },
  { key: "design-patterns", label: "Design Patterns" },
];

const DATABASE_TOPICS = {
  postgresql: [
    { key: "query-design", label: "Query Design" },
    { key: "indexes", label: "Indexes" },
    { key: "transactions", label: "Transactions" },
    { key: "schema-design", label: "Schema Design" },
    { key: "locks", label: "Locks" },
    { key: "replication", label: "Replication Basics" },
  ],
  mysql: [
    { key: "query-design", label: "Query Design" },
    { key: "indexes", label: "Indexes" },
    { key: "transactions", label: "Transactions" },
    { key: "locks", label: "Locks" },
    { key: "tuning", label: "Tuning" },
    { key: "replication", label: "Replication Basics" },
  ],
  mongodb: [
    { key: "document-modeling", label: "Document Modeling" },
    { key: "indexes", label: "Indexes" },
    { key: "aggregation", label: "Aggregation" },
    { key: "consistency", label: "Consistency" },
    { key: "sharding", label: "Sharding" },
    { key: "schema-evolution", label: "Schema Evolution" },
  ],
  redis: [
    { key: "caching-patterns", label: "Caching Patterns" },
    { key: "eviction", label: "Eviction" },
    { key: "locks", label: "Locks" },
    { key: "pubsub", label: "Pub/Sub" },
    { key: "streams", label: "Streams" },
    { key: "data-structures", label: "Data Structures" },
  ],
};

const SCENARIO_SEEDS = [
  {
    id: "java-equals-hashcode-cache-key",
    track: "java",
    topic: "core-java",
    title: "Broken Cache Key After Refactor",
    difficulty: "Mid",
    prompt: "A Java service uses a custom `CustomerKey` object as a key in a `HashMap` cache. After a refactor, cache hits dropped and memory usage increased. What would you inspect and how would you fix it?",
    interviewerIntent: "Tests object equality, hash-based collections, immutability, and production debugging.",
    answerOutline: [
      "Inspect whether `equals` and `hashCode` are both implemented and still use the same immutable fields.",
      "Check if key fields are mutated after insertion into the `HashMap`.",
      "Add focused unit tests for equal keys, unequal keys, and map lookup behavior.",
      "Prefer immutable key objects or records when the key is value-based.",
    ],
    deepDive: "Hash-based collections depend on stable `hashCode` and equality semantics. If `equals` changes without a matching `hashCode`, logically equal keys land in different buckets. If fields used for hashing mutate after insertion, the map cannot find the entry reliably. A senior fix verifies the key contract, makes key fields final where possible, adds tests for map lookup using equivalent instances, and checks cache metrics after rollout.",
    traps: [
      "Overriding `equals` but not `hashCode`.",
      "Using mutable fields inside `hashCode`.",
      "Fixing by increasing cache size instead of correcting key identity.",
    ],
    followUps: [
      "How would a Java record help here?",
      "What happens if two unequal keys share the same hash code?",
      "How would you detect this issue from metrics?",
    ],
    rubric: [
      "Explains the equality/hashCode contract.",
      "Identifies mutability as a cache-key risk.",
      "Proposes tests and rollout validation.",
    ],
  },
  {
    id: "java-thread-pool-saturation",
    track: "java",
    topic: "concurrency",
    title: "Thread Pool Saturation During Checkout",
    difficulty: "Senior",
    prompt: "Your Spring Boot checkout API uses a fixed thread pool to call payment, inventory, and notification services. During a flash sale, latency spikes and requests start timing out even though CPU is only at 45%. Walk through how you would diagnose and fix it.",
    interviewerIntent: "Tests concurrency fundamentals, queueing, timeout budgets, backpressure, and production debugging.",
    answerOutline: [
      "Check executor queue depth, active threads, rejection counts, downstream latency, and request timeout budgets.",
      "Separate critical synchronous work from async side effects and avoid blocking inside shared pools.",
      "Add bounded queues, sane rejection/backpressure behavior, bulkheads, and per-call timeouts.",
      "Load test the new pool sizing and watch p95/p99 latency, saturation, and error rates.",
    ],
    deepDive: "A senior answer starts by proving saturation instead of increasing thread count blindly. Inspect thread dumps, executor metrics, downstream timings, and whether tasks block on remote calls or locks. Payment and inventory may need bounded, separate pools because they have different latency and failure profiles. Notification should move to an async queue after the order state is durable. Use timeouts shorter than the request SLA, circuit breakers for failing dependencies, and backpressure when queue depth grows. Increasing the pool can help only after checking CPU, memory, context switching, and downstream capacity.",
    traps: [
      "Increasing max threads without checking blocking calls or downstream limits.",
      "Using an unbounded queue that hides overload until latency explodes.",
      "Running notification side effects on the checkout critical path.",
    ],
    followUps: [
      "How would you size the pool for blocking IO versus CPU work?",
      "What metrics tell you the system is shedding load correctly?",
      "How would virtual threads change your design?",
    ],
    rubric: [
      "Correctly identifies saturation and queueing evidence.",
      "Explains isolation, timeout budgets, and backpressure.",
      "Discusses trade-offs between throughput, latency, and reliability.",
    ],
  },
  {
    id: "java-linkedhashset-dedup-events",
    track: "java",
    topic: "collections",
    title: "Deduplicate Events While Preserving Arrival Order",
    difficulty: "Mid",
    prompt: "A service receives duplicate event ids from multiple producers. You must return the first 500 unique ids in arrival order. Which Java collection choices would you consider and what are the trade-offs?",
    interviewerIntent: "Tests collection semantics, Big-O, ordering, memory, and practical API choice.",
    answerOutline: [
      "Use `LinkedHashSet` when insertion order and uniqueness are both required.",
      "Stop once 500 unique ids are collected to avoid unnecessary work.",
      "Discuss memory overhead versus `HashSet` and when a stream pipeline is less clear.",
    ],
    deepDive: "`LinkedHashSet` is the direct fit because it combines hash-based lookup with insertion-order iteration. The algorithm scans events, adds each id, and stops when the set size reaches 500. Average insertion is O(1), while memory is higher than `HashSet` due to linked ordering pointers. If concurrency is needed, collect per partition or guard access; do not assume `LinkedHashSet` is thread-safe. For very large streams, consider batching or a bounded dedup window.",
    traps: [
      "Using `HashSet` and losing stable order.",
      "Sorting ids, which changes arrival semantics.",
      "Collecting the entire stream when only 500 unique ids are needed.",
    ],
    followUps: [
      "How would you handle a stream with millions of ids?",
      "What changes if duplicates are only relevant within a 10-minute window?",
    ],
    rubric: [
      "Chooses a collection that matches uniqueness and ordering.",
      "Explains complexity and memory trade-offs.",
      "Recognizes thread-safety and bounded processing concerns.",
    ],
  },
  {
    id: "spring-transaction-event-publish-failure",
    track: "java",
    topic: "spring-boot",
    title: "Payment Saved But Event Publish Fails",
    difficulty: "Senior",
    prompt: "A Spring Boot payment service saves a successful payment in the database and then publishes an event to Kafka. Sometimes the DB commit succeeds but Kafka publish fails, so downstream order status is stale. How would you redesign this?",
    interviewerIntent: "Tests transaction boundaries, outbox pattern, idempotency, and distributed consistency.",
    answerOutline: [
      "Do not rely on a DB transaction and Kafka publish as one atomic operation.",
      "Write an outbox record in the same DB transaction as the payment state.",
      "Publish outbox records asynchronously with retries and idempotent consumers.",
    ],
    deepDive: "The reliable design is a transactional outbox. The payment row and outbox event are committed together in the same database transaction. A poller or CDC pipeline publishes the event to Kafka and marks it sent after success. Consumers must be idempotent because retries can duplicate messages. This favors eventual consistency but avoids the split-brain state where payment is saved without a durable intent to notify downstream systems.",
    traps: [
      "Wrapping Kafka publish in `@Transactional` and assuming it commits atomically with the database.",
      "Ignoring duplicate delivery during retry.",
      "Publishing before the DB commit and letting consumers observe state that may roll back.",
    ],
    followUps: [
      "Would you use polling or CDC for the outbox?",
      "How do you make consumers idempotent?",
      "What monitoring would you add for stuck outbox records?",
    ],
    rubric: [
      "Identifies the dual-write problem.",
      "Proposes durable outbox/event relay with retries.",
      "Explains eventual consistency and duplicate handling.",
    ],
  },
  {
    id: "postgresql-composite-index-dashboard",
    track: "database",
    engine: "postgresql",
    topic: "indexes",
    title: "Slow Multi-Tenant Dashboard Query",
    difficulty: "Senior",
    prompt: "A PostgreSQL dashboard query filters by `tenant_id`, `status`, and a recent `created_at` range, then orders by `created_at desc` with a limit of 50. It is slow for large tenants. How would you design and validate an index?",
    interviewerIntent: "Tests composite index ordering, selectivity, query plans, and production-safe validation.",
    answerOutline: [
      "Inspect `EXPLAIN ANALYZE` for scan type, rows removed, sort, and buffer reads.",
      "Consider a composite index such as `(tenant_id, status, created_at desc)` for the filter and order.",
      "Validate with realistic tenant cardinality and avoid adding unused write-heavy indexes.",
    ],
    deepDive: "For this query shape, `tenant_id` and `status` are equality filters and `created_at` is both range and ordering. A composite index starting with equality columns followed by `created_at desc` can let PostgreSQL filter and return the latest rows without a large sort. Validate with `EXPLAIN (ANALYZE, BUFFERS)` on realistic data, compare planning estimates to actual rows, and check whether a partial index by active statuses is justified. Consider write overhead and index bloat before shipping.",
    traps: [
      "Adding separate indexes on each column and expecting PostgreSQL to always combine them well.",
      "Ignoring sort cost for `ORDER BY created_at desc LIMIT 50`.",
      "Testing only on tiny development data.",
    ],
    followUps: [
      "When would a partial index be better?",
      "How would you roll this index out without locking writes?",
      "What if the query also searches by optional customer id?",
    ],
    rubric: [
      "Uses query-plan evidence rather than guessing.",
      "Explains composite index column order.",
      "Covers write overhead and rollout risk.",
    ],
  },
  {
    id: "mysql-deadlock-inconsistent-update-order",
    track: "database",
    engine: "mysql",
    topic: "transactions",
    title: "Deadlock From Inconsistent Row Update Order",
    difficulty: "Senior",
    prompt: "Two MySQL code paths update `account_balance` and `ledger_entry` in opposite order. Under load, InnoDB reports deadlocks. What would you investigate and how would you fix it?",
    interviewerIntent: "Tests transaction isolation, lock ordering, deadlock handling, and idempotent retries.",
    answerOutline: [
      "Read the latest InnoDB deadlock report and identify lock order and indexes used.",
      "Make all code paths acquire locks in a consistent order.",
      "Keep transactions short and retry deadlock victims safely.",
    ],
    deepDive: "Deadlocks are normal in transactional systems but frequent deadlocks indicate inconsistent lock ordering or poor indexes. Use `SHOW ENGINE INNODB STATUS` or performance schema to inspect the deadlock graph. Ensure both code paths lock account rows before ledger rows, and use indexes that avoid broad range locks. Keep transactions short and avoid remote calls inside them. Add retry with idempotency so a rolled-back victim can safely re-run.",
    traps: [
      "Disabling transactions to avoid deadlocks.",
      "Retrying without idempotency keys.",
      "Ignoring missing indexes that expand lock scope.",
    ],
    followUps: [
      "How does isolation level affect locking behavior?",
      "What would you log to diagnose future deadlocks?",
    ],
    rubric: [
      "Reads deadlock evidence and identifies lock order.",
      "Proposes consistent locking and short transactions.",
      "Handles retries without double-applying business actions.",
    ],
  },
  {
    id: "mongodb-unbounded-feed-document",
    track: "database",
    engine: "mongodb",
    topic: "document-modeling",
    title: "User Feed Document Grows Without Bound",
    difficulty: "Mid",
    prompt: "A MongoDB app stores every feed item inside a single user document array. Popular users now have huge documents and updates are slowing down. How would you remodel it?",
    interviewerIntent: "Tests document modeling, bounded arrays, read patterns, and index strategy.",
    answerOutline: [
      "Identify that unbounded arrays create large documents and expensive updates.",
      "Move feed items into a separate collection or bucketed documents.",
      "Index by user id and feed timestamp for paginated reads.",
    ],
    deepDive: "MongoDB modeling should follow access patterns, but unbounded arrays are dangerous because documents grow, updates rewrite more data, and document size limits become a risk. A separate `feed_items` collection keyed by `user_id` and timestamp supports pagination and retention. For very high volume, bucket feed items by user and time window. Add indexes that match read patterns and keep only small summary fields on the user document.",
    traps: [
      "Embedding every child record because MongoDB supports documents.",
      "Ignoring the 16 MB document limit.",
      "Creating indexes that do not match pagination queries.",
    ],
    followUps: [
      "When would embedding still be correct?",
      "How would you handle fan-out for celebrity users?",
    ],
    rubric: [
      "Recognizes the unbounded array modeling issue.",
      "Proposes a model aligned to read and write patterns.",
      "Discusses indexing, retention, and pagination.",
    ],
  },
  {
    id: "redis-cache-stampede",
    track: "database",
    engine: "redis",
    topic: "caching-patterns",
    title: "Hot Key Cache Stampede",
    difficulty: "Senior",
    prompt: "A hot Redis key for product pricing expires during peak traffic. Thousands of requests miss the cache and hit PostgreSQL at the same time. How would you prevent this?",
    interviewerIntent: "Tests caching strategy, TTL design, locking, stale data trade-offs, and failure behavior.",
    answerOutline: [
      "Use TTL jitter so hot keys do not expire together.",
      "Use request coalescing or a short Redis lock so one worker refreshes while others wait or serve stale.",
      "Consider stale-while-revalidate for safe data and monitor lock failures.",
    ],
    deepDive: "A cache stampede happens when many requests recompute the same value after expiry. Add TTL jitter to spread expirations and use single-flight/request coalescing so one process refreshes the key. For Redis, a short lock with an expiry can work, but the system must handle lock holder failure and avoid long blocking. For pricing, decide whether stale-while-revalidate is safe; if stale data is risky, use shorter waits and controlled fallback. Monitor hit rate, refresh latency, database load, and lock contention.",
    traps: [
      "Setting the same TTL for every hot key.",
      "Using a Redis lock without expiration.",
      "Serving stale pricing without checking business correctness.",
    ],
    followUps: [
      "When is stale-while-revalidate safe?",
      "How would you warm hot keys before a sale?",
      "What metrics prove the fix works?",
    ],
    rubric: [
      "Explains why stampedes happen.",
      "Uses jitter, coalescing, or lock-based refresh safely.",
      "Discusses stale data and failure trade-offs.",
    ],
  },
];

const RECENT_SCENARIO_REPORTS = [
  {
    id: "google-ai-code-comprehension-2026",
    company: "Google",
    round: "Coding",
    level: "Junior",
    track: "java",
    topic: "core-java",
    title: "AI-assisted code comprehension and debugging",
    freshnessLabel: "Publicly reported in May 2026",
    confidence: "High confidence",
    trapType: "Execution trap",
    prompt: "You are given an existing service code path and allowed an approved AI assistant. Walk through how you would read, validate, debug, and improve the code without blindly trusting AI output.",
    interviewerIntent: "Tests whether the candidate can use AI as a force multiplier while still showing independent debugging judgment, code reading skill, and validation discipline.",
    candidateTrap: "Candidates often treat AI output as the answer instead of explaining how they would verify behavior, edge cases, and performance impact.",
    answerOutline: [
      "Start by restating the goal, inputs, and failure symptoms before touching the AI assistant.",
      "Use AI to summarize unfamiliar code or suggest hypotheses, but validate every claim against the actual code and tests.",
      "Explain how you would confirm correctness, measure performance changes, and check regressions.",
      "Call out where AI is useful and where human judgment is still required.",
    ],
    polishedAnswer: "A strong answer is that I would use the AI assistant to accelerate code comprehension and hypothesis generation, not to outsource judgment. I would first understand the failing path, reproduce the issue, and identify the expected behavior. Then I would use AI to summarize the code, highlight risky areas, or propose optimizations. After that, I would validate each suggestion against tests, edge cases, performance constraints, and the business requirement. In an interview, the key is showing that AI helps me move faster, but correctness and debugging ownership still stay with me.",
    followUps: [
      "How would you detect when the AI suggestion is subtly wrong?",
      "What would you log or test before shipping the fix?",
      "When would you avoid using AI during this workflow?",
    ],
    rubric: [
      "Uses AI as a tool, not as a substitute for reasoning.",
      "Explains concrete validation steps.",
      "Discusses performance, regressions, and debugging ownership.",
    ],
    sourceLinks: [
      {
        label: "Business Insider - Google AI-assisted interview pilot",
        url: "https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5",
        note: "Reported in May 2026 for selected U.S. software engineering interview pilots.",
      },
    ],
  },
  {
    id: "amazon-ownership-metric-trap-2026",
    company: "Amazon",
    round: "Behavioral",
    level: "Mid",
    track: "java",
    topic: "spring-boot",
    title: "Ownership story with metric defense",
    freshnessLabel: "Refreshed from public guides in June 2026",
    confidence: "High confidence",
    trapType: "Behavioral depth trap",
    prompt: "Tell me about a time you took ownership of a difficult problem. Be ready to defend the result, the metric, and what trade-off you made.",
    interviewerIntent: "Tests whether the candidate can show ownership with evidence, not just effort or busyness.",
    candidateTrap: "Candidates tell a long STAR story but never state the business result clearly or cannot defend why their chosen action was the right trade-off.",
    answerOutline: [
      "Set up the situation in one or two sentences.",
      "State the concrete problem, why it mattered, and what ownership looked like.",
      "Describe the decision, trade-off, and measurable result.",
      "Close with what you learned and what you would do next.",
    ],
    polishedAnswer: "A strong ownership answer sounds like this: I noticed a problem that was hurting users or delivery, I took responsibility beyond my immediate task, I made a decision under constraints, and I can quantify what changed because of that work. The winning detail is the trade-off. For example, instead of saying I improved performance, say I chose a smaller rollback-safe optimization first because latency was hurting checkout during peak traffic, which reduced p95 latency by 28 percent and gave the team time for the larger redesign.",
    followUps: [
      "How did you know your solution was the right priority?",
      "What metric proved the impact?",
      "What would you do differently now?",
    ],
    rubric: [
      "Shows ownership beyond assigned tasks.",
      "Includes a measurable outcome.",
      "Explains why the chosen action was the right trade-off.",
    ],
    sourceLinks: [
      {
        label: "Amazon interview guide",
        url: "https://igotanoffer.com/blogs/tech/amazon-software-development-engineer-interview",
        note: "Leadership principles and behavioral expectations.",
      },
      {
        label: "Business Insider - Amazon hiring manager interview advice",
        url: "https://www.businessinsider.com/things-amazon-hiring-manager-looks-for-tech-interview-candidates-preparation-2025-4",
        note: "Explains collaboration, bigger-picture thinking, and preparation signals.",
      },
    ],
  },
  {
    id: "amazon-idempotency-bar-raiser-2026",
    company: "Amazon",
    round: "Bar Raiser",
    level: "Senior",
    track: "java",
    topic: "spring-boot",
    title: "Idempotency under retries and duplicate events",
    freshnessLabel: "Refreshed from public guides in June 2026",
    confidence: "Medium confidence",
    trapType: "Trade-off trap",
    prompt: "Design or debug an order-processing workflow where client retries and duplicate events can create double charges or repeated order transitions. How would you make it safe?",
    interviewerIntent: "Tests whether the candidate understands distributed retries, safe state transitions, and correctness under partial failure.",
    candidateTrap: "Candidates define idempotency correctly but never explain how they would actually implement it with keys, persistence, state checks, and consumer safety.",
    answerOutline: [
      "Clarify where retries come from: client, gateway, queue consumer, or internal service.",
      "Use durable idempotency keys or business identifiers and store processing state.",
      "Make state transitions and consumers safe against repeats.",
      "Explain failure handling, expiration strategy, and observability.",
    ],
    polishedAnswer: "My answer would be that idempotency is not just an HTTP concept; it is a workflow correctness guarantee. I would identify the business operation, choose a stable idempotency key, persist the key with processing status, and ensure repeated requests return the same final result instead of applying the side effect twice. For asynchronous consumers, I would also make event handling idempotent because retries or redelivery are normal. The senior signal is discussing expiration policy, partial-failure behavior, and how to monitor duplicate-suppression failures.",
    followUps: [
      "How would you expire idempotency keys safely?",
      "What if the first attempt succeeded but the response was lost?",
      "How do you avoid race conditions on the same key?",
    ],
    rubric: [
      "Moves from definition to implementation.",
      "Covers sync and async duplicate handling.",
      "Discusses monitoring and failure modes.",
    ],
    sourceLinks: [
      {
        label: "Exponent - Amazon software engineer guide",
        url: "https://www.tryexponent.com/guides/amazon-software-engineer",
        note: "System design and reliability-style question patterns.",
      },
      {
        label: "Interview Query - Amazon software engineer guide",
        url: "https://www.interviewquery.com/interview-guides/amazon-software-engineer",
        note: "Common backend and design themes from public prep material.",
      },
    ],
  },
  {
    id: "meta-backpressure-notification-2026",
    company: "Meta",
    round: "System Design",
    level: "Senior",
    track: "java",
    topic: "concurrency",
    title: "Backpressure and fanout in notification systems",
    freshnessLabel: "Refreshed from public guides in June 2026",
    confidence: "Medium confidence",
    trapType: "Scalability trap",
    prompt: "Design a high-volume notification system and explain what happens when one downstream channel or consumer group slows down unexpectedly.",
    interviewerIntent: "Tests system design depth beyond happy-path architecture diagrams.",
    candidateTrap: "Candidates often draw queues and workers but never explain overload behavior, backpressure, retries, dropped work, or tenant fairness.",
    answerOutline: [
      "Clarify throughput, durability, latency, and channel requirements.",
      "Separate ingestion from delivery and isolate channels with queues or worker pools.",
      "Explain backpressure, retry policy, dead-letter handling, and rate limiting.",
      "Cover observability and per-tenant fairness or prioritization.",
    ],
    polishedAnswer: "A senior-level answer should show that the real design challenge is not fanout on a whiteboard, but controlled degradation under overload. I would isolate channels or workloads so one slow dependency does not stall everything, use bounded queues and retry budgets, and define what gets delayed, dropped, or downgraded first. I would also explain how I would measure queue lag, failure rate, retry amplification, and tenant impact, because the trap in this question is pretending the system works the same under normal and overloaded traffic.",
    followUps: [
      "How would you stop retries from creating a storm?",
      "What would you prioritize first under overload?",
      "How would you design fairness for high-value versus free-tier tenants?",
    ],
    rubric: [
      "Explains overload behavior, not just happy path.",
      "Uses isolation, backpressure, and retry budgets.",
      "Discusses prioritization and observability.",
    ],
    sourceLinks: [
      {
        label: "Exponent system design resources",
        url: "https://www.tryexponent.com/system-design",
        note: "Common high-scale system-design themes and follow-up pressure.",
      },
      {
        label: "Reddit search - Meta interview experience",
        url: "https://www.reddit.com/search/?q=Meta%20software%20engineer%20interview%20experience",
        note: "Community reports; verify recency manually.",
      },
    ],
  },
  {
    id: "google-clarify-before-coding-2026",
    company: "Google",
    round: "Coding",
    level: "Mid",
    track: "java",
    topic: "collections",
    title: "Clarify constraints before coding",
    freshnessLabel: "Publicly discussed in early 2026",
    confidence: "Medium confidence",
    trapType: "Communication trap",
    prompt: "You are given a coding problem with deliberate ambiguity. What do you ask before coding, and how do you keep momentum while clarifying?",
    interviewerIntent: "Tests communication quality, structured problem framing, and whether the candidate can avoid coding the wrong solution under time pressure.",
    candidateTrap: "Candidates jump into implementation too early and burn time solving the wrong interpretation or missing edge conditions.",
    answerOutline: [
      "Restate the problem and identify ambiguous inputs, output guarantees, and constraints.",
      "Ask only the highest-value clarifying questions first.",
      "State assumptions if the interviewer leaves some ambiguity open.",
      "Keep the conversation moving into approach, complexity, and code.",
    ],
    polishedAnswer: "My answer would be that clarification is part of problem-solving, not a delay. I first restate the problem in my own words and ask for the missing details that change the solution shape, such as input size, duplicates, ordering guarantees, or failure conditions. If some ambiguity remains, I state my assumption explicitly and proceed. That shows I can communicate and make progress at the same time, which is much stronger than silently coding the wrong interpretation.",
    followUps: [
      "How many clarifying questions is too many?",
      "What assumptions should you state out loud before coding?",
      "What would you do if the interviewer says 'choose the best reasonable assumption'?",
    ],
    rubric: [
      "Uses clarification to reduce solution risk.",
      "Balances speed with communication.",
      "States assumptions cleanly before coding.",
    ],
    sourceLinks: [
      {
        label: "Economic Times summary of Google recruiter advice",
        url: "https://m.economictimes.com/magazines/panache/google-recruiter-who-hired-just-7-out-of-100-candidates-shares-interview-tips-candidates-are-often-unable-to/articleshow/128377484.cms",
        note: "Highlights clarification, time management, and clean communication.",
      },
    ],
  },
  {
    id: "backend-sql-paging-trap-2026",
    company: "Cross-company",
    round: "Hiring Manager",
    level: "Mid",
    track: "database",
    engine: "postgresql",
    topic: "query-design",
    title: "Pagination that works until large tenants arrive",
    freshnessLabel: "Refreshed from public reports in June 2026",
    confidence: "Medium confidence",
    trapType: "Scale trap",
    prompt: "A query with offset-based pagination works fine in staging but slows down badly for the largest tenants in production. Explain what is happening and how you would redesign it.",
    interviewerIntent: "Tests whether the candidate can connect SQL behavior to real data shape and production scaling effects.",
    candidateTrap: "Candidates say 'add an index' without discussing offset cost, unstable ordering, or seek-based pagination.",
    answerOutline: [
      "Explain why larger offsets force the database to skip more rows before returning a page.",
      "Check ordering stability and index alignment.",
      "Propose keyset or seek pagination when the use case allows it.",
      "Discuss trade-offs for random access, cursor handling, and API shape.",
    ],
    polishedAnswer: "A strong answer is that offset pagination often degrades with large tenants because the database still has to walk past many rows before returning the requested page. I would inspect the plan, ordering, and index usage first. If the product flow is next-page oriented, I would move to keyset pagination using a stable sort key such as created_at plus id. I would also explain the trade-off: keyset pagination is much better for large sequential browsing, but it changes how random page jumps work.",
    followUps: [
      "How would you design the API cursor?",
      "What if rows are inserted between page requests?",
      "When is offset pagination still acceptable?",
    ],
    rubric: [
      "Explains why offset cost grows.",
      "Uses index and ordering evidence.",
      "Discusses keyset trade-offs clearly.",
    ],
    sourceLinks: [
      {
        label: "Interview Query engineering interview guides",
        url: "https://www.interviewquery.com/interview-guides/amazon-software-engineer",
        note: "Common backend and SQL reasoning patterns.",
      },
      {
        label: "Reddit search - software engineer interview experience",
        url: "https://www.reddit.com/search/?q=software%20engineer%20interview%20experience%20sql%20pagination",
        note: "Community reports; verify recency manually.",
      },
    ],
  },
];

const TRACK_KEYS = new Set(SCENARIO_BANK_TRACKS.map((track) => track.key));
const ENGINE_KEYS = new Set(DATABASE_ENGINES.map((engine) => engine.key));

function normalizeTrack(track) {
  return TRACK_KEYS.has(track) ? track : "java";
}

function normalizeEngine(engine) {
  return ENGINE_KEYS.has(engine) ? engine : "postgresql";
}

function normalizeDifficulty(difficulty) {
  return SCENARIO_BANK_DIFFICULTIES.includes(difficulty) ? difficulty : "Mid";
}

function normalizeMode(mode) {
  return SCENARIO_BANK_MODES.includes(mode) ? mode : "Learn";
}

function topicKeysFor(track, engine) {
  return listScenarioBankTopics(track, engine).map((topic) => topic.key);
}

function normalizeTopic(track, engine, topic) {
  const topics = topicKeysFor(track, engine);
  return topics.includes(topic) ? topic : topics[0];
}

function engineLabel(engine) {
  return DATABASE_ENGINES.find((item) => item.key === engine)?.label || "PostgreSQL";
}

function topicLabel(track, engine, topic) {
  return listScenarioBankTopics(track, engine).find((item) => item.key === topic)?.label || topic;
}

function scenarioTrackLabel(state) {
  return state.track === "database" ? engineLabel(state.engine) : "Java";
}

function normalizeOutcome(outcome) {
  return outcome === "mastered" ? "mastered" : "needsReview";
}

export function listScenarioBankTopics(track = "java", engine = "postgresql") {
  const normalizedTrack = normalizeTrack(track);
  if (normalizedTrack === "java") return JAVA_TOPICS;
  return DATABASE_TOPICS[normalizeEngine(engine)] || DATABASE_TOPICS.postgresql;
}

export function createScenarioBankState(input = {}) {
  const track = normalizeTrack(input.track);
  const engine = normalizeEngine(input.engine);
  const topic = normalizeTopic(track, engine, input.topic);

  return {
    track,
    engine,
    topic,
    difficulty: normalizeDifficulty(input.difficulty),
    mode: normalizeMode(input.mode),
  };
}

export function createScenarioBankProgress(input = {}) {
  const scenarios = input?.scenarios && typeof input.scenarios === "object" ? input.scenarios : {};
  const normalizedScenarios = Object.fromEntries(
    Object.entries(scenarios)
      .filter(([id, value]) => id && value && typeof value === "object")
      .map(([id, value]) => [
        id,
        {
          id,
          attempts: Math.max(0, Number(value.attempts) || 0),
          mastered: Boolean(value.mastered),
          needsReview: Boolean(value.needsReview) && !value.mastered,
          lastOutcome: normalizeOutcome(value.lastOutcome),
          lastPracticedAt: typeof value.lastPracticedAt === "string" ? value.lastPracticedAt : "",
          track: normalizeTrack(value.track),
          engine: value.engine ? normalizeEngine(value.engine) : "",
          topic: typeof value.topic === "string" ? value.topic : "",
          difficulty: normalizeDifficulty(value.difficulty),
        },
      ]),
  );

  const values = Object.values(normalizedScenarios);
  return {
    version: SCENARIO_BANK_STORAGE_VERSION,
    state: createScenarioBankState(input?.state || {}),
    progress: createScenarioBankState(input?.progress || input?.state || {}),
    scenarios: normalizedScenarios,
    summary: {
      attempted: values.filter((item) => item.attempts > 0).length,
      mastered: values.filter((item) => item.mastered).length,
      needsReview: values.filter((item) => item.needsReview).length,
    },
  };
}

export function recordScenarioBankAttempt(progress = createScenarioBankProgress(), scenario, { outcome = "needsReview", now = new Date().toISOString() } = {}) {
  const current = createScenarioBankProgress(progress);
  if (!scenario?.id) return current;

  const normalizedOutcome = normalizeOutcome(outcome);
  const previous = current.scenarios[scenario.id] || {};
  return createScenarioBankProgress({
    ...current,
    scenarios: {
      ...current.scenarios,
      [scenario.id]: {
        ...previous,
        id: scenario.id,
        attempts: Math.max(0, Number(previous.attempts) || 0) + 1,
        mastered: normalizedOutcome === "mastered",
        needsReview: normalizedOutcome !== "mastered",
        lastOutcome: normalizedOutcome,
        lastPracticedAt: now,
        track: scenario.track,
        engine: scenario.engine || "",
        topic: scenario.topic,
        difficulty: scenario.difficulty,
      },
    },
  });
}

export function estimateScenarioCoverage(filters = {}) {
  const state = createScenarioBankState(filters);
  const difficulties = SCENARIO_BANK_DIFFICULTIES.length;
  const modes = SCENARIO_BANK_MODES.length;
  const topicCount = filters.track
    ? listScenarioBankTopics(state.track, state.engine).length
    : JAVA_TOPICS.length + Object.values(DATABASE_TOPICS).reduce((total, topics) => total + topics.length, 0);

  return {
    track: state.track,
    engine: state.engine,
    topics: topicCount,
    difficulties,
    modes,
    variantsPerTopic: SCENARIO_VARIANT_MULTIPLIER,
    total: topicCount * difficulties * modes * SCENARIO_VARIANT_MULTIPLIER,
  };
}

export function listScenarioSeeds(filters = {}) {
  const state = createScenarioBankState(filters);
  return SCENARIO_SEEDS.filter((seed) => {
    if (seed.track !== state.track) return false;
    if (state.track === "database" && seed.engine !== state.engine) return false;
    if (filters.topic && seed.topic !== state.topic) return false;
    return true;
  });
}

export function getScenarioSeed(id) {
  return SCENARIO_SEEDS.find((seed) => seed.id === id) || SCENARIO_SEEDS[0];
}

export function listRecentScenarioCompanies() {
  return ["All", ...Array.from(new Set(RECENT_SCENARIO_REPORTS.map((item) => item.company)))];
}

export function listRecentScenarioReports({ company = "All", round = "All", level = "All" } = {}) {
  return RECENT_SCENARIO_REPORTS.filter((item) => {
    const matchesCompany = company === "All" || item.company === company;
    const matchesRound = round === "All" || item.round === round;
    const matchesLevel = level === "All" || item.level === level;

    return matchesCompany && matchesRound && matchesLevel;
  });
}

export function getRecentScenarioReport(id) {
  return RECENT_SCENARIO_REPORTS.find((item) => item.id === id) || RECENT_SCENARIO_REPORTS[0];
}

const LOCAL_VARIANT_CONTEXTS = [
  "during a production incident",
  "after a high-traffic release",
  "while migrating a legacy service",
  "during a performance review before launch",
  "after an intermittent customer escalation",
  "while adding observability to a critical workflow",
  "during a multi-region rollout",
  "after a dependency or schema change",
];

const LOCAL_VARIANT_TRIGGERS = [
  "metrics look healthy at the top level but user-facing latency or correctness is degrading",
  "a recent refactor changed behavior without an obvious compile-time failure",
  "load, concurrency, or data shape changed faster than the original design expected",
  "the first fix reduced one symptom but exposed a deeper trade-off",
  "the team needs a rollback-safe answer before changing production again",
  "the issue only appears for large tenants, hot keys, or peak traffic",
  "an async dependency failed and left state partially updated",
  "a cache, index, lock, or retry policy is hiding the real bottleneck",
];

function localVariantSeed(inputScenario, filters) {
  if (inputScenario?.id) return inputScenario;
  return listScenarioSeeds(filters)[0] || getScenarioSeed();
}

export function buildLocalScenarioVariant(scenario, filters = {}, { variantIndex = 0 } = {}) {
  const state = createScenarioBankState(filters);
  const seed = localVariantSeed(scenario, state);
  const index = Math.max(0, Number(variantIndex) || 0);
  const context = LOCAL_VARIANT_CONTEXTS[index % LOCAL_VARIANT_CONTEXTS.length];
  const trigger = LOCAL_VARIANT_TRIGGERS[index % LOCAL_VARIANT_TRIGGERS.length];
  const trackLabel = seed.track === "database" ? engineLabel(seed.engine || state.engine) : "Java";
  const topic = topicLabel(seed.track, seed.engine || state.engine, seed.topic || state.topic);
  const difficulty = normalizeDifficulty(filters.difficulty || seed.difficulty);

  return {
    ...seed,
    id: `${seed.id}-local-variant-${index + 1}`,
    generated: true,
    sourceScenarioId: seed.id,
    difficulty,
    title: `Fresh Variant ${index + 1}: ${seed.title}`,
    prompt: `Fresh variation for ${trackLabel} ${topic}: ${context}, ${trigger}. Start from the same core skill as "${seed.title}", but answer it as a new real interview scenario. Original situation: ${seed.prompt}`,
    interviewerIntent: `Tests whether the candidate can transfer the ${topic} skill to a fresh production scenario, not just repeat the original answer.`,
    answerOutline: [
      ...seed.answerOutline,
      "Call out what changed from the original scenario and which evidence would confirm the new root cause.",
      "State the production-safe rollout, validation, and follow-up monitoring plan.",
    ],
    deepDive: `${seed.deepDive} For this fresh variation, explicitly compare the new context with the original scenario, identify the strongest signal you would collect first, and explain how you would validate the fix before broad rollout.`,
    traps: [
      ...seed.traps,
      "Repeating the original scenario answer without adapting to the new evidence.",
    ],
    followUps: [
      ...seed.followUps,
      "What evidence would prove this fresh variation is different from the original scenario?",
    ],
    rubric: [
      ...seed.rubric,
      "Adapts the original concept to the fresh scenario with evidence and rollout safety.",
    ],
  };
}

export function buildScenarioVariantPrompt(filters = {}) {
  const state = createScenarioBankState(filters);
  const trackLabel = state.track === "database" ? engineLabel(state.engine) : "Java";
  const topic = topicLabel(state.track, state.engine, state.topic);

  return [
    `Create one realistic scenario-based interview question for ${trackLabel}.`,
    `Topic: ${topic}. Difficulty: ${state.difficulty}. Mode: ${state.mode}.`,
    "Make it original and do not copy from any third-party question bank.",
    "Include:",
    "- realistic scenario prompt",
    "- interviewer intent",
    "- expected senior answer",
    "- step-by-step reasoning",
    "- trade-offs",
    "- common traps",
    "- follow-ups",
    "- scoring rubric",
  ].join("\n");
}

export function buildScenarioAnswerPrompt(scenario, filters = {}) {
  const state = createScenarioBankState(filters);
  const seed = scenario || getScenarioSeed();
  const trackLabel = seed.track === "database" ? engineLabel(seed.engine || state.engine) : "Java";

  return [
    `Deep-dive answer for this ${trackLabel} scenario.`,
    `Difficulty: ${state.difficulty}.`,
    `Scenario: ${seed.title}`,
    seed.prompt,
    `Local answer outline: ${seed.answerOutline.join(" ")}`,
    "Explain the ideal answer, reasoning steps, trade-offs, common traps, follow-up answers, and a scoring rubric.",
  ].join("\n");
}

export function buildScenarioMockPrompt(scenario, filters = {}) {
  const state = createScenarioBankState(filters);
  const seed = scenario || getScenarioSeed();
  const trackLabel = seed.track === "database" ? engineLabel(seed.engine || state.engine) : "Java";

  return [
    `Run a mock interview for this ${trackLabel} scenario, one question at a time.`,
    `Difficulty: ${state.difficulty}. Mode: ${state.mode}.`,
    `Scenario: ${seed.title}`,
    seed.prompt,
    "Ask the first question, wait for my answer, then grade with rubric, traps, and follow-ups.",
  ].join("\n");
}

export function buildRecentScenarioAnswerPrompt(report) {
  const item = report || getRecentScenarioReport();

  return [
    `Explain the ideal interview-ready answer for this recent public-report scenario.`,
    `Company: ${item.company}. Round: ${item.round}. Level: ${item.level}.`,
    `Trap type: ${item.trapType}.`,
    `Scenario: ${item.title}.`,
    item.prompt,
    `Candidate trap: ${item.candidateTrap}`,
    `Local outline: ${item.answerOutline.join(" ")}`,
    "Return a direct polished answer, what candidates usually miss, what the follow-up will likely be, and how to answer it strongly.",
  ].join("\n");
}

export function buildRecentScenarioMockPrompt(report) {
  const item = report || getRecentScenarioReport();

  return [
    `Run a mock interview for this recent scenario, one question at a time.`,
    `Company: ${item.company}. Round: ${item.round}. Level: ${item.level}.`,
    `Trap type: ${item.trapType}.`,
    `Scenario: ${item.title}.`,
    item.prompt,
    `Watch for this candidate trap: ${item.candidateTrap}`,
    "Ask the first question, wait for my answer, then grade clarity, trade-offs, depth, and follow-up readiness.",
  ].join("\n");
}

export function buildScenarioInterviewPlan({ progress = createScenarioBankProgress(), state: inputState = {}, count = 5 } = {}) {
  const state = createScenarioBankState(inputState);
  const currentProgress = createScenarioBankProgress(progress);
  const seeds = listScenarioSeeds(state);
  const scored = seeds
    .map((scenario) => {
      const item = currentProgress.scenarios[scenario.id];
      const priority = !item ? 0 : item.needsReview ? -1 : item.mastered ? 2 : 1;
      return { scenario, progress: item || null, priority };
    })
    .sort((left, right) => left.priority - right.priority || left.scenario.title.localeCompare(right.scenario.title))
    .slice(0, Math.max(1, Number(count) || 5));
  const trackLabel = scenarioTrackLabel(state);
  const topic = topicLabel(state.track, state.engine, state.topic);
  const prompt = [
    `Create a daily interview plan for ${trackLabel}.`,
    `Topic: ${topic}. Difficulty: ${state.difficulty}.`,
    "Prioritize scenario-based practice, weak areas, answer structure, follow-ups, and a short scoring rubric.",
    "Selected scenarios:",
    ...scored.map(({ scenario, progress: scenarioProgress }, index) => `${index + 1}. ${scenario.title} - ${scenario.prompt} (${scenarioProgress?.lastOutcome || "unseen"})`),
  ].join("\n");

  return {
    trackLabel,
    topic,
    items: scored,
    prompt,
  };
}

export { SCENARIO_SEEDS, RECENT_SCENARIO_REPORTS };
