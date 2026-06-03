import {
  buildScenarioMockPrompt,
  createScenarioBankProgress,
  listScenarioSeeds,
} from "./scenarioBank.mjs";
import { buildCanvasReviewPrompt, createSystemDesignCanvasState } from "./systemDesignCanvas.mjs";

export const INTERVIEW_MISSION_CONTROL_STORAGE_KEY = "interviewiq:mission-control:v1";
export const INTERVIEW_MISSION_CONTROL_STORAGE_VERSION = 1;

const DATABASE_ENGINE_ALIASES = [
  { key: "postgresql", label: "PostgreSQL", pattern: /postgre|postgres|pgsql/i },
  { key: "mysql", label: "MySQL", pattern: /mysql/i },
  { key: "mongodb", label: "MongoDB", pattern: /mongo/i },
  { key: "redis", label: "Redis", pattern: /redis/i },
];

function todayKey(now = new Date()) {
  if (typeof now === "string") return now.slice(0, 10);
  if (now instanceof Date && !Number.isNaN(now.valueOf())) return now.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function cleanText(value) {
  return String(value || "").trim();
}

function stackText(profile = {}) {
  return [
    profile.stack,
    profile.primaryStack,
    profile.targetRole,
    profile.role,
    profile.experience,
  ].filter(Boolean).join(" ");
}

export function inferMissionDatabaseEngine(profile = {}) {
  const text = stackText(profile);
  return DATABASE_ENGINE_ALIASES.find((engine) => engine.pattern.test(text)) || DATABASE_ENGINE_ALIASES[0];
}

export function createMissionControlState(value = {}) {
  const completedByDay = value?.completedByDay && typeof value.completedByDay === "object"
    ? Object.fromEntries(
      Object.entries(value.completedByDay).map(([day, ids]) => [
        String(day).slice(0, 10),
        Array.isArray(ids) ? [...new Set(ids.filter(Boolean).map(String))] : [],
      ]),
    )
    : {};

  return {
    version: INTERVIEW_MISSION_CONTROL_STORAGE_VERSION,
    completedByDay,
  };
}

export function recordMissionCompletion(state = createMissionControlState(), missionId, { today = todayKey() } = {}) {
  const current = createMissionControlState(state);
  const id = cleanText(missionId);
  if (!id) return current;

  const day = todayKey(today);
  const currentIds = current.completedByDay[day] || [];
  return createMissionControlState({
    ...current,
    completedByDay: {
      ...current.completedByDay,
      [day]: [...new Set([...currentIds, id])],
    },
  });
}

function scenarioPriority(scenario, progress, weakSpots = []) {
  const scenarioProgress = progress.scenarios[scenario.id];
  let score = scenarioProgress?.needsReview ? 0 : scenarioProgress?.mastered ? 20 : 5;
  const haystack = `${scenario.topic} ${scenario.title} ${scenario.prompt}`.toLowerCase();

  weakSpots.forEach((spot, index) => {
    const normalized = cleanText(spot).toLowerCase();
    if (normalized && haystack.includes(normalized)) score -= 8 - Math.min(index, 5);
  });

  return score;
}

function pickScenario(filters, progress, weakSpots = []) {
  const seeds = listScenarioSeeds(filters);
  return [...seeds].sort((left, right) => (
    scenarioPriority(left, progress, weakSpots) - scenarioPriority(right, progress, weakSpots)
    || left.title.localeCompare(right.title)
  ))[0] || null;
}

function hasCanvasNotes(canvasState) {
  if (cleanText(canvasState.problem)) return true;
  return Object.values(canvasState.sections || {}).some((value) => cleanText(value));
}

function withCompletion(mission, completedIds) {
  return {
    ...mission,
    completed: completedIds.includes(mission.id),
  };
}

export function buildInterviewMissionControl({
  profile = {},
  topics = [],
  weakSpots = [],
  scenarioProgress = createScenarioBankProgress(),
  missionState = createMissionControlState(),
  systemDesignCanvas = {},
  today = todayKey(),
} = {}) {
  const progress = createScenarioBankProgress(scenarioProgress);
  const state = createMissionControlState(missionState);
  const day = todayKey(today);
  const completedIds = state.completedByDay[day] || [];
  const databaseEngine = inferMissionDatabaseEngine(profile);
  const javaScenario = pickScenario({ track: "java", difficulty: "Senior" }, progress, weakSpots);
  const databaseScenario = pickScenario({ track: "database", engine: databaseEngine.key, difficulty: "Senior" }, progress, weakSpots);
  const canvasState = createSystemDesignCanvasState(systemDesignCanvas);
  const focusTopic = cleanText(weakSpots[0]) || cleanText(topics[0]?.sub || topics[0]?.cat || topics[0]) || "core interview fundamentals";

  const missions = [
    javaScenario && {
      id: `java:${javaScenario.id}`,
      lane: "java",
      icon: "ti-cup",
      title: `Java scenario: ${javaScenario.title}`,
      detail: "Practice one production-style Java answer with diagnosis, trade-offs, and follow-ups.",
      workspaceId: "scenarioBank",
      workspaceLabel: "Scenario Bank",
      actionLabel: "Start Java mock",
      prompt: buildScenarioMockPrompt(javaScenario, { track: "java", difficulty: javaScenario.difficulty, mode: "Mock Interview" }),
      evidence: javaScenario.interviewerIntent,
    },
    databaseScenario && {
      id: `database:${databaseScenario.id}`,
      lane: "database",
      icon: "ti-database",
      title: `${databaseEngine.label} scenario: ${databaseScenario.title}`,
      detail: "Sharpen the selected database track with query, scaling, consistency, and operations judgment.",
      workspaceId: "scenarioBank",
      workspaceLabel: "Scenario Bank",
      actionLabel: "Start DB mock",
      prompt: buildScenarioMockPrompt(databaseScenario, {
        track: "database",
        engine: databaseEngine.key,
        difficulty: databaseScenario.difficulty,
        mode: "Mock Interview",
      }),
      evidence: databaseScenario.interviewerIntent,
    },
    hasCanvasNotes(canvasState)
      ? {
        id: "systemDesign:canvas-review",
        lane: "systemDesign",
        icon: "ti-schema",
        title: `System design review: ${cleanText(canvasState.problem) || "Current canvas"}`,
        detail: "Convert your Canvas notes into a senior-interviewer critique with missing depth and next improvements.",
        workspaceId: "canvas",
        workspaceLabel: "System Canvas",
        actionLabel: "Review canvas",
        prompt: buildCanvasReviewPrompt(canvasState),
        evidence: "Uses your existing Canvas and Studio notes as the source material.",
      }
      : {
        id: "dsa:pattern-refresh",
        lane: "systemDesign",
        icon: "ti-binary-tree",
        title: "DSA pattern refresh",
        detail: `Use DSA Lab to tighten ${focusTopic} before the next scored mock.`,
        workspaceId: "dsaLab",
        workspaceLabel: "DSA Lab",
        actionLabel: "Start pattern mock",
        prompt: `Run a focused DSA interview drill on ${focusTopic}. Ask one realistic question, wait for my answer, then score correctness, pattern recognition, dry run, edge cases, code readiness, and communication clarity.`,
        evidence: "No active system design canvas notes yet, so the mission shifts to pattern readiness.",
      },
  ].filter(Boolean).map((mission) => withCompletion(mission, completedIds));

  const completedToday = missions.filter((mission) => mission.completed).length;

  return {
    title: "Interview Mission Control",
    subtitle: "Three next-best actions from your stack, weak spots, scenario progress, and design notes.",
    day,
    databaseEngine: databaseEngine.key,
    missions,
    summary: {
      total: missions.length,
      completedToday,
      remainingToday: Math.max(0, missions.length - completedToday),
      weakSpot: focusTopic,
    },
  };
}
