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

const MCQ_SIGNALS = {
  arrays: "Track an index-based invariant while scanning or updating contiguous positions.",
  strings: "Clarify normalization and track characters, windows, or counts deliberately.",
  hashing: "Trade extra memory for fast lookup of facts you have already seen.",
  "two-pointers": "Move left or right only when the invariant proves choices can be eliminated.",
  "stack-queue": "Choose last-in-first-out for unfinished work or first-in-first-out for level order.",
  trees: "Define one node's return value, recurse into children, then combine the answers.",
  "graph-bfs-dfs": "Use visited plus frontier/recursion so traversal cannot loop or double-count.",
  "dp-basics": "Define state, transition, base cases, and the final answer before coding.",
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

function makeChoices(correct, distractors) {
  return [correct, ...distractors].slice(0, 4).map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text,
  }));
}

function buildChallengeSetFromLesson(lessonSummary, stack = DEFAULT_STACK) {
  const lesson = getDsaVisualLesson(lessonSummary.id);
  const code = getDsaCodeTemplate(lesson, stack);
  const edgeCases = EDGE_CASES[lesson.id] || ["Empty input", "Duplicate values", "Large input"];
  const complexity = `${lesson.complexity?.time || "O(n)"} time and ${lesson.complexity?.space || "O(1)"} extra space`;
  const signal = MCQ_SIGNALS[lesson.id] || `Use ${lesson.title} when the prompt matches the pattern signal.`;

  return [
    {
      id: `challenge-${lesson.id}-mcq`,
      lessonId: lesson.id,
      type: "mcq",
      typeLabel: "MCQ",
      title: `${lesson.title} Pattern MCQ`,
      difficulty: LESSON_DIFFICULTY[lesson.id] || "Medium",
      prompt: `Which interview signal most strongly points to ${lesson.title}?`,
      choices: makeChoices(signal, [
        "Start coding immediately and explain the pattern only after the solution passes.",
        "Pick the data structure with the shortest syntax, regardless of the invariant.",
        "Avoid discussing edge cases until the interviewer asks for them.",
      ]),
      correctChoiceId: "a",
      explanation: `${lesson.title} questions become easier when you name the pattern signal first, then tie every move back to the invariant.`,
      trick: "The distractors sound productive, but they skip the pattern signal or invariant.",
      tricky: true,
      tags: [lesson.title, "MCQ", "Pattern Recognition"],
    },
    {
      id: `challenge-${lesson.id}-coding`,
      lessonId: lesson.id,
      type: "coding",
      typeLabel: "Coding",
      title: `${lesson.title} Tricky Coding Prompt`,
      difficulty: lesson.id === "dp-basics" ? "Hard" : "Medium",
      prompt: `Tricky interview coding: before submitting this ${code.language} ${lesson.title} template, what should you explain or guard?`,
      codeSnippet: code.code,
      choices: makeChoices(
        `State the invariant, dry run ${edgeCases[0].toLowerCase()}, and keep the template aligned with ${complexity}.`,
        [
          "Only mention the happy path because the code template already proves correctness.",
          "Change the algorithm after coding if the interviewer asks about complexity.",
          "Skip the dry run and focus on memorizing exact syntax for the selected stack.",
        ],
      ),
      correctChoiceId: "a",
      explanation: `Interview coding is not just syntax. The safest answer connects the code to the invariant, one edge case, and the expected ${complexity}.`,
      trick: `A common trap is writing the template cleanly but never proving it survives ${edgeCases[0].toLowerCase()}.`,
      tricky: true,
      tags: [lesson.title, "Coding", code.language],
    },
    {
      id: `challenge-${lesson.id}-quantitative`,
      lessonId: lesson.id,
      type: "quantitative",
      typeLabel: "Quantitative",
      title: `${lesson.title} Quantitative Check`,
      difficulty: lesson.id === "dp-basics" ? "Hard" : "Medium",
      prompt: `Quantitative question: what Big-O should you state for the standard ${lesson.title} approach in this lab?`,
      choices: makeChoices(complexity, [
        "O(n^2) time and O(1) extra space because every interview solution compares all pairs.",
        "O(1) time and O(1) extra space because the code uses a fixed number of variables.",
        "O(log n) time and O(n) extra space because every optimized solution halves the input.",
      ]),
      correctChoiceId: "a",
      explanation: `The quantitative answer should match the pattern's dominant work and extra state: ${complexity}.`,
      trick: "The wrong answers confuse syntax size, pairwise brute force, or binary-search-style halving with the actual pattern.",
      tricky: false,
      tags: [lesson.title, "Quantitative", "Big-O"],
    },
    {
      id: `challenge-${lesson.id}-edge-mcq`,
      lessonId: lesson.id,
      type: "mcq",
      typeLabel: "MCQ",
      title: `${lesson.title} Edge-Case Trap`,
      difficulty: "Medium",
      prompt: `Which edge case should you mention first for a tricky ${lesson.title} interview question?`,
      choices: makeChoices(edgeCases[0], [
        "Only the largest happy-path input because it proves performance.",
        "A case with perfect formatting and no boundary behavior.",
        "The exact sample input only, because samples cover the contract.",
      ]),
      correctChoiceId: "a",
      explanation: `A strong interview answer names the risky boundary before coding. For ${lesson.title}, start with ${edgeCases[0].toLowerCase()} and explain how the invariant survives it.`,
      trick: "The wrong answers hide boundary behavior behind happy-path confidence.",
      tricky: true,
      tags: [lesson.title, "MCQ", "Edge Case"],
    },
    {
      id: `challenge-${lesson.id}-quantitative-counting`,
      lessonId: lesson.id,
      type: "quantitative",
      typeLabel: "Quantitative",
      title: `${lesson.title} Work Counting`,
      difficulty: "Medium",
      prompt: `Quantitative question: if the input doubles, which statement best matches the usual ${lesson.title} cost?`,
      choices: makeChoices(
        `The dominant work follows ${lesson.complexity?.time || "O(n)"}, while extra memory follows ${lesson.complexity?.space || "O(1)"}.`,
        [
          "Runtime is always unchanged because Big-O ignores input size.",
          "Space is always O(1) because the input itself is not counted.",
          "Runtime always squares because interviews prefer nested loops.",
        ],
      ),
      correctChoiceId: "a",
      explanation: `Quantitative interview answers should connect growth to the dominant operation: ${complexity}.`,
      trick: "The distractors misuse Big-O shortcuts instead of counting the work done by this pattern.",
      tricky: false,
      tags: [lesson.title, "Quantitative", "Counting"],
    },
  ];
}

