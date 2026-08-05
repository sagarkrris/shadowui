export const INTERVIEW_SESSION_VERSION = 1;

export const INTERVIEW_SESSION_STATES = Object.freeze({
  IDLE: "idle",
  QUESTION: "question",
  ANSWER: "answer",
  FOLLOW_UP: "follow-up",
  SCORE: "score",
  REVIEW: "review",
  COMPLETE: "complete",
});

const TRANSITIONS = Object.freeze({
  idle: ["question"],
  question: ["answer", "complete"],
  answer: ["follow-up", "score", "complete"],
  "follow-up": ["answer", "score", "complete"],
  score: ["review", "question", "complete"],
  review: ["question", "complete"],
  complete: ["question", "idle"],
});

function clean(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function nowIso(value = new Date()) {
  return new Date(value).toISOString();
}

function id(value, fallback) {
  return clean(value, fallback);
}

export function createInterviewSession(input = {}) {
  const startedAt = nowIso(input.startedAt || new Date());
  return {
    version: INTERVIEW_SESSION_VERSION,
    id: id(input.id, `session-${Date.now()}`),
    state: INTERVIEW_SESSION_STATES.IDLE,
    mode: clean(input.mode, "strict"),
    round: clean(input.round, "coding"),
    panel: clean(input.panel, "seniorEngineer"),
    profile: input.profile && typeof input.profile === "object" ? input.profile : null,
    startedAt,
    updatedAt: nowIso(input.updatedAt || startedAt),
    currentQuestionId: null,
    turns: [],
    summary: null,
  };
}

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

function transition(session, nextState) {
  if (!canTransition(session.state, nextState)) {
    throw new Error(`Invalid interview transition: ${session.state} -> ${nextState}`);
  }
  return { ...session, state: nextState, updatedAt: nowIso() };
}

export function startInterviewQuestion(session, question = {}) {
  const next = transition(session, INTERVIEW_SESSION_STATES.QUESTION);
  const turn = {
    id: id(question.id, `turn-${next.turns.length + 1}`),
    questionId: id(question.questionId, "generated"),
    question: clean(question.question, "Interview question"),
    answer: "",
    followUp: "",
    score: null,
    review: null,
    createdAt: nowIso(),
  };
  return { ...next, currentQuestionId: turn.id, turns: [...next.turns, turn] };
}

function updateCurrentTurn(session, update) {
  return {
    ...session,
    turns: session.turns.map((turn) => turn.id === session.currentQuestionId ? { ...turn, ...update } : turn),
    updatedAt: nowIso(),
  };
}

export function submitInterviewAnswer(session, answer) {
  if (session.state !== INTERVIEW_SESSION_STATES.QUESTION && session.state !== INTERVIEW_SESSION_STATES.FOLLOW_UP) {
    throw new Error(`Cannot submit an answer while interview is ${session.state}`);
  }
  const next = transition(session, session.state === INTERVIEW_SESSION_STATES.QUESTION ? INTERVIEW_SESSION_STATES.ANSWER : INTERVIEW_SESSION_STATES.ANSWER);
  return updateCurrentTurn(next, { answer: clean(answer) });
}

export function addInterviewFollowUp(session, followUp) {
  const next = transition(session, INTERVIEW_SESSION_STATES.FOLLOW_UP);
  return updateCurrentTurn(next, { followUp: clean(followUp) });
}

export function scoreInterviewTurn(session, score = {}) {
  const next = transition(session, INTERVIEW_SESSION_STATES.SCORE);
  const normalizedScore = Number(score.value ?? score.score);
  return updateCurrentTurn(next, {
    score: {
      value: Number.isFinite(normalizedScore) ? Math.max(0, Math.min(10, normalizedScore)) : null,
      confidence: clean(score.confidence, "insufficient-evidence"),
      strengths: Array.isArray(score.strengths) ? score.strengths.map(String).slice(0, 8) : [],
      gaps: Array.isArray(score.gaps) ? score.gaps.map(String).slice(0, 8) : [],
      recommendations: Array.isArray(score.recommendations) ? score.recommendations.map(String).slice(0, 8) : [],
    },
  });
}

export function reviewInterviewTurn(session, review = {}) {
  const next = transition(session, INTERVIEW_SESSION_STATES.REVIEW);
  return updateCurrentTurn(next, {
    review: {
      notes: clean(review.notes),
      nextAction: clean(review.nextAction),
      reviewedAt: nowIso(),
    },
  });
}

export function completeInterviewSession(session) {
  const next = transition(session, INTERVIEW_SESSION_STATES.COMPLETE);
  const scores = next.turns.map((turn) => turn.score?.value).filter(Number.isFinite);
  return {
    ...next,
    currentQuestionId: null,
    summary: {
      turnCount: next.turns.length,
      scoredTurnCount: scores.length,
      averageScore: scores.length ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2)) : null,
      completedAt: nowIso(),
    },
  };
}

export function normalizeInterviewSession(value = {}) {
  const base = createInterviewSession(value);
  const turns = Array.isArray(value.turns) ? value.turns.map((turn, index) => ({
    id: id(turn?.id, `turn-${index + 1}`),
    questionId: id(turn?.questionId, "generated"),
    question: clean(turn?.question, "Interview question"),
    answer: clean(turn?.answer),
    followUp: clean(turn?.followUp),
    score: turn?.score && typeof turn.score === "object" ? turn.score : null,
    review: turn?.review && typeof turn.review === "object" ? turn.review : null,
    createdAt: nowIso(turn?.createdAt || new Date()),
  })) : [];
  const state = Object.values(INTERVIEW_SESSION_STATES).includes(value.state) ? value.state : base.state;
  return { ...base, ...value, version: INTERVIEW_SESSION_VERSION, state, turns };
}

export function buildStructuredEvaluationPrompt({ question, answer, profile, round = "coding" } = {}) {
  return [
    "Evaluate one interview answer. Return JSON only, matching this schema exactly:",
    '{"score":number|null,"confidence":"high|medium|low|insufficient-evidence","strengths":string[],"gaps":string[],"followUp":string,"recommendations":string[],"inventedMetrics":string[]}',
    "Do not invent candidate facts, metrics, employers, or outcomes. Use null and insufficient-evidence when the answer lacks proof.",
    `Round: ${clean(round, "coding")}`,
    `Candidate profile: ${JSON.stringify(profile || {})}`,
    `Question: ${clean(question)}`,
    `Answer: ${clean(answer)}`,
  ].join("\n");
}

export function parseStructuredEvaluation(value) {
  let parsed = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value); } catch { return { ok: false, error: "AI evaluation was not valid JSON." }; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, error: "AI evaluation must be an object." };
  const score = parsed.score === null || parsed.score === undefined ? null : Number(parsed.score);
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 10)) return { ok: false, error: "AI score must be between 0 and 10." };
  const confidence = ["high", "medium", "low", "insufficient-evidence"].includes(parsed.confidence) ? parsed.confidence : "insufficient-evidence";
  return { ok: true, value: { score, confidence, strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 8) : [], gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 8) : [], followUp: clean(parsed.followUp), recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String).slice(0, 8) : [], inventedMetrics: Array.isArray(parsed.inventedMetrics) ? parsed.inventedMetrics.map(String).slice(0, 8) : [] } };
}
