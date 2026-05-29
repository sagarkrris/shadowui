export const QUESTION_MEMORY_STORAGE_KEY = "interviewiq.questionMemory.v1";

const VERSION = 1;
const REVIEW_DUE_DAYS = 7;
const MAX_ATTEMPTS_PER_QUESTION = 12;
const STATUSES = ["New", "Needs Review", "Improving", "Mastered"];

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isoDate(value, fallback = new Date()) {
  return (parseDate(value) || fallback).toISOString();
}

function normalizeScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  return Math.max(0, Math.min(10, Math.round(score)));
}

function normalizeAttempt(attempt = {}) {
  const score = normalizeScore(attempt.score);

  return {
    score,
    attemptedAt: isoDate(attempt.attemptedAt),
  };
}

function statusFromAttempts(attempts, { now = new Date() } = {}) {
  if (!attempts.length) return { status: "New", dueForReview: false };

  const latest = attempts[attempts.length - 1];
  const latestScore = latest.score;
  const strongAttempts = attempts.filter((attempt) => (attempt.score ?? 0) >= 8).length;
  const latestDate = parseDate(latest.attemptedAt);
  const ageMs = latestDate ? new Date(now).getTime() - latestDate.getTime() : 0;
  const dueForReview = ageMs >= REVIEW_DUE_DAYS * 24 * 60 * 60 * 1000;

  if (strongAttempts >= 2 && (latestScore ?? 0) >= 8) {
    return { status: "Mastered", dueForReview: false };
  }

  if (latestScore === null || latestScore <= 4 || dueForReview) {
    return { status: "Needs Review", dueForReview: Boolean(dueForReview) };
  }

  return { status: "Improving", dueForReview: false };
}

function normalizeQuestion(question = {}, fallbackId, options = {}) {
  const questionId = String(question.questionId || fallbackId || "").trim();
  const attempts = Array.isArray(question.attempts)
    ? question.attempts.map(normalizeAttempt).slice(-MAX_ATTEMPTS_PER_QUESTION)
    : [];
  const scores = attempts.map((attempt) => attempt.score).filter((score) => score !== null);
  const latest = attempts[attempts.length - 1] || null;
  const { status, dueForReview } = statusFromAttempts(attempts, options);

  return {
    questionId,
    question: typeof question.question === "string" ? question.question : "",
    packId: typeof question.packId === "string" ? question.packId : "",
    topic: typeof question.topic === "string" ? question.topic : "",
    stack: typeof question.stack === "string" ? question.stack : "",
    attempts,
    attemptCount: attempts.length,
    lastSeenAt: latest?.attemptedAt || null,
    lastScore: latest?.score ?? null,
    bestScore: scores.length ? Math.max(...scores) : null,
    status,
    dueForReview,
  };
}

function normalizeMemory(memory = {}, options = {}) {
  const questions = {};

  Object.entries(memory?.questions || {}).forEach(([questionId, question]) => {
    const normalized = normalizeQuestion(question, questionId, options);
    if (normalized.questionId) questions[normalized.questionId] = normalized;
  });

  return { questions };
}

function readMemory(value, options = {}) {
  if (!value) return normalizeMemory({}, options);

  if (typeof value.getItem === "function") {
    return loadQuestionMemory(value, options);
  }

  return normalizeMemory(value, options);
}

export function loadQuestionMemory(storage, options = {}) {
  if (!storage) return normalizeMemory({}, options);

  try {
    const raw = storage.getItem(QUESTION_MEMORY_STORAGE_KEY);
    if (!raw) return normalizeMemory({}, options);

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== VERSION) return normalizeMemory({}, options);

    return normalizeMemory(parsed.memory || {}, options);
  } catch {
    return normalizeMemory({}, options);
  }
}

export function saveQuestionMemory(storage, memory) {
  if (!storage) return false;

  try {
    storage.setItem(
      QUESTION_MEMORY_STORAGE_KEY,
      JSON.stringify({
        version: VERSION,
        savedAt: new Date().toISOString(),
        memory: normalizeMemory(memory),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function recordQuestionAttempt(storage, attempt = {}) {
  const questionId = String(attempt.questionId || "").trim();
  const memory = loadQuestionMemory(storage);

  if (!questionId) return memory;

  const existing = memory.questions[questionId] || { questionId, attempts: [] };
  const nextQuestion = normalizeQuestion({
    ...existing,
    question: attempt.question || existing.question,
    packId: attempt.packId || existing.packId,
    topic: attempt.topic || existing.topic,
    stack: attempt.stack || existing.stack,
    attempts: [
      ...(existing.attempts || []),
      {
        score: attempt.score,
        attemptedAt: attempt.attemptedAt || new Date().toISOString(),
      },
    ],
  }, questionId);
  const nextMemory = {
    questions: {
      ...memory.questions,
      [questionId]: nextQuestion,
    },
  };

  saveQuestionMemory(storage, nextMemory);
  return nextMemory;
}

export function buildMasteryMap(memoryOrStorage, cards = [], options = {}) {
  const memory = readMemory(memoryOrStorage, options);
  const byQuestionId = {};
  const cardIds = new Set(cards.map((card) => card?.id).filter(Boolean));

  Object.entries(memory.questions).forEach(([questionId, question]) => {
    byQuestionId[questionId] = normalizeQuestion(question, questionId, options);
  });

  cards.forEach((card) => {
    if (!card?.id || byQuestionId[card.id]) return;
    byQuestionId[card.id] = normalizeQuestion({
      questionId: card.id,
      question: card.question,
      packId: card.packId,
      topic: Array.isArray(card.tags) ? card.tags[0] : "",
      attempts: [],
    }, card.id, options);
  });

  const entries = Object.values(byQuestionId)
    .filter((entry) => !cardIds.size || cardIds.has(entry.questionId))
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
  const summary = {
    total: entries.length,
    byStatus: {
      New: 0,
      "Needs Review": 0,
      Improving: 0,
      Mastered: 0,
    },
    dueForReview: 0,
  };

  entries.forEach((entry) => {
    summary.byStatus[entry.status] += 1;
    if (entry.dueForReview) summary.dueForReview += 1;
  });

  return {
    byQuestionId,
    entries,
    summary,
  };
}

export function prioritizePracticeCards(cards = [], masteryMap = {}) {
  const byQuestionId = masteryMap.byQuestionId || {};
  const priority = {
    "Needs Review": 0,
    Improving: 1,
    New: 2,
    Mastered: 3,
  };

  return cards
    .map((card, index) => {
      const memory = byQuestionId[card.id] || { status: "New" };
      const masteryStatus = STATUSES.includes(memory.status) ? memory.status : "New";

      return {
        card: {
          ...card,
          masteryStatus,
          mastery: memory,
        },
        index,
        rank: priority[masteryStatus],
      };
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ card }) => card);
}
