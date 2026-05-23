import { getDisplayName } from "./personalization.mjs";
import { getPrepLabel } from "./prepTopics.mjs";

const MISTAKE_PATTERNS = [
  {
    topic: "Edge cases",
    pattern: /edge cases?|boundary|corner cases?/i,
    correction: "Name the boundary conditions before coding: empty input, one item, null or invalid values, duplicates, limits, and failure cases.",
  },
  {
    topic: "Trade-offs",
    pattern: /trade-?offs?|pros and cons|alternative/i,
    correction: "Compare at least two approaches, explain why you chose one, and mention when the other approach would be better.",
  },
  {
    topic: "Complexity analysis",
    pattern: /complexity|time\/space|big o|memory/i,
    correction: "State time and space complexity, explain the driver of each cost, and call out what changes with input size.",
  },
  {
    topic: "System design depth",
    pattern: /scalability|capacity|partition|cache|queue|availability|latency/i,
    correction: "Clarify scale, APIs, data model, bottlenecks, failure modes, observability, and rollout trade-offs.",
  },
  {
    topic: "Behavioral structure",
    pattern: /star|situation|task|action|result|behavioral/i,
    correction: "Use STAR: set context briefly, explain your action clearly, quantify the result, and close with learning.",
  },
  {
    topic: "Testing strategy",
    pattern: /test|coverage|mock|integration|unit/i,
    correction: "Explain the test pyramid for this case: fast unit tests, focused integration tests, and one user-level confidence check.",
  },
];

function firstTopic(topics) {
  return topics?.[0]?.cat || "Core stack";
}

function firstSubtopic(topics, index) {
  return topics?.[index]?.subs?.[0] || topics?.[0]?.subs?.[index] || firstTopic(topics);
}

function average(values) {
  if (!values?.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildRetryPrompt(topic, correction) {
  return [
    `Drill my interview weakness: ${topic}.`,
    `Teach the correction first: ${correction}`,
    "Then ask one realistic interview question and wait for my answer.",
    "After I answer, reply with Score: X/10, strengths, gaps, and an improved answer.",
  ].join("\n");
}

export function deriveMistakeBank(messages = []) {
  const matches = [];

  messages.forEach((message, messageIndex) => {
    if (message.role !== "assistant") return;

    const content = String(message.content || "");
    MISTAKE_PATTERNS.forEach((mistake) => {
      if (!mistake.pattern.test(content)) return;

      matches.push({
        id: mistake.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        topic: mistake.topic,
        correction: mistake.correction,
        evidence: content.split("\n").find((line) => /gap|miss|weak|shallow|trade|complex|edge|test/i.test(line))?.trim() || "Mentioned in recent assistant feedback.",
        retryPrompt: buildRetryPrompt(mistake.topic, mistake.correction),
        messageIndex,
      });
    });
  });

  const latestByTopic = new Map();
  matches.forEach((item) => {
    latestByTopic.set(item.topic, item);
  });

  return MISTAKE_PATTERNS
    .map((mistake) => latestByTopic.get(mistake.topic))
    .filter(Boolean)
    .slice(0, 6);
}

export function buildInterviewRoadmap({
  profile,
  topics = [],
  weakSpots = [],
  mockScores = [],
} = {}) {
  const name = getDisplayName(profile);
  const stack = profile?.stack || getPrepLabel(profile?.stack);
  const prepLabel = getPrepLabel(profile?.stack);
  const recentAverage = average(mockScores.slice(-5));
  const scoreContext = recentAverage === null
    ? "No scored mock yet"
    : `Recent mock average ${Math.round(recentAverage * 10)}/100`;
  const focusQueue = [
    ...weakSpots,
    firstTopic(topics),
    firstSubtopic(topics, 0),
    firstSubtopic(topics, 1),
    firstSubtopic(topics, 2),
    "System Design",
    "Behavioral STAR story",
  ].filter(Boolean);

  const templates = [
    ["Foundation", 25, "Review fundamentals and explain concepts out loud."],
    ["Weak Spot Repair", 30, "Fix the highest-risk gap from recent feedback."],
    ["Implementation Drill", 35, "Practice a hands-on coding or API scenario."],
    ["System Design", 40, "Walk through architecture, trade-offs, and failure modes."],
    ["Behavioral Signal", 25, "Prepare one STAR story with measurable impact."],
    ["Scored Mock", 45, "Run a realistic mock round and capture a score."],
    ["Polish", 30, "Retry missed topics and tighten final answer structure."],
  ];

  const days = templates.map(([title, minutes, detail], index) => {
    const focus = focusQueue[index % focusQueue.length] || "Interview prep";

    return {
      day: index + 1,
      title,
      focus,
      minutes,
      detail,
      prompt: `Run day ${index + 1} of ${name}'s ${prepLabel} roadmap. Focus: ${focus}. Stack: ${stack}. Spend about ${minutes} minutes. ${detail} End with Score: X/10 if this includes an answer attempt, plus next steps.`,
    };
  });

  return {
    title: "7-Day Interview Roadmap",
    summary: `${name}'s ${prepLabel} plan for ${stack}. ${scoreContext}.`,
    days,
  };
}
