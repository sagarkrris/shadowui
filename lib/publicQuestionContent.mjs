// Build-time content assembly. Keep canonical question banks out of navigation bundles.
import { readInterviewTopic } from './interviewTopicContent.mjs';
import { INTERVIEW_TOPICS } from './interviewTopics.mjs';
import { CONCEPT_SOURCES, SYSTEM_DESIGN_CONCEPT_LESSONS } from './systemDesignConceptLessons.mjs';
import { PUBLIC_INTERVIEW_LESSONS, STACK_GUIDE_LESSONS } from './publicInterviewLessons.mjs';

const EXAMPLES = {
  java: [
    'Assume a method receives a list containing 1. Appending 2 changes that shared list; assigning a new list to the parameter does not replace the caller’s variable.',
    'Two separate CustomerKey values for customer 7 must find the same mapping when the key contract defines equality by customer ID.',
    'A list can contain the same order twice, a set deduplicates it by equality, and a map associates its ID with the current order value.',
    'A deliberately colliding non-Comparable key type still needs equality checks; a tree-shaped bucket is not a universal logarithmic lookup guarantee.',
    'A List<Integer> cannot be passed as List<Number>, because that would allow a Double to enter an integer-only list.',
    'If parsing throws while a file is open, try-with-resources closes the declared file resource; a close failure is suppressed behind the primary failure.',
    'A record that contains a mutable list is not deeply immutable. Copy the retained list when caller mutation would violate the record’s contract.',
    'A filter/map pipeline does not itself produce a list; a terminal operation drives traversal, and side effects must not rely on incidental evaluation.',
    'A lookup can return Optional.empty for a missing product, while a database outage must remain a different error outcome.',
    'Two threads incrementing one volatile int can both read 7 and both write 8. Visibility does not make the compound increment atomic.',
    'A balance transfer changes two related balances; protecting each independent field separately does not automatically conserve the combined invariant.',
    'Assume four workers and a queue of eight tasks. Work beyond that finite capacity needs a deliberate rejection or backpressure policy.',
    'Timing out a derived future may stop waiting for an optional recommendation while the underlying remote work still needs its own cancellation/timeout policy.',
    'Ten thousand waiting virtual threads do not create ten thousand database connections. Admission still respects a bounded database pool.',
    'A reachable static map that retains every request ID can grow after each full collection; reclamation cannot remove entries the application still retains.',
  ],
  'spring-boot': [
    'A Spring service can run without Spring Boot; Boot assembles conventions and configured defaults around the underlying framework.',
    'A command-line startup failure can occur before any HTTP server is ready, so the first causal exception matters more than later cleanup messages.',
    'A user-defined datasource bean can make a matching auto-configuration back off. The condition report explains the selected path.',
    'Overriding one Jackson artifact independently of Boot’s aligned dependency set can create a runtime method mismatch despite successful compilation.',
    'A deployment-provided property can change an endpoint or timeout without changing the packaged application artifact; property precedence must be verified.',
    'A typed duration property is still invalid when it is negative. Startup validation should reject that configuration before serving traffic.',
    'The test and production profiles can select different beans. A passing test profile does not prove production wiring.',
    'Using a reactive HTTP server does not make a blocking JDBC call non-blocking; the actual work and execution context still determine occupancy.',
    'A management endpoint that exposes environment details requires an explicit access policy rather than assuming its URL is private.',
    'An application can be alive yet not ready to receive checkout traffic while its required local startup work is incomplete.',
    'A slow request trace can separate connection acquisition from query execution, while bounded metric labels avoid a series per customer ID.',
    'A web slice can prove JSON validation behavior but does not by itself prove a real database transaction rolls back.',
    'A transaction test using the deployed database dialect catches behavior that an in-memory substitute may not reproduce.',
    'An authenticated request for another tenant’s invoice must still be denied by the resource-owning authorization policy.',
    'A container image must contain the runtime artifact and receive signals correctly; a successful JAR build alone does not prove container startup.',
  ],
  sql: [
    'An order line refers to an existing order by a foreign key. A uniqueness constraint can separately prevent duplicate business identifiers.',
    'For a row whose team_id is NULL, team_id != 1 is unknown and does not pass WHERE. Include IS NULL if unassigned rows belong in the result.',
    'Selecting only name changes output columns; WHERE salary >= 70 changes retained rows. These operations answer different parts of the contract.',
    'Joining one order to three lines yields three joined rows; counting those rows is not the same as counting unique orders.',
    'COUNT(*) counts every input row; COUNT(email) excludes NULL email values. On an empty input their counts are zero.',
    'A CTE can name a complicated query stage, but its physical execution and materialization depend on the database version and query plan.',
    'ROW_NUMBER with a unique time/ID order assigns positions without collapsing rows, unlike grouping them into one aggregate result.',
    'A tenant_id, created_at, id index can support a tenant’s ordered feed; a different unfiltered access pattern may need a different plan.',
    'Filtering an indexed timestamp by a directly bounded range may avoid the work of applying a function to every row; inspect the actual plan.',
    'A plan estimating ten rows while processing one million suggests selectivity/statistics assumptions worth investigating before adding hardware.',
    'A transfer’s debit and credit commit together in one local transaction; a remote notification needs an outbox or a separate recovery contract.',
    'Two transactions can both observe no matching reservation before either inserts one. Visibility alone does not establish the business invariant.',
    'Two transactions locking accounts in opposite order can deadlock. A consistent lock order reduces that path; deadlock retries still need a safe policy.',
    'Two workers racing to create the same business key need a database uniqueness rule, not only a pre-insert application lookup.',
    'A feed ordered by created_at and unique id can seek after the last cursor. A timestamp alone does not deterministically order equal-time rows.',
    'An amount stored in integer minor units still needs currency and overflow rules; a timestamp needs an explicit instant/time-zone interpretation.',
    'Add a compatible column, deploy readers/writers that tolerate both shapes, backfill with verification, then remove the old contract later.',
    'A customer ID is bound as a value parameter; a requested sort-column identifier is chosen from an allowlist instead of concatenating arbitrary input.',
    'A table with substantial churn can retain dead tuples and stale statistics; maintenance and storage behavior must be observed on the actual engine.',
    'A successful backup job does not prove that the application can restore and reconcile the required point in time within its recovery objective.',
  ],
};

