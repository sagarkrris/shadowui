import assert from 'node:assert/strict';
import test from 'node:test';
import { PRODUCTION_COURSE_DEMOS as demos } from '../lib/productionCourseDemos.mjs';
import { traceFrames } from '../lib/courseDemoModels.mjs';

const states = (id, scenario) => traceFrames(demos[id], scenario).map(frame => frame.cells.map(cell => cell.value));

test('pod drain consumes preStop inside grace and never confirms an unfinished owner', () => {
  assert.deepEqual(states('podDrain', 0).map(row => row[0]), ['0s', '8s', '38s']);
  assert.equal(states('podDrain', 0).at(-1)[2], 'confirmed');
  assert.deepEqual(states('podDrain', 1).at(-1), ['45s', 'closed', 'unknown; recover']);
});
test('cutover never grants both databases write authority; target commits prohibit blind rollback', () => {
  for (const scenario of [0, 1]) {
    for (const [source, target] of states('migrationOwnership', scenario)) assert.ok(source !== 'writable' || target !== 'writable');
  }
  assert.deepEqual(states('migrationOwnership', 0).at(-1), ['fenced', 'writable', 'promote']);
  assert.deepEqual(states('migrationOwnership', 1).at(-1), ['stale', 'fenced', 'reconcile; no blind rollback']);
});
test('collector keeps queue bounded and declares loss rather than inventing delivery', () => {
  for (const scenario of [0, 1]) for (const row of states('collectorCapacity', scenario)) {
    const [used, cap] = row[1].split(' / ').map(Number);
    assert.ok(used >= 0 && used <= cap);
  }
  assert.deepEqual(states('collectorCapacity', 0).at(-1), ['available', '0 / 2', 'delivered']);
  assert.deepEqual(states('collectorCapacity', 1).at(-1), ['unavailable', '2 / 2', '1 batch dropped']);
});
test('promotion evidence is bound to the deployed digest', () => {
  assert.deepEqual(states('artifactPromotion', 0).at(-1), ['digest A', 'A approved', 'deploy A']);
  assert.deepEqual(states('artifactPromotion', 1).at(-1), ['digest B', 'B unverified', 'do not deploy B']);
});
test('cross-tenant model proposals cause no effect in any frame', () => {
  assert.ok(states('llmToolAuthority', 1).every(row => row[2] === 'none'));
  assert.equal(states('llmToolAuthority', 1).at(-1)[1], 'denied');
  assert.equal(states('llmToolAuthority', 0).at(-1)[2], 'scoped read');
});
