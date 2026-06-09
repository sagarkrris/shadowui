import assert from "node:assert/strict";
import test from "node:test";

import {
  CSES_JAVA_PARTS,
  CSES_JAVA_TRACKS,
  JAVA_DIGEST_ARTICLES,
  JAVA_DIGEST_ROADMAPS,
  JAVA_DIGEST_TRACKS,
  buildCsesJavaPracticePrompt,
  buildJavaDigestGeneratedTopicPrompt,
  buildJavaDigestCoachPrompt,
  buildJavaDigestMockPrompt,
  buildJavaDigestRoadmapPrompt,
  getCsesJavaChapterDetail,
  getJavaDigestTrack,
  listJavaDigestArticles,
} from "../lib/javaDigest.mjs";

test("java digest exposes original topic tracks and article cards", () => {
  assert.ok(JAVA_DIGEST_TRACKS.length >= 5);
  assert.ok(JAVA_DIGEST_ARTICLES.length >= 6);
  assert.ok(JAVA_DIGEST_ROADMAPS.length >= 2);
  assert.equal(CSES_JAVA_PARTS.length, 3);
  assert.ok(CSES_JAVA_TRACKS.length >= 30);
  assert.equal(getJavaDigestTrack("spring-boot").label, "Spring Boot");
  assert.equal(getJavaDigestTrack("missing").id, "core-java");
});

test("java digest filters articles by track", () => {
  const springArticles = listJavaDigestArticles("spring-boot");

  assert.ok(springArticles.length > 0);
  assert.ok(springArticles.every((article) => article.trackId === "spring-boot"));
  assert.equal(listJavaDigestArticles("all").length, JAVA_DIGEST_ARTICLES.length);
});

test("java digest prompt builders produce interview-ready prompts", () => {
  const coachPrompt = buildJavaDigestCoachPrompt("hashmap-internals");
  const mockPrompt = buildJavaDigestMockPrompt("executor-service");
  const roadmapPrompt = buildJavaDigestRoadmapPrompt("java-backend-14-day");

  assert.match(coachPrompt, /Coach me through this Java Digest topic/);
  assert.match(coachPrompt, /HashMap Internals/);
  assert.match(mockPrompt, /Run a focused Java interview mock/);
  assert.match(mockPrompt, /ExecutorService/);
  assert.match(roadmapPrompt, /personalized prep plan/);
  assert.match(roadmapPrompt, /14-Day Java Backend Interview Sprint/);
});

test("java digest generated search prompt supports any topic and candidate context", () => {
  const prompt = buildJavaDigestGeneratedTopicPrompt("interface", {
    position: "Backend Developer",
    experience: "5-7 years",
    stack: "Java, Spring Boot",
  });

  assert.match(prompt, /searched topic: interface/);
  assert.match(prompt, /Target role: Backend Developer/);
  assert.match(prompt, /Experience: 5-7 years/);
  assert.match(prompt, /Tech stack: Java, Spring Boot/);
  assert.match(prompt, /Interview-Ready Answer/);
  assert.match(prompt, /Competitive Programmer's Handbook/);
  assert.match(prompt, /Do not quote or reproduce book text/);
});

test("cses java tracks expose java-only competitive programming practice prompts", () => {
  const graphPart = CSES_JAVA_PARTS.find((part) => part.id === "graph-algorithms");
  const shortestPathTrack = CSES_JAVA_TRACKS.find((track) => track.id === "shortest-paths-java");
  const prompt = buildCsesJavaPracticePrompt("shortest-paths-java");

  assert.ok(graphPart);
  assert.equal(graphPart.part, "II");
  assert.ok(shortestPathTrack);
  assert.equal(shortestPathTrack.chapter, 13);
  assert.match(shortestPathTrack.templateFocus, /Dijkstra/);
  assert.match(prompt, /Java-only competitive programming track/);
  assert.match(prompt, /Shortest Paths/);
  assert.match(prompt, /CSES handbook-inspired topic themes/);
  assert.match(prompt, /Do not quote or reproduce the handbook text/);
});

test("cses java chapters include detailed learner-facing explanations", () => {
  const timeComplexity = CSES_JAVA_TRACKS.find((track) => track.id === "time-complexity-java");
  const detail = getCsesJavaChapterDetail(timeComplexity);

  assert.ok(timeComplexity);
  assert.match(detail.explanation, /200,000/);
  assert.match(detail.explanation, /40,000,000,000/);
  assert.match(detail.explanation, /3.6 million/);
  assert.match(detail.workedExample, /Kadane/);
  assert.match(detail.codeSketch, /current = Math.max/);
  assert.ok(detail.stepByStep.length >= 4);
  assert.match(detail.interviewAnswer, /constraints/);
  assert.match(detail.commonMistakes.join(" "), /Big-O/);
  assert.match(detail.practiceTasks.join(" "), /O\(n log n\)/);
});