export function listDsaInterviewChallenges({ stack = DEFAULT_STACK, lessonId = "all", type = "all" } = {}) {
  return listDsaVisualLessons()
    .flatMap((lesson) => buildChallengeSetFromLesson(lesson, stack))
    .filter((challenge) => lessonId === "all" || challenge.lessonId === lessonId)
    .filter((challenge) => type === "all" || challenge.type === type);
}

export function buildDsaInterviewChallengeMockPrompt(challenge) {
  const activeChallenge = challenge || listDsaInterviewChallenges()[0];
  const choices = (activeChallenge.choices || [])
    .map((choice) => `${choice.id.toUpperCase()}. ${choice.text}`)
    .join("\n");

  return [
    `Run a DSA Interview Challenge mock for ${activeChallenge.title}.`,
    `Question type: ${activeChallenge.typeLabel || activeChallenge.type}.`,
    activeChallenge.codeSnippet ? `Use this coding snippet:\n${activeChallenge.codeSnippet}` : "",
    "Ask exactly this question first, then wait for my answer:",
    `"${activeChallenge.prompt}"`,
    choices,
    "After I answer, reveal whether I chose correctly, explain the trick, and ask one follow-up.",
    `Private correct answer: ${String(activeChallenge.correctChoiceId || "a").toUpperCase()}.`,
    `Private explanation: ${activeChallenge.explanation}`,
  ].filter(Boolean).join("\n");
}
