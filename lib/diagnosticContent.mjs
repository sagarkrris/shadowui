// Server-only assembly: send only five selected explanations, not entire banks.
import { readInterviewTopic } from './interviewTopicContent.mjs';
import { learningCatalogue } from './learningCatalog.mjs';
import { LEARNING_PATHS } from './learningHub.mjs';
import { PRACTICE_RUBRIC } from './dailyPractice.mjs';
import { CONCEPT_SOURCES, SYSTEM_DESIGN_CONCEPT_LESSONS } from './systemDesignConceptLessons.mjs';
import { DIAGNOSTIC_DOMAINS } from './diagnostic.mjs';

function bankFeedback(topic, group, example) {
  return { answer: group.questions[0].answer, mechanism: group.mechanism, example, tradeOff: group.tradeOff, verification: group.verify, followUp: { question: group.questions[1].question, answer: group.questions[1].answer }, sources: topic.sources };
}
export async function diagnosticContent() {
  const [{ topic: java, groups: javaGroups }, { topic: spring, groups: springGroups }] = await Promise.all([readInterviewTopic('java'), readInterviewTopic('spring-framework')]);
  const retry = SYSTEM_DESIGN_CONCEPT_LESSONS['Retry policy'];
  const feedback = {
    'java-jvm': bankFeedback(java, javaGroups[14], 'Assume a static request cache retains 1,000 completed sessions per minute without eviction. Those references remain reachable after collection. Inspect the retaining path and bound retention before treating heap size as the repair.'),
    concurrency: bankFeedback(java, javaGroups[9], 'Assume counter starts at 0. A reads 0, B reads 0, A writes 1, and B writes 1. Both increments finished, but the result is 1. Making each read and write visible does not combine them into one atomic increment.'),
    spring: bankFeedback(spring, springGroups[8], 'Assume proxy-based transaction management. An external call through the proxy starts the configured transaction. A self-call directly on the target does not independently invoke proxy advice; whether an outer transaction already exists must be checked separately.'),
    dsa: {
      answer: 'Binary search finds a target in sorted data by maintaining an interval that contains every remaining possible position. Compare the middle value with the target and discard only the half that sorted order proves cannot contain it. Continue until the target is found or the interval is empty. With constant-time indexed access and comparisons, the number of comparisons grows logarithmically. Sorting and access costs are separate from the search itself.',
      mechanism: 'An invariant is a condition preserved after each step. Here, any matching position remains inside the candidate interval. A smaller target cannot be to the right of a larger middle value in ascending order. Each valid comparison reduces the interval; an empty interval proves absence under that ordering assumption.',
      example: 'Assume 64 sorted unique integers, as in the lookup lab. Compare an absent target 65 with successive middle values. The interval shrinks to empty instead of reporting a false match. The lab counts comparisons; it does not measure database response time.',
      tradeOff: 'Binary search needs compatible sorted order and suitable access. Sorting a one-off unsorted input may cost more than scanning it once. Duplicate values need an explicit contract if the caller wants the first match or a range rather than any match.',
      verification: 'Trace the candidate interval for an empty input, one value, both endpoints, an absent target and duplicate values. Verify that every step reduces the interval while keeping every possible match. Include sort and access work when comparing end-to-end alternatives.',
      followUp: { question: 'Is binary search always preferable to a linear scan?', answer: 'No. A small or unsorted one-off input may favor a scan. Binary search helps when ordered data and access costs support it; repeated queries can justify preparing an index. Choose from the complete workload rather than the search-loop complexity alone.' },
      sources: [['Java 21 Arrays binarySearch contract', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html#binarySearch(int%5B%5D,int)']],
    },
    'system-design': { answer: retry.interviewAnswer, mechanism: `${retry.beginner} ${retry.mechanism}`, example: retry.example, tradeOff: retry.deepDive, verification: 'Simulate a response lost after commit, duplicate delivery, deadline exhaustion and process restart. Verify that the same operation identity does not create a second protected effect and that uncertain outcomes remain visible for reconciliation.', followUp: retry.followUp, sources: retry.sources.map(key => CONCEPT_SOURCES[key]) },
  };
  feedback['java-jvm'].answer = 'A Java object remains live while the application or runtime can still reach it through retaining references. A garbage collector cannot free an unneeded session while a static map still strongly retains it. I would trace the retaining path, compare the post-collection live set under a representative workload, and define the cache’s ownership, retention and eviction policy. Raising the heap limit may buy time, but it does not repair an unbounded retention rule. Allocation pressure and retention must be distinguished before changing collectors or memory settings.';
  feedback.concurrency.answer = 'volatile gives visibility and ordering for reads and writes of its variable, but an increment still combines a read, calculation and write. Two threads can both read 0 and both write 1, losing one increment. For an isolated shared count I would use an atomic increment; for a multi-field invariant I would protect the complete invariant with an appropriate lock or remove shared ownership. I would verify the invariant with concurrent tests rather than assuming a sleep establishes ordering. The added coordination can contend, so confinement is often the simpler alternative.';
  feedback.spring.answer = 'In default proxy-based Spring transaction management, transactional advice runs when an eligible call goes through the managed proxy. A self-call on the target bypasses that advice, so an inner annotation does not independently activate its requested transaction behavior; an outer transaction may already be active. I put a cohesive local database use case behind an explicit service boundary and test rollback through the actual proxy and transaction manager. A wider transaction can hold locks and connections longer, and it cannot automatically roll back a remote payment. I keep those remote outcomes under a separate idempotency and recovery contract.';
  feedback['java-jvm'].sources = [['Oracle Java 21: troubleshooting memory leaks', 'https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html']];
  feedback.concurrency.sources = [['JLS 21: happens-before order', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5'], ['AtomicInteger API', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html']];
  feedback.spring.sources = [['Spring Framework 6.2: transactional annotations', 'https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/annotations.html']];
  const courses = learningCatalogue();
  const domains = DIAGNOSTIC_DOMAINS.map(domain => {
    const course = courses.find(item => item.id === domain.course);
    const path = LEARNING_PATHS.find(item => item.id === domain.path);
    return { ...domain, feedback: feedback[domain.id], lesson: course ? { title: course.title, href: course.href } : { title: domain.id === 'dsa' ? 'Search comparison lab and explanation' : domain.title, href: domain.lessonHref }, path: { title: path.title, href: domain.path === 'java-backend' ? path.href : `/learn/roadmaps/${domain.path}` } };
  });
  return { domains, rubric: PRACTICE_RUBRIC };
}
