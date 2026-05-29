export const FEATURED_BLIND75_IDS = [
  "two-sum",
  "best-time-to-buy-and-sell-stock",
  "contains-duplicate",
  "product-of-array-except-self",
  "valid-anagram",
  "valid-palindrome",
  "3sum",
  "container-with-most-water",
  "longest-substring-without-repeating-characters",
  "valid-parentheses",
  "binary-search",
  "reverse-linked-list",
  "maximum-depth-of-binary-tree",
  "number-of-islands",
  "climbing-stairs",
];

export const DSA_CONFIDENCE_STORAGE_KEY = "interviewiq:dsa-confidence:v1";

const MASTERY_CHECKLIST = [
  {
    id: "understand",
    label: "Understand",
    coach: "Restate the problem, input, output, and constraints before touching code.",
  },
  {
    id: "visualize",
    label: "Visualize",
    coach: "Point to the changing state and explain why each move is legal.",
  },
  {
    id: "dry-run",
    label: "Dry Run",
    coach: "Run one normal example out loud with indexes, values, and state.",
  },
  {
    id: "code",
    label: "Code",
    coach: "Write the selected-stack template cleanly without changing the invariant.",
  },
  {
    id: "test-cases",
    label: "Test Cases",
    coach: "Try normal, edge, and trick cases before claiming the solution works.",
  },
  {
    id: "complexity",
    label: "Explain Complexity",
    coach: "State time, space, and the trade-off that makes this pattern useful.",
  },
];

export const BLIND75_VISUALIZERS = [
  {
    id: "arrays-hashing",
    title: "Arrays & Hashing",
    icon: "ti ti-hash",
    memoryHook: "Use a table when remembering beats searching.",
    invariant: "The map or table only contains seen facts already proven by earlier positions.",
    defaultInput: [2, 7, 11, 15],
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    icon: "ti ti-arrows-left-right",
    memoryHook: "Move the pointer whose side you can safely eliminate.",
    invariant: "Every left or right move discards choices that cannot improve or satisfy the answer.",
    defaultInput: [1, 2, 3, 4, 6, 8],
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    icon: "ti ti-window",
    memoryHook: "Expand to learn, shrink to restore the rule.",
    invariant: "The active window is always the best candidate that still obeys the problem rule.",
    defaultInput: "abcabcbb",
    inputKind: "string",
    complexity: { time: "O(n)", space: "O(k)" },
  },
  {
    id: "stack",
    title: "Stack",
    icon: "ti ti-stack-2",
    memoryHook: "The top is the most recent unfinished obligation.",
    invariant: "The stack contains exactly the unresolved items that must be matched or returned to later.",
    defaultInput: ["(", "{", "}", ")"],
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "binary-search",
    title: "Binary Search",
    icon: "ti ti-target-arrow",
    memoryHook: "Keep the answer inside low and high.",
    invariant: "The answer, if it exists, still lives inside the current low-to-high search range.",
    defaultInput: [1, 3, 5, 7, 9, 11],
    complexity: { time: "O(log n)", space: "O(1)" },
  },
  {
    id: "linked-list",
    title: "Linked List",
    icon: "ti ti-link",
    memoryHook: "Move references, not values.",
    invariant: "Every pointer update preserves access to the remaining list before rewiring the current node.",
    defaultInput: ["1", "2", "3", "4"],
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "trees",
    title: "Trees",
    icon: "ti ti-binary-tree",
    memoryHook: "Define one node's job, then trust the children.",
    invariant: "Each visit returns a correct answer for one subtree before the parent combines results.",
    defaultInput: ["8", "3", "10", "1", "6"],
    complexity: { time: "O(n)", space: "O(h)" },
  },
  {
    id: "graphs",
    title: "Graphs",
    icon: "ti ti-route",
    memoryHook: "Visited protects you; frontier tells you where to go next.",
    invariant: "Visited contains every node already scheduled or processed, so traversal cannot loop or double-count.",
    defaultInput: ["A", "B", "C", "D"],
    complexity: { time: "O(V + E)", space: "O(V)" },
  },
  {
    id: "dp",
    title: "Dynamic Programming",
    icon: "ti ti-table",
    memoryHook: "State first, transition second, code third.",
    invariant: "Every filled state is computed from smaller states whose answers are already known.",
    defaultInput: [1, 1, 2, 3, 5],
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "heap",
    title: "Heap / Priority Queue",
    icon: "ti ti-triangle-square-circle",
    memoryHook: "Keep the next best item at the top.",
    invariant: "The heap contains the candidates that can still become the next required answer.",
    defaultInput: [1, 3, 5, 7],
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "trie",
    title: "Trie",
    icon: "ti ti-sitemap",
    memoryHook: "Each character chooses the next branch.",
    invariant: "The current trie node represents exactly the prefix consumed so far.",
    defaultInput: ["c", "a", "t", "r"],
    complexity: { time: "O(w)", space: "O(w)" },
  },
  {
    id: "intervals",
    title: "Intervals",
    icon: "ti ti-timeline",
    memoryHook: "Sort starts, then reason about overlaps.",
    invariant: "The merged result contains non-overlapping intervals for every interval already processed.",
    defaultInput: ["1-3", "2-6", "8-10"],
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "matrix",
    title: "Matrix",
    icon: "ti ti-grid-dots",
    memoryHook: "Rows and columns are coordinates, not mystery.",
    invariant: "Every visited cell has a known row-column meaning and is not processed twice.",
    defaultInput: ["r0c0", "r0c1", "r1c0", "r1c1"],
    complexity: { time: "O(mn)", space: "O(1)" },
  },
  {
    id: "bit",
    title: "Bit Manipulation",
    icon: "ti ti-binary",
    memoryHook: "Bits are switches; masks choose which switch matters.",
    invariant: "Each bit operation changes or inspects only the intended bit position.",
    defaultInput: [0, 1, 2, 3, 4],
    complexity: { time: "O(1)", space: "O(1)" },
  },
  {
    id: "greedy",
    title: "Greedy",
    icon: "ti ti-flame",
    memoryHook: "Make the locally safe move and prove it never blocks the future.",
    invariant: "The current choice keeps the best reachable answer among all choices considered so far.",
    defaultInput: [2, 3, 1, 1, 4],
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "backtracking",
    title: "Backtracking",
    icon: "ti ti-corner-up-left",
    memoryHook: "Choose, explore, undo.",
    invariant: "The path contains only choices that satisfy the rule up to the current depth.",
    defaultInput: [2, 3, 6, 7],
    complexity: { time: "O(2^n)", space: "O(n)" },
  },
];

