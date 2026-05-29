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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeInput(id, input) {
  if (input === undefined || input === null || input === "") {
    return clone(DEFAULT_INPUTS[id] || []);
  }

  if (Array.isArray(input)) return [...input];

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return clone(DEFAULT_INPUTS[id] || []);
    if (id === "strings") return trimmed;
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

  for (const key of ["left", "right", "index"]) {
    if (typeof resolved[key] === "number" && resolved[key] < 0) {
      resolved[key] = Math.max(0, length + resolved[key]);
    }
  }

  return resolved;
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

export function getDsaVisualLesson(id) {
  const lesson = LESSON_BY_ID.get(id) || LESSONS[0];
  return clone(lesson);
}

export function buildDsaMockPrompt(lessonOrId) {
  const lesson = typeof lessonOrId === "string" ? getDsaVisualLesson(lessonOrId) : lessonOrId;
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
  const normalizedInput = normalizeInput(lesson.id, input);

  return {
    lessonId: lesson.id,
    input: normalizedInput,
    steps: lesson.steps.map((step, index) => ({
      title: step.title,
      highlight: resolveHighlight(step.highlight || {}, normalizedInput),
      explanation: step.explanation,
      memoryHook: lesson.memoryHook,
      stepNumber: index + 1,
    })),
  };
}
