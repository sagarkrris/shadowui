import { deriveMistakeBank } from "./prepInsights.mjs";

export const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";

const REVIEW_INTERVALS = [1, 3, 7];

const SKILLS = [
  { name: "Java", aliases: ["java", "jvm"], category: "Backend" },
  { name: "Spring Boot", aliases: ["spring boot", "spring", "springboot"], category: "Backend" },
  { name: "React", aliases: ["react", "next.js", "nextjs", "frontend"], category: "Frontend" },
  { name: "Node.js", aliases: ["node", "node.js", "express", "nestjs"], category: "Backend" },
  { name: "Python", aliases: ["python", "django", "fastapi", "flask"], category: "Backend" },
  { name: "SQL", aliases: ["sql", "mysql", "oracle", "database", "relational"], category: "Databases" },
  { name: "PostgreSQL", aliases: ["postgres", "postgresql"], category: "Databases" },
  { name: "MongoDB", aliases: ["mongo", "mongodb", "nosql"], category: "Databases" },
  { name: "AWS", aliases: ["aws", "lambda", "s3", "ecs"], category: "Cloud" },
  { name: "Docker", aliases: ["docker", "container", "kubernetes", "k8s"], category: "DevOps" },
  { name: "SAP", aliases: ["sap", "abap", "s/4hana", "hana", "fiori", "odata"], category: "Enterprise" },
  { name: "Ruby", aliases: ["ruby", "rails", "ruby on rails", "rspec"], category: "Backend" },
  { name: "Rust", aliases: ["rust", "tokio", "axum", "actix", "cargo"], category: "Systems" },
  { name: "System Design", aliases: ["system design", "hld", "architecture", "scalability"], category: "Architecture" },
  { name: "Caching", aliases: ["cache", "caching", "redis"], category: "Architecture" },
  { name: "Message Queues", aliases: ["queue", "queues", "kafka", "rabbitmq", "sqs"], category: "Architecture" },
  { name: "Testing", aliases: ["test", "testing", "junit", "mockito", "pytest", "jest", "rspec"], category: "Quality" },
  { name: "Security", aliases: ["security", "oauth", "jwt", "auth", "authentication"], category: "Security" },
  { name: "DSA", aliases: ["dsa", "algorithms", "data structures", "dynamic programming"], category: "Algorithms" },
  { name: "CI/CD", aliases: ["ci/cd", "cicd", "jenkins", "github actions", "deployment"], category: "DevOps" },
  { name: "Observability", aliases: ["observability", "logging", "metrics", "tracing", "monitoring"], category: "Operations" },
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateOnly(dateValue)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(left, right) {
  const leftDate = new Date(`${dateOnly(left)}T00:00:00.000Z`);
  const rightDate = new Date(`${dateOnly(right)}T00:00:00.000Z`);
  return Math.round((leftDate - rightDate) / 86400000);
}

function titleize(value) {
  return String(value || "")
    .split(/[^a-zA-Z0-9+#/]+/)
    .filter(Boolean)
    .map((part) => {
      if (/^(api|sql|dsa|aws|sap|jpa|jwt|ci|cd)$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function skillMatches(skill, text) {
  return skill.aliases.some((alias) => normalize(text).includes(normalize(alias)));
}

function expectedSkills({ profile, topics }) {
  const text = [
    profile?.position,
    profile?.stack,
    ...(topics || []).flatMap((topic) => [topic.cat, ...(topic.subs || [])]),
  ].join(" ");
  const expected = SKILLS.filter((skill) => skillMatches(skill, text));

  return expected.length
    ? expected
    : SKILLS.filter((skill) => ["System Design", "Testing", "Security", "DSA"].includes(skill.name));
}

export function analyzeResumeGaps({ resumeText = "", profile = {}, topics = [] } = {}) {
  const text = normalize(resumeText);
  const expected = expectedSkills({ profile, topics });
  const matchedSkills = expected.filter((skill) => skillMatches(skill, text));
  const missingSkills = expected.filter((skill) => !skillMatches(skill, text));
  const score = expected.length ? Math.round((matchedSkills.length / expected.length) * 100) : 0;
  const displayName = profile?.name || "Candidate";
  const targetRole = profile?.position || "Target role";
  const practicePlan = missingSkills.slice(0, 6).map((skill, index) => ({
    id: `gap-${normalize(skill.name).replace(/[^a-z0-9]+/g, "-")}`,
    title: `${index + 1}. Close ${skill.name} gap`,
    focus: skill.category,
    prompt: `Help ${displayName} close a resume gap for ${targetRole}: ${skill.name}. Start with a short concept check, then ask one practical interview question and score my answer.`,
  }));

  return {
    score,
    targetRole,
    matchedSkills: matchedSkills.map(({ name, category }) => ({ name, category })),
    missingSkills: missingSkills.map(({ name, category }) => ({ name, category })),
    practicePlan,
    summary: score >= 75
      ? "Resume is aligned with the target role. Use mocks to sharpen proof points."
      : "Resume has visible gaps against the target role. Prioritize the plan below before mocks.",
  };
}

function reviewKey(topic) {
  return normalize(topic).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildSpacedReviewQueue({ messages = [], reviewHistory = {}, now = new Date() } = {}) {
  const today = dateOnly(now);
  const mistakeBank = deriveMistakeBank(messages);

  return mistakeBank.map((mistake) => {
    const key = reviewKey(mistake.topic);
    const history = reviewHistory[key] || {};
    const completedCount = Number.isFinite(history.completedCount) ? history.completedCount : 0;
    const intervalDays = REVIEW_INTERVALS[Math.min(completedCount, REVIEW_INTERVALS.length - 1)];
    const baseDate = dateOnly(history.lastReviewedAt) || today;
    const dueDate = addDays(baseDate, intervalDays);
    const daysUntil = diffDays(dueDate, today);

    return {
      id: key,
      topic: mistake.topic,
      correction: mistake.correction,
      retryPrompt: mistake.retryPrompt,
      intervalDays,
      dueDate,
      daysUntil,
      status: daysUntil <= 0 ? "due" : "scheduled",
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil || a.topic.localeCompare(b.topic));
}

export function markReviewComplete(reviewHistory = {}, topic, reviewedAt = new Date()) {
  const key = reviewKey(topic);
  const previous = reviewHistory[key] || {};

  return {
    ...reviewHistory,
    [key]: {
      completedCount: (previous.completedCount || 0) + 1,
      lastReviewedAt: new Date(reviewedAt).toISOString(),
    },
  };
}

export function normalizeInterviewEvent(value = {}) {
  return {
    id: value.id || `interview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    company: String(value.company || "").trim().slice(0, 80),
    role: String(value.role || "").trim().slice(0, 100),
    date: dateOnly(value.date) || dateOnly(new Date()),
    round: String(value.round || "Recruiter Screen").trim().slice(0, 80),
    status: ["scheduled", "completed", "waiting", "offer", "rejected"].includes(value.status) ? value.status : "scheduled",
    notes: String(value.notes || "").trim().slice(0, 400),
  };
}

export function buildInterviewTrackerSummary(events = [], todayValue = new Date()) {
  const today = dateOnly(todayValue);
  const normalized = events
    .map(normalizeInterviewEvent)
    .filter((event) => event.company && event.role)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = normalized
    .filter((event) => event.status === "scheduled" && diffDays(event.date, today) >= 0)
    .map((event) => ({ ...event, daysUntil: diffDays(event.date, today) }));

  return {
    total: normalized.length,
    upcomingCount: upcoming.length,
    completedCount: normalized.filter((event) => event.status === "completed").length,
    next: upcoming[0] || null,
    events: normalized,
  };
}

export function recordActivityDate(dates = [], value = new Date()) {
  const day = dateOnly(value);
  return Array.from(new Set([...dates.map(dateOnly).filter(Boolean), day])).sort();
}

function countCurrentStreak(dates, todayValue) {
  const set = new Set(dates);
  let current = dateOnly(todayValue);
  let count = 0;

  while (set.has(current)) {
    count += 1;
    current = addDays(current, -1);
  }

  return count;
}

function countLongestStreak(dates) {
  let longest = 0;
  let current = 0;
  let previous = null;

  dates.forEach((date) => {
    current = previous && diffDays(date, previous) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  });

  return longest;
}

export function buildPracticeStreak(activityDates = [], { today = new Date(), reviewedCount = 0, interviewCount = 0 } = {}) {
  const dates = Array.from(new Set(activityDates.map(dateOnly).filter(Boolean))).sort();
  const activeDays = dates.length;
  const currentStreak = countCurrentStreak(dates, today);
  const longestStreak = countLongestStreak(dates);
  const xp = activeDays * 20 + reviewedCount * 10 + interviewCount * 5;

  return {
    activeDays,
    currentStreak,
    longestStreak,
    xp,
    level: Math.max(1, Math.floor(xp / 100) + 1),
  };
}
