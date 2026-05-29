import { buildBlind75VisualLesson } from "./blind75VisualTrack.mjs";

export const DSA_VISUAL_LAB_STORAGE_KEY = "interviewiq:dsa-visual-lab:v1";

const DEFAULT_INPUTS = {
  arrays: [4, 1, 7, 3],
  strings: "racecar",
  hashing: [2, 7, 11, 15],
  "two-pointers": [1, 2, 3, 4],
  "stack-queue": ["(", "{", "}", ")"],
  trees: ["8", "3", "10", "1", "6"],
  "graph-bfs-dfs": ["A", "B", "C", "D"],
  "dp-basics": [1, 2, 3, 4],
};

const LESSONS = [
  {
    id: "arrays",
    title: "Arrays",
    icon: "ti-brackets",
    concept: "Arrays are contiguous positions where index math, scans, prefix sums, and swaps turn a brute-force idea into an interview-ready solution.",
    memoryHook: "Think of an array as numbered parking spots: position first, value second.",
    dryRun: "Say the index, say the value, then say why the current best changes or stays.",
    steps: [
      {
        title: "Scan the first value",
        highlight: { index: 0 },
        explanation: "Anchor the first slot so you have a real value to compare against instead of a vague idea.",
      },
      {
        title: "Move index by index",
        highlight: { index: 1 },
        explanation: "Arrays reward disciplined movement: update the answer only when the current index proves something new.",
      },
      {
        title: "Return the tracked answer",
        highlight: { index: 3 },
        explanation: "Close the loop by naming the invariant you maintained while scanning.",
      },
    ],
    codeTemplate: `function solveArray(nums) {
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    // update best using nums[i]
  }
  return best;
}`,
    complexity: { time: "O(n)", space: "O(1)" },
    quiz: {
      question: "What should you say before writing an array scan?",
      answer: "Define what each index represents and what invariant you update while scanning.",
    },
    mockPrompt: "Run an Arrays mock: explain the invariant, dry run indices, write code, and finish with complexity.",
  },
  {
    id: "strings",
    title: "Strings",
    icon: "ti-abc",
    concept: "Strings are arrays of characters with extra attention to normalization, windows, character counts, and immutable operations.",
    memoryHook: "A string problem is usually an array problem wearing letters.",
    dryRun: "Read each character out loud and track the count, window, or builder state after every move.",
    steps: [
      {
        title: "Normalize the characters",
        highlight: { index: 0 },
        explanation: "Clarify casing, punctuation, and whitespace before the algorithm starts.",
      },
      {
        title: "Track character state",
        highlight: { index: 2 },
        explanation: "Most string solutions become simple once you can point to the current character and its stored meaning.",
      },
      {
        title: "Build or compare the result",
        highlight: { index: 5 },
        explanation: "Avoid hidden string work by saying whether you are comparing, counting, or building.",
      },
    ],
    codeTemplate: `function solveString(text) {
  const counts = new Map();
  for (const char of text) {
    counts.set(char, (counts.get(char) || 0) + 1);
  }
  return counts;
}`,
    complexity: { time: "O(n)", space: "O(k)" },
    quiz: {
      question: "Why ask about normalization before solving a string problem?",
      answer: "Because casing, spaces, and punctuation can change both correctness and edge cases.",
    },
    mockPrompt: "Run a Strings mock: clarify normalization, dry run characters, code the approach, and state time and space.",
  },
  {
    id: "hashing",
    title: "Hashing",
    icon: "ti-hash",
    concept: "Hashing trades memory for instant lookup so you can remember what you have seen instead of searching again.",
    memoryHook: "A hash map is your interview notebook: write down facts once, look them up fast.",
    dryRun: "After every element, say what key you lookup, what you found, and what you store.",
    steps: [
      {
        title: "Create the lookup table",
        highlight: { index: 0, lookup: "target - value" },
        explanation: "Start with the question you need the map to answer quickly.",
      },
      {
        title: "Check before storing",
        highlight: { index: 1, lookup: "complement" },
        explanation: "For pair problems, lookup first so the same element cannot accidentally pair with itself.",
      },
      {
        title: "Store the current fact",
        highlight: { index: 2, store: "value -> index" },
        explanation: "The map turns future work into a constant-time check.",
      },
    ],
    codeTemplate: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    complexity: { time: "O(n)", space: "O(n)" },
    quiz: {
      question: "What is the trade-off when you choose hashing?",
      answer: "You spend extra memory to avoid repeated searching.",
    },
    mockPrompt: "Run a Hashing mock: name the lookup key, dry run the map, write code, and explain the memory trade-off.",
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    icon: "ti-arrows-left-right",
    concept: "Two pointers use two moving positions when the answer depends on comparing both ends, shrinking a window, or keeping a sorted invariant.",
    memoryHook: "Two fingers walking toward the answer.",
    dryRun: "At every step, point to left and right, compare their values, then justify which pointer moves.",
    steps: [
      {
        title: "Start at both ends",
        highlight: { left: 0, right: -1 },
        explanation: "Use two pointers when the answer depends on comparing both sides of the input.",
      },
      {
        title: "Compare and choose a move",
        highlight: { left: 0, right: -1, compare: true },
        explanation: "The interview signal is not the comparison itself; it is why one pointer can safely move.",
      },
      {
        title: "Move inward without losing answers",
        highlight: { left: 1, right: -2 },
        explanation: "Each move must eliminate work you can prove will not produce a better or valid answer.",
      },
      {
        title: "Stop when pointers cross",
        highlight: { left: 2, right: -3 },
        explanation: "The loop ends when every useful pair or window has been considered exactly once.",
      },
    ],
    codeTemplate: `function solveTwoPointers(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left += 1;
    else right -= 1;
  }

  return [];
}`,
    complexity: { time: "O(n)", space: "O(1)" },
    quiz: {
      question: "When can a pointer move safely?",
      answer: "When the sorted order, window rule, or invariant proves the skipped choices cannot be the answer.",
    },
    mockPrompt: "Run a Two Pointers mock: explain the invariant, dry run left/right movement, write code, and finish with complexity.",
  },
  {
    id: "stack-queue",
    title: "Stack/Queue",
    icon: "ti-stack-2",
    concept: "Stacks remember the most recent unfinished work; queues process work in the same order it arrived.",
    memoryHook: "Stack is plates, queue is a line.",
    dryRun: "Name the operation first: push, pop, enqueue, or dequeue. Then say what remains.",
    steps: [
      {
        title: "Pick the discipline",
        highlight: { structure: "stack" },
        explanation: "Use a stack for nested or previous-state problems; use a queue for level-order or first-in work.",
      },
      {
        title: "Record unfinished work",
        highlight: { action: "push/enqueue" },
        explanation: "The data structure stores what the algorithm must return to later.",
      },
      {
        title: "Resolve in the right order",
        highlight: { action: "pop/dequeue" },
        explanation: "Correctness comes from processing the next item according to the chosen discipline.",
      },
    ],
    codeTemplate: `function isBalanced(chars) {
  const stack = [];
  for (const char of chars) {
    if (char === "(") stack.push(char);
    if (char === ")") stack.pop();
  }
  return stack.length === 0;
}`,
    complexity: { time: "O(n)", space: "O(n)" },
    quiz: {
      question: "What question tells you stack versus queue?",
      answer: "Ask whether the next useful item is the most recent unfinished item or the earliest waiting item.",
    },
    mockPrompt: "Run a Stack/Queue mock: choose the discipline, dry run operations, write code, and explain complexity.",
  },
  {
    id: "trees",
    title: "Trees",
    icon: "ti-binary-tree",
    concept: "Tree problems are recursive decisions over nodes: do local work, ask children for answers, then combine.",
    memoryHook: "At every node, ask: what do I know, what do I need from my children?",
    dryRun: "Draw the current node, then say the left result, right result, and combined return value.",
    steps: [
      {
        title: "Define the node job",
        highlight: { node: 0 },
        explanation: "Before recursion, explain exactly what each call returns.",
      },
      {
        title: "Visit children",
        highlight: { node: 1, children: [3, 4] },
        explanation: "Most tree code is simple when left and right calls answer the same question.",
      },
      {
        title: "Combine and return",
        highlight: { node: 0, combine: true },
        explanation: "The parent should combine child answers without knowing their internals.",
      },
    ],
    codeTemplate: `function maxDepth(root) {
  if (!root) return 0;
  const left = maxDepth(root.left);
  const right = maxDepth(root.right);
  return 1 + Math.max(left, right);
}`,
    complexity: { time: "O(n)", space: "O(h)" },
    quiz: {
      question: "What should every recursive tree helper define?",
      answer: "Define its return value for one node before writing the recursive calls.",
    },
    mockPrompt: "Run a Trees mock: define the recursive return, dry run nodes, write code, and explain call-stack space.",
  },
  {
    id: "graph-bfs-dfs",
    title: "Graph BFS/DFS",
    icon: "ti-route",
    concept: "Graph traversal is controlled exploration: visited prevents loops, BFS expands by distance, and DFS follows a path deeply.",
    memoryHook: "Visited is the seatbelt; BFS is ripples, DFS is a tunnel.",
    dryRun: "Say the frontier, visited set, and the next node before each move.",
    steps: [
      {
        title: "Build the visited set",
        highlight: { visited: ["A"] },
        explanation: "Visited is what keeps graph code from cycling forever.",
      },
      {
        title: "Choose BFS or DFS",
        highlight: { frontier: ["B", "C"] },
        explanation: "Use BFS for shortest unweighted distance; use DFS for reachability, components, or backtracking.",
      },
      {
        title: "Expand neighbors",
        highlight: { node: "B", neighbors: ["D"] },
        explanation: "Only add neighbors that have not already been visited.",
      },
    ],
    codeTemplate: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node] || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited;
}`,
    complexity: { time: "O(V + E)", space: "O(V)" },
    quiz: {
      question: "Why is visited non-negotiable in most graph traversals?",
      answer: "Because cycles can make the traversal repeat nodes forever or overcount work.",
    },
    mockPrompt: "Run a Graph BFS/DFS mock: state the traversal choice, dry run visited/frontier, write code, and explain complexity.",
  },
  {
    id: "dp-basics",
    title: "DP Basics",
    icon: "ti-table",
    concept: "Dynamic programming stores repeated subproblem answers after you define the state, transition, base cases, and final answer.",
    memoryHook: "DP is a receipt book: never pay twice for the same subproblem.",
    dryRun: "Fill one state at a time: base case, transition inputs, computed value, final answer.",
    steps: [
      {
        title: "Define the state",
        highlight: { state: "dp[i]" },
        explanation: "A DP solution starts when you can say exactly what one table entry means.",
      },
      {
        title: "Set base cases",
        highlight: { index: 0 },
        explanation: "Base cases are the answers small enough to know without recursion.",
      },
      {
        title: "Apply the transition",
        highlight: { from: [0, 1], to: 2 },
        explanation: "Each new state should reuse earlier states instead of recomputing them.",
      },
    ],
    codeTemplate: `function climbStairs(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;
  for (let i = 2; i <= n; i += 1) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`,
    complexity: { time: "O(n)", space: "O(n)" },
    quiz: {
      question: "What four things should you say before coding DP?",
      answer: "State, transition, base cases, and final answer.",
    },
    mockPrompt: "Run a DP Basics mock: define state and transition, dry run the table, write code, and discuss optimization.",
  },
];

const LESSON_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

const LANGUAGE_ALIASES = [
  { language: "Java", match: /\b(java|spring|spring boot|jvm)\b/i },
  { language: "Python", match: /\b(python|django|fastapi|flask)\b/i },
  { language: "Ruby", match: /\b(ruby|rails)\b/i },
  { language: "Rust", match: /\b(rust|cargo)\b/i },
  { language: "JavaScript", match: /\b(javascript|typescript|react|node|node\.js|next|next\.js|frontend)\b/i },
];

const CODE_TEMPLATES = {
  JavaScript: {
    arrays: `function solveArray(nums) {
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    best = Math.max(best, nums[i]);
  }
  return best;
}`,
    strings: `function solveString(text) {
  const counts = new Map();
  for (const char of text) {
    counts.set(char, (counts.get(char) || 0) + 1);
  }
  return counts;
}`,
    hashing: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    "two-pointers": `function solveTwoPointers(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left += 1;
    else right -= 1;
  }

  return [];
}`,
    "stack-queue": `function isBalanced(chars) {
  const stack = [];
  for (const char of chars) {
    if (char === "(" || char === "{" || char === "[") stack.push(char);
    if (char === ")" || char === "}" || char === "]") stack.pop();
  }
  return stack.length === 0;
}`,
    trees: `function maxDepth(root) {
  if (!root) return 0;
  const left = maxDepth(root.left);
  const right = maxDepth(root.right);
  return 1 + Math.max(left, right);
}`,
    "graph-bfs-dfs": `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];

  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node] || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }

  return visited;
}`,
    "dp-basics": `function climbStairs(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;

  for (let i = 2; i <= n; i += 1) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}`,
  },
  Java: {
    arrays: `class Solution {
  int solveArray(int[] nums) {
    int best = nums[0];
    for (int i = 1; i < nums.length; i++) {
      best = Math.max(best, nums[i]);
    }
    return best;
  }
}`,
    strings: `import java.util.*;

