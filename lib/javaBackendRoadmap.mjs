export const BACKEND_ROADMAP_KEY = 'interviewiq.javaBackendJourney.v1';
export const ROADMAP_ACTIVITIES = ['Learn', 'Experiment', 'Build', 'Interview', 'Review'];

const stage = (id, title, prerequisites, outcome, learn, experiment, build, question, review) => ({
  id, title, prerequisites, outcome,
  activities: [
    { label: 'Learn', title: learn[0], href: learn[1] },
    { label: 'Experiment', title: experiment[0], href: experiment[1] },
    { label: 'Build', title: build[0], href: build[1] },
    { label: 'Interview', title: question, href: `/practice?buddy=1&buddyMode=warmup&buddyTopic=${encodeURIComponent(question)}` },
    { label: 'Review', title: review, href: `/java/roadmap#review-${id}` },
  ],
});

export const JAVA_BACKEND_STAGES = [
  stage('foundations', 'Java foundations', 'Start here. Be comfortable editing a file and running a terminal command.',
    'Use types, collections, and explicit contracts to explain a small Java program.',
    ['Start with the JDK and JVM', '/java/tutorial/jdk-vs-jre-vs-jvm'],
    ['Explore how a map stores keys', '/java/hashmap-internals'],
    ['Build an in-memory inverted index', '/build/inverted-index'],
    'Explain Java collections, equality, and the edge cases of an in-memory search index.',
    'Record one collection choice, its invariant, and an input that challenges it.'),
  stage('spring', 'Spring services', 'Java classes, interfaces, maps, and exceptions.',
    'Trace dependency creation and explain where a service boundary belongs.',
    ['Understand Spring IoC', '/java/tutorial/spring-ioc'],
    ['Investigate Spring transaction boundaries', '/learn/spring-transactions'],
    ['Build a tiny dependency-injection container', '/build/java-dependency-injection'],
    'Explain Spring dependency injection, proxy boundaries, and how you would test a service.',
    'Record where your container differs from Spring and explain a dependency cycle.'),
  stage('data', 'SQL and transactions', 'Service boundaries and Java exception handling. Study JDBC before the database exercises.',
    'Reason about transaction scope, query plans, and persistence limits.',
    ['Study database transactions', '/java/tutorial/transactions'],
    ['Compare database design decisions', '/time-machine/database-decisions'],
    ['Build a write-ahead log model', '/build/write-ahead-log'],
    'Explain transaction boundaries, database indexes, and why a teaching log is not a durable database.',
    'Record a database trade-off and the evidence that would change your choice.'),
  stage('concurrency', 'Concurrency and capacity', 'Collections, exceptions, and the difference between shared and local state.',
    'Explain ownership, bounded capacity, and what happens when work completes twice.',
    ['Study Java threads', '/java/tutorial/threads'],
    ['Explore a connection pool model', '/build/connection-pool'],
    ['Release a permit exactly once', '/build/practice/duplicate-completion'],
    'Explain concurrent ownership, duplicate completion, and how you would bound admission.',
    'Record a concurrency invariant and a failing interleaving. Distinguish single-threaded models from concurrent checks.'),
  stage('systems', 'Reliable system design', 'Service boundaries, persistence, and bounded capacity.',
    'Defend a failure policy using explicit retry, timeout, and idempotency assumptions.',
    ['Study timeouts and retries', '/java/tutorial/timeouts-and-retries'],
    ['Explore system design visually', '/system-design/visual-guide'],
    ['Build a bounded retry scheduler', '/build/retry-scheduler'],
    'Design a backend service with timeouts, bounded retries, idempotency, and observable failures.',
    'Record the failure your design tolerates and the failure it cannot recover from.'),
  stage('readiness', 'Testing and interview readiness', 'Complete the earlier stages or use their checkpoints to identify gaps.',
    'Present a tested implementation and defend its behavior under changed constraints.',
    ['Study JUnit test design', '/java/tutorial/junit-test-design'],
    ['Rehearse daily Java scenarios', '/senior-java-interview/daily'],
    ['Protect order lifecycle transitions', '/build/practice/order-transitions'],
    'Review my Java backend readiness: testing, Spring, SQL, concurrency, and system-design trade-offs.',
    'Record your weakest explanation and schedule another attempt after reviewing it.'),
];

export const roadmapActivityId = (stageId, label) => `${stageId}:${label}`;
const validIds = new Set(JAVA_BACKEND_STAGES.flatMap(s => s.activities.map(a => roadmapActivityId(s.id, a.label))));
export function normalizeRoadmapProgress(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && validIds.has(id)))] : [];
}
export function nextRoadmapActivity(value) {
  const done = new Set(normalizeRoadmapProgress(value));
  for (const stage of JAVA_BACKEND_STAGES) {
    const activity = stage.activities.find(a => !done.has(roadmapActivityId(stage.id, a.label)));
    if (activity) return { stage, activity };
  }
  return null;
}
