import { deriveMistakeBank } from "./prepInsights.mjs";

export const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";
export const TOOLKIT_ARTIFACT_VERSION_LIMIT = 12;

const REVIEW_INTERVALS = [1, 3, 7];

export function recordArtifactVersion(history = [], text = "", { savedAt = new Date().toISOString() } = {}) {
  const value = String(text || "").trim();
  if (!value) return Array.isArray(history) ? history : [];
  const previous = Array.isArray(history) ? history : [];
  if (previous[0]?.text === value) return previous;
  return [{ savedAt, text: value }, ...previous].slice(0, TOOLKIT_ARTIFACT_VERSION_LIMIT);
}

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

const RESUME_EVIDENCE_STOP_ALIASES = new Set([
  "frontend",
  "relational",
  "auth",
]);

const ROLE_EXPECTATIONS = [
  { pattern: /full\s*stack|fullstack|mern|mean/i, names: ["React", "Node.js", "SQL", "System Design", "Testing", "Security", "DSA"] },
  { pattern: /front\s*end|frontend|ui|web/i, names: ["React", "Testing", "Security", "DSA"] },
  { pattern: /back\s*end|backend|api|server/i, names: ["SQL", "System Design", "Testing", "Security", "DSA"] },
  { pattern: /senior|lead|staff|principal/i, names: ["System Design", "Testing", "Security", "DSA", "Observability"] },
  { pattern: /software\s+engineer|developer/i, names: ["Testing", "Security", "DSA"] },
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeDateInput(value) {
  const text = String(value || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return "";

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return text;
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

function uniqueSkills(skills) {
  const byName = new Map();

  skills.forEach((skill) => {
    if (!byName.has(skill.name)) byName.set(skill.name, skill);
  });

  return Array.from(byName.values());
}

function skillsByName(names) {
  const wanted = new Set(names);
  return SKILLS.filter((skill) => wanted.has(skill.name));
}

function skillMatches(skill, text, { resumeEvidence = false } = {}) {
  const aliases = resumeEvidence
    ? skill.aliases.filter((alias) => !RESUME_EVIDENCE_STOP_ALIASES.has(normalize(alias)))
    : skill.aliases;

  return aliases.some((alias) => normalize(text).includes(normalize(alias)));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createIssue(severity, title, detail, action) {
  return { severity, title, detail, action };
}

function hasContactSignal(text) {
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text) ||
    /\+?\d[\d\s().-]{7,}\d/.test(text) ||
    /linkedin\.com|github\.com|portfolio|https?:\/\//i.test(text);
}

function hasSection(text, names) {
  const pattern = new RegExp(`(^|\\n)\\s*(${names.join("|")})\\s*(:|\\n|$)`, "i");
  return pattern.test(text);
}

function hasMeasurableImpact(text) {
  return /\b\d+(\.\d+)?\s*(%|percent|x|k|m|million|ms|sec|seconds|users|requests|revenue|cost|latency|throughput|hours|days)\b/i.test(text);
}

function hasActionVerb(text) {
  return /\b(led|owned|built|designed|implemented|delivered|reduced|improved|optimized|migrated|launched|automated|scaled|debugged|mentored)\b/i.test(text);
}

function hasInterviewProof(text) {
  return /\b(system design|architecture|scalability|cache|caching|queue|kafka|observability|metrics|tracing|testing|junit|mockito|security|oauth|jwt|dsa|algorithm|complexity)\b/i.test(text);
}

function buildScoreBreakdown({ rawText, expected, matchedSkills, missingSkills }) {
  const basicsChecks = [
    hasContactSignal(rawText),
    hasSection(rawText, ["experience", "work experience", "employment"]),
    hasSection(rawText, ["skills", "technical skills", "technologies"]),
    hasSection(rawText, ["projects", "project", "experience"]),
  ];
  const contentChecks = [
    hasMeasurableImpact(rawText),
    hasActionVerb(rawText),
    /\b(result|impact|reduced|improved|increased|saved|scaled|latency|revenue|users)\b/i.test(rawText),
    rawText.length >= 420,
  ];
  const roleMatch = expected.length ? (matchedSkills.length / expected.length) * 100 : 0;
  const proofChecks = [
    hasInterviewProof(rawText),
    !missingSkills.some((skill) => skill.name === "System Design"),
    !missingSkills.some((skill) => skill.name === "Testing"),
    !missingSkills.some((skill) => skill.name === "Security"),
  ];

  return [
    {
      id: "ats-basics",
      label: "ATS Basics",
      score: clampScore((basicsChecks.filter(Boolean).length / basicsChecks.length) * 100),
      detail: "Contact signals, recognizable sections, and parseable structure.",
    },
    {
      id: "content-strength",
      label: "Content Strength",
      score: clampScore((contentChecks.filter(Boolean).length / contentChecks.length) * 100),
      detail: "Action verbs, measurable impact, and enough context for strong bullets.",
    },
    {
      id: "role-match",
      label: "Role Match",
      score: clampScore(roleMatch),
      detail: "Coverage against the target role, stack, and selected prep topics.",
    },
    {
      id: "interview-proof",
      label: "Interview Proof",
      score: clampScore((proofChecks.filter(Boolean).length / proofChecks.length) * 100),
      detail: "Evidence for topics interviewers probe beyond keyword matching.",
    },
  ];
}

function buildResumeIssues({ rawText, missingSkills, scoreBreakdown }) {
  const issues = [];

  if (!hasContactSignal(rawText)) {
    issues.push(createIssue(
      "High",
      "Missing clear contact or profile signal",
      "Add email, phone, LinkedIn, GitHub, or portfolio so recruiters and ATS parsers can connect the profile to you.",
      "Place contact details in the first few lines of the resume.",
    ));
  }

  if (!hasMeasurableImpact(rawText)) {
    issues.push(createIssue(
      "High",
      "No quantified impact found",
      "The resume mentions work, but not measurable outcomes like latency, scale, cost, users, revenue, or defect reduction.",
      "Rewrite at least two bullets with a metric and the business or engineering result.",
    ));
  }

  if (missingSkills.length) {
    issues.push(createIssue(
      missingSkills.length > 4 ? "High" : "Medium",
      "Target role proof is incomplete",
      `Missing visible proof for ${missingSkills.slice(0, 5).map((skill) => skill.name).join(", ")}.`,
      "Add project bullets or skills that show hands-on evidence for the highest-priority gaps.",
    ));
  }

  if (!hasInterviewProof(rawText)) {
    issues.push(createIssue(
      "Medium",
      "Interview-critical proof is thin",
      "The resume should show evidence for design, testing, security, scale, or debugging because interviewers will probe those claims.",
      "Add one bullet that explains a design decision, trade-off, production issue, or testing strategy.",
    ));
  }

  const weakCategory = scoreBreakdown.find((item) => item.score < 60);
  if (weakCategory) {
    issues.push(createIssue(
      "Medium",
      `${weakCategory.label} needs work`,
      weakCategory.detail,
      `Improve the ${weakCategory.label.toLowerCase()} section before running mocks.`,
    ));
  }

  return issues.slice(0, 6);
}

function firstResumeBullet(rawText) {
  return rawText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .find((line) => line.length >= 18 && !/^(experience|skills|projects|summary|education)$/i.test(line));
}

function buildRewriteSuggestions({ rawText, missingSkills, profile }) {
  const targetRole = profile?.position || "target role";
  const firstBullet = firstResumeBullet(rawText) || "Worked on application features and fixed issues.";
  const primaryGap = missingSkills[0]?.name || "target role impact";
  const secondaryGap = missingSkills[1]?.name || "quality and scale";

  return [
    {
      id: "impact-bullet",
      title: "Make one bullet measurable",
      original: firstBullet,
      improved: `Improved: Delivered ${primaryGap} work for ${targetRole}, explaining the technical decision, measurable outcome, and production impact.`,
      reason: "Recruiters and interviewers need evidence, not only responsibilities.",
    },
    {
      id: "proof-bullet",
      title: "Add interview proof",
      original: `Missing visible proof for ${primaryGap}.`,
      improved: `Improved: Designed and validated ${primaryGap} with ${secondaryGap}, including trade-offs, testing, and failure handling.`,
      reason: "This gives you a stronger story for follow-up interview questions.",
    },
  ];
}

function buildInterviewProofGaps(missingSkills, profile) {
  const targetRole = profile?.position || "target role";

  return missingSkills.slice(0, 5).map((skill) => ({
    skill: skill.name,
    category: skill.category,
    prompt: `Mock me on the resume gap "${skill.name}" for a ${targetRole}. Ask one practical question, wait for my answer, then score it and suggest a resume bullet that proves this skill.`,
  }));
}

function expectedSkills({ profile, topics }) {
  const text = [
    profile?.position,
    profile?.stack,
    ...(topics || []).flatMap((topic) => [topic.cat, ...(topic.subs || [])]),
  ].join(" ");
  const roleText = [profile?.position, profile?.experience].join(" ");
  const explicit = SKILLS.filter((skill) => skillMatches(skill, text));
  const roleExpected = ROLE_EXPECTATIONS
    .filter((expectation) => expectation.pattern.test(roleText))
    .flatMap((expectation) => skillsByName(expectation.names));
  const expected = uniqueSkills([...explicit, ...roleExpected]);

  return expected.length
    ? expected
    : SKILLS.filter((skill) => ["System Design", "Testing", "Security", "DSA"].includes(skill.name));
}

function skillPriority(skill) {
  const categoryWeight = {
    Architecture: 95,
    Backend: 88,
    Cloud: 82,
    Security: 80,
    Databases: 76,
    Quality: 72,
    Algorithms: 70,
    Frontend: 68,
    DevOps: 64,
  };

  return categoryWeight[skill.category] || 60;
}

function buildJdLikelyQuestions({ requiredSkills, missingSkills, targetRole, displayName }) {
  const prioritySkills = uniqueSkills([...missingSkills, ...requiredSkills]).slice(0, 8);
  const questions = prioritySkills.map((skill, index) => ({
    id: `jd-question-${index + 1}-${normalize(skill.name).replace(/[^a-z0-9]+/g, "-")}`,
    skill: skill.name,
    question: `How would you use ${skill.name} in a ${targetRole} role, and what trade-offs would you call out?`,
    prompt: `JD Copilot for ${displayName}: ask me this likely target-role question about ${skill.name}: "How would you use ${skill.name} in a ${targetRole} role, and what trade-offs would you call out?" Wait for my answer, then score correctness, depth, examples, trade-offs, communication clarity, and follow-up readiness.`,
  }));

  return [
    ...questions,
    {
      id: "jd-question-system-design",
      skill: "Role synthesis",
      question: `Walk me through a realistic ${targetRole} system design scenario using the top requirements from this JD.`,
      prompt: `JD Copilot for ${displayName}: ask a system design question tailored to this target job description, wait for my answer, then review scale, APIs, data model, trade-offs, failure modes, and observability.`,
    },
  ].slice(0, 10);
}

function buildJdResumeRewriteSuggestions({ missingSkills, coveredSkills, targetRole }) {
  const primary = missingSkills[0]?.name || coveredSkills[0]?.name || "role impact";
  const secondary = missingSkills[1]?.name || coveredSkills[1]?.name || "technical depth";

  return [
    {
      id: "jd-proof-headline",
      title: `Add visible ${primary} proof`,
      before: `Missing clear ${primary} evidence for the ${targetRole} JD.`,
      after: `Designed and delivered ${primary} capability for ${targetRole}-level systems, including trade-offs, testing, and measurable production impact.`,
      reason: "The JD needs proof that the skill was applied, not only listed.",
    },
    {
      id: "jd-scope-metric",
      title: "Attach scope and metric",
      before: `Worked on ${secondary}.`,
      after: `Improved ${secondary} across a production workflow, reducing risk or latency with a measurable before/after result.`,
      reason: "Metrics help recruiters and interviewers connect resume claims to business or engineering outcomes.",
    },
  ];
}

function buildJdGapUrgency({ missingSkills, coveredSkills }) {
  return uniqueSkills([...missingSkills, ...coveredSkills])
    .map((skill, index) => ({
      skill: skill.name,
      category: skill.category,
      priority: Math.max(1, skillPriority(skill) - index * 4),
      status: missingSkills.some((missing) => missing.name === skill.name) ? "missing" : "covered",
      action: missingSkills.some((missing) => missing.name === skill.name)
        ? `Prepare one project proof and one mock answer for ${skill.name}.`
        : `Keep ${skill.name} ready with a concise example and trade-off.`,
    }))
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 8);
}

function buildJdCrashPlan({ planSkills, targetRole, displayName }) {
  const templates = [
    ["Role map", "Extract must-have requirements and convert them into a prep checklist."],
    ["Resume proof", "Rewrite one resume bullet so it proves the highest-risk JD gap."],
    ["Concept drill", "Explain the hardest missing skill in plain language, then answer one follow-up."],
    ["Coding/API drill", "Practice a hands-on implementation or API scenario from the role."],
    ["System design", "Connect the JD to architecture, scale, failure modes, and observability."],
    ["Behavioral proof", "Turn the strongest project into a STAR answer for this company/role."],
    ["Final mock", "Run a realistic scored mock using the target JD as the rubric."],
  ];

  return templates.map(([title, detail], index) => {
    const skill = planSkills[index % Math.max(planSkills.length, 1)]?.name || "target role";

    return {
      day: index + 1,
      title,
      focus: skill,
      detail,
      prompt: `JD Copilot day ${index + 1} for ${displayName}: ${detail} Target role: ${targetRole}. Focus on ${skill}. Ask one practical question, wait for my answer, then give Score: X/10, gaps, and next action.`,
    };
  });
}

export function analyzeResumeGaps({ resumeText = "", profile = {}, topics = [] } = {}) {
  const rawText = String(resumeText || "");
  const text = normalize(resumeText);
  const expected = expectedSkills({ profile, topics });
  const matchedSkills = expected.filter((skill) => skillMatches(skill, text, { resumeEvidence: true }));
  const missingSkills = expected.filter((skill) => !skillMatches(skill, text, { resumeEvidence: true }));
  const scoreBreakdown = buildScoreBreakdown({ rawText, expected, matchedSkills, missingSkills });
  const score = clampScore(scoreBreakdown.reduce((sum, item) => sum + item.score, 0) / scoreBreakdown.length);
  const displayName = profile?.name || "Candidate";
  const targetRole = profile?.position || "Target role";
  const practicePlan = missingSkills.slice(0, 6).map((skill, index) => ({
    id: `gap-${normalize(skill.name).replace(/[^a-z0-9]+/g, "-")}`,
    title: `${index + 1}. Close ${skill.name} gap`,
    focus: skill.category,
    prompt: `Help ${displayName} close a resume gap for ${targetRole}: ${skill.name}. Start with a short concept check, then ask one practical interview question and score my answer.`,
  }));
  const issues = buildResumeIssues({
    rawText,
    missingSkills,
    scoreBreakdown,
  });

  return {
    score,
    scoreBreakdown,
    targetRole,
    matchedSkills: matchedSkills.map(({ name, category }) => ({ name, category })),
    missingSkills: missingSkills.map(({ name, category }) => ({ name, category })),
    issues,
    rewriteSuggestions: buildRewriteSuggestions({ rawText, missingSkills, profile }),
    interviewProofGaps: buildInterviewProofGaps(missingSkills, profile),
    practicePlan,
    summary: score >= 75
      ? "Resume is aligned with the target role. Use mocks to sharpen proof points."
      : "Resume has visible gaps against the target role. Prioritize the plan below before mocks.",
  };
}

export function analyzeJobDescriptionFit({
  jobDescriptionText = "",
  resumeText = "",
  profile = {},
  topics = [],
} = {}) {
  const jobText = normalize(jobDescriptionText);
  if (!jobText.trim()) {
    return {
      score: 0,
      targetRole: profile?.position || "Target role",
      requiredSkills: [],
      coveredSkills: [],
      missingSkills: [],
      practicePlan: [],
      mustKnowSkills: [],
      likelyQuestions: [],
      resumeRewriteSuggestions: [],
      gapUrgency: [],
      crashPlan: [],
      summary: "Paste a target job description to compare it with your resume and prep plan.",
    };
  }

  const targetRole = profile?.position || "Target role";
  const requiredFromJob = uniqueSkills([
    ...SKILLS.filter((skill) => skillMatches(skill, jobText)),
    ...ROLE_EXPECTATIONS
      .filter((expectation) => expectation.pattern.test(jobText))
      .flatMap((expectation) => skillsByName(expectation.names)),
  ]);
  const requiredFallback = expectedSkills({ profile, topics }).filter((skill) => skillMatches(skill, jobText) || requiredFromJob.length === 0);
  const requiredSkills = uniqueSkills([...requiredFromJob, ...requiredFallback]).slice(0, 12);
  const evidenceText = normalize(resumeText);
  const coveredSkills = requiredSkills.filter((skill) => skillMatches(skill, evidenceText, { resumeEvidence: true }));
  const missingSkills = requiredSkills.filter((skill) => !skillMatches(skill, evidenceText, { resumeEvidence: true }));
  const score = requiredSkills.length ? clampScore((coveredSkills.length / requiredSkills.length) * 100) : 0;
  const displayName = profile?.name || "Candidate";
  const planSkills = (missingSkills.length ? missingSkills : requiredSkills).slice(0, 6);
  const mustKnowSource = uniqueSkills([...missingSkills, ...requiredSkills])
    .sort((left, right) => skillPriority(right) - skillPriority(left))
    .slice(0, 6);
  const practicePlan = planSkills.map((skill, index) => ({
    id: `jd-gap-${normalize(skill.name).replace(/[^a-z0-9]+/g, "-")}`,
    title: `${index + 1}. Mock ${skill.name} from the target role`,
    focus: skill.category,
    prompt: `Use this target job description to mock ${displayName} for ${targetRole}. Focus on the missing requirement "${skill.name}". Ask one realistic role-specific question, wait for my answer, then show Your Answer, Ideal Answer, Improved Version, score, and follow-up readiness.`,
  }));
  const mustKnowSkills = mustKnowSource.map(({ name, category }) => ({
    name,
    category,
    status: missingSkills.some((skill) => skill.name === name) ? "missing" : "covered",
    priority: skillPriority({ name, category }),
  }));
  const likelyQuestions = buildJdLikelyQuestions({ requiredSkills, missingSkills, targetRole, displayName });
  const resumeRewriteSuggestions = buildJdResumeRewriteSuggestions({ missingSkills, coveredSkills, targetRole });
  const gapUrgency = buildJdGapUrgency({ missingSkills, coveredSkills });
  const crashPlan = buildJdCrashPlan({ planSkills: planSkills.length ? planSkills : requiredSkills, targetRole, displayName });

  return {
    score,
    targetRole,
    requiredSkills: requiredSkills.map(({ name, category }) => ({ name, category })),
    coveredSkills: coveredSkills.map(({ name, category }) => ({ name, category })),
    missingSkills: missingSkills.map(({ name, category }) => ({ name, category })),
    practicePlan,
    mustKnowSkills,
    likelyQuestions,
    resumeRewriteSuggestions,
    gapUrgency,
    crashPlan,
    summary: score >= 75
      ? "Strong match against the target job description. Use role-specific mocks to sharpen evidence."
      : "Target job description has gaps against your current resume evidence. Prioritize the missing requirements below.",
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
    date: normalizeDateInput(value.date),
    round: String(value.round || "Recruiter Screen").trim().slice(0, 80),
    status: ["scheduled", "completed", "waiting", "offer", "rejected"].includes(value.status) ? value.status : "scheduled",
    notes: String(value.notes || "").trim().slice(0, 400),
  };
}

export function validateInterviewDraft(value = {}, { today = new Date() } = {}) {
  const company = String(value.company || "").trim();
  const role = String(value.role || "").trim();
  const date = normalizeDateInput(value.date);
  const todayInput = dateOnly(today);
  const status = ["completed", "offer", "rejected"].includes(value.status) ? value.status : "scheduled";

  if (!company) return { ok: false, message: "Company is required." };
  if (!role) return { ok: false, message: "Role is required." };
  if (!String(value.date || "").trim()) return { ok: false, message: "Interview date is required." };
  if (!date) return { ok: false, message: "Enter a valid interview date." };
  if (status && todayInput && date < todayInput) return { ok: false, message: "Interview date cannot be in the past." };

  return { ok: true, message: "" };
}

export function buildInterviewTrackerSummary(events = [], todayValue = new Date()) {
  const today = dateOnly(todayValue);
  const normalized = events
    .map(normalizeInterviewEvent)
    .filter((event) => event.company && event.role && event.date)
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