class Solution {
  Map<Character, Integer> solveString(String text) {
    Map<Character, Integer> counts = new HashMap<>();
    for (char ch : text.toCharArray()) {
      counts.put(ch, counts.getOrDefault(ch, 0) + 1);
    }
    return counts;
  }
}`,
    hashing: `import java.util.*;

class Solution {
  int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (seen.containsKey(need)) return new int[] { seen.get(need), i };
      seen.put(nums[i], i);
    }
    return new int[0];
  }
}`,
    "two-pointers": `class Solution {
  int[] solveTwoPointers(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;

    while (left < right) {
      int sum = nums[left] + nums[right];
      if (sum == target) return new int[] { left, right };
      if (sum < target) left++;
      else right--;
    }

    return new int[0];
  }
}`,
    "stack-queue": `import java.util.*;

class Solution {
  boolean isBalanced(char[] chars) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char ch : chars) {
      if (ch == '(' || ch == '{' || ch == '[') stack.push(ch);
      if (ch == ')' || ch == '}' || ch == ']') {
        if (stack.isEmpty()) return false;
        stack.pop();
      }
    }
    return stack.isEmpty();
  }
}`,
    trees: `class Solution {
  int maxDepth(TreeNode root) {
    if (root == null) return 0;
    int left = maxDepth(root.left);
    int right = maxDepth(root.right);
    return 1 + Math.max(left, right);
  }
}`,
    "graph-bfs-dfs": `import java.util.*;

