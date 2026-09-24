// Editorial answers are keyed by chapter identity so reordering cannot attach the wrong answer.
export const TECH_BLOG_GUIDANCE = {
  "java-api-evolution-contracts": {
    "whenToUse": "Use when a deployed HTTP or event contract must change while independently released clients or consumers still exist.",
    "avoid": "Avoid a versioning ceremony or a breaking replacement when an additive, measurable change preserves the existing contract.",
    "answers": {
      "1. Define the compatibility promise": "A response can retain its JSON shape yet break callers by changing the meaning of a missing field, an error code, ordering, pagination, or retry behavior. Record those observable rules before judging compatibility.",
      "2. Additive payloads and tolerant readers": "An additive field is safe only when its absence retains the prior meaning and old readers can ignore it. It becomes breaking when a producer requires it or uses it to alter the prior operation for clients that do not send or understand it.",
      "3. Defaults, enums, and semantic traps": "Map an unknown future enum to an explicit unknown state only when the client can remain safe without its meaning. For payment, authorization, or state-changing decisions, fail closed or preserve the raw value for a controlled upgrade rather than treating it as a known state.",
      "4. Errors, retries, and idempotency": "A 5xx may be caused by a request that reached the provider, a non-retryable server rule, or a temporary outage. Retry only an explicitly retryable result with the original idempotency key and within the caller deadline; reconcile ambiguous outcomes.",
      "5. Versioning, deprecation, and rollout": "Removal needs both the published compatibility window and evidence: telemetry should show the old path is unused or migrated above the agreed threshold, contract tests should pass, and rollback must remain available through the release.",
      "6. Contract tests and event evolution": "Provider tests prove only the new producer behavior. Compatibility also requires old consumer expectations against the new output and new consumer handling of historical input, including replay, partition-key, and ordering assumptions for events."
    }
  },
  "java-8-to-26-evolution": {
    "whenToUse": "Use when planning a Java upgrade or explaining how a language or runtime feature changes a design.",
    "avoid": "Avoid adopting a feature without checking its release status, runtime requirements, and operational effect.",
    "answers": {
      "1. Java 8: functional foundations": "Use lambdas to supply interchangeable behavior such as a filter. A stream helps compose transformations; a simple loop is clearer when control flow or early exit dominates.",
      "2. Java 9–11: platform boundaries": "An explicit module declares what it requires and exports. Classpath visibility alone does not document or enforce that intended API boundary.",
      "3. Java 12–14: clearer language": "Cover every enum or sealed alternative, decide how null is handled, and distinguish unsupported input from a legitimate default result.",
      "4. Java 15–17: compact data models": "A sealed hierarchy fits a deliberately closed set of alternatives that callers must handle exhaustively. Use an open interface when third parties must extend it.",
      "5. Java 18–20: concurrency runway": "Database connections, CPU, remote quotas, and memory still bound concurrency even when waiting threads are inexpensive.",
      "6. Java 21: production-scale concurrency": "A million inexpensive waiting threads can still overwhelm a connection pool or dependency. Bound outstanding work and propagate cancellation and deadlines.",
      "7. Java 22–24: platform acceleration": "Unnamed variables reduce source ceremony; FFM and the class-file API provide platform capabilities. Gatherers add a library mechanism for custom stream operations.",
      "8. Java 25–26: runtime feedback loop": "Compare the same workload before and after: startup time, tail latency, throughput, allocation, memory, and errors. Keep the change only if the chosen target improves without unacceptable regressions."
    }
  },
  "design-patterns-in-18-minutes": {
    "whenToUse": "Use when construction, integration, policy, or lifecycle changes repeatedly affect callers.",
    "avoid": "Avoid pattern hierarchies when a direct method or function already keeps the responsibility clear.",
    "answers": {
      "1. Choosing a pattern": "The abstraction must isolate a real source of change while preserving caller behavior. A stable two-branch method may need no pattern.",
      "2. Creational patterns": "Constructed objects must satisfy their invariants. A builder must reject an invalid required field before returning an object.",
      "3. Structural patterns": "An adapter must preserve the domain contract while translating vendor units and errors; wrappers must preserve interface semantics.",
      "4. Behavioral patterns": "Strategies must be interchangeable, state transitions must remain legal, and observers must have explicit delivery and cleanup rules.",
      "5. Composition and testing": "A test double must obey the same contract as production. Test wrapper order separately because tracing, retries, and authorization can interact.",
      "6. Interview design review": "Explain the original pressure, participants, one successful interaction, one failure, and the cost of indirection. Demonstrate that the chosen pattern protects the stated invariant."
    }
  },
  "learn-low-level-design-from-zero": {
    "whenToUse": "Use when turning requirements into object responsibilities, state transitions, and testable contracts.",
    "avoid": "Avoid choosing classes before clarifying actors, failure behavior, and the invariants they protect.",
    "answers": {
      "1. Requirements before classes": "Every required use case needs an actor, observable result, and failure rule. For a parking lot, clarify whether a reservation guarantees a space before designing classes.",
      "2. Responsibilities and invariants": "Only the owning object should mutate protected state. A ticket cannot be closed twice or have an exit time before entry.",
      "3. Interfaces and policies": "Policy implementations must preserve the caller-facing contract. Adding weekend pricing should change wiring or policy implementation, not ticket lifecycle code.",
      "4. Modeling relationships": "Use inheritance only when substituting the subtype preserves the base contract. Ownership, such as a lot containing spaces, is composition.",
      "5. State, errors, and concurrency": "Claiming the final space must be atomic: two concurrent requests cannot both succeed. Reject invalid transitions with a defined domain result.",
      "6. Testing and evolution": "Preserve the externally visible behavior during refactoring. Test normal flows, invalid transitions, and integration wiring before adding an extension."
    }
  },
  "leetcode-patterns": {
    "whenToUse": "Use when the problem's constraints support the pattern's state and movement rules; verify them on a concrete input.",
    "avoid": "Avoid selecting a pattern by its name alone or applying it without proving its preconditions.",
    "answers": {
      "Prefix Sum": "Use prefix sums for repeated range sums: [2, -1, 3] has prefix [0, 2, 1, 4], so range [1, 2] totals 4 - 2 = 2. Include the initial zero and use a wide enough sum type.",
      "Two Pointers": "Use two pointers when moving a boundary rules out candidates, such as sorted pair search. Without sorted input, the same movement can discard a valid pair.",
      "Sliding Window": "Use a sliding window when validity can be maintained as boundaries move. A sum-bounded shrinking window is not generally correct with negative values.",
      "Fast & Slow Pointers": "Use slow/fast pointers to detect a linked-list cycle or middle. Check fast and fast.next before advancing twice on an empty or odd-length list.",
      "Linked List In-place Reversal": "Use in-place reversal when node identity must remain unchanged and extra space is limited. Save next before rewiring or the unreversed suffix becomes unreachable.",
      "Frequency Counting": "Use counts for duplicates, anagrams, or bounded alphabets. Negative counts and removing absent keys can invalidate a sliding-window frequency invariant.",
      "Monotonic Stack": "Use a monotonic stack for next-greater or span problems. Decide whether equal values pop: strict versus non-strict comparisons change duplicate behavior.",
      "Bit Manipulation": "Use bit operations for flags and bit identities. For positive powers of two, require n > 0 && (n & (n - 1)) == 0; zero and negative integers must fail.",
      "Top K Elements": "Use a size-k min-heap for the k largest values. Define behavior for k = 0 and k greater than the input size, and never read an empty heap root.",
      "Overlapping Intervals": "Use sorting and merging for overlapping intervals. Decide whether endpoints are inclusive: [1,2] and [2,3] overlap only under the relevant boundary convention.",
      "Modified Binary Search": "Use binary search when each comparison eliminates a known half or feasibility is monotonic. Duplicates in rotated input can make the sorted half ambiguous.",
      "Binary Tree Traversal": "Use traversal order to place work before, between, or after children. Inorder is sorted only for a valid BST; deep trees can overflow a recursive stack.",
      "Depth-First Search (DFS)": "Use DFS for reachability, components, and path exploration. Track visited nodes in cyclic graphs; undo path-specific state without clearing global visitation incorrectly.",
      "Breadth-First Search (BFS)": "Use BFS for shortest hop count in an unweighted graph. Mark nodes when enqueuing to avoid repeated queue entries; weighted shortest paths need another algorithm.",
      "Shortest Path": "Use Dijkstra for non-negative weights and a suitable alternative when negative edges are possible. Guard unreachable distances and arithmetic overflow.",
      "Matrix Traversal": "Use grid traversal for adjacency problems. Check row and column bounds before indexing, and decide whether diagonal adjacency counts.",
      "Backtracking": "Use backtracking to enumerate constrained choices. Undo every mutation when returning, including after a rejected candidate, and handle duplicate choices deliberately.",
      "Prefix Search (Trie)": "Use a trie for shared-prefix lookup. A prefix node is not automatically a complete word; store a terminal marker and define empty-string behavior.",
      "Greedy": "Use greedy choices only with an exchange or dominance proof. Earliest-finish interval scheduling works for maximum count, but not automatically for maximum total weight.",
      "Dynamic Programming Patterns": "Use DP when subproblems overlap and a state summarizes all relevant history. Specify the base case and dependency order; an insufficient state merges distinct futures."
    }
  },
  "system-design-concepts": {
    "whenToUse": "Use when translating a workload and user contract into service, storage, and failure-handling decisions.",
    "avoid": "Avoid choosing infrastructure before defining load, consistency, and acceptable degraded behavior.",
    "answers": {
      "1. Requirements and workload": "Component choices must fit the workload assumptions. Estimate peak requests and bytes per object separately; an average alone hides burst capacity.",
      "2. APIs and data ownership": "Each write has one authoritative owner and a defined idempotency rule. Pagination and tenant authorization must remain stable as data grows.",
      "3. Partitioning and replication": "Replicas and shards must preserve the operation's consistency contract. Route read-after-write traffic to an authoritative source when replica lag is unacceptable.",
      "4. Caching and CDNs": "Serving from cache must respect freshness and privacy. A catalog description may tolerate stale data while checkout must verify its authoritative price.",
      "5. Queues and event-driven work": "An acknowledged business operation must have a recoverable path to completion. Deduplicate replayed messages and track poison-message ownership.",
      "6. Reliability and failure recovery": "Failure handling must stay within the caller deadline and capacity limits. Reject or degrade explicitly rather than multiplying retries indefinitely.",
      "7. Security and observability": "Every protected request must be authorized at its owner, and telemetry must explain failures without exposing secrets or unbounded metric labels.",
      "8. Capacity review": "The design must name its next capacity limit and a migration path. For a hot shard, validate routing and redistribution while maintaining availability targets."
    }
  },
  "system-design-handbook": {
    "whenToUse": "Use when comparing architectural mechanisms against a stated capacity, consistency, or reliability requirement.",
    "avoid": "Avoid treating a mechanism as universally beneficial without its operating and failure costs.",
    "answers": {
      "1. Scalability": "Scaling must preserve correctness and resource bounds. Adding stateless instances helps only when the stateful dependency can sustain the extra traffic.",
      "2. Availability": "Availability is measured at the user boundary. Failover must restore useful service within the agreed recovery target, not merely start another process.",
      "3. Latency vs throughput": "Throughput gains must not silently violate latency targets. Measure distributions under the same offered load when evaluating batching.",
      "4. CAP theorem": "During a partition, specify whether an operation requires linearizable results or must remain available; CAP does not mean choosing any two properties at all times.",
      "5. Load balancers": "Only ready instances should receive traffic, and draining must let accepted work finish within a bound. Retry policy must not overload surviving instances.",
      "6. Databases": "The store must support the access patterns and invariants. Choose transaction and query requirements before choosing a database family.",
      "7. CDN": "Cache keys and cacheability must preserve privacy. Public immutable assets can be shared; personalized responses require isolation or bypass.",
      "8. Message queues": "Delivery, ordering scope, and acknowledgment behavior must be explicit. A consumer crash after a side effect must not cause that effect twice on replay.",
      "9. Rate limiting": "Limits must apply to a defined principal or tenant and window. Concurrent enforcement must not allow every caller to independently spend the same token.",
      "10. Database indexes": "An index must preserve query results while reducing relevant work. Measure actual rows and reads, and account for write and storage overhead.",
      "11. Caching": "Cache hits must meet the freshness contract. A high hit rate does not excuse stale authorization decisions or an uncontrolled miss storm.",
      "12. Consistent hashing": "Membership changes should move only affected key ranges while preserving routing consistency. Virtual nodes improve distribution but do not create migration bandwidth.",
      "13. Database sharding": "Every record must route to its authoritative shard. Choose a stable partition key and plan for hot tenants, cross-shard queries, and rebalance recovery.",
      "14. Consensus algorithms": "Only a valid leader or quorum may commit decisions. Fence stale leaders and specify what happens when the quorum is unavailable."
    }
  },
  "production-java-reliability": {
    "whenToUse": "Use when reviewing a Java service's state ownership, resources, error behavior, and production signals.",
    "avoid": "Avoid adding concurrency or abstraction without a clear invariant and a measurable problem.",
    "answers": {
      "1. Ownership and invariants": "State changes must pass through the business invariant. An order cannot be refunded twice simply because two controllers expose the same operation.",
      "2. Concurrency boundaries": "Shared mutable state needs an explicit atomic boundary; visibility alone does not make check-then-update safe. Executors also need bounds and shutdown ownership.",
      "3. Persistence and transactions": "A local commit must not imply a remote side effect succeeded. Keep the database transaction short and record durable follow-up intent when needed.",
      "4. Error handling": "Callers receive a safe, stable error contract while operators retain a correlation ID and cause. Retry only failures the operation can safely repeat.",
      "5. Observability": "Signals must describe user outcomes and saturation without leaking secrets. Alert thresholds must lead to a concrete response.",
      "6. Performance review": "A performance change must preserve correctness and improve the measured bottleneck under representative load, including tail latency and memory."
    }
  },
  "api-reliability-playbook": {
    "whenToUse": "Use when defining API behavior under retries, dependency failures, overload, and client upgrades.",
    "avoid": "Avoid implicit deadlines, unbounded queues, or retries without an idempotency contract.",
    "answers": {
      "1. Contract first": "Retries and pagination must preserve the API contract. Repeating a create operation with the same idempotency key must not create a second resource.",
      "2. Timeouts and budgets": "Child calls and queue waits must fit inside the caller deadline, with time reserved for response handling and cleanup.",
      "3. Retries and idempotency": "A retry must preserve operation intent and use the original key. A timeout after commit requires lookup or safe repetition, not a new identity.",
      "4. Backpressure": "Accepted work must fit bounded concurrency and queues. Reject excess work promptly rather than retaining it until every caller times out.",
      "5. Safe evolution": "Old consumers must still understand responses during the migration window. Add fields, observe adoption, then remove obsolete behavior deliberately.",
      "6. Incident playbook": "Mitigation must reduce user impact and remain reversible. Verify recovery with errors, latency, saturation, and queue age before declaring resolution."
    }
  },
  "technical-interview-communication": {
    "whenToUse": "Use when explaining a technical decision so another person can assess assumptions, reasoning, and evidence.",
    "avoid": "Avoid listing technologies without connecting them to the problem and its trade-offs.",
    "answers": {
      "1. Clarify the problem": "Both people must agree on the goal and constraints. Restate assumptions about load, consistency, and expected output before solving.",
      "2. Lead with a mental model": "The model must explain the mechanism faithfully. Describe a cache as a copy with a freshness policy, then illustrate one miss and one update.",
      "3. Show the proof": "Each claim needs evidence: an invariant for an algorithm, a failure trace for a system, or a test for a code change.",
      "4. Discuss alternatives": "Compare alternatives against the same constraints. Prefer SQL for a transaction-heavy workflow because of its invariants, not because it is universally superior.",
      "5. Handle changing requirements": "Identify which assumption changed and adapt the affected boundary. A new region may change replication and consistency without replacing the whole API.",
      "6. Close strongly": "Close with the decision, trade-off, remaining risk, and next measurement. Do not introduce an unexamined new architecture in the final sentence."
    }
  },
  "java-concurrency-interviews": {
    "whenToUse": "Use when multiple tasks share state or contend for bounded threads, connections, or downstream capacity.",
    "avoid": "Avoid assuming thread-safe collections make a multi-step workflow atomic.",
    "answers": {
      "1. The three concurrency guarantees": "Atomicity, visibility, and ordering are separate obligations. A volatile counter is visible but incrementing it is not an atomic read-modify-write.",
      "2. Locks and immutability": "Immutable values avoid shared mutation; locks protect multi-step invariants. Use the same lock for every access participating in that invariant.",
      "3. Executors and backpressure": "Outstanding work and queue size must remain bounded. An executor rejection policy is part of the caller contract, not an unexpected implementation detail.",
      "4. Futures and cancellation": "Cancellation must propagate to owned work and preserve interruption. Cancelling a future alone does not prove a blocked remote call stopped.",
      "5. Deadlocks and diagnostics": "Lock acquisition must avoid cyclic dependencies. Use thread dumps to identify the owning and waiting threads before changing lock order.",
      "6. Interview review": "Explain the shared state, protected invariant, synchronization, and shutdown path. Include an interleaving that would fail without the chosen mechanism."
    }
  },
  "sql-performance-interviews": {
    "whenToUse": "Use when a real query is slow or resource-intensive under representative data and concurrency.",
    "avoid": "Avoid changing indexes or query shape without checking result equivalence and the actual plan.",
    "answers": {
      "1. Capture the real problem": "Use the actual query, bind values, row counts, and workload. A fast synthetic query may hide production skew or a different execution plan.",
      "2. Read an execution plan": "Compare estimated and actual row counts at each step. A large mismatch can explain a bad join choice even when an index exists.",
      "3. Index design": "Choose index order from equality, range, and ordering requirements. Confirm selectivity and the write cost using the real plan.",
      "4. Query shape": "Rewriting a query must preserve rows, duplicates, and null semantics. Moving a filter across an outer join can silently change the result.",
      "5. Growth and contention": "A plan that works for small data must still control scans, lock duration, and contention at expected growth. Measure concurrent traffic, not just one query.",
      "6. Prove the fix": "Compare correct results and latency under equivalent workloads before and after. Keep rollback and watch write overhead after adding an index."
    }
  },
  "distributed-systems-interviews": {
    "whenToUse": "Use when correctness depends on behavior across network, ownership, replication, or process boundaries.",
    "avoid": "Avoid assuming a timeout proves failure or that independent services share one transaction.",
    "answers": {
      "1. Failure is normal": "A timeout is uncertainty, not proof of failure. Distinguish lost requests, lost responses, delayed work, and process crashes before choosing recovery.",
      "2. Ownership and consistency": "Each invariant needs an authoritative owner and explicit consistency. If two services can both approve the same scarce resource, ownership is unresolved.",
      "3. Replication and lag": "Replica reads may lag the writer. Provide read-your-writes routing or another explicit guarantee when a user must immediately see their own update.",
      "4. Idempotency and deduplication": "The same operation key must preserve the same intent and result across restarts. Deduplication and the protected local side effect must commit together.",
      "5. Coordination and leader election": "Leader election alone does not prevent a paused old leader from writing. Use a fencing token checked by the resource owner.",
      "6. Presenting the design": "Walk one successful request and one partial failure, showing state ownership, time budgets, recovery, and the consistency trade-off."
    }
  },
  "behavioral-star-interviews": {
    "whenToUse": "Use when explaining a real decision, your contribution, and the outcome in a behavioral interview.",
    "avoid": "Avoid invented metrics, inflated ownership, or a memorized story that does not answer the question.",
    "answers": {
      "1. Build a story bank": "Stories must be truthful and distinguish your contribution from the team's. Keep enough evidence to answer follow-ups without inventing metrics.",
      "2. Situation and Task": "Explain the stakes and your responsibility briefly. The task should say what you owned, not imply you controlled the entire organization.",
      "3. Action with judgement": "Describe the decision you made, the alternatives, and why. A disagreement story should show how you used evidence and handled another viewpoint.",
      "4. Result and learning": "Report the actual outcome and lesson, including an imperfect result. If a metric is unavailable, use a concrete observable outcome rather than a fabricated number.",
      "5. Follow-up handling": "Answer the follow-up directly and acknowledge uncertainty. Keep facts consistent with the original story and do not expand your ownership retrospectively.",
      "6. Practice and calibration": "Practice concise delivery while keeping the facts intact. Feedback should improve clarity and specificity, not turn the story into a memorized script."
    }
  },
  "system-design-fundamentals-roadmap": {
    "whenToUse": "Use when organizing a design from requirements through data ownership, communication, capacity, and operations.",
    "avoid": "Avoid skipping the workload and failure assumptions to jump directly to a technology diagram.",
    "answers": {
      "1. Course roadmap": "Choose a learning sequence: requirements and workload first, then data and communication boundaries, then failure handling and operations. Use one running example to connect the topics.",
      "2. Scalability and availability": "Decide whether the immediate constraint is capacity or uptime. More replicas may improve availability but cannot remove a single saturated database writer.",
      "3. Latency, throughput, and bandwidth": "Choose separate targets for response time, completed work per second, and bytes per second; identify which resource limits each target.",
      "4. Consistency and CAP": "Define the consistency guarantee per operation and the behavior during a network partition. A stale catalog read and a stock allocation can justify different choices.",
      "5. Networking fundamentals": "Identify where DNS, TLS, proxying, and HTTP time contribute latency or failure. Choose deadlines and trust boundaries for the actual request path.",
      "6. Load balancing": "Choose health checks, readiness, routing, and draining behavior. Explain what happens to traffic when an instance is removed during an active request.",
      "7. API design and security": "Define identity, authorization, resource ownership, pagination, and repeatable commands. A valid token alone does not authorize access to another tenant.",
      "8. Real-time and asynchronous communication": "Decide whether a caller needs an immediate result or can observe completion later. Specify event delivery and duplicate handling when choosing asynchronous work.",
      "9. Caching and CDNs": "Choose the freshness and invalidation contract before a cache location. Distinguish public CDN content from private per-user responses.",
      "10. Database choices": "Choose storage from transaction needs, query shapes, and growth. Explain one query or invariant that makes the alternative less suitable.",
      "11. Database internals": "Decide how indexes, logs, and storage layout serve the workload. An extra index must justify its write amplification and space cost.",
      "12. Read and write scaling": "Choose replicas for acceptable read lag and partitioning for write or storage scale. Name the owner and routing key for each write.",
      "13. Storage systems": "Choose block, file, or object access from update granularity, access protocol, durability, and cost; do not assume all storage supports the same operations.",
      "14. Architecture patterns": "Choose boundaries and coupling from the domain and team constraints. A modular monolith can preserve local transactions while services add network failure boundaries.",
      "15. Microservices patterns": "Select each pattern for a specific pressure: a gateway for edge routing, a bulkhead for capacity isolation, or a Strangler boundary for migration.",
      "16. Distributed systems": "Specify failure assumptions, ordering, and coordination requirements. Logical clocks order events but do not remove network partitions or guarantee exactly-once side effects.",
      "17. Distributed transactions": "Decide whether local transactions plus compensation preserve the business invariant. Make intermediate states and recovery explicit before choosing coordination.",
      "18. Scale data structures and processing": "Choose approximate structures only when their error model is acceptable. A Bloom filter may answer possibly present, so positives still need authoritative lookup.",
      "19. Deployment and observability": "Choose deployment gates, rollback conditions, and observability before shifting traffic. A canary must measure correctness as well as error rate.",
      "20. Security and integrated design": "Connect identity, authorization, encrypted boundaries, and secret ownership to one complete request. Finish with failure behavior, operating signals, and explicit trade-offs."
    }
  },
  "java-observability-opentelemetry": {
    "whenToUse": "Use when choosing telemetry to explain user impact and follow work across service and executor boundaries.",
    "avoid": "Avoid unbounded metric labels, secret-bearing logs, or instrumentation without a diagnostic purpose.",
    "answers": {
      "1. Signals and user impact": "Use metrics to detect a pattern, traces to locate a slow boundary, and logs to explain a decision. All three must connect back to a user-visible symptom.",
      "2. Instrumentation boundaries": "Spans should represent meaningful boundaries and owned work. A database call deserves a span; instrumenting every trivial method adds cost without explaining latency.",
      "3. Context propagation": "The parent context must reach the next task or service. Capture and restore it across executor and message boundaries, and clean it up after the operation.",
      "4. Metrics and cardinality": "Metric label sets must be bounded. Use a route template instead of a URL containing a user ID; keep request-specific detail in traces or logs.",
      "5. Sampling, cost, and privacy": "Telemetry must fit cost and privacy limits. Redact secrets before export and document sampling blind spots instead of assuming every error has a trace.",
      "6. Operate the feedback loop": "Every alert needs a responsible owner and a useful next action. Verify that the runbook finds the failing boundary and measures recovery."
    }
  },
  "spring-transactions-data-access": {
    "whenToUse": "Use when deciding commit boundaries, concurrent update behavior, fetch plans, and persistence tests.",
    "avoid": "Avoid assuming annotations make remote side effects atomic or mocks prove database semantics.",
    "answers": {
      "1. Transaction boundaries": "Commit all state needed for one business invariant together, such as an order and its publication intent. Keep remote calls outside a long-held local transaction.",
      "2. Propagation and rollback": "An independent inner transaction can commit even when the outer transaction later rolls back. Document that outcome and test the actual propagation and rollback configuration.",
      "3. Isolation and locking": "Two requests cannot both reserve the final item. Use a conditional version update or suitable locking and handle the losing transaction explicitly.",
      "4. ORM behavior and query shape": "Query count and fetch scope must remain bounded for a page. Loading one association per row can turn a single page request into an N+1 query problem.",
      "5. Outbox and remote calls": "The local transaction must record both the state change and outbox intent. A remote HTTP call does not become atomic merely because it runs inside a transactional method.",
      "6. Prove persistence behavior": "Use the real database to verify commit, rollback, uniqueness, and concurrent conflicts. A mocked repository cannot prove isolation or constraint behavior."
    }
  },
  "java-performance-clinic": {
    "whenToUse": "Use when a measured latency, throughput, allocation, or memory target is missed.",
    "avoid": "Avoid tuning from intuition or comparing benchmarks with different workload assumptions.",
    "answers": {
      "1. Define the performance contract": "Specify a target such as p99 latency at a stated request rate and memory limit. Preserve the workload and correctness checks when comparing changes.",
      "2. CPU and allocation evidence": "Separate CPU work, allocation churn, lock waits, and I/O with appropriate profiles. A high CPU percentage does not identify the responsible method.",
      "3. Garbage collection and heap": "Distinguish allocation rate from retained live data. Extra heap may delay pressure but cannot fix unbounded retention or guarantee lower pauses.",
      "4. Threads, locks, and queues": "Measure pool usage and blocked threads before increasing thread count. Waiting for a saturated connection pool requires controlling downstream demand.",
      "5. Benchmark without lying": "Use representative data, warmup, repeated samples, and distributions. A benchmark must prevent dead-code elimination and include the cost relevant to the production hypothesis.",
      "6. Change and verify": "Change one variable, compare the agreed user metric, and keep a rollback threshold. Retain the change only if the gain survives realistic sustained load."
    }
  },
  "event-driven-java-reliability": {
    "whenToUse": "Use when a Java workflow publishes, consumes, retries, or replays durable messages.",
    "avoid": "Avoid assuming delivery order or exactly-once external effects without defining the system boundary.",
    "answers": {
      "1. Delivery guarantees": "State where the delivery guarantee ends. Exactly-once processing inside a broker does not automatically prevent a duplicate external payment.",
      "2. Idempotent consumers": "Persist the stable event ID with the local effect in one transaction. After a restart, replay must return or preserve the original result.",
      "3. Ordering and partitions": "Preserve order for the business key that needs it, such as an order ID. Global ordering costs throughput and can let one hot key block unrelated work.",
      "4. Retries and poison messages": "Transient failures get bounded retries; malformed messages get an owned dead-letter path. Replay must follow a fix and respect downstream capacity.",
      "5. Outbox and schema evolution": "Commit the outbox with business state and prove schema compatibility for old consumers. Additive changes still need tests against strict readers.",
      "6. Operate and replay": "Replay only after proving idempotency and choosing a bounded rate. Watch backlog age, duplicate suppression, and side effects until recovery completes."
    }
  },
  "production-java-testing": {
    "whenToUse": "Use when selecting the smallest test layer that proves a business, persistence, or integration contract.",
    "avoid": "Avoid tests that only mirror implementation steps or depend on sleeps and shared mutable fixtures.",
    "answers": {
      "1. Test the domain contract": "Assert business outcomes and forbidden transitions directly. A domain test for canceling an already-shipped order should prove rejection without needing a database.",
      "2. Integration boundaries": "Keep real collaborators where their behavior is the contract, such as transaction managers and serializers. Isolate test data and clean up owned resources.",
      "3. API and contract tests": "Verify status, schema, authorization, and pagination as consumers observe them. Provider and consumer changes must preserve the agreed compatibility window.",
      "4. Async and time": "Inject clocks and schedulers so a retry can be advanced deterministically. Use bounded condition waiting for unavoidable asynchronous integration work.",
      "5. Failure-path testing": "Assert the resulting state after a failure, not just the exception. A timeout after commit must leave one effect and a recoverable response.",
      "6. Suite design and signals": "Place each scenario at the smallest layer that proves its risk. Track flaky tests and runtime while preserving real integration coverage for persistence and wiring."
    }
  },
  "java-memory-management-evolution": {
    "whenToUse": "Use when explaining allocation, retention, GC behavior, or memory pressure in a Java process.",
    "avoid": "Avoid equating process memory with heap or increasing heap before identifying the growing region.",
    "answers": {
      "1. The memory map": "Heap is only one region of process memory. Include stacks, metaspace, code cache, direct buffers, and other native allocations when diagnosing container pressure.",
      "2. Allocation and object lifetime": "Allocation is not retention: short-lived objects can increase GC work while a small static collection can retain a large graph indefinitely.",
      "3. Collector evolution": "Choose a collector by measured pause, throughput, and memory goals on the supported runtime. Lower pauses can trade additional CPU or heap headroom.",
      "4. References and leaks": "An unwanted path from a GC root keeps objects alive. Remove the owning reference or bound its lifecycle; calling GC cannot free reachable objects.",
      "5. Off-heap and container limits": "Budget the entire process below the container limit with headroom. A stable Java heap does not rule out native growth or too many thread stacks.",
      "6. Diagnose and evolve safely": "Correlate region-specific evidence with RSS and GC behavior, then change one cause. Verify latency, memory, and recovery under the same workload."
    }
  }
};
