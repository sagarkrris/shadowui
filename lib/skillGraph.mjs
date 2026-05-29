export const SKILL_GRAPH_STATUSES = ["New", "Weak", "Improving", "Strong", "Mastered"];

const CORE_SKILLS = [
  {
    label: "Java Core",
    icon: "ti-brand-java",
    aliases: ["java", "jvm", "collections", "streams", "concurrency", "generics"],
  },
  {
    label: "Spring Boot",
    icon: "ti-leaf",
    aliases: ["spring boot", "spring", "spring security", "jpa", "hibernate", "rest controller"],
  },
  {
    label: "SQL",
    icon: "ti-database",
    aliases: ["sql", "postgres", "postgresql", "mysql", "database", "index", "transaction", "query"],
  },
  {
    label: "System Design",
    icon: "ti-topology-star",
    aliases: ["system design", "architecture", "scalability", "cache", "caching", "queue", "kafka", "observability"],
  },
  {
    label: "Behavioral",
    icon: "ti-users",
    aliases: ["behavioral", "star", "leadership", "ownership", "collaboration", "mentoring", "conflict"],
  },
  {
    label: "DSA",
    icon: "ti-binary-tree",
    aliases: ["dsa", "algorithm", "arrays", "graphs", "dynamic programming", "complexity", "coding"],
  },
];

