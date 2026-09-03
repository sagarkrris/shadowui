import { JAVA_INTERVIEW_QA, JAVA_PRODUCTION_SCENARIOS, getJavaInterviewAnswerSteps, getJavaInterviewInternals } from "./javaDigest.mjs";

const qa = (id) => JAVA_INTERVIEW_QA.find((entry) => entry.id === id);
const scenario = (id) => JAVA_PRODUCTION_SCENARIOS.find((entry) => entry.id === id);

const PUBLIC_ARTICLE_SEEDS = [
  { slug: "hashmap-internals", title: "How HashMap Works Internally in Java", description: "Understand Java HashMap buckets, collisions, resizing, treeification, equals, hashCode, and production pitfalls.", source: qa("hashmap-internals-interview"), category: "Java Collections", keywords: ["java hashmap internals", "hashmap collision", "hashmap resize"] },
  { slug: "hashmap-vs-concurrenthashmap", title: "HashMap vs ConcurrentHashMap: Differences and Use Cases", description: "Compare HashMap and ConcurrentHashMap, atomic compound operations, null handling, and concurrency boundaries.", source: qa("hashmap-concurrenthashmap"), category: "Java Concurrency", keywords: ["hashmap vs concurrenthashmap", "java concurrent map"] },
  { slug: "debug-java-high-cpu", title: "How to Debug High CPU Usage in a Java Production Application", description: "A practical, end-to-end runbook for confirming high CPU, using JFR and thread dumps, mitigating safely, and preventing recurrence.", source: scenario("prod-high-cpu"), category: "Production Debugging", keywords: ["java high cpu", "jvm cpu troubleshooting", "java production incident"] },
  { slug: "jvm-memory-leak", title: "How to Diagnose a Java Memory Leak", description: "Learn how to distinguish allocation pressure from retention leaks using GC data, heap histograms, dominator trees, and a safe fix loop.", source: scenario("prod-memory-growth"), category: "JVM", keywords: ["java memory leak", "heap dump analysis", "jvm outofmemoryerror"] },
  { slug: "spring-transactional-not-working", title: "Spring @Transactional Not Working: Causes and Fixes", description: "Understand Spring transaction proxy boundaries, self-invocation, rollback rules, and production-safe transaction design.", source: qa("spring-transactions"), category: "Spring", keywords: ["spring transactional not working", "spring transaction proxy", "transaction rollback"] },
  { slug: "kafka-consumer-rebalancing", title: "Kafka Consumer Rebalancing: Diagnosis and Prevention", description: "Diagnose poll gaps, long processing, partition assignment changes, lag growth, and duplicate-safe recovery.", source: scenario("prod-kafka-rebalance"), category: "Kafka", keywords: ["kafka consumer rebalance", "kafka lag", "kafka poll interval"] },
  { slug: "redis-cache-evictions", title: "Redis Cache Evictions: Causes, Diagnosis, and Safe Recovery", description: "Handle Redis memory pressure, eviction policy, key criticality, stale data, and cascading production failures.", source: scenario("prod-redis-failure"), category: "Redis", keywords: ["redis evictions", "redis memory pressure", "redis cache incident"] },
  { slug: "slow-sql-query", title: "How to Investigate a Slow SQL Query", description: "Use execution plans, selectivity, indexes, statistics, and production-safe measurements to fix slow SQL queries.", source: scenario("prod-slow-query"), category: "SQL Performance", keywords: ["slow sql query", "explain analyze", "database query optimization"] },
  { slug: "system-design-reliability", title: "Designing Reliable Microservices Under Dependency Failure", description: "Use deadlines, retries, circuit breakers, bulkheads, idempotency, graceful degradation, and observability together.", source: qa("system-design-reliability"), category: "System Design", keywords: ["microservices reliability", "circuit breaker retry", "distributed systems interview"] },
];

