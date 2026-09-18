import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLearning, chapterTestReported, calibrationFeedback } from '../lib/tinyContainerLearning.mjs';
import { containerSource } from '../lib/tinyContainer.mjs';
test('stored learning accepts only bounded known chapter data', () => {
  assert.deepEqual(normalizeLearning(null), {});
  assert.deepEqual(normalizeLearning({ registry: { choice: 8, confidence: 95, testedSource: 'x'.repeat(20001) }, arbitrary: { choice: 0 } }), { registry: {} });
  assert.deepEqual(normalizeLearning({ cycles: { choice: 2, confidence: 95, testedSource: 'code' } }), { cycles: { choice: 2, confidence: 95, testedSource: 'code' } });
});
test('local test confirmation is tied to the current source', () => {
  const learning = { registry: { testedSource: 'tested code' } };
  assert.equal(chapterTestReported(0, { registry: 'tested code' }, learning), true);
  assert.equal(chapterTestReported(0, { registry: 'edited code' }, learning), false);
  assert.equal(chapterTestReported(0, {}, {}), false);
  assert.equal(chapterTestReported(0, {}, { registry: { testedSource: containerSource(0) } }), true);
});
test('calibration flags confident misconceptions without mislabeling correct answers', () => {
  assert.equal(calibrationFeedback(0, 0, 95).revisit, true);
  assert.equal(calibrationFeedback(0, 0, 50).revisit, false);
  assert.equal(calibrationFeedback(0, 1, 95).correct, true);
  assert.equal(calibrationFeedback(0, 1, 95).revisit, false);
});
