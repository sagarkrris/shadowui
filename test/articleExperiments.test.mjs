import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPERIMENTS, normalizeExperiment, experimentResult } from '../lib/articleExperiments.mjs';
import { normalizeResume, saveResume, RESUME_KEY } from '../lib/learningResume.mjs';
test('experiment outcomes expose the changed failure boundary', () => {
  const expected = [['1 charge', '2 charges'], ['5 ticks', '100 ticks'], ['Write is missing', 'Write is recovered']];
  Object.keys(EXPERIMENTS).forEach((id, index) => {
    for (const condition of [0, 1]) {
      assert.equal(experimentResult(id, { condition, prediction: condition }).answer, expected[index][condition]);
      assert.equal(experimentResult(id, { condition, prediction: condition }).correct, true);
      assert.equal(experimentResult(id, { condition, prediction: 1 - condition }).correct, false);
    }
  });
});
test('persisted experiments constrain inputs and snapshot the original prediction', () => {
  assert.deepEqual(normalizeExperiment({ condition: 3, prediction: -1, confidence: '100', run: { condition: 0 }, reflection: {} }), normalizeExperiment(null));
  const value = normalizeExperiment({ condition: 1, prediction: 0, confidence: 75, run: { condition: 0, prediction: 1, confidence: 100 }, reflection: 'x'.repeat(3000) });
  assert.equal(value.run.condition, 0); assert.equal(value.run.confidence, 100); assert.equal(value.reflection.length, 2000);
  assert.equal(experimentResult('missing', value.run), null);
});
test('resume history rejects unsafe links, deduplicates pages and caps storage', () => {
  assert.deepEqual(normalizeResume([{ href: '//evil.test', title: 'Bad' }, { href: 'javascript:alert(1)', title: 'Bad' }]), []);
  const store = new Map([[RESUME_KEY, 'broken JSON']]);
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  saveResume(storage, { href: '/build/retry-scheduler#chapter-1', title: 'Retry' });
  const next = saveResume(storage, { href: '/build/retry-scheduler#chapter-2', title: 'Retry' });
  assert.equal(next.length, 1); assert.equal(next[0].href, '/build/retry-scheduler#chapter-2');
  assert.equal(normalizeResume(Array.from({ length: 20 }, (_, i) => ({ href: `/java/test-${i}`, title: 'Article' }))).length, 12);
});
