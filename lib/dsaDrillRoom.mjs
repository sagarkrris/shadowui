import {
  getDsaCodeTemplate,
  getDsaVisualLesson,
  listDsaVisualLessons,
} from "./dsaVisualLab.mjs";

const DEFAULT_STACK = "JavaScript";

const LESSON_DIFFICULTY = {
  arrays: "Easy",
  strings: "Easy",
  hashing: "Medium",
  "two-pointers": "Medium",
  "stack-queue": "Medium",
  trees: "Medium",
  "graph-bfs-dfs": "Medium",
  "dp-basics": "Hard",
};

const PATTERN_KEYWORDS = {
  arrays: ["array", "index", "scan", "invariant"],
  strings: ["string", "char", "character", "normalize", "count"],
  hashing: ["hash", "map", "lookup", "seen", "complement"],
  "two-pointers": ["pointer", "left", "right", "window", "move"],
  "stack-queue": ["stack", "queue", "push", "pop", "enqueue", "dequeue"],
  trees: ["tree", "node", "recursive", "recursion", "left", "right"],
  "graph-bfs-dfs": ["graph", "bfs", "dfs", "visited", "frontier", "queue"],
  "dp-basics": ["dp", "dynamic", "state", "transition", "base"],
};

const EDGE_CASES = {
  arrays: ["Empty or single-element input", "Negative numbers", "Duplicate values"],
  strings: ["Empty string", "Case and punctuation normalization", "Repeated characters"],
  hashing: ["No valid pair", "Duplicate values", "The same element cannot be reused"],
  "two-pointers": ["Pointers cross without a match", "Already sorted versus unsorted input", "Duplicate values"],
  "stack-queue": ["Closing token before opening token", "Leftover stack items", "Deep nesting"],
  trees: ["Empty tree", "Single node", "Skewed tree and recursion depth"],
  "graph-bfs-dfs": ["Disconnected graph", "Cycles", "Start node missing from adjacency list"],
  "dp-basics": ["Small base cases", "Invalid or zero input", "Memory reduction possibility"],
};

function asText(value) {
  return String(value || "").trim();
}

function normalizeDrillId(id) {
  const text = asText(id);
  return text.startsWith("drill-") ? text.slice("drill-".length) : text;
}

function includesAny(text, keywords = []) {
  const haystack = String(text || "").toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function buildDrillFromLesson(lessonSummary, stack = DEFAULT_STACK) {
  const lesson = getDsaVisualLesson(lessonSummary.id);
  const code = getDsaCodeTemplate(lesson, stack);
  const edgeCases = EDGE_CASES[lesson.id] || [
    "Empty input",
    "Duplicate values",
    "Large input near constraints",
  ];
  const pattern = lesson.title;
  const complexity = `${lesson.complexity?.time || "O(n)"} time, ${lesson.complexity?.space || "O(1)"} space`;

  return {
    id: `drill-${lesson.id}`,
    lessonId: lesson.id,
    title: `${pattern} Drill`,
    difficulty: LESSON_DIFFICULTY[lesson.id] || "Medium",
    tags: [pattern, "DSA", "Interview Drill"],
    question: `Solve a ${pattern} interview problem. Explain the pattern, give brute force, then present the optimal approach before coding.`,
    answer: {
      pattern,
      bruteForce: `A brute force answer tries all relevant choices directly, then measures why that repeated work is too slow before improving it with ${pattern}.`,
      optimalApproach: `Use ${pattern} deliberately: define the invariant, update only the state needed at each step, dry run a small example, then code the loop or recursion around that invariant.`,
      code,
      dryRun: lesson.dryRun || "Walk through a small input one move at a time and say how the tracked state changes.",
      edgeCases,
      complexity,
    },
    rubric: [
      { label: "Pattern", keywords: PATTERN_KEYWORDS[lesson.id] || [lesson.title.toLowerCase()] },
      { label: "Brute force", keywords: ["brute", "naive", "all pairs", "try all", "nested"] },
      { label: "Invariant", keywords: ["invariant", "maintain", "guarantee", "state"] },
      { label: "Dry run", keywords: ["dry run", "example", "walk", "step"] },
      { label: "Edge cases", keywords: ["edge", "empty", "duplicate", "single", "null"] },
      { label: "Complexity", keywords: ["o(", "time", "space", "complexity"] },
    ],
    followUps: [
      `What makes ${pattern} better than brute force here?`,
      "Which edge case would break a careless solution?",
      "How would you explain the complexity in one sentence?",
    ],
  };
}

export function listDsaDrillQuestions({ stack = DEFAULT_STACK } = {}) {
  return listDsaVisualLessons().map((lesson) => buildDrillFromLesson(lesson, stack));
}

export function getDsaDrillQuestion(id = "drill-arrays", options = {}) {
  const lessonId = normalizeDrillId(id) || "arrays";
  const drills = listDsaDrillQuestions(options);
  return drills.find((drill) => drill.lessonId === lessonId || drill.id === id) || drills[0];
}

export function buildDsaDrillMockPrompt(drill) {
  const question = drill?.question || "Ask me one DSA drill question.";
  const pattern = drill?.answer?.pattern || drill?.title || "DSA";
  const edgeCases = (drill?.answer?.edgeCases || []).join(", ");
  const complexity = drill?.answer?.complexity || "state time and space complexity";

  return [
    `Run a DSA Drill Room mock for ${pattern}.`,
    "Ask exactly this question first, then wait for my answer:",
    `"${question}"`,
    "After I answer, compare against this private guide:",
    `Pattern: ${pattern}`,
    `Edge cases: ${edgeCases}`,
    `Complexity target: ${complexity}`,
    "Score correctness, pattern recognition, dry run, edge cases, code readiness, and communication clarity.",
  ].join("\n");
}

export function buildDsaDrillComparison({ drill, response = "" } = {}) {
  const activeDrill = drill || getDsaDrillQuestion();
  const text = asText(response);
  const checks = (activeDrill.rubric || []).map((item) => {
    const covered = includesAny(text, item.keywords);
    return {
      label: item.label,
      covered,
      feedback: covered
        ? `${item.label} is present.`
        : `Add ${item.label.toLowerCase()} to make the answer interview-ready.`,
    };
  });
  const coveredCount = checks.filter((check) => check.covered).length;
  const score = checks.length ? Math.round((coveredCount / checks.length) * 100) : 0;
  const summary = score >= 80
    ? "Close to interview-ready. Reveal the ideal answer to tighten phrasing."
    : score >= 50
      ? "Good start, but add the missing pieces before coding."
      : "Not ready yet. Start with pattern, invariant, edge cases, and complexity.";

  return {
    score,
    summary,
    checks,
  };
}
