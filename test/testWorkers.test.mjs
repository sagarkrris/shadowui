import test from 'node:test';
import assert from 'node:assert/strict';
import { testWorkers, runConcurrent } from '../scripts/validation/test-workers.mjs';
import config from '../playwright.config.mjs';
import { techBlogGateCommands } from '../scripts/validation/tech-blog-gate.mjs';

test('local and CI budgets use multiple workers with bounded automatic CPU sizing', () => {
  for (const env of [{}, { CI: '1' }]) {
    for (const [cpus, expected] of [[1, 2], [2, 2], [4, 3], [8, 4], [64, 4]]) assert.equal(testWorkers(env, cpus), expected);
  }
  for (const value of ['1', '2', '6', '16']) assert.equal(testWorkers({ TEST_WORKERS: value }, 64), Number(value));
  for (const value of ['', '0', '-1', '17', '2.5', 'auto', '2x', ' 2', '02']) assert.throws(() => testWorkers({ TEST_WORKERS: value }), /TEST_WORKERS/);
  assert.equal(config.workers, testWorkers());
  const browser = techBlogGateCommands('/tmp/worker-test').find(step => step[0] === 'readers-and-diagrams')[2];
  assert.ok(!browser.some(arg => arg.startsWith('--workers')), 'gate must honor shared configuration');
});

test('pool overlaps tasks, keeps the concurrency bound and runs each item once', { timeout: 5000 }, async () => {
  let active = 0, peak = 0;
  const completed = [];
  const barriers = [];
  const running = runConcurrent([0, 1, 2, 3, 4], 2, async item => {
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => barriers.push(resolve));
    completed.push(item); active--;
  });
  assert.equal(active, 2, 'two tasks must start before either is released');
  while (completed.length < 5) {
    barriers.splice(0).forEach(release => release());
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(active <= 2);
  }
  await running;
  assert.equal(peak, 2);
  assert.deepEqual(completed.sort(), [0, 1, 2, 3, 4]);
});

test('pool drains every task and propagates failures instead of reporting a partial pass', { timeout: 5000 }, async () => {
  const completed = [];
  await assert.rejects(runConcurrent([0, 1, 2, 3], 2, async item => {
    await new Promise(resolve => setImmediate(resolve));
    completed.push(item);
    if (item % 2 === 0) throw new Error(`failed ${item}`);
  }), error => error instanceof AggregateError && error.errors.length === 2);
  assert.deepEqual(completed.sort(), [0, 1, 2, 3]);
  await runConcurrent([], 4, () => assert.fail('empty pool ran work'));
  await assert.rejects(runConcurrent([1], 0, () => {}), /worker count/);
});
