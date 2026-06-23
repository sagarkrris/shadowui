import { analyzeInterviewRecordingTranscript, buildInterviewRecordingReviewPrompt } from "./interviewRecordingReview.mjs";
import { getCompanyPrep } from "./companyPrep.mjs";
import {
  buildDailyPrepPlan,
  buildGuidedPrepMissions,
  buildInterviewDayPack,
  buildOfferReadinessScore,
  deriveAnswerQualityHeatmap,
  deriveMockReplayTimelines,
  deriveProofVaultStories,
  deriveWeakSpotRadar,
} from "./prepInsights.mjs";

export const OFFER_WAR_ROOM_STORAGE_KEY = "interviewiq.offerWarRoom.v1";
export const OFFER_WAR_ROOM_STORAGE_VERSION = 1;

const DEFAULT_COMPANIES = ["Amazon", "Google", "Microsoft", "Startup"];
const ROUND_ORDER = ["Recruiter", "Coding", "System Design", "Hiring Manager", "Bar Raiser"];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values = []) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function preview(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function uniq(items = []) {
  return Array.from(new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)));
}

function parseCompanyTargets(raw = "") {
  const parsed = uniq(String(raw || "")
    .split(/[,\n]/)
    .map((item) => item.trim()))
    .slice(0, 8);

  return parsed.length ? parsed : DEFAULT_COMPANIES;
}

export function createOfferWarRoomState(state = {}) {
  return {
    companyTargets: typeof state.companyTargets === "string"
      ? state.companyTargets
      : DEFAULT_COMPANIES.join(", "),
    roleLevel: state.roleLevel || "Mid",
    selectedCompany: state.selectedCompany || "Amazon",
    speechTranscript: state.speechTranscript || "",
    speechQuestion: state.speechQuestion || "Tell me about a time you took ownership of a production issue.",
  };
}

export function buildOfferWarRoomOverview({
  profile = null,
  topics = [],
  weakSpots = [],
  mockScores = [],
  messages = [],
  resumeAnalysis = null,
  jobDescriptionAnalysis = null,
  interviews = [],
  companyTargets = [],
} = {}) {
  const proofStories = deriveProofVaultStories(messages, profile);
  const offerReadiness = buildOfferReadinessScore({
    resumeAnalysis,
    jobDescriptionAnalysis,
    mockScores,
    weakSpots,
    proofStories,
    companyPrepScore: interviews.length ? 72 : 40,
  });
  const heatmap = deriveAnswerQualityHeatmap(messages);
  const recentAverage = average(mockScores.slice(-5));
  const nextCompany = companyTargets[0] || interviews[0]?.company || "your next company";

  return {
    score: offerReadiness.score,
    label: offerReadiness.label,
    strongest: heatmap.strongest?.label || "No signal yet",
    weakest: heatmap.weakest?.label || weakSpots[0] || "No signal yet",
    recentAverage: recentAverage === null ? null : Math.round(recentAverage * 10) / 10,
    nextCompany,
    mission: recentAverage === null
      ? `Start one scored mock loop for ${nextCompany} so the war room can calibrate your true readiness.`
      : `Your next lift comes from improving ${heatmap.weakest?.label || weakSpots[0] || "the weakest signal"} before the next ${nextCompany} round.`,
  };
}

export function buildCompanyWarLanes({
  companies = [],
  role = "target role",
  roleLevel = "Mid",
  weakSpots = [],
  messages = [],
} = {}) {
  return companies.map((company, index) => {
    const prep = getCompanyPrep(company);
    const behavioral = prep.behavioral?.[0] || "Tell me about a time you took ownership.";
    const dsa = prep.dsa?.[0];
    const system = prep.systemDesign?.[0];
    const weakFocus = weakSpots[index % Math.max(weakSpots.length, 1)] || (dsa?.title || "core fundamentals");

    return {
      id: company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      company: prep.company,
      summary: prep.isSeeded
        ? `Seeded public prep patterns for ${prep.company}.`
        : `Generic lane with public-source links and reusable interview patterns for ${prep.company}.`,
      focusAreas: [
        dsa?.title || "Coding fundamentals",
        system?.title || "System design trade-offs",
        preview(behavioral, "Behavioral ownership"),
      ],
      dailyPrompt: [
        `Build today's ${prep.company} interview war plan for a ${roleLevel} ${role}.`,
        `Weak focus: ${weakFocus}.`,
        `Coding pattern: ${dsa?.prompt || "Use one arrays/hash map problem with edge-case discussion."}`,
        `System design pattern: ${system?.prompt || "Use one scalable backend design question."}`,
        `Behavioral anchor: ${behavioral}`,
        "Return a one-day company-specific plan with coding, behavioral, system design, and final interview questions to ask.",
      ].join("\n"),
      loopPrompt: [
        `Run a full interview loop for ${prep.company} as a ${roleLevel} ${role}.`,
        `Use this coding theme: ${dsa?.title || "Coding fundamentals"}.`,
        `Use this design theme: ${system?.title || "System design trade-offs"}.`,
        `Use this behavioral theme: ${behavioral}.`,
        "Go round by round: recruiter, coding, system design, hiring manager, bar raiser. Ask one question at a time and score every round.",
      ].join("\n"),
      sourceLinks: prep.resources || [],
      prep,
      proofStories: deriveProofVaultStories(messages, { position: role }),
    };
  });
}