const STACK_LABELS = new Map([
  ["postgresql", "SQL"],
  ["postgres", "SQL"],
  ["mysql", "SQL"],
  ["mariadb", "SQL"],
  ["oracle", "SQL"],
  ["spring", "Spring Boot"],
  ["spring boot", "Spring Boot"],
  ["java", "Java Core"],
  ["jvm", "Java Core"],
  ["algorithms", "DSA"],
  ["algorithm", "DSA"],
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "skill";
}

function titleCase(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map((part) => (part.length <= 3 && part === part.toUpperCase() ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function skillMatches(skill, text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  const terms = unique([skill.label, ...(skill.aliases || [])]).map(normalizeText);
  return terms.some((term) => term && (normalized === term || normalized.includes(term) || term.includes(normalized)));
}

function scoreValue(value) {
  const score = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(score)) return null;
  return Math.max(0, Math.min(10, score));
}

function addSkill(skills, skill) {
  const label = titleCase(skill.label);
  const id = slug(label);
  if (skills.has(id)) return;

  skills.set(id, {
    id,
    label,
    icon: skill.icon || "ti-circle-dot",
    aliases: unique([label, ...(skill.aliases || [])]),
    evidence: [],
  });
}

function stackSkills(profile = {}) {
  const raw = `${profile?.stack || ""},${profile?.position || ""}`;
  return raw
    .split(/[,/|;]+|\band\b/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .map((item) => STACK_LABELS.get(normalizeText(item)) || titleCase(item))
    .filter((item) => !/backend|frontend|full stack|engineer|developer|sde|ii|iii|senior/i.test(item));
}

function topicSkills(topics = []) {
  return topics
    .map((topic) => topic?.cat || topic?.label || topic?.name)
    .filter(Boolean);
}

function findMatchingSkills(skills, text) {
  return Array.from(skills.values()).filter((skill) => skillMatches(skill, text));
}

function appendEvidence(skill, evidence) {
  skill.evidence.push(evidence);
}

function addWeakSpotEvidence(skills, weakSpots = []) {
  weakSpots.forEach((spot) => {
    const text = typeof spot === "string"
      ? spot
      : [spot?.topic, spot?.label, spot?.detail, spot?.reason, spot?.correction].filter(Boolean).join(" ");
    const matches = findMatchingSkills(skills, text);

    matches.forEach((skill) => appendEvidence(skill, {
      type: "weakSpot",
      label: "Weak spot",
      detail: String(text || "Needs review").trim(),
      weight: -2,
    }));
  });
}

function addMockScoreEvidence(skills, mockScores = []) {
  mockScores.forEach((entry) => {
    const score = scoreValue(typeof entry === "number" ? entry : entry?.score ?? entry?.value);
    if (score === null) return;

    const topicText = typeof entry === "number"
      ? "general mock"
      : [entry?.topic, entry?.cat, entry?.sub, entry?.skill, entry?.label, entry?.question].filter(Boolean).join(" ");
    const matches = findMatchingSkills(skills, topicText);
    const targetSkills = matches.length ? matches : Array.from(skills.values()).filter((skill) => ["system-design", "behavioral", "dsa"].includes(skill.id));

    targetSkills.forEach((skill) => appendEvidence(skill, {
      type: "mockScore",
      label: "Mock score",
      detail: `${score}/10${topicText && topicText !== "general mock" ? ` in ${topicText}` : ""}`,
      score,
      weight: score >= 8 ? 2 : score >= 5 ? 1 : -2,
    }));
  });
}

function attemptsFromQuestion(question = {}) {
  if (Array.isArray(question.attempts)) return question.attempts;
  if (typeof question.lastScore === "number") return [{ score: question.lastScore }];
  if (typeof question.bestScore === "number") return [{ score: question.bestScore }];
  return [];
}

function addQuestionMemoryEvidence(skills, questionMemory = {}) {
  Object.entries(questionMemory?.questions || {}).forEach(([questionId, question]) => {
    const text = [question?.topic, question?.stack, question?.question, questionId].filter(Boolean).join(" ");
    const matches = findMatchingSkills(skills, text);
    if (!matches.length) return;

    const attempts = attemptsFromQuestion(question);
    const scores = attempts.map((attempt) => scoreValue(attempt?.score)).filter((score) => score !== null);
    const status = String(question?.status || "").trim();
    const bestScore = scores.length ? Math.max(...scores) : scoreValue(question?.bestScore);
    const latestScore = scores.length ? scores[scores.length - 1] : scoreValue(question?.lastScore);

    matches.forEach((skill) => appendEvidence(skill, {
      type: "questionMemory",
      label: "Question memory",
      detail: status || `${question?.topic || skill.label} practice`,
      score: latestScore,
      bestScore,
      attemptCount: attempts.length || Number(question?.attemptCount || 0),
      mastered: status === "Mastered",
      weak: status === "Needs Review",
      weight: status === "Mastered" || (bestScore ?? 0) >= 8 ? 2 : status === "Needs Review" || (latestScore ?? 10) <= 4 ? -1 : 1,
    }));
  });
}

function statusFromEvidence(evidence) {
  if (!evidence.length) return "New";

  const hasWeak = evidence.some((item) => item.type === "weakSpot" || item.weak || (item.score ?? 10) <= 4);
  if (hasWeak) return "Weak";

  const strongSignals = evidence.filter((item) => item.mastered || (item.score ?? 0) >= 8 || (item.bestScore ?? 0) >= 8).length;
  const improvingSignals = evidence.filter((item) => (item.score ?? 0) >= 5 || item.attemptCount > 0 || item.weight > 0).length;

  if (strongSignals >= 2) return "Mastered";
  if (strongSignals === 1) return "Strong";
  if (improvingSignals > 0) return "Improving";
  return "Weak";
}

function statusScore(status) {
  return {
    New: 0,
    Weak: 25,
    Improving: 55,
    Strong: 78,
    Mastered: 100,
  }[status] ?? 0;
}

function nextActionFor(node) {
  if (node.status === "Mastered") return `Keep ${node.label} warm with one follow-up drill.`;
  if (node.status === "Strong") return `Prove ${node.label} with a deeper follow-up and trade-off.`;
  if (node.status === "Improving") return `Run one timed ${node.label} practice rep and compare against the ideal answer.`;
  if (node.status === "Weak") return `Review ${node.label}, then retry with examples, edge cases, and metrics.`;
  return `Start one focused ${node.label} primer and save the first practice result.`;
}

export function buildSkillGraph({
  profile = {},
  topics = [],
  weakSpots = [],
  mockScores = [],
  questionMemory = {},
} = {}) {
  const skills = new Map();

  CORE_SKILLS.forEach((skill) => addSkill(skills, skill));
  topicSkills(topics).forEach((label) => addSkill(skills, { label }));
  stackSkills(profile).forEach((label) => addSkill(skills, { label }));

  addWeakSpotEvidence(skills, weakSpots);
  addMockScoreEvidence(skills, mockScores);
  addQuestionMemoryEvidence(skills, questionMemory);

  const nodes = Array.from(skills.values()).map((skill) => {
    const status = statusFromEvidence(skill.evidence);
    const node = {
      id: skill.id,
      label: skill.label,
      icon: skill.icon,
      status,
      score: statusScore(status),
      evidence: clone(skill.evidence).slice(0, 5),
    };

    node.nextAction = nextActionFor(node);
    return node;
  });

  const focusNode = nodes.find((node) => node.status === "Weak")
    || nodes.find((node) => node.status === "Improving")
    || nodes.find((node) => node.status === "New")
    || nodes[0];

  const sortedNodes = [...nodes];
  const priority = { Weak: 0, Improving: 1, New: 2, Strong: 3, Mastered: 4 };
  sortedNodes.sort((left, right) => {
    const statusDelta = priority[left.status] - priority[right.status];
    return statusDelta || left.label.localeCompare(right.label);
  });

  const summary = {
    total: nodes.length,
    byStatus: Object.fromEntries(SKILL_GRAPH_STATUSES.map((status) => [status, 0])),
    masteredPercent: 0,
  };

  sortedNodes.forEach((node) => {
    summary.byStatus[node.status] += 1;
  });
  summary.masteredPercent = summary.total ? Math.round((summary.byStatus.Mastered / summary.total) * 100) : 0;

  return {
    nodes: sortedNodes,
    summary,
    focusPrompt: focusNode
      ? `Skill Graph focus: practice ${focusNode.label}. ${focusNode.nextAction}`
      : "Skill Graph focus: add profile, mock, or question evidence to build your map.",
  };
}