class Solution {
  Set<String> bfs(Map<String, List<String>> graph, String start) {
    Set<String> visited = new HashSet<>();
    Queue<String> queue = new ArrayDeque<>();
    visited.add(start);
    queue.add(start);

    while (!queue.isEmpty()) {
      String node = queue.poll();
      for (String next : graph.getOrDefault(node, List.of())) {
        if (visited.add(next)) queue.add(next);
      }
    }
    return visited;
  }
}`,
    "dp-basics": `class Solution {
  int climbStairs(int n) {
    int[] dp = new int[n + 1];
    dp[0] = 1;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
  }
}`,
  },
  Python: {
    arrays: `def solve_array(nums):
    best = nums[0]
    for value in nums[1:]:
        best = max(best, value)
    return best`,
    strings: `from collections import Counter

def solve_string(text):
    return Counter(text)`,
    hashing: `def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        if need in seen:
            return [seen[need], i]
        seen[value] = i
    return []`,
    "two-pointers": `def solve_two_pointers(nums, target):
    left, right = 0, len(nums) - 1

    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1

    return []`,
    "stack-queue": `def is_balanced(chars):
    stack = []
    for char in chars:
        if char in "({[":
            stack.append(char)
        elif char in ")}]":
            if not stack:
                return False
            stack.pop()
    return not stack`,
    trees: `def max_depth(root):
    if not root:
        return 0
    left = max_depth(root.left)
    right = max_depth(root.right)
    return 1 + max(left, right)`,
    "graph-bfs-dfs": `from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        for nxt in graph.get(node, []):
            if nxt in visited:
                continue
            visited.add(nxt)
            queue.append(nxt)
    return visited`,
    "dp-basics": `def climb_stairs(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
  },
};

