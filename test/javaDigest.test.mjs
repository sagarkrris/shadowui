import assert from "node:assert/strict";
import test from "node:test";

import {
  CSES_JAVA_PARTS,
  CSES_JAVA_TRACKS,
  FRESHER_DSA_PLAYBOOK,
  FRESHER_DSA_GLOSSARY,
  JAVA_DIGEST_ARTICLES,
  JAVA_DIGEST_ROADMAPS,
  JAVA_DIGEST_TRACKS,
  JAVA_DIGEST_VERSION,
  JAVA_SPRING_STUDY_PATHS,
  JAVA_QUICK_REFERENCE,
  JAVA_TUTORIAL_CATALOG,
  JAVA_VERSION_TOPIC_GUIDE,
  JAVA_PROGRAM_EXAMPLES,
  JAVA_QUIZ_BANK,
  JAVA_EDITORIAL_CHAPTERS,
  getJavaTutorialBySlug,
  slugifyJavaTutorial,
  JAVA_INTERVIEW_QA,
  JAVA_PRODUCTION_GLOSSARY,
  JAVA_PRODUCTION_SCENARIOS,
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
import { appendAdditionalTrickyQa, buildJavaSeniorRefresherFallbackQa, loadJavaSeniorRefresherQa, parseJavaSeniorRefresherQa } from "../lib/javaSeniorRefresherQa.mjs";
import { JAVA_REVIEW_INTERVALS_DAYS, getJavaReviewIntervalDays } from "../components/java-digest/useJavaDigestProgress.js";

test("java digest spaced repetition uses progressive review intervals", () => {
  assert.deepEqual(JAVA_REVIEW_INTERVALS_DAYS, [1, 3, 7, 14, 30]);
  assert.equal(getJavaReviewIntervalDays(0), 1);
  assert.equal(getJavaReviewIntervalDays(2), 7);
  assert.equal(getJavaReviewIntervalDays(999), 30);
});

test("fresher DSA playbook covers solving method, patterns, practice, and debugging", () => {
  assert.equal(FRESHER_DSA_PLAYBOOK.framework.length, 7);
  assert.ok(FRESHER_DSA_PLAYBOOK.constraintMap.length >= 5);
  assert.ok(FRESHER_DSA_PLAYBOOK.patterns.length >= 10);
  assert.ok(FRESHER_DSA_PLAYBOOK.patterns.every((pattern) => pattern.recognize && pattern.approach && pattern.java && pattern.followUp));
  assert.ok(FRESHER_DSA_PLAYBOOK.edgeCases.length >= 5);
  assert.ok(FRESHER_DSA_PLAYBOOK.debugging.length >= 5);
  assert.equal(FRESHER_DSA_PLAYBOOK.practiceLadder.length, 6);
  assert.match(FRESHER_DSA_PLAYBOOK.framework[3], /invariant/);
  assert.match(FRESHER_DSA_PLAYBOOK.constraintMap.find((entry) => entry.limit === "n <= 100,000").reason, /10 billion/);
  assert.ok(FRESHER_DSA_GLOSSARY.some((entry) => entry.term === "Invariant"));
  assert.ok(FRESHER_DSA_GLOSSARY.some((entry) => entry.term === "Fenwick tree \/ segment tree"));
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

test("java digest includes original Java and Spring learning paths", () => {
  assert.equal(JAVA_SPRING_STUDY_PATHS.length, 5);
  assert.deepEqual(JAVA_SPRING_STUDY_PATHS.map((path) => path.id), [
    "java-starter-foundations",
    "effective-java-practice",
    "spring-framework-foundations",
    "spring-boot-production",
    "microservices-patterns",
  ]);
  assert.ok(JAVA_SPRING_STUDY_PATHS.every((path) => path.lessons.length >= 5));
  assert.ok(JAVA_SPRING_STUDY_PATHS.every((path) => path.level));
  assert.ok(JAVA_SPRING_STUDY_PATHS.every((path) => path.lessons.every((lesson) => (
    lesson.title && lesson.outcome && lesson.mentalModel && lesson.example && lesson.recall && lesson.drill
  ))));
  assert.ok(JAVA_SPRING_STUDY_PATHS[0].lessons.length >= 8);
  const microservices = JAVA_SPRING_STUDY_PATHS.find((path) => path.id === "microservices-patterns");
  assert.equal(microservices.lessons.length, 12);
  assert.ok(microservices.lessons.every((lesson) => lesson.definition && lesson.howItWorks && lesson.advantages && lesson.disadvantages && lesson.whenToUse && lesson.interview && lesson.star && lesson.codeSketch));
});

test("java digest includes compact reference sheets with self-check answers", () => {
  assert.equal(JAVA_QUICK_REFERENCE.length, 6);
  assert.ok(JAVA_QUICK_REFERENCE.every((reference) => reference.level && reference.points.length === 3 && reference.quiz && reference.answer));
});

test("java digest exposes the expanded original catalog", () => {
  assert.ok(JAVA_TUTORIAL_CATALOG.length >= 60);
  assert.ok(JAVA_TUTORIAL_CATALOG.every((tutorial) => tutorial.title && tutorial.category && tutorial.level && tutorial.memoryHook && tutorial.practice));
  assert.equal(JAVA_VERSION_TOPIC_GUIDE.length, 8);
  assert.ok(JAVA_PROGRAM_EXAMPLES.length >= 40);
  assert.equal(JAVA_QUIZ_BANK.length, 48);
});

test("java digest includes detailed STAR interview answers for collections and concurrency", () => {
  assert.ok(JAVA_INTERVIEW_QA.length >= 6);
  assert.ok(JAVA_INTERVIEW_QA.some((entry) => entry.question.includes("HashMap work internally")));
  assert.ok(JAVA_INTERVIEW_QA.some((entry) => entry.question.includes("ConcurrentHashMap")));
  assert.ok(JAVA_INTERVIEW_QA.filter((entry) => entry.section === "Multithreading").length >= 5);
  assert.ok(JAVA_INTERVIEW_QA.every((entry) => entry.answer && entry.example && entry.star && entry.followUps));
});

test("java interview Q&A covers JVM, Spring, SQL, system design, and concurrency", () => {
  for (const section of ["JVM", "Spring", "Spring Boot", "SQL", "System Design", "Multithreading"]) {
    assert.ok(JAVA_INTERVIEW_QA.filter((entry) => entry.section === section).length >= 2, section);
  }
  assert.ok(JAVA_INTERVIEW_QA.every((entry) => entry.answer.length > 180 && entry.star.length > 120));
});

test("production interview scenarios teach end-to-end incident reasoning", () => {
  assert.ok(JAVA_PRODUCTION_SCENARIOS.length >= 21);
  assert.ok(JAVA_PRODUCTION_SCENARIOS.every((scenario) => (
    scenario.prompt && scenario.impact && scenario.triage.length >= 3 && scenario.diagnosis && scenario.prevention && scenario.star && scenario.followUps
  )));
  assert.ok(JAVA_PRODUCTION_SCENARIOS.some((scenario) => scenario.title.includes("latency")));
  assert.ok(JAVA_PRODUCTION_SCENARIOS.some((scenario) => scenario.area === "Concurrency"));
  assert.ok(JAVA_PRODUCTION_SCENARIOS.some((scenario) => scenario.area === "JVM & runtime"));
  assert.ok(JAVA_PRODUCTION_SCENARIOS.some((scenario) => scenario.area === "Distributed tracing"));
  assert.ok(JAVA_PRODUCTION_SCENARIOS.some((scenario) => scenario.area === "SQL operations"));
  for (const area of ["Kafka", "Kafka rebalancing", "MQ & messaging", "Kubernetes", "Kubernetes networking", "Caching", "Redis & caching", "Security", "Docker & delivery", "CI/CD", "Distributed transactions"]) {
    assert.ok(JAVA_PRODUCTION_SCENARIOS.some((scenario) => scenario.area === area), area);
  }
});

test("java digest filters articles by track", () => {
  const springArticles = listJavaDigestArticles("spring-boot");

  assert.ok(springArticles.length > 0);
  assert.ok(springArticles.every((article) => article.trackId === "spring-boot"));
  assert.equal(listJavaDigestArticles("all").length, JAVA_DIGEST_ARTICLES.length);
});

test("tutorial catalog exposes full article-card lesson fields", () => {
  assert.ok(JAVA_TUTORIAL_CATALOG.length >= 100);
  assert.ok(JAVA_TUTORIAL_CATALOG.every((tutorial) => (
    tutorial.explanation && tutorial.howToThink && tutorial.example && tutorial.diagram && tutorial.benchmark && tutorial.mistakes && tutorial.productionNote && tutorial.exercise && tutorial.interviewAnswer && tutorial.author && tutorial.reviewedAt && tutorial.javaVersions && Array.isArray(tutorial.relatedTopics)
  )));
  assert.ok(new Set(JAVA_TUTORIAL_CATALOG.map((tutorial) => tutorial.explanation)).size >= 90);
  assert.ok(new Set(JAVA_TUTORIAL_CATALOG.map((tutorial) => tutorial.example)).size >= 90);
});

test("flagship Java topics have individually authored editorial chapters", () => {
  for (const topic of ["HashMap", "Generics", "Stream pipelines", "Executors", "Virtual threads", "Spring IoC", "Spring Security", "Transactions", "Spring Data JPA", "Garbage collection"]) {
    assert.ok(JAVA_EDITORIAL_CHAPTERS[topic]?.walkthrough, topic);
    assert.ok(JAVA_TUTORIAL_CATALOG.find((tutorial) => tutorial.title === topic)?.output, topic);
  }
});

test("tutorials expose stable publishable slugs", () => {
  const slug = slugifyJavaTutorial("Spring Data JPA");
  assert.equal(slug, "spring-data-jpa");
  assert.equal(getJavaTutorialBySlug(slug).title, "Spring Data JPA");
});

test("java digest includes a Java 21, JVM, and concurrency senior refresher section", () => {
  const refresher = listJavaSeniorRefresherArticles();

  assert.equal(refresher.length, 6);
  assert.ok(refresher.every((article) => article.collection === "senior-refresher"));
  assert.ok(refresher.some((article) => article.id === "java-21-virtual-threads"));
  assert.ok(refresher.some((article) => article.title.includes("JVM")));
  assert.match(refresher.find((article) => article.id === "java-21-virtual-threads").learn.join(" "), /preview APIs/);
  assert.match(refresher.find((article) => article.id === "java-21-virtual-threads").learn.join(" "), /JDK 25/);
  assert.match(JAVA_VERSION_TOPIC_GUIDE.find((entry) => entry.version === "Java 22–25").focus, /StructuredTaskScope remains preview/);
});

test("production scenarios explain operational shorthand before using it", () => {
  assert.match(JAVA_PRODUCTION_SCENARIOS.find((scenario) => scenario.id === "prod-latency-spike").prompt, /99% of requests finish/);
  assert.match(JAVA_PRODUCTION_GLOSSARY.find((entry) => entry.term === "p50 \/ p95 \/ p99 latency").definition, /slowest 1%/);
  assert.ok(JAVA_PRODUCTION_GLOSSARY.some((entry) => entry.term === "SLO"));
  assert.ok(JAVA_PRODUCTION_GLOSSARY.some((entry) => entry.term === "DLQ"));
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

  assert.equal(questions.length, 42);
  assert.ok(questions.every((question) => question.question && question.answer && question.section));
  assert.ok(questions.every((question) => question.answer.length >= 350));
  assert.ok(questions.every((question) => !question.answer.includes("\\\\`")));
  const recordQuestion = questions.find((question) => question.question === "When would you choose a record over a class?");
  assert.match(recordQuestion.answer, /public record UserId/);
  assert.match(recordQuestion.answer, /JPA entities/);
  assert.ok(questions.some((question) => question.question === "Why can heap pollution compile cleanly and still fail later?"));
  assert.ok(questions.some((question) => question.question === "Why can @Transactional appear to do nothing on self-invocation?"));
  assert.match(questions.find((question) => question.question === "Why can heap pollution compile cleanly and still fail later?").answer, /```java/);
  assert.match(questions.find((question) => question.question === "Why can groupingByConcurrent still be unsafe for a parallel stream?").answer, /concurrent, unordered collector/);
  assert.deepEqual(questions.map((question) => question.question), [
    "When would you choose a record over a class?",
    "How does PECS make a public API more flexible?",
    "When is Optional the wrong modeling choice?",
    "Where do virtual threads help, and where do they not?",
    "How can virtual threads reveal a database bottleneck?",
    "What changes when a structured-concurrency API is preview?",
    "How do you investigate a suspected memory leak?",
    "Why is a rising heap not enough evidence of a leak?",
    "Which signals would you correlate with a p99 latency increase?",
    "Why does volatile not make a read-modify-write sequence atomic?",
    "When is a lock clearer than CAS?",
    "What makes cancellation reliable rather than merely requested?",
    "Why can get followed by put still be incorrect on ConcurrentHashMap?",
    "What should happen when a work queue is full?",
    "Why does a queue move pressure instead of removing it?",
    "Why can a HashMap lookup fail after insertion?",
    "When would you avoid streams?",
    "Why is parallelStream not a general performance switch?",
    "Why can heap pollution compile cleanly and still fail later?",
    "Why is List<Integer> not a subtype of List<Number>?",
    "Why can a static initializer cause a production outage that persists after the original failure?",
    "Why is double-checked locking broken without volatile?",
    "What is the lost-notification problem with wait and notify?",
    "Why can CompletableFuture make a thread-pool starvation deadlock easier to create?",
    "Why is modifying a collection while streaming it a correctness bug even when it appears to work?",
    "Why can groupingByConcurrent still be unsafe for a parallel stream?",
    "Why is catching Exception and wrapping it in RuntimeException often an API regression?",
    "What happens when both the try block and close() throw in try-with-resources?",
    "Why can @Transactional appear to do nothing on self-invocation?",
    "Why can a fetch join with pagination return incomplete or misleading pages?",
    "A Java endpoint has a p99 latency spike but normal CPU. How would you investigate it?",
    "How would you test concurrent code without relying on sleep?",
    "How do you make a Java message consumer safe when delivery is at least once?",
    "How would you evolve a Java API response without breaking existing clients?",
    "How would you choose between optimistic locking, pessimistic locking, and a transaction isolation level?",
    "What makes an outbound HTTP client resilient instead of merely retrying failures?",
    "Why can ThreadLocal become a memory or data-isolation bug in server code?",
    "Why are equals and hashCode difficult for JPA entities?",
    "What would you review before accepting polymorphic JSON into a Java service?",
    "How do you decide what belongs in unit, integration, and contract tests for a Java service?",
    "What do you look for first when reviewing a Java backend change?",
    "How do design patterns, SOLID, KISS, and DRY guide a Java refactor without causing over-engineering?",
  ]);
});

test("senior refresher adds curated tricky questions to the PDF bank without duplicates", () => {
  const questions = appendAdditionalTrickyQa([{ id: "pdf-1", section: "PDF", question: "Why can heap pollution compile cleanly and still fail later?", answer: "PDF answer" }]);

  assert.equal(questions.length, 24);
  assert.equal(questions.filter((question) => question.question === "Why can heap pollution compile cleanly and still fail later?").length, 1);
  assert.ok(questions.some((question) => question.section === "Streams: Semantics and Side Effects"));
  assert.ok(questions.some((question) => question.section === "Exceptions: Contracts and Resource Ownership"));
  assert.ok(questions.some((question) => question.section === "Interviewer Expectations: Production Diagnosis"));
  assert.ok(questions.some((question) => question.section === "Design Principles: Patterns, SOLID, KISS, and DRY"));
});

test("senior refresher loads the repository PDF source", async () => {
  const questions = await loadJavaSeniorRefresherQa();

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
