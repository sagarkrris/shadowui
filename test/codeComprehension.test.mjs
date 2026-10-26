import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { COMPREHENSION_REFERENCE, COMPREHENSION_STARTER } from '../lib/codeComprehension.mjs';

const readCached = runInNewContext(`(${COMPREHENSION_REFERENCE})`);
const readCachedBuggy = runInNewContext(`(${COMPREHENSION_STARTER})`);

test('cache exercise preserves valid values and expires at the exact deadline', () => {
  for (const value of [0, false, '', null, 'Ada']) {
    const entry = { value, expiresAt: 1000 };
    const cache = new Map([['key', entry]]);
    assert.equal(readCached(cache, 'key', 999), value);
    assert.equal(readCached(cache, 'key', 1000), undefined);
    assert.equal(readCached(cache, 'key', 1001), undefined);
    assert.equal(readCached(cache, 'missing', 999), undefined);
    assert.equal(cache.size, 1);
    assert.equal(cache.get('key'), entry);
    assert.deepEqual(entry, { value, expiresAt: 1000 });
  }
});

test('the published starter demonstrates both independent regressions', () => {
  const cache = new Map([
    ['zero', { value: 0, expiresAt: 1000 }],
    ['name', { value: 'Ada', expiresAt: 1000 }],
  ]);
  assert.equal(readCachedBuggy(cache, 'zero', 999), undefined);
  assert.equal(readCachedBuggy(cache, 'name', 999), 'Ada');
  assert.equal(readCachedBuggy(cache, 'name', 1000), 'Ada');
  assert.equal(readCached(cache, 'zero', 999), 0);
  assert.equal(readCached(cache, 'name', 1000), undefined);
});