CODE_TEMPLATES.Ruby = {
  "two-pointers": `def solve_two_pointers(nums, target)
  left = 0
  right = nums.length - 1

  while left < right
    sum = nums[left] + nums[right]
    return [left, right] if sum == target

    if sum < target
      left += 1
    else
      right -= 1
    end
  end

  []
end`,
};

CODE_TEMPLATES.Rust = {
  "two-pointers": `impl Solution {
    pub fn solve_two_pointers(nums: Vec<i32>, target: i32) -> Vec<i32> {
        let mut left = 0usize;
        let mut right = nums.len().saturating_sub(1);

        while left < right {
            let sum = nums[left] + nums[right];
            if sum == target {
                return vec![left as i32, right as i32];
            }
            if sum < target {
                left += 1;
            } else {
                right -= 1;
            }
        }

        vec![]
    }
}`,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeInput(id, input, defaultInput, inputKind) {
  if (input === undefined || input === null || input === "") {
    return clone(defaultInput ?? DEFAULT_INPUTS[id] ?? []);
  }

  if (Array.isArray(input)) return [...input];

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return clone(defaultInput ?? DEFAULT_INPUTS[id] ?? []);
    if (id === "strings" || inputKind === "string") return trimmed;
    return trimmed.split(",").map((part) => {
      const value = part.trim();
      const numberValue = Number(value);
      return Number.isNaN(numberValue) || value === "" ? value : numberValue;
    });
  }

  return input;
}

