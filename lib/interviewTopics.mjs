export const INTERVIEW_STAGES = [
  { id: 'foundations', title: 'Foundations', description: 'Vocabulary, purpose and the core contract.' },
  { id: 'applied', title: 'Applied reasoning', description: 'Choose an approach for a concrete use case.' },
  { id: 'internals', title: 'Internals and boundaries', description: 'Explain the mechanism and its limits.' },
  { id: 'failures', title: 'Failure scenarios', description: 'Diagnose incorrect assumptions and real failures.' },
  { id: 'deep-dive', title: 'Deep dive and verification', description: 'Defend the trade-off and prove the behavior.' },
];

export const INTERVIEW_TOPICS = [
  { slug: 'java', title: 'Java', count: 250, minimum: 100, baseline: 'Java 21; preview features are identified explicitly.', description: 'Language, OOP, strings, collections, generics, streams, concurrency, JVM, I/O, networking, modules, reflection and API design.', sources: [
    ['Java 21 API', 'https://docs.oracle.com/en/java/javase/21/docs/api/'], ['Java language specification', 'https://docs.oracle.com/javase/specs/jls/se21/html/index.html'], ['Virtual threads', 'https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html'],
  ] },
  { slug: 'spring-framework', title: 'Spring Framework', count: 150, minimum: 100, baseline: 'Spring Framework 6.2 on Java 21.', description: 'DI, lifecycle, AOP, transactions, MVC, WebFlux and annotation internals: discovery, metadata, post-processors and proxies.', sources: [
    ['Spring Framework 6.2', 'https://docs.spring.io/spring-framework/reference/6.2/'], ['Component scanning', 'https://docs.spring.io/spring-framework/reference/6.2/core/beans/classpath-scanning.html'], ['Java configuration', 'https://docs.spring.io/spring-framework/reference/6.2/core/beans/java/basic-concepts.html'], ['Proxy behavior', 'https://docs.spring.io/spring-framework/reference/6.2/core/aop/proxying.html'],
  ] },
  { slug: 'spring-boot', title: 'Spring Boot', count: 130, minimum: 100, baseline: 'Spring Boot 3.5 with its aligned Spring dependencies on Java 21.', description: 'Startup, auto-configuration, conditional annotations, typed configuration, test slices, Actuator, packaging, AOT and operations.', sources: [
    ['Boot 3.5 reference', 'https://docs.spring.io/spring-boot/3.5/reference/'], ['SpringBootApplication API', 'https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/autoconfigure/SpringBootApplication.html'], ['Auto-configuration development', 'https://docs.spring.io/spring-boot/3.5/reference/features/developing-auto-configuration.html'],
  ] },
  { slug: 'microservices', title: 'Microservices', count: 130, minimum: 100, baseline: 'Architecture patterns; infrastructure guarantees depend on the selected implementation.', description: 'Boundaries, APIs, sagas, outbox/inbox, idempotency, CQRS, event sourcing, gateways, BFF, Strangler Fig, sidecars and reliability.', sources: [
    ['Microservices pattern language', 'https://microservices.io/patterns/'], ['Transactional outbox', 'https://microservices.io/patterns/data/transactional-outbox.html'], ['Saga', 'https://microservices.io/patterns/data/saga.html'],
  ] },
  { slug: 'hibernate', title: 'Hibernate', count: 140, minimum: 100, baseline: 'Hibernate ORM 6.6 / Jakarta Persistence; verify the actual database dialect.', description: 'Entity lifecycle, persistence contexts, mapping annotations, ownership, fetching, locking, batching, caching and generated SQL.', sources: [
    ['Hibernate ORM 6.6 user guide', 'https://docs.hibernate.org/orm/6.6/userguide/html_single/'], ['Jakarta Persistence 3.1 specification', 'https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1.html'],
  ] },
  { slug: 'sql', title: 'SQL', count: 100, minimum: 100, baseline: 'PostgreSQL 17 for dialect-specific behavior; SQL portability is qualified in the answers.', description: 'Modeling, nulls, joins, aggregates, windows, indexes, plans, isolation, locks, migrations, query safety and recovery.', sources: [
    ['PostgreSQL 17', 'https://www.postgresql.org/docs/17/index.html'], ['Transaction isolation', 'https://www.postgresql.org/docs/17/transaction-iso.html'], ['Query plans', 'https://www.postgresql.org/docs/17/using-explain.html'],
  ] },
  { slug: 'micronaut', title: 'Micronaut', count: 170, minimum: 100, baseline: 'Micronaut Framework 4.x / Java 21. Modules have separate versions; align the platform BOM.', description: 'Spring comparisons, generated DI/AOP metadata, scopes, factories, conditions, HTTP execution, serialization and annotation internals.', sources: [
    ['Micronaut 4.9.7 API', 'https://docs.micronaut.io/4.9.7/api/'], ['Around advice', 'https://docs.micronaut.io/4.9.1/api/io/micronaut/aop/Around.html'], ['InterceptorBean', 'https://docs.micronaut.io/4.9.7/api/io/micronaut/aop/InterceptorBean.html'], ['Micronaut Data', 'https://micronaut-projects.github.io/micronaut-data/latest/guide/'],
  ] },
  { slug: 'gcp', title: 'GCP', count: 100, minimum: 0, baseline: 'Google Cloud conceptual service contracts, reviewed 15 October 2026; verify current product options, limits and prices.', description: 'IAM, identity, networking, compute, Cloud Run, GKE, storage, databases, Pub/Sub, observability, deployment and recovery.', sources: [
    ['Google Cloud documentation', 'https://docs.cloud.google.com/docs'], ['Cloud Run', 'https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run'], ['Pub/Sub exactly-once scope', 'https://docs.cloud.google.com/pubsub/docs/exactly-once-delivery'],
  ] },
  { slug: 'redis', title: 'Redis', count: 50, minimum: 0, baseline: 'Redis 7.x concepts; newer command options are not assumed. Check the deployed version and provider.', description: 'Structures, TTL, eviction, caching, atomicity, scripts, leases, persistence, replication, clustering, streams and operations.', sources: [
    ['Redis development', 'https://redis.io/docs/latest/develop/'], ['Transactions', 'https://redis.io/docs/latest/develop/using-commands/transactions/'], ['Lua execution', 'https://redis.io/docs/latest/develop/programmability/eval-intro/'], ['Distributed-lock assumptions', 'https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/'],
  ] },
  { slug: 'kafka', title: 'Kafka', count: 50, minimum: 0, baseline: 'Apache Kafka 4.1 concepts; framework acknowledgment defaults must be checked separately.', description: 'Partitions, replication, producers, transactions, groups, offsets, retention, schemas, poison messages, security and operations.', sources: [
    ['Kafka 4.1 design', 'https://kafka.apache.org/41/design/design/'], ['Kafka 4.1 operations', 'https://kafka.apache.org/41/operations/'],
  ] },
];

export function topicHref(slug) { return `/senior-java-interview/topics/${slug}`; }
export function interviewQuestionId(slug, groupIndex, questionIndex) {
  return `${slug}-${String(groupIndex * 5 + questionIndex + 1).padStart(3, '0')}`;
}
export function selectInterviewQuestions(groups, { stage = 'all', query = '', annotations = false } = {}) {
  const words = query.trim().toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
  return INTERVIEW_STAGES.flatMap((level, questionIndex) => groups.flatMap((group, groupIndex) => {
    if (stage !== 'all' && stage !== level.id) return [];
    if (annotations && group.kind !== 'annotation') return [];
    const question = group.questions[questionIndex];
    if (!question) return [];
    const haystack = `${group.title} ${question.question} ${question.answer} ${group.mechanism}`.toLocaleLowerCase('en');
    if (!words.every(word => haystack.includes(word))) return [];
    return [{ groupIndex, questionIndex, stage: level.id, stageTitle: level.title }];
  }));
}
