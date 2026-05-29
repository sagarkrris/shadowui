export const REQUIRED_STORY_QUESTIONS = [
  "Do you have a story for this?",
  "Can you prove this with metrics?",
  "What follow-up question will the interviewer ask?",
];

const CLAIM_TYPES = [
  {
    type: "performance",
    label: "Performance",
    icon: "ti-bolt",
    patterns: [/perform/i, /latency/i, /throughput/i, /speed/i, /optimi[sz]e/i, /faster/i, /response time/i],
    storyTerms: ["performance", "latency", "throughput", "optimization", "speed"],
  },
  {
    type: "api",
    label: "APIs",
    icon: "ti-api",
    patterns: [/\bapi\b/i, /\bapis\b/i, /rest/i, /graphql/i, /endpoint/i, /integration/i, /service/i],
    storyTerms: ["api", "apis", "rest", "graphql", "endpoint", "integration", "service"],
  },
  {
    type: "migration",
    label: "Migration",
    icon: "ti-git-merge",
    patterns: [/migrat/i, /moderni[sz]e/i, /monolith/i, /legacy/i, /refactor/i, /upgrade/i, /replatform/i],
    storyTerms: ["migration", "migrated", "modernization", "monolith", "legacy", "refactor"],
  },
  {
    type: "leadership",
    label: "Leadership",
    icon: "ti-users",
    patterns: [/\bled\b/i, /leadership/i, /ment(?:or|ored|oring)/i, /owned/i, /drove/i, /stakeholder/i, /team/i],
    storyTerms: ["leadership", "led", "mentored", "owned", "team", "stakeholder"],
  },
  {
    type: "reliability",
    label: "Reliability",
    icon: "ti-shield-check",
    patterns: [/reliab/i, /uptime/i, /incident/i, /failure/i, /resilien/i, /on-call/i, /rollback/i, /error rate/i],
    storyTerms: ["reliability", "incident", "uptime", "resilience", "failure", "production"],
  },
  {
    type: "cost",
    label: "Cost",
    icon: "ti-coin",
    patterns: [/\bcost\b/i, /spend/i, /savings?/i, /rightsiz/i, /cloud bill/i, /budget/i],
    storyTerms: ["cost", "spend", "saving", "rightsizing", "budget"],
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9%$.\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "claim";
}

function splitSentences(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/^[*-]\s*/, "").trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

export function extractClaimMetrics(text) {
  const value = String(text || "");
  const rangeMetrics = Array.from(value.matchAll(/\b(?:from\s+)?\d+(?:\.\d+)?\s*(?:to|→|-)\s*\d+(?:\.\d+)?(?:\s+(?:per|each|a)\s+\w+)?/gi))
    .map((match) => match[0].replace(/^from\s+/i, "").trim());
  const scalarMetrics = Array.from(value.matchAll(/\$?\b\d+(?:\.\d+)?\s*(?:%|percent|x|ms|sec|seconds|minutes|hours|days|weeks|months|years|users|requests|rps|qps|incidents|engineers|people|tickets|k|m|million|billion)(?=\b|[^a-z0-9])|\$\d+(?:\.\d+)?\s*(?:k|m|million|billion)?/gi))
    .map((match) => match[0].trim());

  return unique([...rangeMetrics, ...scalarMetrics]).slice(0, 4);
}

export function extractResumeStoryClaims(resumeText = "") {
  const claims = [];
  const seen = new Set();

  splitSentences(resumeText).forEach((sentence) => {
    CLAIM_TYPES.forEach((claimType) => {
      if (!claimType.patterns.some((pattern) => pattern.test(sentence))) return;

      const id = `${claimType.type}-${slug(sentence).slice(0, 60)}`;
      if (seen.has(id)) return;
      seen.add(id);

      claims.push({
        id,
        type: claimType.type,
        label: claimType.label,
        icon: claimType.icon,
        sentence,
        metrics: extractClaimMetrics(sentence),
      });
    });
  });

  return claims;
}

function storyText(story = {}) {
  return [
    story.title,
    story.situation,
    story.task,
    story.action,
    story.result,
    ...(story.skillsProven || story.skills || []),
    ...(story.impactMetrics || story.metrics || []),
  ].filter(Boolean).join(" ");
}

function matchStory(claim, proofStories = []) {
  const claimType = CLAIM_TYPES.find((item) => item.type === claim.type);
  if (!claimType) return null;

  let best = null;
  proofStories.forEach((story) => {
    const text = normalizeText(storyText(story));
    const termScore = claimType.storyTerms.reduce((count, term) => count + (text.includes(normalizeText(term)) ? 1 : 0), 0);
    const sentenceTerms = normalizeText(claim.sentence).split(" ").filter((part) => part.length >= 5);
    const overlapScore = sentenceTerms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    const score = termScore * 4 + overlapScore;

    if (score > 0 && (!best || score > best.score)) {
      best = { story, score };
    }
  });

  return best?.story || null;
}

function resumeGapText(resumeAnalysis = {}) {
  const missing = (resumeAnalysis?.missingSkills || [])
    .map((skill) => skill?.name || skill?.label || skill)
    .filter(Boolean);
  const gaps = (resumeAnalysis?.gaps || resumeAnalysis?.weaknesses || [])
    .map(String)
    .filter(Boolean);

  return unique([...missing, ...gaps]).slice(0, 4).join(", ");
}

function buildMockPrompt({ claim, matchedStory, resumeAnalysis }) {
  const metricLine = claim.metrics.length
    ? `Resume metrics already stated: ${claim.metrics.join(", ")}. Use only these metrics unless I provide more.`
    : "No metric is stated. Do not invent metrics; ask me for missing metrics before quantifying impact.";
  const storyLine = matchedStory
    ? `Matched proof story: ${matchedStory.title || "Saved proof story"}.`
    : "No saved proof story is matched yet.";
  const gaps = resumeGapText(resumeAnalysis);

  return [
    "Practice this as a behavioral answer.",
    `Resume claim: ${claim.sentence}`,
    `Claim category: ${claim.label}`,
    storyLine,
    metricLine,
    gaps ? `Resume gaps to cover: ${gaps}.` : "",
    "Ask me for Situation, Task, Action, Result, then ask one skeptical follow-up.",
  ].filter(Boolean).join("\n");
}

export function buildResumeStoryMatches({
  resumeText = "",
  resumeAnalysis = null,
  proofStories = [],
} = {}) {
  const claims = extractResumeStoryClaims(resumeText);
  const cards = claims.map((claim, index) => {
    const matchedStory = matchStory(claim, proofStories);
    return {
      id: `resume-story-${index + 1}-${claim.type}`,
      type: claim.type,
      label: claim.label,
      icon: claim.icon,
      claim: claim.sentence,
      sentence: claim.sentence,
      metrics: [...claim.metrics],
      questions: [...REQUIRED_STORY_QUESTIONS],
      matchedStory,
      mockPrompt: buildMockPrompt({ claim, matchedStory, resumeAnalysis }),
    };
  });

  return {
    title: "Resume Story Matcher",
    summary: cards.length
      ? "Resume claims mapped to interview stories using only local resume and proof-vault evidence."
      : "Paste or upload a resume to find claims that need interview stories.",
    requiredQuestions: [...REQUIRED_STORY_QUESTIONS],
    cards,
  };
}
