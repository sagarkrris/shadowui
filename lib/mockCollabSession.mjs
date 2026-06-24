import { randomUUID } from "node:crypto";

import { normalizeInterviewPanel } from "./interviewPanel.mjs";

const DEFAULT_TOPIC = "Collaborative mock interview";
const DEFAULT_STATUS = "draft";
const DEFAULT_ROUND_STRATEGY = "coding";
const DEFAULT_INTERVIEW_MODE = "strict";
const MAX_TOPIC_LENGTH = 140;
const MAX_PARTICIPANT_NAME_LENGTH = 80;
const MAX_PARTICIPANT_ID_LENGTH = 64;
const MAX_TURN_CONTENT_LENGTH = 4000;
const TURN_TYPES = new Set(["question", "answer", "score", "note"]);

export const COLLAB_ROUND_STRATEGIES = new Set([
  "recruiter",
  "coding",
  "systemDesign",
  "manager",
  "final",
]);

export const COLLAB_INTERVIEW_MODES = new Set([
  "strict",
  "coach",
  "barRaiser",
  "behavioralStar",
  "realPressure",
]);

function cleanText(value, maxLength) {
  const text = String(value || "").trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

function makeSessionId() {
  return `mock_${randomUUID().slice(0, 12)}`;
}

function makeTurnId() {
  return `turn_${randomUUID().slice(0, 12)}`;
}

function normalizeRoundStrategy(value) {
  const key = cleanText(value, 40);
  return COLLAB_ROUND_STRATEGIES.has(key) ? key : DEFAULT_ROUND_STRATEGY;
}

function normalizeInterviewMode(value) {
  const key = cleanText(value, 40);
  return COLLAB_INTERVIEW_MODES.has(key) ? key : DEFAULT_INTERVIEW_MODE;
}

function assertRequiredText(value, label, maxLength) {
  const text = cleanText(value, maxLength);
  if (!text) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function normalizeParticipant(participant, role, nowIso) {
  if (!participant || typeof participant !== "object") {
    throw new Error(`${role} participant is required.`);
  }

  const id = assertRequiredText(participant.id, `${role} id`, MAX_PARTICIPANT_ID_LENGTH);
  const name = assertRequiredText(participant.name, `${role} name`, MAX_PARTICIPANT_NAME_LENGTH);

  return {
    id,
    name,
    role,
    joinedAt: cleanText(participant.joinedAt, 40) || nowIso,
  };
}

function participantById(session, participantId) {
  return session.participants.find((participant) => participant.id === participantId) || null;
}

function nextStatus(participants) {
  const hasHost = participants.some((participant) => participant.role === "host");
  const hasCandidate = participants.some((participant) => participant.role === "candidate");
  return hasHost && hasCandidate ? "live" : DEFAULT_STATUS;
}

function normalizeRubric(rubric = {}) {
  const keys = [
    "correctness",
    "depth",
    "examples",
    "tradeoffs",
    "communication",
    "followUpReadiness",
  ];

  return Object.fromEntries(
    keys.map((key) => {
      const value = Number(rubric?.[key]);
      const normalized = Number.isFinite(value) ? Math.max(0, Math.min(10, value)) : null;
      return [key, normalized];
    }),
  );
}

function buildActiveTurnFromQuestion(questionTurn) {
  return {
    questionTurnId: questionTurn.id,
    askedBy: questionTurn.authorId,
    question: questionTurn.content,
    askedAt: questionTurn.createdAt,
    answerTurnId: null,
  };
}

export function createCollaborativeMockSession({
  topic,
  roundStrategy,
  interviewMode,
  interviewPanel,
  host,
  candidate = null,
  observers = [],
  now = new Date(),
  createSessionId = makeSessionId,
} = {}) {
  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const participants = [normalizeParticipant(host, "host", nowIso)];

  if (candidate) {
    participants.push(normalizeParticipant(candidate, "candidate", nowIso));
  }

  for (const observer of Array.isArray(observers) ? observers : []) {
    participants.push(normalizeParticipant(observer, "observer", nowIso));
  }

  const dedupedParticipants = participants.filter((participant, index, collection) => (
    collection.findIndex((candidateItem) => candidateItem.id === participant.id) === index
  ));

  return {
    id: createSessionId(),
    topic: cleanText(topic, MAX_TOPIC_LENGTH) || DEFAULT_TOPIC,
    roundStrategy: normalizeRoundStrategy(roundStrategy),
    interviewMode: normalizeInterviewMode(interviewMode),
    interviewPanel: normalizeInterviewPanel(interviewPanel).key,
    status: nextStatus(dedupedParticipants),
    participants: dedupedParticipants,
    turns: [],
    activeTurn: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function joinCollaborativeMockSession(session, participant, now = new Date()) {
  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const incoming = normalizeParticipant(participant, participant?.role || "observer", nowIso);
  const existing = participantById(session, incoming.id);

  if (existing) {
    return {
      ...session,
      updatedAt: nowIso,
    };
  }

  const nextParticipants = [...session.participants, incoming];
  return {
    ...session,
    participants: nextParticipants,
    status: nextStatus(nextParticipants),
    updatedAt: nowIso,
  };
}

export function appendCollaborativeMockTurn(session, turn, now = new Date()) {
  if (!turn || typeof turn !== "object") {
    throw new Error("Turn payload is required.");
  }

  const type = cleanText(turn.type, 24);
  if (!TURN_TYPES.has(type)) {
    throw new Error("Turn type is invalid.");
  }

  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const authorId = assertRequiredText(turn.authorId, "Turn author", MAX_PARTICIPANT_ID_LENGTH);
  const author = participantById(session, authorId);

  if (!author) {
    throw new Error("Turn author must belong to the session.");
  }

  const content = type === "score"
    ? cleanText(turn.content, MAX_TURN_CONTENT_LENGTH)
    : assertRequiredText(turn.content, "Turn content", MAX_TURN_CONTENT_LENGTH);

  if (type === "question" && author.role !== "host") {
    throw new Error("Only the host can ask interview questions.");
  }

  if (type === "answer" && author.role !== "candidate") {
    throw new Error("Only the candidate can submit interview answers.");
  }

  if (type === "answer" && !session.activeTurn?.questionTurnId) {
    throw new Error("An active question is required before answering.");
  }

  if (type === "score" && author.role === "candidate") {
    throw new Error("The candidate cannot score their own interview turn.");
  }

  const scoreValue = type === "score"
    ? Math.max(0, Math.min(10, Number(turn.score)))
    : null;

  if (type === "score" && !Number.isFinite(scoreValue)) {
    throw new Error("Score turns require a numeric score.");
  }

  if (type === "score" && !cleanText(turn.answerTurnId, 40)) {
    throw new Error("Score turns require an answerTurnId.");
  }

  const nextTurn = {
    id: makeTurnId(),
    type,
    authorId,
    content,
    createdAt: nowIso,
    answerTurnId: type === "score" ? cleanText(turn.answerTurnId, 40) : null,
    score: type === "score" ? scoreValue : null,
    rubric: type === "score" ? normalizeRubric(turn.rubric) : null,
  };

  let activeTurn = session.activeTurn;
  if (type === "question") {
    activeTurn = buildActiveTurnFromQuestion(nextTurn);
  } else if (type === "answer" && activeTurn?.questionTurnId) {
    activeTurn = {
      ...activeTurn,
      answerTurnId: nextTurn.id,
    };
  } else if (type === "score" && activeTurn?.answerTurnId === nextTurn.answerTurnId) {
    activeTurn = null;
  }

  return {
    ...session,
    turns: [...session.turns, nextTurn],
    activeTurn,
    updatedAt: nowIso,
  };
}

export function summarizeCollaborativeMockSession(session) {
  const scoreTurns = session.turns.filter((turn) => turn.type === "score" && Number.isFinite(turn.score));
  const averageScore = scoreTurns.length
    ? Math.round((scoreTurns.reduce((sum, turn) => sum + turn.score, 0) / scoreTurns.length) * 10) / 10
    : null;
  const latestScore = scoreTurns.at(-1) || null;
  const answeredQuestions = session.turns.filter((turn) => turn.type === "answer").length;
  const feedbackHighlights = scoreTurns
    .map((turn) => cleanText(turn.content, 180))
    .filter(Boolean)
    .slice(-3);

  return {
    sessionId: session.id,
    topic: session.topic,
    status: session.status,
    roundStrategy: session.roundStrategy,
    interviewMode: session.interviewMode,
    interviewPanel: session.interviewPanel,
    participantCount: session.participants.length,
    completedQuestions: answeredQuestions,
    averageScore,
    latestScore: latestScore ? latestScore.score : null,
    feedbackHighlights,
    nextAction: session.activeTurn
      ? "Candidate should answer the active question."
      : averageScore !== null && averageScore < 7
        ? "Run another round and focus on the latest feedback gaps."
        : "Continue with the next question or wrap up the session.",
    updatedAt: session.updatedAt,
  };
}
