import test from 'node:test';
import assert from 'node:assert/strict';
import { ERAS, normalizeTimeline, timelineFromShare, sharePath, inheritedContext, decisionMarkdown } from '../lib/engineeringTimeMachine.mjs';
test('timeline validates sequential decisions, bounds notes and stops at the first invalid era', () => {
  assert.deepEqual(normalizeTimeline(null), []);
  assert.deepEqual(normalizeTimeline([{ choice: 'sync' }]), []);
  assert.equal(normalizeTimeline([{ choice: 'cache', reason: 'x'.repeat(900) }])[0].reason.length, 800);
  assert.equal(normalizeTimeline([{ choice: 'tune' }, { choice: 'bad' }, { choice: 'purge' }]).length, 1);
});
test('versioned share links round trip every path and exclude private reasoning', () => {
  for (const first of ERAS[0].options) for (const second of ERAS[1].options) for (const third of ERAS[2].options) {
    const path = [first, second, third].map(option => ({ choice: option.id, reason: 'PRIVATE' }));
    const url = sharePath(path);
    assert.equal(url.includes('PRIVATE'), false);
    assert.deepEqual(timelineFromShare(new URL(url, 'https://example.test').searchParams.get('path')).map(item => item.choice), path.map(item => item.choice));
  }
  for (const value of ['v2.cache.sync.purge', 'v1.cache.bad', 'v1.cache.sync.purge.extra', 'v1.<script>', ['v1.tune']]) assert.deepEqual(timelineFromShare(value), []);
});
test('earlier choices change inherited deletion obligations', () => {
  assert.equal(inheritedContext([{ choice: 'tune' }, { choice: 'pause' }]).length, 1);
  const context = inheritedContext([{ choice: 'cache' }, { choice: 'sync' }]);
  assert.equal(context.length, 3);
  assert.match(context.join(' '), /cache/);
  assert.match(context.join(' '), /standby/);
  assert.match(inheritedContext([{ choice: 'shard' }]).join(' '), /partition/);
});
test('downloaded decision artifact includes reasoning, trade-offs, constraints and attribution', () => {
  const artifact = decisionMarkdown([{ choice: 'cache', reason: 'Freshness budget allows it' }], 'https://example.test/lesson');
  assert.match(artifact, /Freshness budget allows it/);
  assert.match(artifact, /Trade-off:/);
  assert.match(artifact, /Keep:/);
  assert.match(artifact, /Original lesson: https:\/\/example.test\/lesson/);
});
