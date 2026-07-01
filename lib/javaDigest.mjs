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

export const JAVA_DIGEST_ARTICLES = [
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

export const JAVA_DIGEST_VERSION = "2026.07";

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
    `CSES handbook-inspired topic themes: ${track.handbookThemes.join(", ")}.`,
    `Java implementation focus: ${track.javaFocus.join("; ")}.`,
    `Interview signals: ${track.interviewSignals.join("; ")}.`,
    `Common pitfalls: ${track.pitfalls.join("; ")}.`,
    `Detailed chapter explanation: ${getCsesJavaChapterDetail(track).explanation}`,
    `Reasoning path: ${getCsesJavaChapterDetail(track).reasoning}`,
    "Return a direct polished study answer, not an interviewer prompt.",
    "Do not greet the user. Do not ask the user to implement something first.",
    "Use plain text math only: O(log n), O(1), 2 * 10^9, gcd(a, b), a mod b. Do not use LaTeX syntax like $, \\mathcal, \\cdot, \\gcd, or \\pmod.",
    "Use original explanations and Java examples only. Do not quote or reproduce the handbook text.",
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
    "When the topic overlaps with DSA or algorithms, add competitive-programming style depth inspired by the broad themes of Antti Laaksonen's Competitive Programmer's Handbook: complexity analysis, invariants, edge cases, proof intuition, greedy/DP/search/graph/range-query/bit-manipulation framing where relevant. Do not quote or reproduce book text.",
    "Return a direct polished answer, not a mock interview prompt. Do not greet the user. Do not ask the user to implement something before teaching the topic.",
    "Use clean Markdown only. Use normal bullets with '-'. Avoid LaTeX syntax and dollar math. Write O(log n), O(1), 2 * 10^9, gcd(a, b), and a mod b as plain text.",
    "Format exactly with these sections:",
    "**Direct Answer**",
    "**Simple Mental Model**",
    "**Interview-Ready Answer**",
    "**Key Points**",
    "**Example / Code**",
    "**Common Mistakes**",
    "**Follow-up Questions**",
    "**Competitive Programming / DSA Angle**",
    "**60-Second Revision**",
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
