// Explicit editorial assignments. Diagram selection never infers behavior from category words.
export const COURSE_DIAGRAMS = {
  saga: {
    title: "Order saga: success and compensation",
    description: "After reserving stock, capture payment. A confirmed capture confirms the order. A definitive rejection releases stock before cancellation. An ambiguous timeout requires reconciliation, not immediate compensation.",
    nodes: [["reserve",20,20,"Reserve stock","Local inventory transaction"],["capture",275,20,"Capture payment","Stable idempotency key"],["confirm",530,20,"Confirm order","Payment confirmed"],["release",275,180,"Release stock","Retry compensation safely"],["cancel",530,180,"Cancel order","After release is confirmed"]],
    edges: [["reserve","capture","reserved"],["capture","confirm","accepted"],["capture","release","rejected"],["release","cancel","released"]],
  },
  cache: {
    title: "Cache-aside: hit and miss branches",
    description: "A fresh cache hit returns directly. A miss loads the authoritative source, validates freshness or version, fills the cache, and returns. An unsafe stale value must not be served as a valid hit.",
    nodes: [["read",20,20,"Read request","Cache key + tenant"],["cache",275,20,"Check cache","Fresh and permitted?"],["return",530,20,"Return value","Hit avoids source read"],["source",275,180,"Load source","Miss or unsafe stale value"],["fill",530,180,"Validate and fill","Then return to caller"]],
    edges: [["read","cache","lookup"],["cache","return","hit"],["cache","source","miss"],["source","fill","loaded"]],
  },
  cacheRace: {
    title: "Stale fill race: retain the version floor",
    description: "An old reader starts loading v1. A write commits v2 and invalidation records a v2 floor. When the v1 load finishes, the floor rejects it even if the cached value was evicted. A v2 or newer load may fill the cache.",
    nodes: [["load",20,20,"T1: load v1","Reader still in flight"],["write",275,20,"T2: commit v2","Authoritative source"],["floor",530,20,"T3: invalidate","Retain floor = v2"],["late",20,180,"T4: v1 arrives","Compare to retained floor"],["reject",275,180,"Reject v1","1 < 2: do not refill"],["fresh",530,180,"Accept v2+","Recheck floor on fill"]],
    edges: [["load","write","concurrent write"],["write","floor","invalidation"],["load","late","late response"],["late","reject","below floor"],["floor","fresh","new load"]],
  },
  breaker: {
    title: "Circuit breaker state transitions",
    description: "Closed permits normal calls. A failure threshold opens the circuit and rejects calls. After cooldown, half-open admits a bounded probe. A successful probe closes the circuit; a failed probe reopens it. Every remote call still needs a timeout.",
    nodes: [["closed",20,20,"CLOSED","Normal calls allowed"],["open",530,20,"OPEN","Reject calls"],["probe",275,200,"HALF_OPEN","Bounded recovery probe"]],
    edges: [["closed","open","failure threshold"],["open","probe","cooldown elapsed"],["probe","closed","probe succeeds"],["probe","open","probe fails"]],
  },
  memory: {
    title: "JVM process memory: beyond the heap",
    description: "Process memory includes Java heap, thread stacks, and other native regions such as metaspace, code cache, direct buffers and mappings. A container can run out of memory while the Java heap remains stable.",
    nodes: [["process",275,20,"Java process","Container memory budget"],["heap",20,190,"Java heap","Live objects + allocation"],["stacks",275,190,"Thread stacks","Count × stack budget"],["native",530,190,"Other regions","Metaspace, code, direct, maps"]],
    edges: [["process","heap","managed objects"],["process","stacks","per-thread"],["process","native","outside heap"]],
  },
  sql: {
    title: "Selective index access versus a full scan",
    description: "A full scan examines table rows and then filters. A selective index finds matching entries and fetches needed rows, unless the index covers the query. Both paths must return equivalent results. For low selectivity a scan may be cheaper.",
    height: 580,
    nodes: [["query",275,20,"Same query","Same parameters + snapshot"],["scan",20,190,"Full scan","Read table pages"],["index",530,190,"Index access","Seek matching keys"],["filter",20,360,"Apply predicate","Discard nonmatching rows"],["fetch",530,360,"Fetch needed rows","Or use covering index"],["result",275,480,"Equivalent result","Compare reads and latency"]],
    edges: [["query","scan","plan A"],["query","index","plan B"],["scan","filter","all rows"],["index","fetch","candidate rows"],["filter","result","matches"],["fetch","result","matches"]],
  },
  pointers: {
    title: "Two pointers: sorted pair sum",
    description: "For [1, 2, 4, 8] and target 6: 1 + 8 is too large, so move right leftward. Then 1 + 4 is too small, so move left rightward. Finally 2 + 4 equals 6. Sorted order makes each elimination valid.",
    nodes: [["first",20,20,"L=1, R=8","Sum 9 > target 6"],["second",275,20,"L=1, R=4","Sum 5 < target 6"],["third",530,20,"L=2, R=4","Sum 6: found pair"]],
    edges: [["first","second","move R left"],["second","third","move L right"]],
  },
  window: {
    title: "Sliding window: longest unique substring",
    description: "Scan abba. After a and b the valid window is ab, length 2. The next b duplicates a character: remove a, then the old b. The window is b; adding a gives ba. The maximum remains 2.",
    nodes: [["ab",20,20,"Window: ab","Best length = 2"],["abb",275,20,"Next character: b","Duplicate: window invalid"],["b",530,20,"Shrink to: b","Remove a, then old b"],["ba",530,190,"Append a: ba","Best length still 2"]],
    edges: [["ab","abb","expand"],["abb","b","restore invariant"],["b","ba","expand"]],
  },
  stack: {
    title: "Monotonic stack: next warmer day",
    description: "Temperatures [73, 71, 74]: store unresolved indices. At 74, pop day 1 (wait 1 day), then day 0 (wait 2 days). Push day 2. Each index is pushed and popped at most once.",
    nodes: [["a",20,20,"Day 0: 73","Stack [0]"],["b",275,20,"Day 1: 71","Stack [0, 1]"],["c",530,20,"Day 2: 74","Pop 1 and 0; push 2"],["out",530,190,"Answer [2, 1, 0]","0 means no warmer day"]],
    edges: [["a","b","push cooler"],["b","c","pop cooler days"],["c","out","record waits"]],
  },
  bfs: {
    title: "Breadth-first search: distance layers",
    description: "In an unweighted graph A connects to B and C, and both connect to D. Start at A with distance 0. Enqueue B and C at distance 1. Mark D on first enqueue at distance 2 so it is not queued twice.",
    nodes: [["a",275,20,"A: distance 0","Queue [A]"],["b",20,190,"B: distance 1","First neighbor"],["c",530,190,"C: distance 1","Second neighbor"],["d",275,360,"D: distance 2","Enqueue only once"]],
    edges: [["a","b","first layer"],["a","c","first layer"],["b","d","discover"],["c","d","already visited"]],
  },
  apiEvolution: {
    title: "Compatible API evolution: prove before removal",
    description: "An additive change lets old clients continue with the prior behavior while capable clients use the optional field. Contract tests and adoption telemetry precede deprecation. Removal happens only after the published window and measured migration, with a rollback path retained through the rollout.",
    nodes: [["add",20,20,"Add optional field","Preserve old meaning"],["mixed",275,20,"Mixed clients","Old ignores; new uses"],["evidence",530,20,"Prove adoption","Contract tests + telemetry"],["deprecate",160,180,"Deprecate safely","Published window"],["remove",415,180,"Remove behavior","Only after proof"]],
    edges: [["add","mixed","deploy"],["mixed","evidence","measure"],["evidence","deprecate","ready"],["deprecate","remove","window + threshold"]],
  },
};

