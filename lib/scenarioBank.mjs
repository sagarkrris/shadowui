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

export { SCENARIO_SEEDS };
