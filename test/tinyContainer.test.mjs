import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, containerSource, javaExercise, runContainerModel } from '../lib/tinyContainer.mjs';

test('container model separates repeated construction from identity caching', () => {
  assert.equal(runContainerModel().same, false);
  const cached = runContainerModel({ cache: true });
  assert.equal(cached.same, true);
  assert.deepEqual(cached.trace, ['Enter Service', 'Enter Repo', 'Construct Repo #1', 'Construct Service #2', 'Reuse Service']);
});
test('cache cannot solve constructor cycles; active path gives a bounded diagnosis', () => {
  assert.match(runContainerModel({ cache: true, cycle: true }).error, /stopped repeated recursion/);
  const detected = runContainerModel({ cache: true, cycle: true, detectCycles: true });
  assert.equal(detected.error, 'Cycle detected at Service');
  assert.equal(detected.trace.length, 2);
  assert.equal(runContainerModel({ detectCycles: true }).error, null);
});
test('exercise downloads preserve edits and reject invalid chapters and oversized drafts', () => {
  assert.ok(javaExercise(0, '// my draft').startsWith('// my draft\n'));
  assert.throws(() => javaExercise(8, 'code'));
  assert.throws(() => javaExercise(0, 'x'.repeat(20001)));
  assert.throws(() => containerSource(-1));
  assert.equal(new Set(CHAPTERS.map(chapter => chapter.id)).size, 4);
});
