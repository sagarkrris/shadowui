export const PREP_OS_STORAGE_KEY = "interviewiq.prepOS.v1";

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function displayName(profile = {}) {
  return cleanText(profile.name, "Candidate");
}

function targetRole(profile = {}) {
  return cleanText(profile.position, "target role");
}

function firstTopic(topics = []) {
  return topics.find((topic) => cleanText(topic?.cat))?.cat || "Core interview prep";
}

function firstSubtopic(topics = [], index = 0) {
  const flattened = topics.flatMap((topic) => Array.isArray(topic?.subs) ? topic.subs : []);
  return cleanText(flattened[index], firstTopic(topics));
}

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function daysUntil(date, now) {
  const start = new Date(`${dateOnly(now)}T00:00:00.000Z`);
  const end = new Date(`${dateOnly(date)}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function average(values = []) {
  const scores = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  if (!scores.length) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function normalizeWeakSpot(spot, index) {
  const topic = cleanText(spot?.topic || spot?.name || spot?.title || spot, "");
  if (!topic) return null;

  return {
    id: cleanText(spot?.id, `weak-${index + 1}`),
    topic,
    source: "weak-spot",
    status: cleanText(spot?.status, "Needs Review"),
    lastScore: typeof spot?.lastScore === "number" ? spot.lastScore : null,
    due: spot?.due !== false,
    dueDate: cleanText(spot?.dueDate || spot?.reviewDate, ""),
  };
}

function normalizeQuestionMemory(questionMemory = {}) {
  const questions = Array.isArray(questionMemory?.entries)
    ? questionMemory.entries
    : Object.values(questionMemory?.questions || {});

  return questions.map((question, index) => ({
    id: cleanText(question?.questionId || question?.id, `question-${index + 1}`),
    topic: cleanText(question?.topic || question?.stack || question?.question, ""),
    source: "question-memory",
    status: cleanText(question?.status, "New"),
    lastScore: typeof question?.lastScore === "number" ? question.lastScore : null,
    due: Boolean(question?.dueForReview || question?.status === "Needs Review" || (typeof question?.lastScore === "number" && question.lastScore <= 5)),
    dueDate: cleanText(question?.dueDate || question?.lastSeenAt, ""),
  })).filter((question) => question.topic);
}

function getWeakTopicsDue({ weakSpots = [], questionMemory = {}, now = new Date() } = {}) {
  const today = dateOnly(now);
  const dueFromWeakSpots = weakSpots
    .map(normalizeWeakSpot)
    .filter(Boolean)
    .filter((item) => item.due || !item.dueDate || item.dueDate <= today);
  const dueFromMemory = normalizeQuestionMemory(questionMemory)
    .filter((item) => item.due || (item.dueDate && item.dueDate <= today));
  const seen = new Set();

  return [...dueFromWeakSpots, ...dueFromMemory].filter((item) => {
    const key = item.topic.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function getUpcomingInterview(interviews = [], now = new Date()) {
  const today = dateOnly(now);
  return interviews
    .filter((item) => item?.status !== "completed" && cleanText(item?.date) && item.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date))[0] || null;
}

function buildInterviewRisks({ upcoming, weakTopicsDue, topics, mockScores, now }) {
  const risks = [];
  const scoreAverage = average(mockScores.slice(-3));

  if (upcoming) {
    const days = daysUntil(upcoming.date, now);
    risks.push({
      id: "upcoming-interview",
      label: `${upcoming.company || "Upcoming company"} ${upcoming.round || "interview"}`,
      level: days !== null && days <= 3 ? "high" : "medium",
      detail: days === 0 ? "Scheduled today" : days === 1 ? "1 day left" : `${days ?? "Soon"} days left`,
    });
  }

  if (weakTopicsDue.length) {
    risks.push({
      id: "weak-topic-load",
      label: `${weakTopicsDue[0].topic} needs a rep`,
      level: weakTopicsDue.length >= 3 ? "high" : "medium",
      detail: `${weakTopicsDue.length} weak ${weakTopicsDue.length === 1 ? "topic is" : "topics are"} due today`,
    });
  }

  if (scoreAverage !== null && scoreAverage < 7) {
    risks.push({
      id: "mock-score",
      label: "Mock score below ready range",
      level: "medium",
      detail: `Recent average ${Math.round(scoreAverage * 10) / 10}/10`,
    });
  }

  if (!risks.length) {
    risks.push({
      id: "baseline",
      label: `${firstTopic(topics)} coverage not proven yet`,
      level: "low",
      detail: "Start one scored mock to create a local readiness signal.",
    });
  }

  return risks.slice(0, 4);
}

function topProofStory(proofStories = []) {
  if (!proofStories.length) {
    return {
      title: "Proof story needed",
      result: "Add one STAR story with measurable impact.",
      prompt: "Create a concise STAR proof story for my next interview. Ask me for missing metrics before drafting the result.",
    };
  }

  return [...proofStories].sort((left, right) => {
    const leftMetrics = Array.isArray(left?.impactMetrics) ? left.impactMetrics.length : 0;
    const rightMetrics = Array.isArray(right?.impactMetrics) ? right.impactMetrics.length : 0;
    return rightMetrics - leftMetrics;
  })[0];
}

function buildWhy({ profile, topics, weakTopicsDue, upcoming, mockScores, topStory }) {
  const reasons = [];
  const scoreAverage = average(mockScores.slice(-3));

  if (upcoming) {
    reasons.push(`${upcoming.company} ${upcoming.round || "interview"} is scheduled for ${upcoming.date}.`);
  }

  if (weakTopicsDue.length) {
    reasons.push(`${weakTopicsDue[0].topic} is the highest-priority local weak signal due today.`);
  } else {
    reasons.push(`${firstSubtopic(topics)} is the next clean starting point for ${targetRole(profile)} prep.`);
  }

  reasons.push(scoreAverage === null
    ? "No scored mock trend exists yet, so one focused mock will create a baseline."
    : `Recent mock average is ${Math.round(scoreAverage * 10) / 10}/10, so today's rep should be scored.`);

  reasons.push(topStory?.title === "Proof story needed"
    ? "A proof story is still missing, so behavioral follow-ups need evidence."
    : `${topStory.title} is the strongest saved proof story to reuse in follow-ups.`);

  return reasons;
}

export function buildPrepOSDashboard({
  profile = {},
  topics = [],
  weakSpots = [],
  mockScores = [],
  questionMemory = {},
  proofStories = [],
  interviews = [],
  now = new Date(),
} = {}) {
  const name = displayName(profile);
  const weakTopicsDue = getWeakTopicsDue({ weakSpots, questionMemory, now });
  const upcoming = getUpcomingInterview(interviews, now);
  const focusTopic = weakTopicsDue[0]?.topic || firstSubtopic(topics);
  const companyContext = upcoming?.company ? `${upcoming.company} ${upcoming.round || "interview"}` : firstTopic(topics);
  const story = topProofStory(proofStories);
  const practiceNow = {
    topic: focusTopic,
    label: `Practice ${focusTopic}`,
    detail: upcoming
      ? `Protect the ${upcoming.round || "interview"} signal for ${upcoming.company}.`
      : `Build today's strongest signal for ${targetRole(profile)} interviews.`,
    prompt: `PrepOS Today for ${name}: drill "${focusTopic}" for ${targetRole(profile)}. Ask one realistic interview question, wait for my answer, then score it and give one precise improvement.`,
  };
  const nextMock = {
    label: upcoming ? `${upcoming.company} ${upcoming.round || "mock"}` : `${focusTopic} scored mock`,
    focus: focusTopic,
    company: upcoming?.company || "",
    round: upcoming?.round || "Mock interview",
    prompt: `Start my next PrepOS mock for ${name}. Context: ${companyContext}. Focus on ${focusTopic}. Ask one realistic question, wait for my answer, then score correctness, depth, examples, trade-offs, communication clarity, and follow-up readiness.`,
  };

  return {
    title: "PrepOS Today",
    practiceNow,
    whyItMatters: buildWhy({ profile, topics, weakTopicsDue, upcoming, mockScores, topStory: story }),
    interviewRisks: buildInterviewRisks({ upcoming, weakTopicsDue, topics, mockScores, now }),
    weakTopicsDue,
    topStory: story,
    nextMock,
  };
}

function milestone(id, label, status, detail, action) {
  return { id, label, status, detail, action };
}

export function buildSmartPrepTimeline({
  profile = {},
  topics = [],
  weakSpots = [],
  mockScores = [],
  questionMemory = {},
  proofStories = [],
  interviews = [],
  resumeAnalysis = null,
  jobDescriptionAnalysis = null,
  finalPack = null,
  now = new Date(),
} = {}) {
  const profileComplete = Boolean(cleanText(profile.name) && cleanText(profile.position) && cleanText(profile.stack));
  const upcoming = getUpcomingInterview(interviews, now);
  const weakTopicsDue = getWeakTopicsDue({ weakSpots, questionMemory, now });
  const memoryEntries = normalizeQuestionMemory(questionMemory);
  const masteredCount = memoryEntries.filter((entry) => entry.status === "Mastered").length;
  const hasTopics = Boolean(firstSubtopic(topics, ""));
  const finalPackReady = Boolean(finalPack?.ready || finalPack?.generatedAt);
  const milestones = [
    milestone(
      "profile",
      "Profile ready",
      profileComplete ? "complete" : "active",
      profileComplete ? `${targetRole(profile)} target and stack are set.` : "Add target role and stack to personalize prep.",
      "Update profile",
    ),
    milestone(
      "resume",
      "Resume uploaded",
      resumeAnalysis ? "complete" : profileComplete ? "active" : "pending",
      resumeAnalysis ? `Resume match is ${resumeAnalysis.score ?? "tracked"}%.` : "Resume gaps are ready after upload.",
      "Analyze resume",
    ),
    milestone(
      "jd",
      "JD matched",
      jobDescriptionAnalysis ? "complete" : resumeAnalysis ? "active" : "pending",
      jobDescriptionAnalysis ? `JD match is ${jobDescriptionAnalysis.score ?? "tracked"}%.` : `Compare against ${firstTopic(topics)} requirements.`,
      "Analyze JD",
    ),
    milestone(
      "mock",
      "Mock baseline",
      mockScores.length ? "complete" : hasTopics ? "active" : "pending",
      mockScores.length ? `${mockScores.length} scored mock${mockScores.length === 1 ? "" : "s"} captured.` : "Run one scored mock to create a baseline.",
      "Start mock",
    ),
    milestone(
      "weak-spots",
      "Weak spots due",
      weakTopicsDue.length ? "active" : mockScores.length ? "complete" : "pending",
      weakTopicsDue.length ? `${weakTopicsDue[0].topic} is due today.` : "No weak spot is due right now.",
      "Review weak spots",
    ),
    milestone(
      "questions-mastered",
      "Questions mastered",
      masteredCount >= 3 ? "complete" : masteredCount > 0 ? "active" : "pending",
      masteredCount ? `${masteredCount} question${masteredCount === 1 ? "" : "s"} mastered.` : "Mark practice questions as mastered.",
      "Open practice pack",
    ),
    milestone(
      "stories",
      "Stories saved",
      proofStories.length >= 2 ? "complete" : proofStories.length ? "active" : "pending",
      proofStories.length ? `${proofStories.length} proof stor${proofStories.length === 1 ? "y" : "ies"} saved.` : "Save STAR stories for behavioral follow-ups.",
      "Add proof story",
    ),
    milestone(
      "interview-scheduled",
      "Interview scheduled",
      upcoming ? "complete" : "pending",
      upcoming ? `${upcoming.company} ${upcoming.round || "interview"} on ${upcoming.date}.` : "Add company, round, and date.",
      "Schedule interview",
    ),
    milestone(
      "final-pack",
      "Final pack",
      finalPackReady ? "complete" : upcoming ? "active" : "pending",
      finalPackReady ? "Final interview pack is ready." : "Generate warmups, risks, stories, and last reps.",
      "Build final pack",
    ),
  ];
  const completed = milestones.filter((item) => item.status === "complete").length;

  return {
    title: "Smart Prep Timeline",
    completed,
    total: milestones.length,
    next: milestones.find((item) => item.status === "active") || milestones.find((item) => item.status === "pending") || milestones[milestones.length - 1],
    milestones,
  };
}
