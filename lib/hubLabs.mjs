export const HUB_LABS = [
  { id: 'cache', title: 'Caching: reuse and eviction', course: 'caching-patterns-java', scope: 'An in-memory LRU model for a fixed request sequence. No TTL, concurrent requests, persistence, or network.', source: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html' },
  { id: 'concurrency', title: 'Concurrency: a lost update', course: 'java-concurrency-interviews', scope: 'Two prescribed read/write schedules. This is an interleaving model, not real thread execution or a proof of a concurrent algorithm.', source: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/package-summary.html' },
  { id: 'indexes', title: 'Indexes: lookup comparisons', course: 'sql-performance-interviews', scope: 'Linear and binary search over 64 sorted unique integers. Comparison counts are not SQL latency or a database query plan.', source: 'https://www.postgresql.org/docs/current/indexes-types.html' },
  { id: 'queues', title: 'Queues: bounded capacity', course: 'java-background-jobs', scope: 'Four discrete ticks; service occurs before arrivals. Excess arrivals are rejected. No durable delivery, retries, or worker threads.', source: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ArrayBlockingQueue.html' },
  { id: 'agents', title: 'Agents: budget and approval', course: 'production-llm-evals-guardrails', scope: 'A deterministic application-controlled read/read/write workflow. No model, tools, or external actions run; approval here is only a simulated policy input.', source: 'https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html' },
];
const bounded = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.trunc(Number(value)))) : fallback;
export function labResult(id, options = {}) {
  const lines = [];
  if (id === 'cache') {
    const capacity = bounded(options.value, 2, 1, 3); const cache = []; let hits = 0;
    for (const key of ['A', 'A', 'B', 'A', 'B', 'C', 'A']) { const found = cache.indexOf(key); if (found >= 0) { hits++; cache.splice(found, 1); } cache.push(key); if (cache.length > capacity) cache.shift(); lines.push(`${key}: ${found >= 0 ? 'hit' : 'miss'}; oldest → newest: ${cache.join(', ')}`); }
    return { summary: `${hits} hits; ${7 - hits} misses`, lines };
  }
  if (id === 'concurrency') return options.enabled ? { summary: 'Final counter: 2', lines: ['A reads 0; writes 1', 'B reads 1; writes 2', 'Serializing the whole read/modify/write preserves both increments.'] } : { summary: 'Final counter: 1', lines: ['A reads 0', 'B reads 0', 'A writes 1', 'B writes 1; one increment is lost.'] };
  if (id === 'indexes') {
    const target = bounded(options.value, 32, 1, 65); let linear = 0, binary = 0; let low = 1, high = 64;
    for (let n = 1; n <= 64; n++) { linear++; if (n === target) break; }
    while (low <= high) { binary++; const mid = Math.floor((low + high) / 2); lines.push(`Compare ${target} with ${mid}`); if (mid === target) break; if (mid < target) low = mid + 1; else high = mid - 1; }
    return { summary: `${target <= 64 ? 'Found' : 'Absent'}: linear ${linear} comparisons; binary ${binary}`, lines };
  }
  if (id === 'queues') {
    const arrivals = bounded(options.value, 4, 0, 8); let queued = 0, served = 0, rejected = 0;
    for (let tick = 1; tick <= 4; tick++) { const service = Math.min(queued, 2); served += service; queued -= service; const admitted = Math.min(arrivals, 6 - queued); rejected += arrivals - admitted; queued += admitted; lines.push(`Tick ${tick}: served ${service}, admitted ${admitted}, rejected ${arrivals - admitted}, queued ${queued}`); }
    return { summary: `${served} served; ${queued} queued; ${rejected} rejected`, lines };
  }
  if (id === 'agents') {
    const budget = bounded(options.value, 3, 0, 4); let used = 0;
    for (const action of ['Read evidence', 'Compare evidence', 'Write result']) { if (used >= budget) return { summary: 'Stopped: step budget exhausted', lines }; if (action === 'Write result' && !options.enabled) return { summary: 'Paused: approval required before write', lines: [...lines, 'Write proposed; no write executed.'] }; used++; lines.push(`${used}: ${action}${action === 'Write result' ? ' (simulated approval)' : ''}`); }
    return { summary: 'Completed 3 simulated steps', lines };
  }
  throw new Error('Unknown teaching lab');
}
