import { listBlind75Problems } from "./blind75VisualTrack.mjs";

const FRESHER_DSA_STARTER_PROBLEMS = [
  {
    id: "two-sum-java", pattern: "Hashing", level: "Level 1", title: "Two Sum", prompt: "Return the indices of two values whose sum equals target.",
    hints: ["A complement is target minus the current value.", "Store values you have already visited in a map.", "Check the map before inserting the current value."],
    pseudocode: "for each index i: if target - a[i] is in map, return its index and i; otherwise store a[i] -> i.",
    solution: "Map<Integer, Integer> seen = new HashMap<>();\nfor (int i = 0; i < nums.length; i++) {\n  int need = target - nums[i];\n  if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n  seen.put(nums[i], i);\n}\nreturn new int[0];",
    tests: ["[2,7,11,15], 9 -> [0,1]", "[3,3], 6 -> [0,1]", "[1,2], 8 -> no answer"],
  },
  {
    id: "valid-parentheses-java", pattern: "Stack / Monotonic Stack", level: "Level 1", title: "Valid Parentheses", prompt: "Determine whether brackets are correctly opened and closed.",
    hints: ["The most recent opening bracket must close first.", "Use a stack and map each closer to its opener.", "Reject a closer when the stack is empty or its top does not match."],
    pseudocode: "push openers; for a closer, compare with stack top; valid only when the stack is empty at the end.",
    solution: "Deque<Character> stack = new ArrayDeque<>();\nfor (char c : s.toCharArray()) {\n  if (c == '(' || c == '[' || c == '{') stack.push(c);\n  else if (stack.isEmpty() || !matches(stack.pop(), c)) return false;\n}\nreturn stack.isEmpty();",
    tests: ["()[]{} -> true", "([)] -> false", "{[]} -> true"],
  },
  {
    id: "longest-window-java", pattern: "Sliding Window", level: "Level 2", title: "Longest Substring Without Repeating Characters", prompt: "Find the length of the longest substring with no repeated character.",
    hints: ["Maintain a window whose characters are unique.", "When a duplicate appears, move left past its previous position.", "Store the most recent index for each character."],
    pseudocode: "for right: left = max(left, last[s[right]] + 1); update best; store last index.",
    solution: "int[] last = new int[128];\nArrays.fill(last, -1);\nint left = 0, best = 0;\nfor (int right = 0; right < s.length(); right++) {\n  left = Math.max(left, last[s.charAt(right)] + 1);\n  best = Math.max(best, right - left + 1);\n  last[s.charAt(right)] = right;\n}\nreturn best;",
    tests: ["abcabcbb -> 3", "bbbbb -> 1", "pwwkew -> 3"],
  },
  {
    id: "binary-search-java", pattern: "Binary Search", level: "Level 3", title: "First True Position", prompt: "Given a monotonic boolean condition over [0,n), return the first index where it becomes true.",
    hints: ["The answer is a boundary, not a single comparison.", "Keep low as possibly false and high as possibly true.", "Use a half-open interval and shrink it until low == high."],
    pseudocode: "while low < high: mid; if feasible(mid) high = mid else low = mid + 1; return low.",
    solution: "int low = 0, high = n;\nwhile (low < high) {\n  int mid = low + (high - low) / 2;\n  if (feasible(mid)) high = mid;\n  else low = mid + 1;\n}\nreturn low;",
    tests: ["[false,false,true,true] -> 2", "[true,true] -> 0", "[false,false] -> n"],
  },
  {
    id: "house-robber-java", pattern: "Dynamic Programming", level: "Level 4", title: "House Robber", prompt: "Maximize money without selecting adjacent houses.",
    hints: ["At each house, either skip it or take it.", "The state only needs the best answer through the previous two houses.", "Define take as value + two-back and skip as previous."],
    pseudocode: "prev2=0, prev1=0; for value: current=max(prev1, prev2+value); shift; return prev1.",
    solution: "long prev2 = 0, prev1 = 0;\nfor (int value : nums) {\n  long current = Math.max(prev1, prev2 + value);\n  prev2 = prev1;\n  prev1 = current;\n}\nreturn prev1;",
    tests: ["[1,2,3,1] -> 4", "[2,7,9,3,1] -> 12", "[] -> 0"],
  },
  {
    id: "number-islands-java", pattern: "BFS / DFS", level: "Level 5", title: "Number of Islands", prompt: "Count connected groups of land cells in a grid.",
    hints: ["Every unvisited land cell starts one component.", "Flood-fill its four neighbors and mark them visited.", "The answer is the number of flood-fill starts."],
    pseudocode: "scan cells; for each unvisited land increment count and BFS/DFS its component.",
    solution: "int count = 0;\nfor (int r = 0; r < grid.length; r++) for (int c = 0; c < grid[0].length; c++) {\n  if (grid[r][c] != '1') continue;\n  count++;\n  floodFill(grid, r, c);\n}\nreturn count;",
    tests: ["single island -> 1", "two separated islands -> 2", "all water -> 0"],
  },
];

