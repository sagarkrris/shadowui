import assert from "node:assert/strict";
import test from "node:test";

import { collaborativeMockStore } from "../lib/mockCollabStore.mjs";
import createHandler from "../pages/api/mock-sessions/index.js";
import sessionHandler from "../pages/api/mock-sessions/[sessionId]/index.js";
import summaryHandler from "../pages/api/mock-sessions/[sessionId]/summary.js";
import turnsHandler from "../pages/api/mock-sessions/[sessionId]/turns.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test.afterEach(() => {
  collaborativeMockStore.reset();
});

test("POST /api/mock-sessions creates a collaborative mock room", async () => {
  const res = createResponse();

  await createHandler({
    method: "POST",
    body: {
      topic: "Java Spring Boot",
      roundStrategy: "coding",
      interviewMode: "strict",
      interviewPanel: "seniorEngineer",
      host: { id: "host-1", name: "Sagar" },
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.id);
  assert.equal(res.body.status, "draft");
  assert.equal(res.body.participants[0].role, "host");
  assert.ok(res.headers["X-Request-Id"]);
});

test("session API allows joining, recording turns, and reading summary", async () => {
  const createRes = createResponse();
  await createHandler({
    method: "POST",
    body: {
      topic: "System design",
      roundStrategy: "systemDesign",
      interviewMode: "strict",
      interviewPanel: "systemDesignArchitect",
      host: { id: "host-1", name: "Sagar" },
    },
  }, createRes);

  const sessionId = createRes.body.id;

  const joinRes = createResponse();
  await sessionHandler({
    method: "POST",
    query: { sessionId },
    body: { id: "candidate-1", name: "Asha", role: "candidate" },
  }, joinRes);

  assert.equal(joinRes.statusCode, 200);
  assert.equal(joinRes.body.status, "live");

  const questionRes = createResponse();
  await turnsHandler({
    method: "POST",
    query: { sessionId },
    body: {
      type: "question",
      authorId: "host-1",
      content: "Design a rate limiter for an API gateway.",
    },
  }, questionRes);

  assert.equal(questionRes.statusCode, 200);
  assert.ok(questionRes.body.activeTurn?.questionTurnId);

  const answerRes = createResponse();
  await turnsHandler({
    method: "POST",
    query: { sessionId },
    body: {
      type: "answer",
      authorId: "candidate-1",
      content: "I would start with token buckets and central config, then discuss consistency and fallbacks.",
    },
  }, answerRes);

  assert.equal(answerRes.statusCode, 200);
  const answerTurnId = answerRes.body.turns.at(-1).id;

  const scoreRes = createResponse();
  await turnsHandler({
    method: "POST",
    query: { sessionId },
    body: {
      type: "score",
      authorId: "host-1",
      answerTurnId,
      content: "Good breadth. Go deeper on distributed coordination and noisy-neighbor protection.",
      score: 7,
    },
  }, scoreRes);

  assert.equal(scoreRes.statusCode, 200);
  assert.equal(scoreRes.body.activeTurn, null);

  const summaryRes = createResponse();
  await summaryHandler({
    method: "GET",
    query: { sessionId },
  }, summaryRes);

  assert.equal(summaryRes.statusCode, 200);
  assert.equal(summaryRes.body.completedQuestions, 1);
  assert.equal(summaryRes.body.averageScore, 7);
});

test("turn validation rejects answers before a question exists", async () => {
  const createRes = createResponse();
  await createHandler({
    method: "POST",
    body: {
      host: { id: "host-1", name: "Sagar" },
      candidate: { id: "candidate-1", name: "Asha" },
    },
  }, createRes);

  const sessionId = createRes.body.id;
  const res = createResponse();

  await turnsHandler({
    method: "POST",
    query: { sessionId },
    body: {
      type: "answer",
      authorId: "candidate-1",
      content: "Jumping in too early.",
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /active question/i);
});
