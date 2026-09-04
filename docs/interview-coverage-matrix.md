# Interview coverage matrix

This matrix uses an external interview-study repository as a coverage reference only. Its README is a broad index of DSA prompts (arrays, strings, linked lists, trees, heaps, graphs, greedy, dynamic programming, divide-and-conquer, backtracking, and bit manipulation) and it also contains Java, Spring, SQL/NoSQL, AWS, Python, JavaScript, REST, and microservices study files. We create original explanations and examples; we do not import its PDFs or prose.

## Coverage and depth

| Area | Reference signal | InterviewIQ today | Gap / next visual priority |
| --- | --- | --- | --- |
| Arrays + strings | Large prompt lists, including Kadane, windows, rotations, anagrams, and four-sum | DSA Visual Lab patterns, guided walkthroughs, Blind 75 track | Add a canonical worked-state gallery: two pointers, sliding window, prefix sum, partitioning |
| Linked lists + stacks/queues | Reversal, cycle, merge, LRU, monotonic stack, queue/stack conversions | DSA lab visualizations and drills | Add pointer-before/after animation and invariant/failure cards |
| Trees + heaps | Traversals, views, LCA, serialization, heap median, k-way merge | DSA lab and interview challenges | Add recursion-frame and heap-array state playback |
| Graphs + greedy + DP | DFS/BFS, Dijkstra, topo sort, MST, LIS/LCS, knapsack, edit distance | DSA lab foundations and challenge bank | Highest breadth gap; add state-table and frontier visualizations |
| Backtracking + bit manipulation | N-Queens, Sudoku, maze, bit masks and XOR | Partial challenge coverage | Add decision-tree animation and bit-mask truth-table cards |
| Core Java + collections | Java interview PDFs and collections/tricky-question references | Java Digest plus Interview Ready Q&A | Map every catalog topic to worked heap/thread/collection examples |
| Spring/backend | Spring, Hibernate, REST, microservices references | Java Digest, public guides, company prep | Add request/transaction/error-flow diagrams to each high-frequency answer |
| SQL/data | SQL vs NoSQL reference and database interview material | SQL guides and Java data curriculum | Add before/after row sets, query-plan path, lock/isolation timeline |
| AWS/operations | AWS, Git, Maven, Docker-adjacent reference files | AWS/system-design guides and canvas | Add service-boundary, failure-domain, cost and recovery visual cards |
| HLD/LLD/design | Architecture and microservices references; fewer explicit LLD exercises | Design Lab and System Design Canvas | Add per-pattern class/sequence diagrams and HLD-to-LLD mapping playback |

## Prioritization rubric

1. High-frequency + high-misconception: HashMap/equality, two pointers, sliding window, BFS/DFS, binary search, transactions, retries, caching, idempotency.
2. High-frequency + state-heavy: DP tables, heap operations, LRU, concurrency, locks, HLD request flow, LLD state machines.
3. Breadth expansion: bit manipulation, backtracking, advanced graph algorithms, uncommon Java/framework topics.

Each promoted answer should ship with: a concrete input, visible state transitions, invariant, complexity, trade-off, failure mode, and edge-case checklist.