function bankQuestion(topic, group, questionIndex, index, example) {
  const question = group.questions[questionIndex];
  const followUp = group.questions[(questionIndex + 1) % group.questions.length];
  return {
    id: `${topic.slug}-public-${index + 1}`,
    question: question.question,
    answer: question.answer,
    mechanism: group.mechanism,
    example,
    tradeOff: group.tradeOff,
    verification: group.verify,
    followUp: { question: followUp.question, answer: followUp.answer },
    sources: topic.sources,
    href: `/senior-java-interview/topics/${topic.slug}`,
  };
}

async function bankQuestions(slug, count, excluded = new Set()) {
  const { topic, groups } = await readInterviewTopic(slug);
  // Use distinct subjects before asking another depth variant of a subject.
  return groups.slice(0, count).map((group, index) => bankQuestion(topic, group, excluded.has(group.questions[0].question) ? 1 : 0, index, EXAMPLES[slug][index]));
}

function conceptQuestion(name, question) {
  const content = SYSTEM_DESIGN_CONCEPT_LESSONS[name];
  return {
    id: `system-design-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    question: question || `What does ${name.toLowerCase()} mean, and how would you verify it?`,
    answer: content.interviewAnswer,
    mechanism: `${content.beginner} ${content.mechanism}`,
    example: content.example,
    tradeOff: content.deepDive,
    verification: content.deepDive,
    followUp: content.followUp,
    sources: content.sources.map(key => CONCEPT_SOURCES[key]),
    href: '/system-design/visual-guide',
  };
}

const SYSTEM_QUESTIONS = [
  ['Capacity planning', 'How do you start a system design interview?'],
  ['Cache', 'When should you use a cache?'],
  ['Retry policy', 'How do retries cause outages?'],
  ['Relational database', 'SQL or NoSQL?'],
  ['API gateway', 'What makes an API reliable?'],
  ...['Scalability', 'Availability', 'Latency', 'Throughput', 'SLO', 'Error budget', 'Load balancer', 'CDN', 'DNS', 'Index', 'Replication', 'Sharding', 'Partition key', 'Consistency model', 'Message queue'].map(name => [name]),
];

export async function completePublicListicle(listicle) {
  if (!listicle) return null;
  const count = listicle.vertical === 'sql' ? 25 : 20;
  let questions;
  if (PUBLIC_INTERVIEW_LESSONS[listicle.vertical]) {
    questions = PUBLIC_INTERVIEW_LESSONS[listicle.vertical].slice(0, count);
  } else if (listicle.vertical === 'system-design') {
    questions = SYSTEM_QUESTIONS.map(([name, question]) => conceptQuestion(name, question));
  } else {
    const slug = listicle.vertical === 'spring' ? 'spring-boot' : listicle.vertical;
    const additions = await bankQuestions(slug, count - listicle.questions.length, new Set(listicle.questions.map(item => item.question)));
    const topic = INTERVIEW_TOPICS.find(item => item.slug === slug);
    // Keep the established accordion questions and deep links, adding the same
    // worked depth used by the canonical topic rather than inventing variants.
    const originalGroups = {
      java: [3, 10, 9, 14, 5],
      spring: [0, 12, 2, 15, 11],
      sql: [7, 11, 9, 14, 12],
    };
    const { groups } = await readInterviewTopic(slug);
    const springFramework = await readInterviewTopic('spring-framework');
    const originals = listicle.questions.map((item, index) => {
      const groupIndex = originalGroups[listicle.vertical][index];
      const group = groups[groupIndex];
      const example = EXAMPLES[slug][groupIndex] || 'An interrupted in-flight request must leave a recoverable outcome rather than silently claiming completion.';
      const enriched = bankQuestion(topic, group, 0, count + index, example);
      const isTransaction = (listicle.vertical === 'java' && index === 4) || (listicle.vertical === 'spring' && index === 1);
      const correction = isTransaction ? bankQuestion(springFramework.topic, springFramework.groups[8], 0, count + index, 'An externally invoked checkout service method writes an order and outbox row in one local transaction. A self-call within the same proxy target does not independently trigger transactional advice.') : listicle.vertical === 'spring' && index === 0 ? bankQuestion(springFramework.topic, springFramework.groups[1], 0, count + index, 'An OrderService constructor requires a PaymentPort. A unit test can pass a deterministic fake without starting Spring.') : listicle.vertical === 'spring' && index === 3 ? conceptQuestion('Timeout budget') : {}; 
      return { ...enriched, ...correction, ...item, answer: item.answer.replace('Mention immutable keys and the O(1) average versus collision worst case.', 'Stable keys preserve lookup behavior. Expected constant-time operations are not an unconditional worst-case guarantee.') };
    });
    questions = [...originals, ...additions];
  }
  if (questions.length !== count || new Set(questions.map(item => item.question)).size !== count) {
    throw new Error(`Incomplete public question list: ${listicle.slug}`);
  }
  return { ...listicle, questions, questionCount: count };
}

export async function completePublicStackGuide(guide) {
  if (!guide) return null;
  let questions = STACK_GUIDE_LESSONS[guide.stack] || PUBLIC_INTERVIEW_LESSONS[guide.stack]?.slice(0, 5);
  if (guide.stack === 'sql') {
    const { topic, groups } = await readInterviewTopic('sql');
    questions = [3, 7, 11].map(index => bankQuestion(topic, groups[index], 0, index, EXAMPLES.sql[index]));
  }
  if (!questions?.length) throw new Error(`Missing guide questions: ${guide.slug}`);
  return { ...guide, questions, reviewedAt: '2026-11-17' };
}
