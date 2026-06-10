import { buildMasteryMap } from "./questionMemory.mjs";
import { createSystemDesignCanvasState } from "./systemDesignCanvas.mjs";

const MAX_REPLAY_ITEMS = 6;
const MAX_ACTIVITY_EVENTS = 80;
const VERSION = 1;
export const PREP_PROGRESS_STORAGE_KEY = "interviewiq.prepProgressBrain.v1";
export const PREP_PROGRESS_STORAGE_VERSION = VERSION;
export const BEGINNER_STEPS = ["watch", "predict", "explain", "practice", "review"];

function cleanText(value) {
  return String(value || "").trim();
}

function nowIso(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeBeginnerStep(stepId) {
  return BEGINNER_STEPS.includes(stepId) ? stepId : BEGINNER_STEPS[0];
}

function normalizeWorkspaceId(value) {
  const id = cleanText(value);
  return id || "chat";
}

function normalizeActivityEvent(event = {}, index = 0) {
  const workspaceId = normalizeWorkspaceId(event.workspaceId);
  const type = cleanText(event.type) || "activity";
  const label = cleanText(event.label) || `${workspaceId} activity`;
  const happenedAt = nowIso(event.happenedAt);
  const id = cleanText(event.id) || `${workspaceId}:${type}:${happenedAt}:${index}`;

  return {
    id,
    workspaceId,
    type,
    label,
    detail: cleanText(event.detail),
    happenedAt,
  };
}

export function createPrepProgressState(value = {}) {
  const events = Array.isArray(value?.events)
    ? value.events.map(normalizeActivityEvent).slice(-MAX_ACTIVITY_EVENTS)
    : [];

  return {
    version: VERSION,
    beginnerStep: normalizeBeginnerStep(value?.beginnerStep),
    events,
  };
}

export function recordPrepActivity(state = createPrepProgressState(), event = {}) {
  const current = createPrepProgressState(state);
  const nextEvent = normalizeActivityEvent(event, current.events.length);

  return createPrepProgressState({
    ...current,
    events: [...current.events, nextEvent].slice(-MAX_ACTIVITY_EVENTS),
  });
}

export function recordBeginnerStep(state = createPrepProgressState(), stepId) {
  const current = createPrepProgressState(state);

  return createPrepProgressState({
    ...current,
    beginnerStep: normalizeBeginnerStep(stepId),
  });
}

export function nextBeginnerStep(stepId) {
  const index = BEGINNER_STEPS.indexOf(normalizeBeginnerStep(stepId));
  return BEGINNER_STEPS[Math.min(BEGINNER_STEPS.length - 1, index + 1)];
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasCanvasWork(systemDesignCanvas = {}) {
  const canvas = createSystemDesignCanvasState(systemDesignCanvas);
  return Boolean(cleanText(canvas.problem)) || Object.values(canvas.sections || {}).some((value) => cleanText(value));
}

function average(values = []) {
  const numeric = values.filter((value) => Number.isFinite(value));
  if (!numeric.length) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function scoreToStatus(score) {
  if (score >= 80) return "Strong";
  if (score >= 55) return "Improving";
  if (score > 0) return "Needs Review";
  return "New";
}

function lane(id, label, icon, score, detail, workspaceId, actionLabel = "Open") {
  const normalizedScore = clampScore(score);

  return {
    id,
    label,
    icon,
    score: normalizedScore,
    status: scoreToStatus(normalizedScore),
    detail,
    workspaceId,
    actionLabel,
  };
}

function extractReplayTitle(content = "") {
  const text = cleanText(content).replace(/\s+/g, " ");
  if (!text) return "Practice activity";
  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
}

function scoreFromMessage(content = "") {
  const match = String(content || "").match(/score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  return match ? Math.max(0, Math.min(10, Number(match[1]))) : null;
}

function buildMessageReplay(messages = []) {
  const replay = [];

  messages.forEach((message, index) => {
    if (message?.role !== "assistant") return;
    const score = scoreFromMessage(message.content);
    const previous = messages[index - 1];
    if (score === null && !/gaps:|improved version:|follow[- ]?up/i.test(String(message.content || ""))) return;

    replay.push({
      id: `mock-${index}`,
      type: "Mock Review",
      title: extractReplayTitle(previous?.content || "Scored interview answer"),
      score: score === null ? null : score,
      status: score === null ? "Reviewed" : score >= 8 ? "Strong" : score >= 5 ? "Improving" : "Needs Review",
      detail: score === null ? "Reviewed answer feedback and follow-up actions." : `Scored ${score}/10. Review gaps before the next mock.`,
    });
  });

  return replay;
}

function buildQuestionReplay(masteryMap = {}) {
  return (masteryMap.entries || [])
    .filter((entry) => entry.attemptCount > 0)
    .sort((left, right) => String(right.lastSeenAt || "").localeCompare(String(left.lastSeenAt || "")))
    .slice(0, MAX_REPLAY_ITEMS)
    .map((entry) => ({
      id: `question-${entry.questionId}`,
      type: "Question Memory",
      title: entry.question || entry.questionId,
      score: entry.lastScore,
      status: entry.status,
      detail: entry.dueForReview ? "Due for spaced review." : `${entry.attemptCount} attempt${entry.attemptCount === 1 ? "" : "s"} recorded.`,
    }));
}

function buildActivityReplay(events = []) {
  return events
    .slice(-MAX_REPLAY_ITEMS)
    .map((event) => ({
      id: `activity-${event.id}`,
      type: "Workspace Activity",
      title: event.label,
      score: null,
      status: event.type === "mock" ? "Practice" : event.type === "review" ? "Review" : "Active",
      detail: event.detail || `${event.workspaceId} ${event.type}`,
      happenedAt: event.happenedAt,
    }));
}

export function buildPracticeReplayTimeline({ messages = [], masteryMap = {}, activityEvents = [] } = {}) {
  return [...buildMessageReplay(messages), ...buildQuestionReplay(masteryMap), ...buildActivityReplay(activityEvents)]
    .slice(-MAX_REPLAY_ITEMS)
    .reverse();
}

export function buildBeginnerGuidedPath(progress = {}, beginnerStep = "watch") {
  const weakSpot = cleanText(progress.summary?.weakSpot) || "core interview basics";
  const weakestLane = [...(progress.lanes || [])].sort((left, right) => left.score - right.score)[0];
  const visualWorkspace = weakestLane?.workspaceId || "dsaLab";
  const activeStep = normalizeBeginnerStep(beginnerStep);

  return [
    {
      id: "watch",
      label: "Watch",
      icon: "ti-player-play",
      workspaceId: visualWorkspace,
      actionLabel: "Open visual",
      prompt: "",
      detail: `Watch one visual explanation for ${weakSpot}.`,
    },
    {
      id: "predict",
      label: "Predict",
      icon: "ti-eye-question",
      workspaceId: "dsaLab",
      actionLabel: "Predict step",
      prompt: "",
      detail: "Pause before the next move and say what changes.",
    },
    {
      id: "explain",
      label: "Explain",
      icon: "ti-message-2",
      workspaceId: "scenarioBank",
      actionLabel: "Start explain",
      prompt: `Coach me as an entry-level candidate. Ask me to explain ${weakSpot} in simple words, then score clarity, edge cases, and trade-offs.`,
      detail: "Explain the invariant or trade-off in plain English.",
    },
    {
      id: "practice",
      label: "Practice",
      icon: "ti-target-arrow",
      workspaceId: "scenarioBank",
      actionLabel: "Practice",
      prompt: `Run one beginner-friendly mock drill on ${weakSpot}. Ask one question, wait for my answer, then give a simple score and next step.`,
      detail: "Answer one realistic question with the beginner structure.",
    },
    {
      id: "review",
      label: "Review",
      icon: "ti-refresh-dot",
      workspaceId: "chat",
      actionLabel: "Review",
      prompt: `Review my last practice attempt for ${weakSpot}. Give me one mistake, one improved answer, and one next drill.`,
      detail: "Turn the miss into tomorrow's next drill.",
    },
  ].map((step) => ({
    ...step,
    active: step.id === activeStep,
    completed: BEGINNER_STEPS.indexOf(step.id) < BEGINNER_STEPS.indexOf(activeStep),
  }));
}

function countActivities(events = []) {
  return events.reduce((counts, event) => {
    counts[event.workspaceId] = (counts[event.workspaceId] || 0) + 1;
    return counts;
  }, {});
}

function activityBoost(count) {
  return Math.min(18, (count || 0) * 6);
}

export function buildDailyPrepPlanMarkdown(progress = {}) {
  const lines = [
    `# InterviewIQ Daily Prep Plan`,
    "",
    `Readiness: ${progress.readinessScore || 0}%`,
    `Focus: ${progress.summary?.weakSpot || "core interview fundamentals"}`,
    "",
    "## Beginner Path",
    ...(progress.beginnerPath || []).map((step, index) => `${index + 1}. ${step.label}: ${step.detail}`),
    "",
    "## Workspace Lanes",
    ...(progress.lanes || []).map((lane) => `- ${lane.label}: ${lane.score}% (${lane.status}) - ${lane.detail}`),
    "",
    "## Replay",
    ...((progress.replay || []).length
      ? progress.replay.map((item) => `- ${item.type}: ${item.title} (${item.status})`)
      : ["- No replay items yet. Start one drill or mock."]),
  ];

  return lines.join("\n");
}

export function buildUnifiedPrepProgress({
  profile = {},
  weakSpots = [],
  mockScores = [],
  questionMemory = {},
  systemDesignCanvas = {},
  messages = [],
  beginnerMode = false,
  prepProgressState = createPrepProgressState(),
} = {}) {
  const progressState = createPrepProgressState(prepProgressState);
  const activityCounts = countActivities(progressState.events);
  const masteryMap = buildMasteryMap(questionMemory);
  const mastered = masteryMap.summary.byStatus.Mastered || 0;
  const improving = masteryMap.summary.byStatus.Improving || 0;
  const needsReview = masteryMap.summary.byStatus["Needs Review"] || 0;
  const attempted = masteryMap.entries.filter((entry) => entry.attemptCount > 0).length;
  const mockAverage = average(mockScores);
  const weakSpotCount = Array.isArray(weakSpots) ? weakSpots.length : 0;
  const canvasReady = hasCanvasWork(systemDesignCanvas);
  const roleReady = cleanText(profile.stack || profile.position || profile.targetRole) ? 1 : 0;
  const questionScore = masteryMap.summary.total
    ? ((mastered * 100) + (improving * 65) + (needsReview * 35)) / masteryMap.summary.total
    : 0;
  const mockScore = mockAverage ? mockAverage * 10 : 0;
  const readinessScore = clampScore(
    (questionScore * 0.35)
    + (mockScore * 0.25)
    + (canvasReady ? 15 : 0)
    + (roleReady ? 10 : 0)
    + Math.max(0, 15 - weakSpotCount * 3),
  );
  const weakSpot = cleanText(weakSpots?.[0]) || (needsReview ? "due review questions" : "core interview fundamentals");
  const lanes = [
    lane("dsa", "DSA", "ti-binary-tree", (attempted ? Math.min(100, questionScore + 12) : 20) + activityBoost(activityCounts.dsaLab), `${attempted} practice question${attempted === 1 ? "" : "s"} attempted. ${activityCounts.dsaLab || 0} DSA event${activityCounts.dsaLab === 1 ? "" : "s"}.`, "dsaLab", "Open DSA"),
    lane("scenario", "Scenario", "ti-database-search", (mockScores.length ? mockScore : 30) + activityBoost(activityCounts.scenarioBank), `${mockScores.length} scored mock${mockScores.length === 1 ? "" : "s"} found. ${activityCounts.scenarioBank || 0} scenario event${activityCounts.scenarioBank === 1 ? "" : "s"}.`, "scenarioBank", "Open scenarios"),
    lane("company", "Company", "ti-building", Math.max(25, 75 - weakSpotCount * 8) + activityBoost(activityCounts.company), weakSpotCount ? `${weakSpotCount} weak spot${weakSpotCount === 1 ? "" : "s"} to close. ${activityCounts.company || 0} company event${activityCounts.company === 1 ? "" : "s"}.` : `No repeated weak spot detected. ${activityCounts.company || 0} company event${activityCounts.company === 1 ? "" : "s"}.`, "company", "Open company"),
    lane("java", "Java", "ti-cup", (cleanText(profile.stack).match(/java|spring/i) ? 68 : 42) + activityBoost(activityCounts.javaDigest), cleanText(profile.stack).match(/java|spring/i) ? `Stack signal detected for Java drills. ${activityCounts.javaDigest || 0} Java event${activityCounts.javaDigest === 1 ? "" : "s"}.` : `Use Java Digest when Java/Spring appears in target role. ${activityCounts.javaDigest || 0} Java event${activityCounts.javaDigest === 1 ? "" : "s"}.`, "javaDigest", "Open Java"),
    lane("systemDesign", "System Design", "ti-schema", (canvasReady ? 72 : 28) + activityBoost(activityCounts.canvas), canvasReady ? `Canvas notes are ready for review. ${activityCounts.canvas || 0} canvas event${activityCounts.canvas === 1 ? "" : "s"}.` : `Capture requirements and architecture notes. ${activityCounts.canvas || 0} canvas event${activityCounts.canvas === 1 ? "" : "s"}.`, "canvas", "Open canvas"),
  ];
  const progress = {
    title: "Unified Progress Brain",
    subtitle: "One coaching layer for DSA, scenarios, company prep, Java drills, and system design.",
    readinessScore,
    beginnerMode: Boolean(beginnerMode),
    beginnerStep: progressState.beginnerStep,
    summary: {
      weakSpot,
      attempted,
      mastered,
      dueForReview: masteryMap.summary.dueForReview,
      mockAverage: mockAverage ? Number(mockAverage.toFixed(1)) : 0,
      replayCount: messages.length,
      activityCount: progressState.events.length,
    },
    lanes,
    replay: buildPracticeReplayTimeline({ messages, masteryMap, activityEvents: progressState.events }),
  };

  return {
    ...progress,
    beginnerPath: buildBeginnerGuidedPath(progress, progressState.beginnerStep),
    dailyPlanMarkdown: buildDailyPrepPlanMarkdown({
      ...progress,
      beginnerPath: buildBeginnerGuidedPath(progress, progressState.beginnerStep),
    }),
  };
}
