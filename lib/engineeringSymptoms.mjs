import { JAVA_SPRING_SYMPTOMS } from "./javaSpringSymptoms.mjs";
import { SYMPTOM_LEARNING_PATHS } from "./symptomLearningPaths.mjs";
const ORIGINAL_SYMPTOMS = [
  {
    slug: 'low-cpu-slow-requests', title: 'CPU is low, but requests are slow', category: 'Latency',
    summary: 'Separate time spent waiting from time spent executing before adding CPU capacity.',
    aliases: 'idle processor latency timeout thread pool connection queue stalled bottleneck',
    observations: 'End-to-end latency rises while aggregate CPU stays low. This does not identify the resource being waited on; a single saturated core may also be hidden by the average.',
    firstStep: 'For one slow request, separate queue time, connection acquisition, dependency calls, and execution time. Compare with a healthy request from the same endpoint.',
    causes: [
      { title: 'Worker or connection pool saturation', evidence: 'Pending requests grow while all available slots are occupied. Wait stacks or acquisition spans account for the delay.', against: 'Slots remain available and acquisition time is short during the slow interval.', next: 'Find what holds the occupied slots. Inspect pool occupancy, queue age, and request deadlines before changing the limit.' },
      { title: 'A slow downstream dependency', evidence: 'An outbound span dominates the request and aligns with the dependency’s observed response time.', against: 'Outbound calls are fast; the delay happens before dispatch or after the response.', next: 'Trace the same request across the boundary and distinguish network, service, and database time.' },
      { title: 'Lock contention or a misleading CPU average', evidence: 'Repeated thread samples show the same lock owner, or per-core/process measurements reveal a busy execution thread hidden by host averages.', against: 'Samples show neither sustained lock waits nor concentrated CPU activity.', next: 'Compare repeated stack samples and per-core CPU over the incident interval; one snapshot is insufficient.' },
    ],
    fixture: 'waiting-worker.py', expected: 'Worker: waiting; second request: queued\nRelease the wait: both requests complete',
    fixtureScope: 'Python 3, standard library. A one-worker pool waits on an event while a second task queues. It demonstrates waiting and queueing, not measured CPU utilization, a real connection pool, or a network outage.',
    related: [{ href: '/explain-log/blocked-pool-thread-dump', title: 'Decode a blocked-pool thread dump' }],
    references: [{ href: 'https://docs.python.org/3/library/concurrent.futures.html', title: 'Python: executor scheduling and waiting' }],
  },
  {
    slug: 'query-slower-after-index', title: 'The query became slower after adding an index', category: 'Databases',
    summary: 'Compare access paths and workload conditions instead of assuming that an index must help every query.',
    aliases: 'sql database postgres sqlite index indexes indexed slower regression scan planner selectivity query performance',
    observations: 'Latency increased after an index change. Timing alone does not establish whether the index, changed data, parameter values, contention, or cache state caused it.',
    firstStep: 'Capture before/after plans for the same query parameters and representative data. Compare rows visited, estimates versus actual rows, I/O, and waiting under comparable load.',
    causes: [
      { title: 'A less selective access path', evidence: 'The new plan visits many candidates or performs many table lookups to return few rows.', against: 'The plan and amount of work are unchanged while time is spent waiting elsewhere.', next: 'Check filter selectivity and index column order. Compare a representative alternative without forcing a production-wide plan.' },
      { title: 'Estimates no longer match the data', evidence: 'Estimated cardinalities diverge from actual rows, especially for skewed values or changed data distributions.', against: 'Estimates are close and the chosen path performs the expected amount of work.', next: 'Inspect statistics and compare common versus unusual parameter values using your database’s plan tooling.' },
      { title: 'Write maintenance, locking, or cold I/O', evidence: 'Write load, waits, or physical reads increased around the change; the query plan alone does not explain elapsed time.', against: 'Equivalent warm-cache runs without concurrent writes reproduce a larger amount of query work.', next: 'Separate index-build effects from ongoing maintenance and compare waiting/I/O with execution work.' },
    ],
    fixture: 'index-work.py', expected: 'Same result: 100 rows\nBroad index path: 10000 filter evaluations\nTenant index path: 100 filter evaluations',
    fixtureScope: 'Python 3 with bundled SQLite. Two deliberately forced paths show different filter work for the same result. The probe changes query optimization and the paths are explicitly selected; this is not proof that adding an index makes SQLite or PostgreSQL choose a worse plan, nor a latency benchmark.',
    related: [{ href: '/explain-log/slow-orders-query-plan', title: 'Decode a slow query plan' }, { href: '/detective/the-cost-of-a-faster-query', title: 'Investigate the cost of a faster query' }],
    references: [{ href: 'https://www.sqlite.org/queryplanner.html', title: 'SQLite: query planning and multi-column indexes' }, { href: 'https://www.postgresql.org/docs/18/using-explain.html', title: 'PostgreSQL 18: using EXPLAIN' }],
  },
  {
    slug: 'messages-processed-twice', title: 'Messages are processed twice', category: 'Messaging',
    summary: 'Distinguish redelivery, duplicate publishing, and overlapping consumers before changing acknowledgement behavior.',
    aliases: 'duplicate duplicated double twice repeated message event broker retry retries redelivery idempotent idempotency payment',
    observations: 'A business effect happened twice. Two log lines may represent two attempts or duplicate logging; first confirm the persisted business result.',
    firstStep: 'Correlate the business operation ID, message/event ID, delivery attempt, transaction commit, and acknowledgement. Check whether both attempts used the same stable identity.',
    causes: [
      { title: 'Commit succeeded but acknowledgement was lost', evidence: 'The same event is delivered again after its effect committed, following a disconnect or consumer failure.', against: 'The two effects use different event identities and no redelivery occurred.', next: 'Check the commit/ack ordering and make replay of the same business operation safe.' },
      { title: 'Producer retried with a new identity', evidence: 'Distinct message IDs refer to the same business request after an uncertain publish outcome.', against: 'One published event ID is being redelivered unchanged.', next: 'Preserve a stable business idempotency key across producer retries; transport IDs alone may not identify the operation.' },
      { title: 'Concurrent attempts raced through a check', evidence: 'Two handlers both observe “not processed” before either records completion.', against: 'The deduplication claim and effect are serialized atomically under an enforced unique key.', next: 'Use a durable uniqueness boundary and coordinate it with the effect. External calls need their own idempotency or recovery design.' },
    ],
    fixture: 'duplicate-delivery.py', expected: 'Without deduplication: 20\nAtomic marker + effect: 10',
    fixtureScope: 'Python 3 with bundled SQLite. Sequential duplicate deliveries model the commit-before-ack window. A unique event marker and database effect share one transaction. This does not test broker behavior, concurrent consumers, or exactly-once external payments.',
    related: [{ href: '/explain-log/retrying-http-exchange', title: 'Decode a retrying HTTP exchange' }, { href: '/detective/the-service-that-drowned-in-retries', title: 'Investigate a retry storm' }],
    references: [{ href: 'https://www.rabbitmq.com/docs/reliability', title: 'RabbitMQ: acknowledgements, redelivery, and idempotence' }],
  },
];
export const SYMPTOMS = [...ORIGINAL_SYMPTOMS, ...JAVA_SPRING_SYMPTOMS].map(entry => ({
  ...entry,
  learningPath: SYMPTOM_LEARNING_PATHS[entry.slug],
  reviewedAt: '2026-09-18',
  language: entry.fixture.endsWith('.java') ? 'Java' : 'Python',
  runtime: entry.fixture.endsWith('.java') ? 'Temurin OpenJDK 21.0.9; compiled with --release 8' : entry.fixture === 'waiting-worker.py' ? 'Python 3.13.5' : 'Python 3.13.5 and SQLite 3.51.1',
  applicability: entry.category === 'Spring' ? 'Java / Spring proxy-based applications; verify framework configuration and version-specific behavior.' : 'Java/Spring backend diagnosis; the reproduction isolates the stated mechanism.',
}));
export const SYMPTOM_CATEGORIES = ['All', ...new Set(SYMPTOMS.map(entry => entry.category))];
const STOP_WORDS = new Set('a an the is are was were but and or after before became becomes my our why with for of to in it i have has'.split(' '));
const ALIASES = { slower: 'slow', slowly: 'slow', latency: 'slow', duplicates: 'duplicate', duplicated: 'duplicate', twice: 'duplicate', double: 'duplicate', messages: 'message', requests: 'request', indexes: 'index', indexed: 'index', queries: 'query', processed: 'processing', processing: 'processing' };
function terms(value) {
  return String(value || '').toLowerCase().normalize('NFKC').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(word => word && !STOP_WORDS.has(word)).map(word => ALIASES[word] || word);
}
export function searchSymptoms(query = '', category = 'All') {
  const needles = [...new Set(terms(String(query).slice(0, 200)))];
  return SYMPTOMS.filter(entry => category === 'All' || entry.category === category).map(entry => {
    const title = terms(entry.title), haystack = new Set(terms([entry.title, entry.summary, entry.aliases, entry.applicability, entry.observations, ...entry.causes.map(cause => `${cause.title} ${cause.evidence}`)].join(' ')));
    return { entry, matched: needles.filter(term => haystack.has(term)).length, score: needles.reduce((sum, term) => sum + (title.includes(term) ? 3 : haystack.has(term) ? 1 : 0), 0) };
  }).filter(result => !needles.length || result.matched === needles.length).sort((a, b) => b.score - a.score).map(result => result.entry);
}