function resolveHighlight(highlight, input) {
  const length = Array.isArray(input) || typeof input === "string" ? input.length : 0;
  const resolved = { ...highlight };

  for (const key of ["left", "right", "index", "to", "low", "mid", "high", "windowStart", "windowEnd", "slow", "fast", "current", "prev", "next", "nodeIndex"]) {
    if (typeof resolved[key] === "number" && resolved[key] < 0) {
      resolved[key] = Math.max(0, length + resolved[key]);
    }
  }

  for (const key of ["from", "visitedIndexes", "frontierIndexes"]) {
    if (Array.isArray(resolved[key])) {
      resolved[key] = resolved[key].map((item) => typeof item === "number" && item < 0 ? Math.max(0, length + item) : item);
    }
  }

  return resolved;
}

function textForValue(value) {
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

function lessonVisualKey(lesson) {
  return lesson.visualizerId || lesson.patternId || lesson.id;
}

function deriveInvariant(lesson) {
  if (lesson?.invariant) return lesson.invariant;

  const invariants = {
    arrays: "Before each move, best summarizes every index already visited.",
    "arrays-hashing": "The map or table stores only facts already proven by earlier positions.",
    strings: "Every character decision updates a count, window, or builder without losing normalization rules.",
    hashing: "The map stores only facts from earlier positions, so current lookup is safe.",
    "two-pointers": "Every pointer move eliminates choices that cannot beat or satisfy the answer.",
    "sliding-window": "The active window is always the best candidate that still obeys the problem rule.",
    "stack-queue": "The structure always represents unfinished work in the exact order the problem needs.",
    stack: "The stack contains exactly the unresolved items that must be matched or returned to later.",
    "binary-search": "The answer, if it exists, still lives inside the current low-to-high search range.",
    "linked-list": "Every pointer update preserves access to the remaining list before rewiring the current node.",
    trees: "Each recursive call returns the answer for one node's subtree.",
    "graph-bfs-dfs": "Visited contains every node already scheduled or processed, preventing loops.",
    graphs: "Visited contains every node already scheduled or processed, preventing loops.",
    "dp-basics": "Each state is computed from smaller states whose answers are already known.",
    dp: "Each state is computed from smaller states whose answers are already known.",
    heap: "The heap contains the candidates that can still become the next required answer.",
    trie: "The current trie node represents exactly the prefix consumed so far.",
    intervals: "The merged result contains non-overlapping intervals for every interval already processed.",
    matrix: "Every visited cell has a known row-column meaning and is not processed twice.",
    bit: "Each bit operation changes or inspects only the intended bit position.",
    greedy: "The current choice keeps the best reachable answer among all choices considered so far.",
    backtracking: "The path contains only choices that satisfy the rule up to the current depth.",
  };

  return invariants[lessonVisualKey(lesson)] || "Maintain one clear invariant and say it before every move.";
}

function buildSidePanel(lesson, input, step, index) {
  const highlight = resolveHighlight(step.highlight || {}, input);
  const inputText = textForValue(input);
  const key = lessonVisualKey(lesson);
  const panels = {
    arrays: {
      kind: "array",
      title: "Array State Panel",
      items: [
        { label: "Current index", value: highlight.index ?? index },
        { label: "Current value", value: Array.isArray(input) ? input[highlight.index ?? index] : inputText },
        { label: "Tracked best", value: "best so far" },
      ],
    },
    strings: {
      kind: "string",
      title: "String State Panel",
      items: [
        { label: "Character", value: typeof input === "string" ? input[highlight.index ?? index] : inputText },
        { label: "State", value: "counts / window / builder" },
        { label: "Rule", value: "normalize first" },
      ],
    },
    hashing: {
      kind: "map",
      title: "Map State Panel",
      items: [
        { label: "Lookup", value: highlight.lookup || "complement" },
        { label: "Store", value: highlight.store || "value -> index" },
        { label: "Rule", value: "check before storing" },
      ],
    },
    "arrays-hashing": {
      kind: "map",
      title: "Map / Table State Panel",
      items: [
        { label: "Lookup", value: highlight.lookup || "needed fact" },
        { label: "Store", value: highlight.store || "current fact" },
        { label: "Input", value: inputText },
      ],
    },
    "two-pointers": {
      kind: "pointers",
      title: "Pointer State Panel",
      items: [
        { label: "Left", value: highlight.left ?? 0 },
        { label: "Right", value: highlight.right ?? (Array.isArray(input) ? input.length - 1 : 0) },
        { label: "Decision", value: highlight.compare ? "compare and move one side" : "prove the move" },
      ],
    },
    "sliding-window": {
      kind: "window",
      title: "Sliding Window Panel",
      items: [
        { label: "Left edge", value: highlight.windowStart ?? highlight.left ?? 0 },
        { label: "Right edge", value: highlight.windowEnd ?? highlight.right ?? 0 },
        { label: "Rule", value: "expand, validate, shrink" },
      ],
    },
    "stack-queue": {
      kind: "stack",
      title: "Stack / Queue State Panel",
      items: [
        { label: "Operation", value: highlight.action || "push / pop" },
        { label: "Structure", value: highlight.structure || "stack" },
        { label: "Meaning", value: "unfinished work" },
      ],
    },
    stack: {
      kind: "stack",
      title: "Stack Timeline Panel",
      items: [
        { label: "Operation", value: highlight.action || "push / pop" },
        { label: "Top", value: highlight.index ?? "latest item" },
        { label: "Meaning", value: highlight.structure || "unresolved work" },
      ],
    },
    "binary-search": {
      kind: "binary-search",
      title: "Binary Search Panel",
      items: [
        { label: "Low", value: highlight.low ?? 0 },
        { label: "Mid", value: highlight.mid ?? "middle" },
        { label: "High", value: highlight.high ?? (Array.isArray(input) ? input.length - 1 : 0) },
      ],
    },
    "linked-list": {
      kind: "linked-list",
      title: "Linked List Pointer Panel",
      items: [
        { label: "Prev", value: highlight.prev ?? "null" },
        { label: "Current", value: highlight.current ?? highlight.index ?? "head" },
        { label: "Next", value: highlight.next ?? "saved next" },
      ],
    },
    trees: {
      kind: "tree",
      title: "Tree State Panel",
      items: [
        { label: "Node", value: highlight.node ?? "root" },
        { label: "Children", value: Array.isArray(highlight.children) ? highlight.children.join(", ") : "left / right" },
        { label: "Return", value: "combine child answers" },
      ],
    },
    graphs: {
      kind: "queue",
      title: "Graph Frontier Panel",
      items: [
        { label: "Visited", value: Array.isArray(highlight.visited) ? highlight.visited.join(", ") : "start" },
        { label: "Frontier", value: Array.isArray(highlight.frontier) ? highlight.frontier.join(", ") : "queue / stack" },
        { label: "Next", value: highlight.node || "neighbor" },
      ],
    },
    "graph-bfs-dfs": {
      kind: "queue",
      title: "Graph Frontier Panel",
      items: [
        { label: "Visited", value: Array.isArray(highlight.visited) ? highlight.visited.join(", ") : "start" },
        { label: "Frontier", value: Array.isArray(highlight.frontier) ? highlight.frontier.join(", ") : "queue / stack" },
        { label: "Next", value: highlight.node || "neighbor" },
      ],
    },
    "dp-basics": {
      kind: "table",
      title: "DP Table Panel",
      items: [
        { label: "State", value: highlight.state || "dp[i]" },
        { label: "From", value: Array.isArray(highlight.from) ? highlight.from.map((item) => `dp[${item}]`).join(", ") : "base cases" },
        { label: "To", value: highlight.to !== undefined ? `dp[${highlight.to}]` : "answer state" },
      ],
    },
    dp: {
      kind: "table",
      title: "DP Table Panel",
      items: [
        { label: "State", value: highlight.state || "dp[i]" },
        { label: "From", value: Array.isArray(highlight.from) ? highlight.from.map((item) => `dp[${item}]`).join(", ") : "base cases" },
        { label: "To", value: highlight.to !== undefined ? `dp[${highlight.to}]` : "answer state" },
      ],
    },
    heap: {
      kind: "heap",
      title: "Heap / Priority Queue Panel",
      items: [
        { label: "Operation", value: highlight.action || "insert / poll" },
        { label: "Priority", value: "next best candidate" },
        { label: "Structure", value: highlight.structure || "heap" },
      ],
    },
    trie: {
      kind: "trie",
      title: "Trie Prefix Panel",
      items: [
        { label: "Node", value: highlight.node || "root" },
        { label: "Character", value: Array.isArray(input) ? input[highlight.index ?? index] : inputText },
        { label: "Rule", value: "one level per character" },
      ],
    },
    intervals: {
      kind: "intervals",
      title: "Interval Merge Panel",
      items: [
        { label: "Current", value: Array.isArray(input) ? input[highlight.index ?? index] : inputText },
        { label: "Compare", value: "start <= current end" },
        { label: "Result", value: highlight.store || "merged intervals" },
      ],
    },
    matrix: {
      kind: "matrix",
      title: "Matrix Coordinate Panel",
      items: [
        { label: "Row", value: highlight.row ?? "r" },
        { label: "Column", value: highlight.col ?? "c" },
        { label: "Cell", value: Array.isArray(input) ? input[highlight.index ?? index] : inputText },
      ],
    },
    bit: {
      kind: "bit",
      title: "Bit Operation Panel",
      items: [
        { label: "Bit", value: highlight.bit ?? index },
        { label: "Operation", value: highlight.action || "mask / shift" },
        { label: "Input", value: inputText },
      ],
    },
    greedy: {
      kind: "greedy",
      title: "Greedy Choice Panel",
      items: [
        { label: "Index", value: highlight.index ?? index },
        { label: "Choice", value: "locally safe move" },
        { label: "Best", value: "best reachable so far" },
      ],
    },
    backtracking: {
      kind: "backtracking",
      title: "Backtracking Call Stack Panel",
      items: [
        { label: "Action", value: highlight.action || "choose / explore / undo" },
        { label: "Depth", value: highlight.index ?? index },
        { label: "Path", value: highlight.structure || "current choices" },
      ],
    },
  };

  return panels[key] || {
    kind: "state",
    title: "State Panel",
    items: [
      { label: "Input", value: inputText },
      { label: "Step", value: step.title },
      { label: "Invariant", value: deriveInvariant(lesson) },
    ],
  };
}

function enrichStep(lesson, input, step, index) {
  const sidePanel = buildSidePanel(lesson, input, step, index);
  const invariant = deriveInvariant(lesson);

  return {
    title: step.title,
    highlight: resolveHighlight(step.highlight || {}, input),
    explanation: step.explanation,
    memoryHook: lesson.memoryHook,
    stepNumber: index + 1,
    narration: `${step.title}: ${step.explanation}`,
    changed: `${sidePanel.items[0]?.label || "State"} becomes ${sidePanel.items[0]?.value ?? "active"}.`,
    invariant,
    interviewScript: `Say: "${invariant}" Then explain why ${step.title.toLowerCase()} is safe.`,
    sidePanel,
  };
}

export function listDsaVisualLessons() {
  return LESSONS.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    icon: lesson.icon,
    concept: lesson.concept,
    memoryHook: lesson.memoryHook,
    complexity: { ...lesson.complexity },
  }));
}

