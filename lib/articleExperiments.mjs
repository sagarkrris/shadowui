export const EXPERIMENT_KEY = 'interviewiq.articleExperiments.v1.';
export const EXPERIMENTS = {
  'request-timed-out-did-payment-happen': {
    question: 'The first charge succeeded but its response was lost. How many charges exist after one retry?',
    condition: 'Retry identity', values: ['Reuse the same key', 'Use a new key'], answers: ['1 charge', '2 charges'],
    outcomes: [0, 1],
    explanations: ['The retained ledger entry replays the earlier result; it creates no new charge.', 'The new key identifies another operation, so this model creates a second charge.'],
    boundary: 'Sequential in-memory model: unchanged parameters, no key expiry or concurrency. This is not a payment-provider integration.',
  },
  'connection-pool-full-is-database-slow': {
    question: 'Two callers acquire both connections at tick 0. SQL takes 5 ticks. A third caller arrives at tick 0. How long does it wait?',
    condition: 'Connection hold duration', values: ['Return at tick 5', 'Return at tick 100'], answers: ['5 ticks', '100 ticks'],
    outcomes: [0, 1],
    explanations: ['Returning a lease as soon as SQL finishes lets the waiting caller acquire at tick 5.', 'SQL ends at tick 5, but ownership continues to tick 100. The caller waits for a returned connection.'],
    boundary: 'Two resources, fixed arrival times, no scheduler overhead or database contention. This model does not recommend a production pool size.',
  },
  'database-committed-what-survives-crash': {
    question: 'An acknowledged write is locally durable. The primary is lost. Can the designated standby recover that write from its own log?',
    condition: 'Standby durable log at primary failure', values: ['One record behind', 'Caught up through this write'], answers: ['Write is missing', 'Write is recovered'],
    outcomes: [0, 1],
    explanations: ['The standby cannot replay a record absent from its own durable log. Local durability alone did not protect this failover.', 'The standby has durably stored the record and can replay it in this model.'],
    boundary: 'A virtual log, not PostgreSQL or a disk test. Assumes the standby and its durable storage survive and recovery replays the log.',
  },
};
export function normalizeExperiment(value) {
  const index = v => v === 0 || v === 1;
  const validRun = value?.run && index(value.run.condition) && index(value.run.prediction) && [50, 75, 100].includes(value.run.confidence);
  return {
    condition: index(value?.condition) ? value.condition : 0,
    prediction: index(value?.prediction) ? value.prediction : null,
    confidence: [50, 75, 100].includes(value?.confidence) ? value.confidence : 50,
    run: validRun ? { condition: value.run.condition, prediction: value.run.prediction, confidence: value.run.confidence } : null,
    reflection: typeof value?.reflection === 'string' ? value.reflection.slice(0, 2000) : '',
  };
}
export function experimentResult(id, run) {
  const model = EXPERIMENTS[id];
  if (!model || !run || ![0, 1].includes(run.condition) || ![0, 1].includes(run.prediction)) return null;
  return { answer: model.answers[model.outcomes[run.condition]], correct: run.prediction === model.outcomes[run.condition], explanation: model.explanations[run.condition] };
}
