import assert from "node:assert/strict";
import test from "node:test";

import {
  appendCollaborativeMockTurn,
  createCollaborativeMockSession,
  joinCollaborativeMockSession,
  summarizeCollaborativeMockSession,
} from "../lib/mockCollabSession.mjs";

test("creates a collaborative mock session with normalized interview settings and empty turn history", () => {
  const session = createCollaborativeMockSession({
    topic: "Java Spring Boot",
    roundStrategy: "coding",
    interviewMode: "strict",
    interviewPanel: "seniorEngineer",
    host: {
      id: "host-1",
      name: "Sagar",
    },
    candidate: {
      id: "candidate-1",
      name: "Asha",
    },
  });

  assert.ok(session.id);
  assert.equal(session.topic, "Java Spring Boot");
  assert.equal(session.roundStrategy, "coding");
  assert.equal(session.interviewMode, "strict");
  assert.equal(session.interviewPanel, "seniorEngineer");
  assert.equal(session.status, "live");
  assert.equal(session.participants.length, 2);
  assert.deepEqual(
    session.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      role: participant.role,
    })),
    [
      { id: "host-1", name: "Sagar", role: "host" },
      { id: "candidate-1", name: "Asha", role: "candidate" },
    ],
  );
  assert.ok(session.participants.every((participant) => typeof participant.joinedAt === "string"));
  assert.deepEqual(session.turns, []);
  assert.equal(session.activeTurn, null);
  assert.equal(typeof session.createdAt, "string");
  assert.equal(typeof session.updatedAt, "string");
});

test("joining a session adds the candidate and transitions the room to live", () => {
  const draftSession = createCollaborativeMockSession({
    topic: "Distributed systems",
    host: {
      id: "host-1",
      name: "Sagar",
    },
  });

  const liveSession = joinCollaborativeMockSession(draftSession, {
    id: "candidate-1",
    name: "Asha",
    role: "candidate",
  });

  assert.equal(draftSession.status, "draft");
  assert.equal(liveSession.status, "live");
  assert.equal(liveSession.participants.length, 2);
  assert.equal(liveSession.participants[1].role, "candidate");
});

test("records question, answer, and score turns while managing the active turn", () => {
  const session = createCollaborativeMockSession({
    topic: "Java Spring Boot",
    host: { id: "host-1", name: "Sagar" },
    candidate: { id: "candidate-1", name: "Asha" },
  });

  const asked = appendCollaborativeMockTurn(session, {
    type: "question",
    authorId: "host-1",
    content: "How does optimistic locking work in JPA?",
  });

  assert.ok(asked.activeTurn?.questionTurnId);

  const answered = appendCollaborativeMockTurn(asked, {
    type: "answer",
    authorId: "candidate-1",
    content: "It uses a version field to detect conflicting updates before commit.",
  });

  assert.ok(answered.activeTurn?.answerTurnId);

  const answerTurnId = answered.turns.at(-1).id;
  const scored = appendCollaborativeMockTurn(answered, {
    type: "score",
    authorId: "host-1",
    answerTurnId,
    content: "Strong start, but mention stale object exceptions and retry strategy.",
    score: 7,
    rubric: {
      correctness: 8,
      depth: 6,
      examples: 6,
      tradeoffs: 7,
      communication: 8,
      followUpReadiness: 7,
    },
  });

  assert.equal(scored.activeTurn, null);
  assert.equal(scored.turns.length, 3);
  assert.equal(scored.turns[2].score, 7);
  assert.equal(scored.turns[2].rubric.depth, 6);
});

test("summarizes completed collaborative mock sessions with average score and next action", () => {
  const session = createCollaborativeMockSession({
    topic: "Behavioral leadership",
    roundStrategy: "manager",
    interviewPanel: "engineeringManager",
    host: { id: "host-1", name: "Sagar" },
    candidate: { id: "candidate-1", name: "Asha" },
  });

  const withQuestion = appendCollaborativeMockTurn(session, {
    type: "question",
    authorId: "host-1",
    content: "Tell me about a time you handled team conflict.",
  });
  const withAnswer = appendCollaborativeMockTurn(withQuestion, {
    type: "answer",
    authorId: "candidate-1",
    content: "I aligned two engineers on rollout risk by reframing the decision around customer impact.",
  });
  const summarySource = appendCollaborativeMockTurn(withAnswer, {
    type: "score",
    authorId: "host-1",
    answerTurnId: withAnswer.turns.at(-1).id,
    content: "Strong ownership. Add more metrics and reflection next time.",
    score: 8,
  });

  const summary = summarizeCollaborativeMockSession(summarySource);

  assert.equal(summary.completedQuestions, 1);
  assert.equal(summary.averageScore, 8);
  assert.equal(summary.latestScore, 8);
  assert.equal(summary.feedbackHighlights.length, 1);
  assert.match(summary.nextAction, /Continue with the next question|wrap up/i);
});
