import { availableParallelism } from 'node:os';

// Leave one CPU available on larger machines and bound Java/browser memory pressure.
export function testWorkers(env = process.env, cpus = availableParallelism()) {
  const configured = env.TEST_WORKERS;
  if (configured === undefined) return Math.max(2, Math.min(4, cpus - 1));
  if (!/^(?:[1-9]|1[0-6])$/.test(configured)) {
    throw new Error('TEST_WORKERS must be an integer from 1 to 16');
  }
  return Number(configured);
}

// Finish every scheduled task, including failures, without exceeding the worker budget.
export async function runConcurrent(items, workers, run) {
  if (!Number.isInteger(workers) || workers < 1) throw new Error('Invalid worker count');
  let next = 0;
  const failures = [];
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      try { await run(item); }
      catch (error) { failures.push(error); }
    }
  }));
  if (failures.length) throw new AggregateError(failures, `${failures.length} validation task(s) failed`);
}