export const PUBLIC_ARTICLES = PUBLIC_ARTICLE_SEEDS.map((article) => ({
  ...article,
  summary: article.source?.answer || article.source?.diagnosis || article.description,
  body: article.source?.answer || article.source?.diagnosis || "Use the checklist below to explain the concept, test the failure mode, and communicate the trade-off.",
  star: article.source?.star || "Situation: a production system needed a reliable change. Task: protect correctness and user experience. Action: established a hypothesis, made a reversible change, tested normal and failure paths, and measured the result. Result: the service met its target and the prevention work was documented.",
  reviewedAt: "2026-08-27",
  author: "InterviewIQ Editorial Team",
  answerSteps: article.source?.triage || getJavaInterviewAnswerSteps(article.source?.id),
  internals: getJavaInterviewInternals(article.source?.id),
}));

export function getPublicArticle(slug) {
  return PUBLIC_ARTICLES.find((article) => article.slug === String(slug || "").toLowerCase()) || null;
}

export function getPublicArticleUrl(slug) {
  return `/java/${slug}`;
}

export const PUBLIC_RESOURCES = [
  { slug: "java-interview-cheat-sheet", title: "Java Interview Cheat Sheet", description: "A one-page refresher for collections, concurrency, JVM, Spring, SQL, and system design.", sections: ["Start with the contract and invariant.", "Explain internal mechanics before API usage.", "State time/space complexity and operational trade-offs.", "Finish with a measurable STAR result."] },
  { slug: "jvm-troubleshooting-runbook", title: "JVM Troubleshooting Runbook", description: "A practical decision tree for high CPU, memory growth, GC pressure, deadlocks, and slow requests.", sections: ["Confirm impact with latency, error rate, saturation, and traffic.", "Compare JVM, host, container, and dependency signals.", "Capture JFR, thread dumps, heap histograms, and traces safely.", "Mitigate reversibly, prove root cause, then add a regression guard."] },
  { slug: "kafka-incident-checklist", title: "Kafka Incident Checklist", description: "Use this checklist to diagnose lag, rebalancing, poison messages, duplicates, and partition skew.", sections: ["Check consumer group state, assignments, lag, and poll gaps.", "Separate broker, partition, consumer, and downstream symptoms.", "Quarantine poison messages and preserve replay metadata.", "Make handlers idempotent and monitor recovery slope."] },
  { slug: "spring-boot-production-checklist", title: "Spring Boot Production Checklist", description: "Review transaction boundaries, configuration, health checks, security, observability, and deployment safety.", sections: ["Prefer constructor injection and explicit ownership.", "Verify proxy boundaries for transactions, caching, and security.", "Bound pools, queues, retries, timeouts, and payload sizes.", "Test the packaged artifact and a realistic startup/readiness path."] },
  { slug: "sql-optimization-checklist", title: "SQL Query Optimization Checklist", description: "A compact workflow for slow queries, bad plans, missing indexes, and data-growth regressions.", sections: ["Capture the actual query, parameters, duration, and rows.", "Inspect the real execution plan and statistics.", "Check selectivity, sargability, join order, sorting, and pagination.", "Measure read improvement and write/storage cost before rollout."] },
  { slug: "dsa-pattern-poster", title: "DSA Pattern Recognition Poster", description: "Map common interview signals to hashing, windows, binary search, heaps, graphs, greedy, and DP.", sections: ["Contiguous range → sliding window or prefix sum.", "Monotonic answer space → binary search on the answer.", "Nearest greater/smaller → monotonic stack.", "Repeated subproblems → define DP state and transition.", "Shortest unweighted path → BFS."] },
  { slug: "star-answer-worksheet", title: "STAR Answer Worksheet", description: "Turn a real project incident into a concise, evidence-backed behavioral answer.", sections: ["Situation: what system, users, and impact were involved?", "Task: what responsibility and success target did you own?", "Action: what decisions, experiments, and trade-offs did you make?", "Result: what changed, by how much, and what did you learn?"] },
];

export function getPublicResource(slug) {
  return PUBLIC_RESOURCES.find((resource) => resource.slug === String(slug || "").toLowerCase()) || null;
}