const STARTER_BY_ID = new Map(FRESHER_DSA_STARTER_PROBLEMS.map((problem) => [problem.id, problem]));
const patternHint = (problem) => [
  `Start by naming the ${problem.pattern} state before writing code.`,
  `Keep this invariant true: ${problem.invariant}`,
  `Use the visual dry run and test an empty, boundary, or duplicate case before optimizing.`,
];
const generatedGuidedProblem = (problem) => {
  const starter = STARTER_BY_ID.get(`${problem.id}-java`) || STARTER_BY_ID.get(problem.id);
  if (starter) return { ...starter, id: problem.id, title: problem.title, pattern: problem.pattern, level: problem.difficulty === "Easy" ? "Level 1" : problem.difficulty === "Medium" ? "Level 3" : "Level 5" };
  return {
    id: problem.id,
    pattern: problem.pattern,
    level: problem.difficulty === "Easy" ? "Level 1" : problem.difficulty === "Medium" ? "Level 3" : "Level 5",
    title: problem.title,
    prompt: problem.statement,
    hints: patternHint(problem),
    pseudocode: problem.dryRun,
    solution: problem.codeWalkthrough.map((step) => `${step.title}: ${step.codeCue} — ${step.interviewCue}`).join("\n"),
    tests: problem.testCases.map((testCase) => `${testCase.input} -> ${testCase.expected}`),
    category: problem.category,
    difficulty: problem.difficulty,
    source: "Blind 75",
  };
};

export const FRESHER_DSA_PROBLEMS = listBlind75Problems().map(generatedGuidedProblem);

export function getFresherDsaProblem(id) {
  return FRESHER_DSA_PROBLEMS.find((problem) => problem.id === id) || FRESHER_DSA_PROBLEMS[0];
}

export function getFresherDsaDailyPlan(day = 1) {
  const index = Math.max(0, Number(day || 1) - 1) % FRESHER_DSA_PROBLEMS.length;
  return [FRESHER_DSA_PROBLEMS[index], FRESHER_DSA_PROBLEMS[(index + 1) % FRESHER_DSA_PROBLEMS.length]];
}

export function getSpacedReviewQueue(problems = FRESHER_DSA_PROBLEMS, reviewState = {}, now = new Date()) {
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return [...problems].map((problem) => {
    const state = reviewState[problem.id] || {};
    const attempts = Number(state.attempts || 0);
    const mistakes = Number(state.mistakes || 0);
    const intervalDays = mistakes > 0 ? 1 : Math.min(14, Math.max(1, 2 ** Math.min(attempts, 3)));
    const dueAt = state.reviewedAt ? new Date(state.reviewedAt).getTime() + intervalDays * 86400000 : 0;
    return { problem, due: !dueAt || dueAt <= current, dueAt: dueAt ? new Date(dueAt).toISOString() : null, intervalDays, attempts, mistakes };
  }).sort((a, b) => Number(b.due) - Number(a.due) || a.dueAt?.localeCompare(b.dueAt || "") || 0);
}

export function scoreFresherDsaAttempt({ solved = false, hintLevel = 0, explained = false, complexity = false, edgeCases = false } = {}) {
  return Math.max(0, Math.min(100, (solved ? 45 : 0) + (explained ? 20 : 0) + (complexity ? 15 : 0) + (edgeCases ? 15 : 0) + (hintLevel === 0 ? 5 : 0)));
}
