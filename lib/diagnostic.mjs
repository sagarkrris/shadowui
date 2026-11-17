export const DIAGNOSTIC_KEY = 'interviewiq.diagnostic.v1';
export const DIAGNOSTIC_VERSION = 1;
export const DIAGNOSTIC_BUDGETS = [15, 30, 60];
export const DIAGNOSTIC_DOMAINS = [
  { id: 'java-jvm', title: 'Java / JVM', gap: 'Reachability and retained memory', course: 'java-memory-management-evolution', lessonHref: '/senior-java-interview/topics/java', exerciseHref: '/labs/cache', exercise: 'Compare cache capacities 1 and 3, then sketch an eviction policy for a reachable request cache. Explain why a garbage collector cannot reclaim entries the application still retains.', path: 'java-backend' },
  { id: 'concurrency', title: 'Concurrency', gap: 'Visibility versus atomic updates', course: 'java-concurrency-interviews', lessonHref: '/senior-java-interview/topics/java', exerciseHref: '/labs/concurrency', exercise: 'Run the lost-update schedule with and without serialization. Trace both reads and writes; explain which compound operation must be atomic.', path: 'java-backend' },
  { id: 'spring', title: 'Spring', gap: 'Transaction proxy boundaries', course: 'spring-transactions-data-access', lessonHref: '/senior-java-interview/topics/spring-framework', exerciseHref: '/tech-blogs/spring-transactions-data-access#lesson-1', exercise: 'Complete the transaction lesson exercise. Draw the caller, proxy and service. Compare an external invocation with a self-invocation, then specify a rollback integration test.', path: 'java-backend' },
  { id: 'dsa', title: 'DSA', gap: 'Search invariants and complexity', lessonHref: '/labs/indexes', exerciseHref: '/labs/indexes', exercise: 'Compare lookup targets 1, 32 and absent target 65 in the 64-value model. Record comparison counts and explain why the sorted-order precondition matters; these are comparisons, not database latency.', path: 'java-backend' },
  { id: 'system-design', title: 'System design', gap: 'Ambiguous outcomes and safe retries', course: 'resilience-engineering', lessonHref: '/system-design/visual-guide', exerciseHref: '/build/practice/idempotent-consumer', exercise: 'Complete the local deduplication exercise, then explain what process restart or multiple replicas change. State the durable identity, retry budget and reconciliation policy a real payment workflow needs.', path: 'system-design' },
];
const question = (domain, prompt, choices, correct, rationale) => ({ id: `${domain}-baseline`, domain, prompt, choices, correct, rationale });
export const DIAGNOSTIC_QUESTIONS = [
  question('java-jvm', 'A static map keeps every completed request and grows after full garbage collections. What should you investigate first?', ['Increase the heap until the symptom disappears.', 'Find the retaining path and define a bounded retention or eviction policy.', 'Make each map value volatile.', 'Assume full collection must reclaim every completed request.'], 1, 'The static map remains reachable, so its retained entries can remain live. A larger heap delays exhaustion without defining when data may be released.'),
  question('concurrency', 'Two threads each execute counter++ once on the same volatile int initially 0. Without other coordination, which conclusion is valid?', ['The final value must be 2.', 'volatile prevents the two reads from observing the same value.', 'The final value must be 0.', 'An increment can be lost because read-modify-write is not atomic.'], 3, 'volatile supplies visibility and ordering, but counter++ reads, adds and writes. Both threads can read 0 and both write 1.'),
  question('spring', 'In default proxy-based Spring transaction management, a method calls another @Transactional method on this. What boundary matters?', ['The self-call does not cross the transaction proxy and does not independently activate its advice.', 'Every annotated method invocation creates an independent transaction.', 'Private methods always create a new transaction.', 'A database transaction automatically rolls back remote HTTP effects.'], 0, 'In default proxy mode the interceptor runs on calls through the proxy. A self-call on the target bypasses that boundary; an already active outer transaction is a separate question.'),
  question('dsa', 'Why can binary search discard half of a sorted search interval after one comparison?', ['It inspects every value before discarding anything.', 'A hash function guarantees every comparison is constant time.', 'Sorted order proves the target cannot be in the discarded half.', 'It works the same way on any unsorted input.'], 2, 'The sorted-order invariant lets a comparison eliminate an entire range. Without that precondition, the discarded range may contain the target.'),
  question('system-design', 'A payment request times out after the provider may have committed it. What is the safest next design step?', ['Create a fresh payment identity and retry immediately.', 'Treat the result as unknown; reuse the operation identity and reconcile under a bounded retry policy.', 'Report that the payment definitely failed.', 'Retry forever until a response arrives.'], 1, 'Losing the acknowledgement does not establish whether the provider committed. Stable identity and reconciliation prevent an uncertain response from becoming an unbounded duplicate effect.'),
];
export const DIAGNOSTIC_RETESTS = [
  { ...question('java-jvm', 'A reachable listener registry keeps closed sessions. Which change addresses retention?', ['Ask the collector to ignore reachable sessions.', 'Only increase maximum heap.', 'Remove listeners at their lifecycle boundary and verify the retaining path disappears.', 'Replace session IDs with longer strings.'], 2, 'Reachability follows the registry references. Releasing listeners at the owner’s lifecycle boundary addresses the retention cause; verify retained objects after representative work.'), id: 'java-jvm-retest' },
  { ...question('concurrency', 'A shared count needs an exact atomic increment but no multi-field invariant. Which primitive fits?', ['AtomicInteger.incrementAndGet, with the rest of the workflow considered separately.', 'An ordinary int with a comment.', 'Reading a volatile int twice.', 'Sleeping before writing the updated value.'], 0, 'The atomic increment protects this one read-modify-write operation. It does not make unrelated multi-step business workflows atomic.'), id: 'concurrency-retest' },
  { ...question('spring', 'An external caller invokes a public transactional service through its Spring proxy. Which check belongs in a real rollback test?', ['Only check that the annotation text exists.', 'Only verify a mocked repository was called.', 'Assume a remote charge rolls back with the database.', 'Use the configured transaction manager and real database boundary to verify persisted state after the intended failure.'], 3, 'Rollback is observable in transaction and database state, not annotation presence or mock invocations. Verify the actual exception/rollback rules and separate remote effects.'), id: 'spring-retest' },
  { ...question('dsa', 'A sorted list has 64 unique values and the requested key is absent. What should a binary-search trace preserve?', ['The target must be returned from the middle.', 'Every remaining candidate lies inside a shrinking interval until it is empty.', 'All 64 elements must always be compared.', 'Sorting becomes irrelevant for absent keys.'], 1, 'Each comparison preserves the candidate interval invariant and reduces its size. An empty interval establishes absence under the sorted-order assumption.'), id: 'dsa-retest' },
  { ...question('system-design', 'A deduplication set exists only in one worker’s memory. What happens after restart or on another replica?', ['It guarantees global exactly-once effects forever.', 'The queue no longer needs acknowledgements.', 'Other workers or a restarted process may not remember the identity; durable coordination or an explicit weaker contract is needed.', 'A longer timeout makes the set durable.'], 2, 'Local memory is neither durable nor automatically shared. Scope the guarantee to one process, or persist and atomically coordinate identities with the protected effect.'), id: 'system-design-retest' },
];
const knownQuestions = [...DIAGNOSTIC_QUESTIONS, ...DIAGNOSTIC_RETESTS];
export function normalizeDiagnostic(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return null;
  const answers = {};
  for (const question of knownQuestions) {
    const answer = value.answers?.[question.id];
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) continue;
    const choice = Number.isInteger(answer.choice) && answer.choice >= 0 && answer.choice < question.choices.length ? answer.choice : null;
    answers[question.id] = { choice, note: typeof answer.note === 'string' ? answer.note.slice(0, 1200) : '' };
  }
  return { version: 1, answers, minutes: DIAGNOSTIC_BUDGETS.includes(value.minutes) ? value.minutes : 30, completed: value.completed === true };
}
export function newDiagnostic() { return normalizeDiagnostic({ version: 1 }); }
export function diagnosticEvidence(value) {
  const state = normalizeDiagnostic(value) || newDiagnostic();
  return DIAGNOSTIC_DOMAINS.map(domain => {
    const question = DIAGNOSTIC_QUESTIONS.find(item => item.domain === domain.id);
    const answer = state.answers[question.id];
    const retest = DIAGNOSTIC_RETESTS.find(item => item.domain === domain.id);
    const retestAnswer = state.answers[retest.id];
    const observed = answer?.choice !== null && answer?.choice !== undefined;
    const retestObserved = retestAnswer?.choice !== null && retestAnswer?.choice !== undefined;
    return { ...domain, question, answer: answer || { choice: null, note: '' }, status: !observed ? 'Not observed' : answer.choice === question.correct ? 'Baseline correct' : 'Review suggested', retest, retestAnswer: retestAnswer || null, retestStatus: !retestObserved ? 'Not attempted' : retestAnswer.choice === retest.correct ? 'Retest correct' : 'Review again' };
  });
}
export function diagnosticPlan(value) {
  const state = normalizeDiagnostic(value) || newDiagnostic();
  const rank = item => item.retestStatus === 'Review again' ? 0 : item.retestStatus === 'Retest correct' ? 4 : item.status === 'Review suggested' ? 1 : item.status === 'Not observed' ? 2 : 3;
  const domains = diagnosticEvidence(state).sort((a, b) => rank(a) - rank(b));
  let elapsed = 0;
  const milestones = domains.map(domain => {
    const start = Math.floor(elapsed / state.minutes) + 1;
    elapsed += 45;
    return { domain: domain.id, title: domain.title, minutes: 45, startSession: start, endSession: Math.ceil(elapsed / state.minutes), activities: [{ label: 'Learn', minutes: 15 }, { label: 'Exercise', minutes: 20 }, { label: 'Retest and explain', minutes: 10 }] };
  });
  return { dailyMinutes: state.minutes, totalMinutes: elapsed, sessions: Math.ceil(elapsed / state.minutes), milestones };
}
export function diagnosticExport(value) {
  const state = normalizeDiagnostic(value);
  if (!state) throw new Error('Unsupported diagnostic format');
  return JSON.stringify({ ...state, scope: 'Optional local knowledge sample; not a hiring prediction or independently verified skill assessment.', evidence: diagnosticEvidence(state), plan: diagnosticPlan(state) }, null, 2);
}