export function detectDsaLanguage(stack = "") {
  const text = String(stack || "");
  const match = LANGUAGE_ALIASES.find((item) => item.match.test(text));
  return match?.language || "JavaScript";
}

export function getDsaCodeTemplate(lessonOrId, stack = "") {
  const lesson = typeof lessonOrId === "string" ? getDsaVisualLesson(lessonOrId) : lessonOrId;
  const language = detectDsaLanguage(stack);
  const templates = CODE_TEMPLATES[language] || CODE_TEMPLATES.JavaScript;
  const code =
    lesson?.codeTemplates?.[language]
    || templates[lesson?.id]
    || templates[lesson?.patternId]
    || templates[lesson?.visualizerId]
    || CODE_TEMPLATES.JavaScript[lesson?.id]
    || CODE_TEMPLATES.JavaScript[lesson?.patternId]
    || CODE_TEMPLATES.JavaScript[lesson?.visualizerId]
    || lesson?.codeTemplate
    || "";

  return { language, code };
}

export function getDsaVisualLesson(id) {
  if (String(id || "").startsWith("blind75-")) {
    return buildBlind75VisualLesson(id);
  }

  const lesson = LESSON_BY_ID.get(id) || LESSONS[0];
  return clone(lesson);
}

export function buildDsaMockPrompt(lessonOrId) {
  const lesson = typeof lessonOrId === "string" ? getDsaVisualLesson(lessonOrId) : lessonOrId;
  if (lesson?.blind75 && lesson.mockPrompt) return lesson.mockPrompt;

  const title = lesson?.title || "DSA";
  const concept = lesson?.concept || "Explain the algorithm clearly.";
  const complexity = lesson?.complexity ? `${lesson.complexity.time} time and ${lesson.complexity.space} space` : "state time and space";

  return [
    `Act as an interview coach for ${title}.`,
    `Ask me one coding interview problem that practices this idea: ${concept}`,
    "Make me explain the pattern, dry run a small input, write code, test edge cases, and state complexity.",
    `Expected complexity target: ${complexity}.`,
  ].join("\n");
}

export function buildDsaVisualizationState(id, input) {
  const lesson = getDsaVisualLesson(id);
  const normalizedInput = normalizeInput(lesson.id, input, lesson.defaultInput, lesson.inputKind);

  return {
    lessonId: lesson.id,
    input: normalizedInput,
    steps: lesson.steps.map((step, index) => enrichStep(lesson, normalizedInput, step, index)),
  };
}