const VISUALIZER_BY_ID = new Map(BLIND75_VISUALIZERS.map((visualizer) => [visualizer.id, visualizer]));

const PROBLEM_ROWS = [
  ["contains-duplicate", "Contains Duplicate", "Arrays & Hashing", "Easy", "arrays-hashing", "Detect whether any value appears more than once by remembering values already seen.", [1, 2, 3, 1]],
  ["valid-anagram", "Valid Anagram", "Arrays & Hashing", "Easy", "arrays-hashing", "Compare two words by counting how often each character appears.", "anagram"],
  ["two-sum", "Two Sum", "Arrays & Hashing", "Easy", "arrays-hashing", "Find two indices whose values reach a target by looking up the complement before storing the current value.", [2, 7, 11, 15]],
  ["group-anagrams", "Group Anagrams", "Arrays & Hashing", "Medium", "arrays-hashing", "Group words that share the same normalized character signature.", ["eat", "tea", "tan", "ate"]],
  ["top-k-frequent-elements", "Top K Frequent Elements", "Arrays & Hashing", "Medium", "heap", "Count values first, then keep the most frequent values near the top of a ranked structure.", [1, 1, 1, 2, 2, 3]],
  ["product-of-array-except-self", "Product of Array Except Self", "Arrays & Hashing", "Medium", "arrays-hashing", "Build each answer from the product before the index and the product after the index.", [1, 2, 3, 4]],
  ["encode-and-decode-strings", "Encode and Decode Strings", "Arrays & Hashing", "Medium", "arrays-hashing", "Serialize strings with enough length information that decoding never guesses where one string ends.", ["hi", "java", "ai"]],
  ["longest-consecutive-sequence", "Longest Consecutive Sequence", "Arrays & Hashing", "Medium", "arrays-hashing", "Use a set to start runs only at sequence beginnings and count forward once.", [100, 4, 200, 1, 3, 2]],

  ["valid-palindrome", "Valid Palindrome", "Two Pointers", "Easy", "two-pointers", "Move inward from both ends while skipping characters that do not count.", "racecar"],
  ["3sum", "3Sum", "Two Pointers", "Medium", "two-pointers", "Sort once, anchor one value, then use two pointers to find complement pairs without duplicates.", [-1, 0, 1, 2, -1, -4]],
  ["container-with-most-water", "Container With Most Water", "Two Pointers", "Medium", "two-pointers", "Track area between two walls and move the shorter wall because height limits the container.", [1, 8, 6, 2, 5, 4, 8, 3, 7]],

  ["best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Sliding Window", "Easy", "sliding-window", "Keep the cheapest buy day before today and update profit as the right side moves.", [7, 1, 5, 3, 6, 4]],
  ["longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "Sliding Window", "Medium", "sliding-window", "Grow the window until a duplicate appears, then move the left edge past the previous copy.", "abcabcbb"],
  ["longest-repeating-character-replacement", "Longest Repeating Character Replacement", "Sliding Window", "Medium", "sliding-window", "Keep a window that can become one repeated letter after at most k replacements.", "AABABBA"],
  ["minimum-window-substring", "Minimum Window Substring", "Sliding Window", "Hard", "sliding-window", "Expand until all required characters are covered, then shrink while coverage remains valid.", "ADOBECODEBANC"],

  ["valid-parentheses", "Valid Parentheses", "Stack", "Easy", "stack", "Push expected opening context and pop only when the closing character matches the latest open group.", ["(", "{", "}", ")"]],

  ["binary-search", "Binary Search", "Binary Search", "Easy", "binary-search", "Search a sorted range by comparing the middle value and discarding the impossible half.", [1, 3, 5, 7, 9, 11]],
  ["find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "Binary Search", "Medium", "binary-search", "Use the sorted half relationship to keep the minimum inside the active rotated range.", [4, 5, 6, 7, 0, 1, 2]],
  ["search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "Binary Search", "Medium", "binary-search", "Identify which side is sorted, then decide whether the target can live there.", [4, 5, 6, 7, 0, 1, 2]],

  ["reverse-linked-list", "Reverse Linked List", "Linked List", "Easy", "linked-list", "Rewire one node at a time while keeping a reference to the next node before changing links.", ["1", "2", "3", "4"]],
  ["merge-two-sorted-lists", "Merge Two Sorted Lists", "Linked List", "Easy", "linked-list", "Advance the list with the smaller current value and attach it to the merged tail.", ["1", "2", "4", "1", "3", "4"]],
  ["reorder-list", "Reorder List", "Linked List", "Medium", "linked-list", "Find the middle, reverse the second half, then weave nodes from the two halves.", ["1", "2", "3", "4", "5"]],
  ["remove-nth-node-from-end-of-list", "Remove Nth Node From End of List", "Linked List", "Medium", "linked-list", "Create a gap of n nodes, then move two pointers until the trailing pointer reaches the node before deletion.", ["1", "2", "3", "4", "5"]],
  ["linked-list-cycle", "Linked List Cycle", "Linked List", "Easy", "linked-list", "Move slow and fast pointers; a cycle exists if fast ever catches slow.", ["A", "B", "C", "D"]],
  ["merge-k-sorted-lists", "Merge K Sorted Lists", "Linked List", "Hard", "heap", "Use a priority queue to repeatedly choose the smallest current head among k lists.", ["1", "3", "5", "2", "4", "6"]],

  ["invert-binary-tree", "Invert Binary Tree", "Trees", "Easy", "trees", "Swap each node's left and right child after defining the same job for every subtree.", ["4", "2", "7", "1", "3"]],
  ["maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "Trees", "Easy", "trees", "Ask each child for its depth and return one plus the larger child result.", ["3", "9", "20", "15", "7"]],
  ["same-tree", "Same Tree", "Trees", "Easy", "trees", "Two trees match only when current values match and both child pairs match recursively.", ["1", "2", "3", "1", "2", "3"]],
  ["subtree-of-another-tree", "Subtree of Another Tree", "Trees", "Easy", "trees", "At each source node, either the trees match here or the subtree may start in a child.", ["3", "4", "5", "1", "2"]],
  ["lowest-common-ancestor-of-a-binary-search-tree", "Lowest Common Ancestor of a Binary Search Tree", "Trees", "Medium", "trees", "Use BST ordering to walk toward the split point where two target values diverge.", ["6", "2", "8", "0", "4", "7", "9"]],
  ["binary-tree-level-order-traversal", "Binary Tree Level Order Traversal", "Trees", "Medium", "graphs", "Process nodes breadth-first so every queue layer becomes one output row.", ["3", "9", "20", "15", "7"]],
  ["validate-binary-search-tree", "Validate Binary Search Tree", "Trees", "Medium", "trees", "Carry lower and upper bounds so every node proves it fits the allowed range.", ["5", "1", "7", "6", "8"]],
  ["kth-smallest-element-in-a-bst", "Kth Smallest Element in a BST", "Trees", "Medium", "trees", "Inorder traversal visits BST values in sorted order, so count visits until k.", ["5", "3", "6", "2", "4", "1"]],
  ["construct-binary-tree-from-preorder-and-inorder-traversal", "Construct Binary Tree From Preorder and Inorder Traversal", "Trees", "Medium", "trees", "Use preorder for the root and inorder positions to split left and right subtrees.", ["pre:3", "pre:9", "pre:20", "in:9", "in:3", "in:20"]],
  ["binary-tree-maximum-path-sum", "Binary Tree Maximum Path Sum", "Trees", "Hard", "trees", "Return the best gain upward while separately tracking the best path that bends through a node.", ["-10", "9", "20", "15", "7"]],
  ["serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", "Trees", "Hard", "trees", "Record null markers during traversal so rebuilding preserves exact tree shape.", ["1", "2", "3", "null", "null", "4", "5"]],

  ["find-median-from-data-stream", "Find Median From Data Stream", "Heap / Priority Queue", "Hard", "heap", "Balance a lower max-heap and upper min-heap so the median stays at the boundary.", [5, 15, 1, 3]],

  ["combination-sum", "Combination Sum", "Backtracking", "Medium", "backtracking", "Build combinations by choosing a candidate, recursing with remaining target, then undoing the choice.", [2, 3, 6, 7]],
  ["word-search", "Word Search", "Backtracking", "Medium", "backtracking", "Walk adjacent cells while marking the current path so one board cell is not reused in the same word.", ["A", "B", "C", "E", "S", "F"]],

  ["implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", "Tries", "Medium", "trie", "Store words character by character so prefix checks end at the node reached by the prefix.", ["a", "p", "p", "l", "e"]],
  ["design-add-and-search-words-data-structure", "Design Add and Search Words Data Structure", "Tries", "Medium", "trie", "Use trie DFS so a dot wildcard can branch to any child at that position.", ["b", "a", "d", ".", "a", "d"]],
  ["word-search-ii", "Word Search II", "Tries", "Hard", "trie", "Combine board DFS with a trie so dead prefixes stop early.", ["o", "a", "t", "h", "e", "a", "t"]],

  ["number-of-islands", "Number of Islands", "Graphs", "Medium", "graphs", "Count each land component once by flooding connected land from every new island start.", ["1", "1", "0", "0", "1"]],
  ["clone-graph", "Clone Graph", "Graphs", "Medium", "graphs", "Create each clone once, store it in a map, then connect neighbors through cloned references.", ["A", "B", "C", "D"]],
  ["pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "Graphs", "Medium", "graphs", "Traverse backward from each ocean edge to find cells that can reach both oceans.", ["P", "2", "3", "A", "5"]],
  ["course-schedule", "Course Schedule", "Graphs", "Medium", "graphs", "Detect whether prerequisites form a cycle before claiming every course can be finished.", ["0", "1", "2", "3"]],
  ["graph-valid-tree", "Graph Valid Tree", "Graphs", "Medium", "graphs", "A tree has exactly n - 1 edges and one connected component with no cycle.", ["0", "1", "2", "3"]],
  ["number-of-connected-components-in-an-undirected-graph", "Number of Connected Components in an Undirected Graph", "Graphs", "Medium", "graphs", "Start traversal from each unvisited node and count how many components are discovered.", ["0", "1", "2", "3", "4"]],

  ["alien-dictionary", "Alien Dictionary", "Advanced Graphs", "Hard", "graphs", "Build ordering edges from the first differing character between adjacent words, then topologically sort.", ["wrt", "wrf", "er", "ett", "rftt"]],

  ["climbing-stairs", "Climbing Stairs", "1-D DP", "Easy", "dp", "The ways to reach a stair equal the ways to reach the previous two stairs.", [1, 1, 2, 3, 5]],
  ["house-robber", "House Robber", "1-D DP", "Medium", "dp", "At each house choose between robbing it plus the best two back, or skipping it.", [2, 7, 9, 3, 1]],
  ["house-robber-ii", "House Robber II", "1-D DP", "Medium", "dp", "Break the circular street into two linear robberies because first and last cannot both be chosen.", [2, 3, 2, 3, 1]],
  ["longest-palindromic-substring", "Longest Palindromic Substring", "1-D DP", "Medium", "dp", "Expand around each possible center or remember ranges that are already palindromes.", "babad"],
  ["palindromic-substrings", "Palindromic Substrings", "1-D DP", "Medium", "dp", "Count every palindrome discovered by expanding from each odd and even center.", "aaa"],
  ["decode-ways", "Decode Ways", "1-D DP", "Medium", "dp", "Each position can be reached from one-digit and valid two-digit decodes.", "226"],
  ["coin-change", "Coin Change", "1-D DP", "Medium", "dp", "For each amount, try every coin and keep the smallest known count.", [1, 2, 5, 11]],
  ["maximum-product-subarray", "Maximum Product Subarray", "1-D DP", "Medium", "dp", "Track both max and min ending here because a negative value can flip the best product.", [2, 3, -2, 4]],
  ["word-break", "Word Break", "1-D DP", "Medium", "dp", "A prefix is breakable when an earlier breakable prefix plus a dictionary word reaches it.", "leetcode"],
  ["longest-increasing-subsequence", "Longest Increasing Subsequence", "1-D DP", "Medium", "dp", "Keep the best subsequence length ending at each index or maintain sorted tails.", [10, 9, 2, 5, 3, 7, 101, 18]],

  ["unique-paths", "Unique Paths", "2-D DP", "Medium", "dp", "Each grid cell receives paths from the top and left cells.", ["r0c0", "r0c1", "r1c0", "r1c1"]],
  ["longest-common-subsequence", "Longest Common Subsequence", "2-D DP", "Medium", "dp", "A table cell stores the best subsequence length for two prefixes.", ["abcde", "ace"]],

  ["maximum-subarray", "Maximum Subarray", "Greedy", "Medium", "greedy", "Keep the best sum ending here and restart when carrying the previous sum hurts.", [-2, 1, -3, 4, -1, 2, 1]],
  ["jump-game", "Jump Game", "Greedy", "Medium", "greedy", "Track the farthest reachable index and fail only when the current index is beyond it.", [2, 3, 1, 1, 4]],

  ["insert-interval", "Insert Interval", "Intervals", "Medium", "intervals", "Append intervals before the new one, merge overlaps, then append the rest.", ["1-3", "6-9", "2-5"]],
  ["merge-intervals", "Merge Intervals", "Intervals", "Medium", "intervals", "Sort by start, then extend the current interval while overlaps continue.", ["1-3", "2-6", "8-10"]],
  ["non-overlapping-intervals", "Non-overlapping Intervals", "Intervals", "Medium", "intervals", "Keep the interval that ends earliest whenever overlaps force a removal.", ["1-2", "2-3", "3-4", "1-3"]],
  ["meeting-rooms-ii", "Meeting Rooms II", "Intervals", "Medium", "heap", "Sort starts and use a min-heap of end times to count rooms currently occupied.", ["9-10", "9:30-11", "11-12"]],

  ["rotate-image", "Rotate Image", "Math & Geometry", "Medium", "matrix", "Rotate layers by moving four corresponding cells at a time.", ["r0c0", "r0c1", "r1c0", "r1c1"]],
  ["spiral-matrix", "Spiral Matrix", "Math & Geometry", "Medium", "matrix", "Move around the matrix with shrinking boundaries in top, right, bottom, and left order.", ["r0c0", "r0c1", "r0c2", "r1c2", "r2c2"]],
  ["set-matrix-zeroes", "Set Matrix Zeroes", "Math & Geometry", "Medium", "matrix", "Use row and column markers so zeroing does not destroy information still needed later.", ["1", "0", "3", "4"]],

  ["number-of-1-bits", "Number of 1 Bits", "Bit Manipulation", "Easy", "bit", "Count set bits by repeatedly clearing the lowest set bit or checking masks.", [13, 8, 4, 1]],
  ["counting-bits", "Counting Bits", "Bit Manipulation", "Easy", "dp", "Build counts from smaller numbers using the lowest bit relationship.", [0, 1, 2, 3, 4, 5]],
  ["reverse-bits", "Reverse Bits", "Bit Manipulation", "Easy", "bit", "Shift the answer left and append the current lowest bit one position at a time.", [1, 0, 1, 1]],
  ["missing-number", "Missing Number", "Bit Manipulation", "Easy", "bit", "XOR all indexes and values so matching pairs disappear and the missing value remains.", [3, 0, 1]],
  ["sum-of-two-integers", "Sum of Two Integers", "Bit Manipulation", "Medium", "bit", "Use XOR for partial sum and shifted AND for carry until no carry remains.", [2, 3]],
];

const VISUALIZER_EDGE_CASES = {
  "arrays-hashing": ["empty or one-item input", "duplicate values", "negative values", "target or key missing"],
  "two-pointers": ["empty string or array", "duplicate values after sorting", "pointers meeting at the same index"],
  "sliding-window": ["empty input", "window that becomes invalid immediately", "all characters identical"],
  stack: ["closing token before any opener", "unmatched opener left at the end"],
  "binary-search": ["target smaller than first value", "target larger than last value", "rotated boundary at index 0"],
  "linked-list": ["empty list", "single-node list", "operation at head or tail"],
  trees: ["empty tree", "single-node tree", "unbalanced tree"],
  graphs: ["disconnected graph", "cycle", "single node with no edges"],
  dp: ["zero or empty base case", "first transition after base cases", "large input where repeated work matters"],
  heap: ["stream with one item", "ties in priority", "k larger than unique values"],
  trie: ["empty word", "prefix that is not a full word", "wildcard branch with no match"],
  intervals: ["touching intervals", "fully nested interval", "new interval before all existing intervals"],
  matrix: ["one row", "one column", "in-place update overwriting needed data"],
  bit: ["zero", "negative or signed-boundary value", "carry across multiple bits"],
  greedy: ["choice fails at first index", "local choice ties", "already optimal input"],
  backtracking: ["no valid path", "duplicate choices", "target reached exactly at current depth"],
};

const VISUALIZER_TEST_CASES = {
  "arrays-hashing": [
    ["normal", "Input with one direct lookup match", "Returns the match after the stored fact proves it"],
    ["edge", "Empty, one-item, duplicate, or negative values", "Does not invent a pair or lose duplicate meaning"],
    ["trick", "Answer appears only after several stored facts", "Checks before storing the current fact"],
  ],
  "two-pointers": [
    ["normal", "Sorted input with answer near both ends", "Moves the pointer that can be safely eliminated"],
    ["edge", "Empty input, one value, or pointers meeting", "Stops without reading outside the input"],
    ["trick", "Duplicate values around the answer", "Skips duplicates only when the problem allows it"],
  ],
  "sliding-window": [
    ["normal", "Window grows until it reaches a valid answer", "Records the best valid window"],
    ["edge", "Empty input or immediately invalid window", "Shrinks without losing the next candidate"],
    ["trick", "Repeated characters force multiple shrinks", "Moves the left edge past the conflict"],
  ],
  stack: [
    ["normal", "Nested tokens that close in reverse order", "Pushes and pops in last-in-first-out order"],
    ["edge", "Closing token appears before any opener", "Rejects before popping an empty stack"],
    ["trick", "Unmatched opener remains at the end", "Returns false when unresolved work remains"],
  ],
  "binary-search": [
    ["normal", "Target exists in the sorted range", "Finds it by keeping target inside low and high"],
    ["edge", "Target outside the range", "Terminates when low crosses high"],
    ["trick", "Boundary target at index 0 or last index", "Updates low/high without skipping boundaries"],
  ],
  "linked-list": [
    ["normal", "Multiple nodes require pointer rewiring", "Saves next before changing current"],
    ["edge", "Empty list or one node", "Returns without losing the head case"],
    ["trick", "Operation touches the head or tail", "Uses a dummy node or clear boundary handling"],
  ],
  trees: [
    ["normal", "Balanced tree with left and right children", "Combines child answers at the parent"],
    ["edge", "Empty tree or single node", "Base case returns immediately"],
    ["trick", "Unbalanced tree", "Uses height or recursion stack correctly"],
  ],
  graphs: [
    ["normal", "Connected component with several neighbors", "Visits each reachable node once"],
    ["edge", "Disconnected graph or single node", "Starts traversal only when needed"],
    ["trick", "Cycle in the graph", "Marks visited when scheduling work"],
  ],
  dp: [
    ["normal", "Small input with repeated subproblems", "Fills states from known smaller states"],
    ["edge", "Zero, empty, or first transition", "Initializes base cases correctly"],
    ["trick", "Large input where recursion repeats work", "Uses the table instead of recomputing"],
  ],
};

const CODE_WALKTHROUGH_CUES = {
  "arrays-hashing": [
    ["setup", "Map setup", "Create a Map/table for facts already seen."],
    ["move", "Lookup then store", "Check the complement or key before writing the current value."],
    ["return", "Return proven answer", "Return only when the table proves the answer condition."],
  ],
  "two-pointers": [
    ["setup", "Pointer setup", "Initialize left and right at positions that cover every candidate."],
    ["move", "Comparison branch", "Move the side that the invariant proves is safe to discard."],
    ["return", "Loop boundary", "Stop when the pointers cross or the answer has been found."],
  ],
  "sliding-window": [
    ["setup", "Window state", "Initialize left, right, counts, and best answer."],
    ["move", "Expand and shrink", "Add right, then move left until the rule is valid again."],
    ["return", "Best window", "Update and return the strongest valid window seen."],
  ],
  stack: [
    ["setup", "Stack setup", "Create the stack before scanning tokens."],
    ["move", "Push/pop branch", "Push unfinished work and pop only when the latest item is resolved."],
    ["return", "Empty stack check", "The answer often depends on no unresolved work remaining."],
  ],
  "binary-search": [
    ["setup", "Search bounds", "Initialize low and high so the answer starts inside the range."],
    ["move", "Mid comparison", "Compare middle, then discard the impossible half."],
    ["return", "Not found boundary", "Return when low crosses high or the target is found."],
  ],
  "linked-list": [
    ["setup", "Pointer references", "Create prev/current/next references before rewiring."],
    ["move", "Save before rewire", "Store next before changing current.next."],
    ["return", "New head", "Return the pointer that represents the transformed list."],
  ],
  trees: [
    ["setup", "Base case", "Handle null before touching child nodes."],
    ["move", "Recursive child calls", "Ask left and right children for the same answer type."],
    ["return", "Combine result", "Return the parent value built from child answers."],
  ],
  graphs: [
    ["setup", "Visited/frontier setup", "Add the start node to visited and frontier together."],
    ["move", "Neighbor expansion", "Schedule only unvisited neighbors."],
    ["return", "Traversal result", "Finish when the frontier is empty or all components are counted."],
  ],
  dp: [
    ["setup", "State and base cases", "Define dp state and seed the known answers."],
    ["move", "Transition", "Fill each state from smaller states already computed."],
    ["return", "Answer state", "Return the final state or optimized rolling value."],
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toTitleId(id) {
  return id.replace(/^blind75-/, "");
}

function visualizerFor(problem) {
  return VISUALIZER_BY_ID.get(problem.visualizerId) || VISUALIZER_BY_ID.get("arrays-hashing");
}

function inferInputKind(defaultInput) {
  return typeof defaultInput === "string" ? "string" : "array";
}

function makeQuiz(problem, visualizer) {
  return {
    question: `What must stay true while solving ${problem.title}?`,
    answer: problem.invariant || visualizer.invariant,
  };
}

function makeMockPrompt(problem) {
  return [
    `Run a Blind 75 mock for ${problem.title}.`,
    `Pattern: ${problem.pattern}.`,
    `Problem summary: ${problem.summary}`,
    "Ask me to explain the invariant, dry run the visual steps, code it in my selected stack, test edge cases, and state complexity.",
  ].join("\n");
}

function makeMasteryChecklist() {
  return MASTERY_CHECKLIST.map((item) => ({ ...item }));
}

function makeTestCases(problem, visualizer) {
  if (problem.id === "two-sum") {
    return [
      {
        id: "normal",
        type: "normal",
        input: "nums = [2, 7, 11, 15], target = 9",
        expected: "[0, 1]",
        why: "The complement 2 is already in the map when value 7 is read.",
      },
      {
        id: "edge",
        type: "edge",
        input: "nums = [3, 3], target = 6",
        expected: "[0, 1]",
        why: "Lookup before store prevents using the same index while still allowing duplicates.",
      },
      {
        id: "trick",
        type: "trick",
        input: "nums = [-1, -2, -3, -4, -5], target = -8",
        expected: "[2, 4]",
        why: "Negative complements work the same as positive complements.",
      },
    ];
  }

  if (problem.id === "valid-palindrome") {
    return [
      {
        id: "normal",
        type: "normal",
        input: '"racecar"',
        expected: "true",
        why: "Both pointers meet after matching mirrored characters.",
      },
      {
        id: "edge",
        type: "edge",
        input: '"A man, a plan, a canal: Panama"',
        expected: "true",
        why: "Normalization skips punctuation and compares lowercase characters.",
      },
      {
        id: "trick",
        type: "trick",
        input: '"race a car"',
        expected: "false",
        why: "The first mismatched normalized pair proves it is not a palindrome.",
      },
    ];
  }

  if (problem.id === "binary-search") {
    return [
      {
        id: "normal",
        type: "normal",
        input: "nums = [1, 3, 5, 7, 9, 11], target = 7",
        expected: "3",
        why: "The middle checks keep 7 inside the active range until found.",
      },
      {
        id: "edge",
        type: "edge",
        input: "nums = [1], target = 1",
        expected: "0",
        why: "The low and high boundary can start at the same index.",
      },
      {
        id: "trick",
        type: "trick",
        input: "nums = [1, 3, 5], target = 2",
        expected: "-1",
        why: "Low crosses high after both possible halves are eliminated.",
      },
    ];
  }

  if (problem.id === "number-of-islands") {
    return [
      {
        id: "normal",
        type: "normal",
        input: "grid = [[1,1,0],[0,1,0],[1,0,1]]",
        expected: "3 islands",
        why: "Each new land component is counted once before flood fill marks it visited.",
      },
      {
        id: "edge",
        type: "edge",
        input: "grid = [[0,0],[0,0]]",
        expected: "0 islands",
        why: "Water cells never start traversal.",
      },
      {
        id: "trick",
        type: "trick",
        input: "diagonal land only",
        expected: "Separate islands",
        why: "Only horizontal and vertical neighbors connect unless stated otherwise.",
      },
    ];
  }

  const rows = VISUALIZER_TEST_CASES[visualizer.id] || VISUALIZER_TEST_CASES["arrays-hashing"];
  return rows.map(([type, input, expected]) => ({
    id: type,
    type,
    input,
    expected,
    why: `${problem.title} uses ${visualizer.title}: ${visualizer.invariant}`,
  }));
}

function makeCodeWalkthrough(problem, visualizer) {
  const rows = CODE_WALKTHROUGH_CUES[visualizer.id] || CODE_WALKTHROUGH_CUES["arrays-hashing"];
  return rows.map(([id, codeCue, explanation], index) => ({
    id,
    stepNumber: index + 1,
    title: index === 0 ? "Setup" : index === 1 ? "Core move" : "Finish",
    codeCue,
    interviewCue: explanation,
    visualStep: index,
    say: `For ${problem.title}, say why "${codeCue}" preserves the ${visualizer.title} invariant.`,
  }));
}

function makeProblem(row, index) {
  const [id, title, category, difficulty, visualizerId, summary, defaultInput] = row;
  const visualizer = VISUALIZER_BY_ID.get(visualizerId) || VISUALIZER_BY_ID.get("arrays-hashing");
  const featured = FEATURED_BLIND75_IDS.includes(id);
  const edgeCases = VISUALIZER_EDGE_CASES[visualizer.id] || VISUALIZER_EDGE_CASES["arrays-hashing"];
  const invariant = visualizer.invariant;

  return {
    id,
    lessonId: `blind75-${id}`,
    order: index + 1,
    title,
    category,
    pattern: visualizer.title,
    difficulty,
    visualizerId: visualizer.id,
    featured,
    summary,
    invariant,
    dryRun: `Dry run ${title} by naming the ${visualizer.title} state first, then say exactly why the next move preserves the invariant.`,
    memoryHook: visualizer.memoryHook,
    edgeCases: id === "two-sum" ? ["duplicate values can still be valid", "negative values may be part of the pair", "no pair reaches the target"] : edgeCases,
    masteryChecklist: makeMasteryChecklist(),
    testCases: makeTestCases({ id, title }, visualizer),
    codeWalkthrough: makeCodeWalkthrough({ id, title }, visualizer),
    defaultInput,
    inputKind: inferInputKind(defaultInput),
    complexity: { ...visualizer.complexity },
    quiz: makeQuiz({ title, invariant }, visualizer),
    mockPrompt: makeMockPrompt({ title, pattern: visualizer.title, summary }),
  };
}

const BLIND75_PROBLEMS = PROBLEM_ROWS.map(makeProblem);
const PROBLEM_BY_ID = new Map(BLIND75_PROBLEMS.map((problem) => [problem.id, problem]));
const MASTERY_STEP_IDS = MASTERY_CHECKLIST.map((step) => step.id);

function nowIso(options = {}) {
  return options.now || new Date().toISOString();
}

function normalizeConfidenceState(state) {
  if (!state || typeof state !== "object" || !state.problems) {
    return createDsaConfidenceState();
  }

  return {
    version: 1,
    updatedAt: state.updatedAt || null,
    problems: clone(state.problems || {}),
  };
}

function emptyProblemProgress(timestamp = null) {
  return {
    status: "not-started",
    mastery: {},
    mistakes: [],
    testCasesMastered: [],
    lastPracticedAt: null,
    updatedAt: timestamp,
  };
}

function resolveProblemId(problemOrId) {
  return toTitleId(typeof problemOrId === "string" ? problemOrId : problemOrId?.id);
}

function deriveProgressStatus(progress = {}) {
  const mastery = progress.mastery || {};
  const completedSteps = MASTERY_STEP_IDS.filter((stepId) => mastery[stepId]);
  if (completedSteps.length === MASTERY_STEP_IDS.length) return "mastered";
  if (Array.isArray(progress.mistakes) && progress.mistakes.length > 0) return "weak";
  if (completedSteps.length > 0 || (progress.testCasesMastered || []).length > 0) return "improving";
  return "not-started";
}

function buildSteps(problem) {
  const title = problem.title;
  const visualizerId = problem.visualizerId;
  const base = {
    "arrays-hashing": [
      ["Define the lookup table", { index: 0, lookup: "needed fact", store: "seen value" }, `Before coding ${title}, say what key the map or table answers quickly.`],
      ["Process the current item", { index: 1, lookup: "current lookup", store: "current fact" }, "Check the stored fact before adding the current fact when pairing or grouping."],
      ["Return the proven result", { index: 2, lookup: "answer condition", store: "final summary" }, "Stop only when the table proves the answer or every item has been summarized."],
    ],
    "two-pointers": [
      ["Place left and right pointers", { left: 0, right: -1 }, `For ${title}, point to both ends and say what each side means.`],
      ["Compare the two sides", { left: 0, right: -1, compare: true }, "Use the comparison to prove which side can move without losing the answer."],
      ["Move one pointer safely", { left: 1, right: -2 }, "Each move removes work that cannot produce a better or valid result."],
    ],
    "sliding-window": [
      ["Expand the right edge", { windowStart: 0, windowEnd: 0, index: 0 }, `For ${title}, add the next item and update the window state.`],
      ["Shrink until valid", { windowStart: 1, windowEnd: 3, left: 1, right: 3 }, "Move the left edge only while the rule is broken or while the answer can improve."],
      ["Record the best window", { windowStart: 1, windowEnd: 4, left: 1, right: 4 }, "Update the best answer after the window is valid."],
    ],
    stack: [
      ["Read the next token", { index: 0, action: "inspect" }, `For ${title}, classify the token before changing the stack.`],
      ["Push unfinished work", { index: 1, action: "push", structure: "stack" }, "Push when the item creates an obligation for a future item."],
      ["Pop only when resolved", { index: 2, action: "pop", structure: "stack" }, "Pop only when the newest obligation is satisfied."],
    ],
    "binary-search": [
      ["Set low and high", { low: 0, mid: 2, high: -1 }, `For ${title}, prove the answer starts inside the search range.`],
      ["Inspect the middle", { low: 0, mid: 2, high: -1, index: 2 }, "Compare the middle value to decide which half is impossible."],
      ["Discard one half", { low: 3, mid: 4, high: -1 }, "Keep only the half that can still contain the answer."],
    ],
    "linked-list": [
      ["Save next before rewiring", { prev: -1, current: 0, next: 1, index: 0 }, `For ${title}, never lose the rest of the list before changing pointers.`],
      ["Move the current pointer", { prev: 0, current: 1, next: 2, index: 1 }, "Advance references in the same order every time."],
      ["Finish at the boundary", { prev: 2, current: 3, next: -1, index: 3 }, "Stop when the pointer boundary proves the list operation is complete."],
    ],
    trees: [
      ["Define the node job", { node: 0, nodeIndex: 0 }, `For ${title}, say what one recursive call returns.`],
      ["Visit children", { node: 1, nodeIndex: 1, children: [3, 4] }, "Ask each child for the same kind of answer."],
      ["Combine upward", { node: 0, nodeIndex: 0, combine: true }, "Return the value the parent needs, not every detail from the subtree."],
    ],
    graphs: [
      ["Seed visited and frontier", { visited: ["A"], visitedIndexes: [0], frontier: ["B", "C"], frontierIndexes: [1, 2] }, `For ${title}, mark work as soon as it is scheduled.`],
      ["Expand the next node", { node: "B", nodeIndex: 1, neighbors: ["D"], frontierIndexes: [2, 3] }, "Only add neighbors that have not already been visited."],
      ["Complete the component", { visited: ["A", "B", "C", "D"], visitedIndexes: [0, 1, 2, 3] }, "The traversal ends when the frontier is empty."],
    ],
    dp: [
      ["Define the state", { state: "dp[i]", index: 0 }, `For ${title}, state exactly what one table entry means.`],
      ["Fill base cases", { from: [0], to: 1, index: 1 }, "Base cases give the table stable starting answers."],
      ["Apply the transition", { from: [1, 2], to: 3, index: 3 }, "Each new state reuses earlier states instead of recomputing work."],
    ],
    heap: [
      ["Count or stream candidates", { index: 0, action: "insert", structure: "heap" }, `For ${title}, decide what priority the heap should expose.`],
      ["Balance or trim the heap", { index: 1, action: "poll / rebalance", structure: "heap" }, "Keep only candidates that can still affect the next answer."],
      ["Read the heap top", { index: 2, action: "peek", structure: "heap" }, "The top item should directly answer the next selection question."],
    ],
    trie: [
      ["Follow the prefix path", { index: 0, node: "root" }, `For ${title}, consume one character per trie level.`],
      ["Branch when needed", { index: 1, node: "child", frontier: ["a", "b"] }, "Wildcard or prefix logic chooses which children can still match."],
      ["Check terminal state", { index: 2, node: "terminal" }, "A complete word needs an explicit terminal marker, not just a prefix."],
    ],
    intervals: [
      ["Sort by start", { index: 0, lookup: "start", store: "current interval" }, `For ${title}, sorting turns overlap checks into a local decision.`],
      ["Compare with current end", { index: 1, left: 0, right: 1 }, "Overlap means merge or remove based on the interval goal."],
      ["Commit the interval", { index: 2, store: "merged interval" }, "Commit only when no later interval can extend the current one."],
    ],
    matrix: [
      ["Name row and column", { index: 0, row: 0, col: 0 }, `For ${title}, convert every move into row-column coordinates.`],
      ["Move by boundary rule", { index: 1, row: 0, col: 1 }, "The current boundary tells you which direction is legal."],
      ["Protect needed state", { index: 2, row: 1, col: 0 }, "When in-place, preserve any marker or value needed by future cells."],
    ],
    bit: [
      ["Choose the mask", { index: 0, bit: 0 }, `For ${title}, say which bit position the operation inspects.`],
      ["Apply the operation", { index: 1, bit: 1, action: "xor / and / shift" }, "XOR toggles, AND filters, shifts move positions."],
      ["Stop at the bit boundary", { index: 2, bit: 2 }, "The answer is ready when every required bit position has been processed."],
    ],
    greedy: [
      ["Track the best local state", { index: 0 }, `For ${title}, name the local choice that remains safe.`],
      ["Take the safe move", { index: 1 }, "Update the best reachable answer without revisiting old choices."],
      ["Prove future is not blocked", { index: 2 }, "The greedy proof is why this local move cannot make the optimal answer impossible."],
    ],
    backtracking: [
      ["Choose a candidate", { index: 0, action: "choose", structure: "call stack" }, `For ${title}, add one valid choice to the path.`],
      ["Explore deeper", { index: 1, action: "recurse", structure: "call stack" }, "Recursive depth represents the next decision point."],
      ["Undo the choice", { index: 2, action: "backtrack", structure: "call stack" }, "Remove the choice so sibling branches start from a clean state."],
    ],
  };

  return (base[visualizerId] || base["arrays-hashing"]).map(([stepTitle, highlight, explanation]) => ({
    title: stepTitle,
    highlight,
    explanation,
  }));
}

function detectLanguage(stack = "") {
  const text = String(stack || "");
  if (/\b(java|spring|spring boot|jvm)\b/i.test(text)) return "Java";
  if (/\b(python|django|fastapi|flask)\b/i.test(text)) return "Python";
  if (/\b(javascript|typescript|react|node|node\.js|next|next\.js|frontend)\b/i.test(text)) return "JavaScript";
  if (/\b(ruby|rails)\b/i.test(text)) return "Ruby";
  if (/\b(rust|cargo)\b/i.test(text)) return "Rust";
  return "JavaScript";
}

function functionName(id, language) {
  const camel = id.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");
  if (language === "Python" || language === "Ruby") return id.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return camel;
}

const SPECIAL_CODE = {
  "two-sum": {
    Java: `import java.util.*;

class Solution {
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (seen.containsKey(need)) return new int[] { seen.get(need), i };
      seen.put(nums[i], i);
    }
    return new int[0];
  }
}`,
    Python: `def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        if need in seen:
            return [seen[need], i]
        seen[value] = i
    return []`,
    JavaScript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
  },
  "valid-palindrome": {
    Python: `def valid_palindrome(text):
    left, right = 0, len(text) - 1
    while left < right:
        while left < right and not text[left].isalnum():
            left += 1
        while left < right and not text[right].isalnum():
            right -= 1
        if text[left].lower() != text[right].lower():
            return False
        left += 1
        right -= 1
    return True`,
  },
  "longest-substring-without-repeating-characters": {
    JavaScript: `function lengthOfLongestSubstring(text) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < text.length; right += 1) {
    const char = text[right];
    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      left = lastSeen.get(char) + 1;
    }
    lastSeen.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}`,
  },
};

function genericCode(problem, language) {
  const name = functionName(problem.id, language);
  const comment = `${problem.title}: ${problem.pattern} pattern`;

  if (language === "Java") {
    return `import java.util.*;

class Solution {
  public Object ${name}(int[] input) {
    // ${comment}
    // Invariant: ${problem.invariant}
    return null;
  }
}`;
  }

  if (language === "Python") {
    return `def ${name}(input_values):
    # ${comment}
    # Invariant: ${problem.invariant}
    return None`;
  }

  if (language === "Ruby") {
    return `def ${name}(input_values)
  # ${comment}
  # Invariant: ${problem.invariant}
  nil
end`;
  }

  if (language === "Rust") {
    return `impl Solution {
    pub fn ${name}(input: Vec<i32>) -> Option<i32> {
        // ${comment}
        // Invariant: ${problem.invariant}
        None
    }
}`;
  }

  return `function ${name}(input) {
  // ${comment}
  // Invariant: ${problem.invariant}
  return null;
}`;
}

export function listBlind75Visualizers() {
  return BLIND75_VISUALIZERS.map((visualizer) => clone(visualizer));
}

export function listBlind75Problems({ featuredOnly = false } = {}) {
  const problems = featuredOnly ? BLIND75_PROBLEMS.filter((problem) => problem.featured) : BLIND75_PROBLEMS;
  return problems.map((problem) => clone(problem));
}

export function createDsaConfidenceState(options = {}) {
  return {
    version: 1,
    updatedAt: options.now || null,
    problems: clone(options.problems || {}),
  };
}

export function recordDsaMasteryStep(state, problemOrId, stepId, done = true, options = {}) {
  const next = normalizeConfidenceState(state);
  const problemId = resolveProblemId(problemOrId);
  const timestamp = nowIso(options);
  const current = {
    ...emptyProblemProgress(timestamp),
    ...(next.problems[problemId] || {}),
  };
  const mastery = { ...(current.mastery || {}) };

  if (done) {
    mastery[stepId] = true;
  } else {
    delete mastery[stepId];
  }

  const updated = {
    ...current,
    mastery,
    lastPracticedAt: timestamp,
    updatedAt: timestamp,
  };
  updated.status = deriveProgressStatus(updated);
  next.problems[problemId] = updated;
  next.updatedAt = timestamp;
  return next;
}

export function recordDsaMistake(state, problemOrId, mistake = {}, options = {}) {
  const next = normalizeConfidenceState(state);
  const problemId = resolveProblemId(problemOrId);
  const timestamp = nowIso(options);
  const current = {
    ...emptyProblemProgress(timestamp),
    ...(next.problems[problemId] || {}),
  };
  const mistakes = Array.isArray(current.mistakes) ? [...current.mistakes] : [];

  mistakes.unshift({
    id: `${problemId}-${timestamp}`,
    type: mistake.type || "Missed invariant",
    note: mistake.note || "Review the invariant, dry run, and edge cases before retrying.",
    createdAt: timestamp,
  });

  const updated = {
    ...current,
    mistakes: mistakes.slice(0, 8),
    lastPracticedAt: timestamp,
    updatedAt: timestamp,
  };
  updated.status = deriveProgressStatus(updated);
  next.problems[problemId] = updated;
  next.updatedAt = timestamp;
  return next;
}

export function recordDsaTestCaseMastery(state, problemOrId, testCaseId, options = {}) {
  const next = normalizeConfidenceState(state);
  const problemId = resolveProblemId(problemOrId);
  const timestamp = nowIso(options);
  const current = {
    ...emptyProblemProgress(timestamp),
    ...(next.problems[problemId] || {}),
  };
  const mastered = new Set(current.testCasesMastered || []);
  mastered.add(testCaseId);

  const updated = {
    ...current,
    testCasesMastered: [...mastered],
    lastPracticedAt: timestamp,
    updatedAt: timestamp,
  };
  updated.status = deriveProgressStatus(updated);
  next.problems[problemId] = updated;
  next.updatedAt = timestamp;
  return next;
}

export function buildDsaProgressSummary(state) {
  const normalized = normalizeConfidenceState(state);
  const summary = {
    total: BLIND75_PROBLEMS.length,
    mastered: 0,
    weak: 0,
    improving: 0,
    notStarted: 0,
  };

  for (const problem of BLIND75_PROBLEMS) {
    const status = deriveProgressStatus(normalized.problems[problem.id]);
    if (status === "mastered") summary.mastered += 1;
    else if (status === "weak") summary.weak += 1;
    else if (status === "improving") summary.improving += 1;
    else summary.notStarted += 1;
  }

  return summary;
}

export function getDsaProblemProgress(state, problemOrId) {
  const normalized = normalizeConfidenceState(state);
  const problemId = resolveProblemId(problemOrId);
  const progress = {
    ...emptyProblemProgress(null),
    ...(normalized.problems[problemId] || {}),
  };

  return {
    ...progress,
    status: deriveProgressStatus(progress),
  };
}

export function filterBlind75Problems({ featuredOnly = false, difficulty = "all", status = "all", state } = {}) {
  const normalized = normalizeConfidenceState(state);
  return BLIND75_PROBLEMS
    .filter((problem) => !featuredOnly || problem.featured)
    .filter((problem) => difficulty === "all" || problem.difficulty === difficulty)
    .filter((problem) => {
      if (status === "all") return true;
      return deriveProgressStatus(normalized.problems[problem.id]) === status;
    })
    .map((problem) => clone(problem));
}

export function getBlind75Problem(id) {
  const normalized = toTitleId(String(id || ""));
  const problem = PROBLEM_BY_ID.get(normalized) || BLIND75_PROBLEMS[0];
  return clone(problem);
}

export function getBlind75ProblemCodeTemplate(problemOrId, stack = "") {
  const problem = typeof problemOrId === "string" ? getBlind75Problem(problemOrId) : problemOrId;
  const language = detectLanguage(stack);
  const code = SPECIAL_CODE[problem.id]?.[language] || genericCode(problem, language);

  return { language, code };
}

export function buildBlind75VisualLesson(problemOrId) {
  const problem = typeof problemOrId === "string" ? getBlind75Problem(problemOrId) : problemOrId;
  const visualizer = visualizerFor(problem);

  return {
    id: problem.lessonId,
    problemId: problem.id,
    blind75: true,
    title: problem.title,
    icon: visualizer.icon.replace(/^ti\s+/, ""),
    category: problem.category,
    difficulty: problem.difficulty,
    pattern: problem.pattern,
    visualizerId: problem.visualizerId,
    concept: problem.summary,
    memoryHook: problem.memoryHook,
    dryRun: problem.dryRun,
    steps: buildSteps(problem),
    codeTemplates: {
      Java: getBlind75ProblemCodeTemplate(problem, "Java").code,
      Python: getBlind75ProblemCodeTemplate(problem, "Python").code,
      JavaScript: getBlind75ProblemCodeTemplate(problem, "JavaScript").code,
      Ruby: getBlind75ProblemCodeTemplate(problem, "Ruby").code,
      Rust: getBlind75ProblemCodeTemplate(problem, "Rust").code,
    },
    complexity: clone(problem.complexity),
    quiz: clone(problem.quiz),
    masteryChecklist: clone(problem.masteryChecklist),
    testCases: clone(problem.testCases),
    codeWalkthrough: clone(problem.codeWalkthrough),
    mockPrompt: problem.mockPrompt,
    defaultInput: clone(problem.defaultInput),
    inputKind: problem.inputKind,
    invariant: problem.invariant,
    edgeCases: clone(problem.edgeCases),
  };
}
