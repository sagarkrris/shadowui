// Teaching scenarios: assumptions are explicit, rather than inferred from keywords.
export const CONSTRAINT_BANDS = [
  ['n ≤ 10', 'Factorial search may be feasible', '10! = 3,628,800 permutations before per-result work.'],
  ['n ≤ 20', 'Subset search may be feasible', '2²⁰ = 1,048,576 subsets; output copying adds work.'],
  ['n around 100', 'Consider O(n³) or better', '100³ = 1,000,000 basic iterations.'],
  ['n around 1,000', 'Consider O(n²) or better', '1,000² = 1,000,000 basic iterations.'],
  ['n around 100,000', 'Usually seek O(n log n) or O(n)', 'n² = 10 billion; n log₂ n is about 1.7 million.'],
  ['n around 1,000,000', 'Usually seek O(n) with careful memory', 'Even linear allocation can exceed the memory limit.'],
];

export const STRUCTURE_CLUES = [
  ['Seen before, counts, complement lookup', 'HashSet / HashMap', 'Membership versus counts versus original indices need different stored values.'],
  ['Sorted input, pair target', 'Two pointers on an array', 'Prove which pointer can move; preserve original indices if sorting.'],
  ['Contiguous range', 'Sliding window / prefix sums', 'A window needs a valid removal rule; exact sums with negatives often need prefix counts.'],
  ['Next greater/smaller, nested matching', 'Monotonic stack / ordinary stack', 'A stack removes the most recent item first; next-greater queries also need value ordering.'],
  ['Top k, repeated smallest/largest', 'Heap / buckets / sorting', 'Small k suggests a bounded heap; bounded frequencies may allow buckets.'],
  ['Fewest edges, levels, equal edge costs', 'BFS with queue + visited set', 'A queue processes first-in-first-out. Unequal edge costs invalidate ordinary BFS distance.'],
  ['Weighted shortest path', 'Dijkstra + min-heap', 'Requires nonnegative edge weights; negative weights need another algorithm.'],
  ['Prefix words, autocomplete', 'Trie', 'A trie shares character prefixes; an exact-word lookup alone may only need a set.'],
  ['Connectivity under added edges', 'Disjoint-set union', 'Tracks components; ordinary DSU does not handle arbitrary edge deletion.'],
  ['Repeated subproblems, count/optimize choices', 'DP array / memoization map', 'Define the state and transition first. DP is a technique, not a data structure.'],
  ['Range queries with updates', 'Fenwick / segment tree', 'Static sums often only need prefix sums. Match the aggregate and update operation.'],
  ['Small bounded value domain', 'Frequency array / bitset', 'Allocate by domain size, not input length; sparse huge values favor a map.'],
];

export const CONSTRAINT_SCENARIOS = [
  {
    id: 'two-sum', title: 'Two Sum: unsorted, original indices',
    prompt: 'Return two distinct original indices whose values sum to a target. Assume n ≤ 100,000, values may repeat, and extra memory is allowed.',
    choice: 'HashMap: value → earlier index',
    mechanism: 'For each value x, look for target − x among earlier values, then store x. The invariant (a rule preserved after every step) is that the map contains only earlier indices, so the same element cannot be used twice.',
    example: '[3, 3], target 6: store 3 at index 0; at index 1 the complement is already stored, so return [0, 1].',
    cost: 'Expected O(n) time under good hash dispersion; O(n) extra space. Sorting indexed pairs is O(n log n) and needs index bookkeeping.',
    trap: 'n ≤ 100,000 narrows the time budget but does not uniquely imply hashing. Sorted input could support two pointers with O(1) auxiliary space.',
    verify: 'Test [3,3] → two different indices; [3] → no pair; negatives; no solution. In Java, widen before subtracting when int overflow is possible.',
    spoken: 'I need original indices from unsorted data. Comparing all pairs takes quadratic time, which is risky at 100,000 elements. I will remember earlier values in a hash map and check the complement before inserting. That prevents reusing an index and handles duplicates. This takes expected linear time and linear space; if memory is restricted, I would discuss sorting with index tracking or other constraints.',
    followup: 'What if the input is already sorted? Move two pointers inward: a sum below the target rules out the smaller endpoint, and a sum above it rules out the larger endpoint. This uses linear time and constant auxiliary space.',
  },
  {
    id: 'sum-negative', title: 'Exact subarray sum: negatives allowed',
    prompt: 'Count contiguous subarrays with sum k. Assume n ≤ 100,000, negative values and zeros are allowed.',
    choice: 'Prefix sum + HashMap of prefix frequencies',
    mechanism: 'A prefix sum is the total before a boundary. If the current total is S, every earlier boundary with total S − k starts a valid subarray. Seed frequency 0 with 1, add the frequency of S − k, then increment the frequency of S.',
    example: '[1, -1, 1], k = 1 has three answers: each single 1 and the whole array. Repeated prefix totals must be counted, not just recorded as present.',
    cost: 'Expected O(n) time and O(n) space. Checking every start/end pair costs O(n²).',
    trap: 'A sum-based shrink-when-too-large window fails: for [4, -1], k = 3, discarding 4 immediately loses the valid whole array.',
    verify: 'Test [0,0], k=0 → 3; [4,-1], k=3 → 1; empty input → 0 when allowed. Use wide types for totals and counts: 100,000 zeros have 5,000,050,000 subarrays.',
    spoken: 'Contiguous does not automatically mean sliding window. Negative values make the sum rise or fall when a window expands. I will count earlier prefix sums equal to the current sum minus k. A frequency map handles repeated totals, and the initial zero prefix counts ranges starting at index zero. I will query before updating and use wide arithmetic. The expected cost is linear time and linear memory.',
    followup: 'Why not a set? For [0,0] and k=0, the second zero matches two earlier zero prefixes. A set loses that multiplicity and undercounts.',
  },
  {
    id: 'top-k', title: 'Streaming top k: k is small',
    prompt: 'Retain the k largest values from a stream with duplicates. Assume n ≤ 1,000,000 and 1 ≤ k ≤ min(n, 100); output order is irrelevant.',
    choice: 'Min-heap of at most k values',
    mechanism: 'The smallest retained value sits at the root. Fill the heap, then replace that root only when a larger value arrives. After each input, the heap contains the largest k values seen so far (or all values if fewer than k have arrived).',
    example: 'Stream [5,1,5,3], k=2: retained multisets are [5], [1,5], [5,5], [5,5]. Duplicate values occupy separate slots.',
    cost: 'O(n log(k + 1)) time and O(k) auxiliary space. Sorting all n values costs O(n log n) time and requires retaining the input.',
    trap: 'Top k does not always mean heap. An offline array can use selection; top k frequent values also need frequency counting first. Heap iteration is not sorted.',
    verify: 'Check k=1, k=n within the stated domain, all duplicates and negative values. Polling produces ascending order; sort only if the required output demands it.',
    spoken: 'The stream prevents sorting all values without retaining them. Because k is small, I will keep a min-heap of the best k values. Its root is the weakest retained candidate, so a larger value replaces it. This keeps duplicates and bounds extra memory by k. Each replacement costs logarithmic time in k. I would clarify whether sorted output is required before adding a final sort.',
    followup: 'Why a min-heap for the largest values? It exposes the smallest retained value, which is exactly the one a better candidate should replace.',
  },
];