const assignments = {
  "distributed-transactions-data-consistency": { "2. Saga orchestration and compensation": "saga" },
  "microservices-design-patterns": { "5. Saga and transactional outbox": "saga" },
  "caching-patterns-java": { "1. Cache-aside": "cache", "3. Invalidation and versioning": "cacheRace" },
  "resilience-engineering": { "3. Circuit breakers": "breaker" },
  "java-memory-management-evolution": { "1. The memory map": "memory", "5. Off-heap and container limits": "memory" },
  "sql-performance-interviews": { "2. Read an execution plan": "sql", "3. Index design": "sql" },
  "system-design-concepts": { "4. Caching and CDNs": "cache" },
  "system-design-handbook": { "10. Database indexes": "sql", "11. Caching": "cache" },
  "leetcode-patterns": { "Two Pointers": "pointers", "Sliding Window": "window", "Monotonic Stack": "stack", "Breadth-First Search (BFS)": "bfs" },
  "java-api-evolution-contracts": { "2. Additive payloads and tolerant readers": "apiEvolution", "5. Versioning, deprecation, and rollout": "apiEvolution" },
};

export function chapterDiagramKey(blogId, chapterTitle) {
  return assignments[blogId]?.[chapterTitle] || null;
}

export const BLOG_OVERVIEW_DIAGRAMS = {
  "caching-patterns-java": "cache",
  "java-memory-management-evolution": "memory",
  "sql-performance-interviews": "sql",
  "distributed-transactions-data-consistency": "saga",
  "resilience-engineering": "breaker",
};

export const BLOG_OVERVIEW_KINDS = {
  "java-8-to-26-evolution": "javaTimeline",
  "design-patterns-in-18-minutes": "pattern",
  "java-design-patterns-with-diagrams": "pattern",
  "learn-low-level-design-from-zero": "lld",
  "leetcode-patterns": "dsa",
  "system-design-concepts": "default",
  "system-design-handbook": "default",
  "production-java-reliability": "java",
  "api-reliability-playbook": "api",
  "technical-interview-communication": "communication",
  "java-concurrency-interviews": "java",
  "distributed-systems-interviews": "distributed",
  "behavioral-star-interviews": "behavioral",
  "system-design-fundamentals-roadmap": "default",
  "java-observability-opentelemetry": "observe",
  "spring-transactions-data-access": "event",
  "java-performance-clinic": "observe",
  "event-driven-java-reliability": "event",
  "production-java-testing": "java",
  "microservices-design-patterns": "distributed",
  "microservices-migration-patterns": "default",
  "spring-boot-security": "api",
};
