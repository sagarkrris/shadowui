import assert from "node:assert/strict";
import test from "node:test";

import {
  CSES_JAVA_PARTS,
  CSES_JAVA_TRACKS,
  FRESHER_DSA_PLAYBOOK,
  JAVA_DIGEST_ARTICLES,
  JAVA_DIGEST_ROADMAPS,
  JAVA_DIGEST_TRACKS,
  JAVA_DIGEST_VERSION,
  buildJavaDigestCompetencySummary,
  buildCsesJavaPracticePrompt,
  buildJavaDigestGeneratedTopicPrompt,
  buildJavaDigestCoachPrompt,
  buildJavaDigestMockPrompt,
  buildJavaDigestRoadmapPrompt,
  getCsesJavaChapterDetail,
  getJavaDigestTrack,
  listJavaDigestArticles,
  listJavaSeniorRefresherArticles,
} from "../lib/javaDigest.mjs";
import { buildJavaSeniorRefresherFallbackQa, parseJavaSeniorRefresherQa } from "../lib/javaSeniorRefresherQa.mjs";

test("fresher DSA playbook covers solving method, patterns, practice, and debugging", () => {
  assert.equal(FRESHER_DSA_PLAYBOOK.framework.length, 7);
  assert.ok(FRESHER_DSA_PLAYBOOK.constraintMap.length >= 5);
  assert.ok(FRESHER_DSA_PLAYBOOK.patterns.length >= 10);
  assert.ok(FRESHER_DSA_PLAYBOOK.patterns.every((pattern) => pattern.recognize && pattern.approach && pattern.java && pattern.followUp));
  assert.ok(FRESHER_DSA_PLAYBOOK.edgeCases.length >= 5);
  assert.ok(FRESHER_DSA_PLAYBOOK.debugging.length >= 5);
  assert.equal(FRESHER_DSA_PLAYBOOK.practiceLadder.length, 6);
});

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

test("java digest includes a Java 21, JVM, and concurrency senior refresher section", () => {
  const refresher = listJavaSeniorRefresherArticles();

  assert.equal(refresher.length, 6);
  assert.ok(refresher.every((article) => article.collection === "senior-refresher"));
  assert.ok(refresher.some((article) => article.id === "java-21-virtual-threads"));
  assert.ok(refresher.some((article) => article.title.includes("JVM")));
  assert.match(refresher.find((article) => article.id === "java-21-virtual-threads").learn.join(" "), /preview APIs/);
});

test("senior refresher parser preserves question and answer text without summarizing it", () => {
  const questions = parseJavaSeniorRefresherQa([
    "Java Senior Refresher - Java 21, JVM, Concurrency, Collections, Streams",
    "Page 12",
    "10. Spring and Spring Boot - real-world interview answers",
    "How do you design transaction boundaries in Spring?",
    "Senior answer",
    "I put the transaction at the service operation that represents one business consistency boundary, not on every repository method.",
    "Why can @Transactional appear not to work?",
    "Senior answer",
    "The common causes are self-invocation bypassing the proxy.",
  ].join("\n"));

  assert.equal(questions.length, 2);
  assert.equal(questions[0].question, "How do you design transaction boundaries in Spring?");
  assert.equal(questions[0].answer, "I put the transaction at the service operation that represents one business consistency boundary, not on every repository method.");
  assert.match(questions[0].section, /Spring and Spring Boot/);
});

test("senior refresher has a bundled fallback when the PDF is unavailable at runtime", () => {
  const questions = buildJavaSeniorRefresherFallbackQa();

  assert.ok(questions.length > 0);
  assert.ok(questions.every((question) => question.question && question.answer && question.section));
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
  assert.match(prompt, /competitive-programming depth/);
  assert.match(prompt, /direct polished answer/);
  assert.match(prompt, /Avoid LaTeX syntax/);
  assert.doesNotMatch(prompt, /CSES|Competitive Programmer's Handbook|book text/);
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
  assert.match(prompt, /Java curriculum topic themes/);
  assert.match(prompt, /direct polished study answer/);
  assert.match(prompt, /Do not greet the user/);
  assert.match(prompt, /plain text math/);
  assert.doesNotMatch(prompt, /CSES|Competitive Programmer's Handbook/);
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

test("java digest computes versioned mastery and competency coverage", () => {
  const summary = buildJavaDigestCompetencySummary({
    progress: {
      completedTopics: ["hashmap-internals", "executor-service"],
      masteredTopics: ["executor-service"],
    },
    selectedTrackId: "all",
  });

  assert.equal(summary.version, JAVA_DIGEST_VERSION);
  assert.equal(summary.completedTopics, 2);
  assert.ok(summary.masteryScore >= 0);
  assert.ok(summary.competencyTracks.some((track) => track.label === "Core Java"));
});