export function buildMockLoopPlan({
  company = "Amazon",
  role = "target role",
  roleLevel = "Mid",
  weakSpots = [],
  selectedCat = "",
  selectedSub = "",
} = {}) {
  const focus = weakSpots[0] || selectedSub || selectedCat || "core interview fundamentals";

  const rounds = ROUND_ORDER.map((round, index) => ({
    id: `${company}-${round}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    round,
    pressure: index < 2 ? "medium" : index === 2 ? "high" : "very high",
    objective:
      round === "Recruiter" ? "Show fit, motivation, and concise communication." :
      round === "Coding" ? "Solve clearly, communicate assumptions, and handle follow-up pressure." :
      round === "System Design" ? "Show trade-offs, scale, failure handling, and observability." :
      round === "Hiring Manager" ? "Show leadership, ownership, and judgment." :
      "Defend decisions, metrics, and trade-offs without getting vague.",
    prompt: [
      `Run the ${round} round for ${company}.`,
      `Candidate target: ${roleLevel} ${role}.`,
      `Weak focus: ${focus}.`,
      `Round objective: ${round === "Recruiter" ? "motivation, communication, and role fit" : round === "Coding" ? "clarity, correctness, edge cases, and follow-ups" : round === "System Design" ? "requirements, architecture, bottlenecks, trade-offs, and rollout" : round === "Hiring Manager" ? "leadership, ambiguity handling, and decision quality" : "bar-raiser depth, metrics, and hard trade-off defense"}.`,
      "Ask one question at a time, wait for my answer, then score correctness, depth, communication, and follow-up readiness before moving on.",
    ].join("\n"),
  }));

  return {
    company,
    role,
    roleLevel,
    rounds,
  };
}

export function buildInterviewDaySimulator({
  company = "Amazon",
  role = "target role",
  roleLevel = "Mid",
  weakSpots = [],
  selectedCat = "",
  selectedSub = "",
} = {}) {
  const loop = buildMockLoopPlan({
    company,
    role,
    roleLevel,
    weakSpots,
    selectedCat,
    selectedSub,
  });
  const priorityWeakness = weakSpots[0] || selectedSub || selectedCat || "general interview readiness";

  const runbook = loop.rounds.map((round, index) => ({
    ...round,
    slot: index + 1,
    durationMinutes: round.round === "Coding" ? 45 : round.round === "System Design" ? 45 : 30,
    successSignal:
      round.round === "Recruiter" ? "Clear pitch, role fit, and calm communication." :
      round.round === "Coding" ? "Correct solution, strong communication, good edge-case handling." :
      round.round === "System Design" ? "Trade-offs, scale, failures, and rollout are all covered." :
      round.round === "Hiring Manager" ? "Leadership, ownership, and judgment feel believable." :
      "Decisions survive pressure, metrics questions, and alternative-path challenges.",
  }));

  return {
    company,
    role,
    roleLevel,
    weaknessToWatch: priorityWeakness,
    runbook,
    fullDayPrompt: [
      `Run a complete interview-day simulator for ${company}.`,
      `Candidate target: ${roleLevel} ${role}.`,
      `Highest-risk weakness to watch: ${priorityWeakness}.`,
      "Sequence the day as recruiter, coding, system design, hiring manager, and bar raiser.",
      "Ask one question at a time, wait for each answer, score each round, keep continuity across rounds, and finish with a final offer-readiness report.",
      "The final report must include: overall hire signal, strongest round, weakest round, likely failure point, and the top three actions before the next interview.",
    ].join("\n"),
    finalReportPrompt: [
      `Generate a final interview-day report for ${company}.`,
      `Candidate target: ${roleLevel} ${role}.`,
      `Highest-risk weakness: ${priorityWeakness}.`,
      "Assume the interview day included recruiter, coding, system design, hiring manager, and bar raiser rounds.",
      "Return: round-by-round scorecard, overall hire signal, strongest signal, weakest signal, likely rejection reason, strongest offer-conversion advice, and a 48-hour repair plan.",
    ].join("\n"),
  };
}

export function buildStoryVault({
  messages = [],
  profile = null,
  jobDescriptionAnalysis = null,
} = {}) {
  const stories = deriveProofVaultStories(messages, profile);
  const jdSkills = uniq((jobDescriptionAnalysis?.missingSkills || []).map((item) => item.name || item));

  return stories.map((story, index) => ({
    ...story,
    bestFor: jdSkills.length
      ? jdSkills.slice(index, index + 2).join(", ") || jdSkills[0]
      : story.skillsProven?.join(", ") || "Behavioral proof",
    pressurePrompt: [
      `Pressure test this story for an interview.`,
      `Story title: ${story.title}.`,
      `Situation: ${story.situation}.`,
      `Task: ${story.task}.`,
      `Action: ${story.action}.`,
      `Result: ${story.result}.`,
      "Ask me the story, then hit me with follow-ups on ownership, trade-offs, metrics, and what I would do differently now.",
    ].join("\n"),
  }));
}

export function buildWeakSpotRevengeMode({
  messages = [],
  weakSpots = [],
} = {}) {
  const radar = deriveWeakSpotRadar(messages, weakSpots);
  const top = radar.highestRisk || radar.categories[0];

  return {
    summary: radar.summary,
    categories: radar.categories,
    topCategory: top,
    revengePrompt: [
      "Run Weak-Spot Revenge Mode.",
      `Highest-risk weakness: ${top?.label || "Interview fundamentals"}.`,
      `Correction: ${top?.correction || "Lead with the answer, add trade-offs, and be concrete."}`,
      "Ask three increasingly hard questions on this weakness. After each answer, explain exactly what still sounds weak and how to repair it.",
    ].join("\n"),
  };
}

export function buildSpeechWarCoach({
  transcript = "",
  question = "",
  role = "",
  durationMs = 0,
} = {}) {
  const review = analyzeInterviewRecordingTranscript(transcript, { durationMs });
  return {
    review,
    prompt: buildInterviewRecordingReviewPrompt(review, { question, role }),
  };
}

export function buildOfferWarRoomModel({
  state = {},
  profile = null,
  topics = [],
  weakSpots = [],
  mockScores = [],
  messages = [],
  selectedCat = "",
  selectedSub = "",
  careerToolkitState = {},
} = {}) {
  const normalizedState = createOfferWarRoomState(state);
  const companies = parseCompanyTargets(normalizedState.companyTargets);
  const overview = buildOfferWarRoomOverview({
    profile,
    topics,
    weakSpots,
    mockScores,
    messages,
    resumeAnalysis: careerToolkitState.resumeAnalysis,
    jobDescriptionAnalysis: careerToolkitState.jobDescriptionAnalysis,
    interviews: careerToolkitState.interviews || [],
    companyTargets: companies,
  });
  const companyLanes = buildCompanyWarLanes({
    companies,
    role: profile?.position || "target role",
    roleLevel: normalizedState.roleLevel,
    weakSpots,
    messages,
  });
  const mockLoop = buildMockLoopPlan({
    company: normalizedState.selectedCompany || companies[0] || "Amazon",
    role: profile?.position || "target role",
    roleLevel: normalizedState.roleLevel,
    weakSpots,
    selectedCat,
    selectedSub,
  });
  const interviewDaySimulator = buildInterviewDaySimulator({
    company: normalizedState.selectedCompany || companies[0] || "Amazon",
    role: profile?.position || "target role",
    roleLevel: normalizedState.roleLevel,
    weakSpots,
    selectedCat,
    selectedSub,
  });
  const storyVault = buildStoryVault({
    messages,
    profile,
    jobDescriptionAnalysis: careerToolkitState.jobDescriptionAnalysis,
  });
  const revengeMode = buildWeakSpotRevengeMode({
    messages,
    weakSpots,
  });
  const dayPack = buildInterviewDayPack({
    profile,
    topics,
    interviews: careerToolkitState.interviews || [],
    jobDescriptionAnalysis: careerToolkitState.jobDescriptionAnalysis,
    proofStories: storyVault,
    weakSpots,
  });
  const dailyPlan = buildDailyPrepPlan({
    profile,
    topics,
    weakSpots,
    mockScores,
    interviews: careerToolkitState.interviews || [],
  });
  const missionBoard = buildGuidedPrepMissions({
    profile,
    topics,
    weakSpots,
    mockScores,
    interviews: careerToolkitState.interviews || [],
    resumeAnalysis: careerToolkitState.resumeAnalysis,
    jobDescriptionAnalysis: careerToolkitState.jobDescriptionAnalysis,
    proofStories: storyVault,
    activityDates: careerToolkitState.activityDates,
  });
  const replay = deriveMockReplayTimelines(messages);
  const speechCoach = buildSpeechWarCoach({
    transcript: normalizedState.speechTranscript,
    question: normalizedState.speechQuestion,
    role: profile?.position || "target role",
    durationMs: 0,
  });

  return {
    state: normalizedState,
    companies,
    overview,
    companyLanes,
    mockLoop,
    interviewDaySimulator,
    storyVault,
    revengeMode,
    dayPack,
    dailyPlan,
    missionBoard,
    replay,
    speechCoach,
  };
}
