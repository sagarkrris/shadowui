import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryCatalogue } from '../lib/discoveryCatalog.mjs';
import { searchDiscovery, PUBLIC_NAVIGATION } from '../lib/publicNavigation.mjs';
import handler from '../pages/api/discovery.js';

test('discovery returns public metadata and finds actual chapters, labs and challenges', () => {
  const records = discoveryCatalogue();
  assert.ok(searchDiscovery(records, 'cache', 'Lab').some(item => item.href === '/labs/cache'));
  assert.ok(searchDiscovery(records, 'single-flight', 'Challenge').some(item => item.href === '/build/practice/single-flight-cache'));
  assert.ok(searchDiscovery(records, 'Java Money', 'Course').some(item => item.href === '/tech-blogs/java-money-production'));
  assert.ok(searchDiscovery(records, 'Java', 'Lesson').length > 0);
  assert.equal(searchDiscovery(records, 'not-a-real-concept').length, 0);
  for (const item of records) {
    assert.match(item.href, /^\/(?!\/)/);
    assert.deepEqual(Object.keys(item).sort(), ['category', 'description', 'href', 'title', 'type']);
  }
  assert.equal(new Set(records.map(item => `${item.type}:${item.href}`)).size, records.length);
});
test('search matches each query word, ignores case and spaces, and bounds results', () => {
  const records = discoveryCatalogue();
  assert.deepEqual(searchDiscovery(records, '  JAVA   money ', 'Course'), searchDiscovery(records, 'java money', 'Course'));
  assert.ok(searchDiscovery(records).length <= 30);
  assert.equal(searchDiscovery([{ title: 'Transaction', description: 'Ownership matters', type: 'Article' }], 'transaction ownership', 'Article').length, 1);
  assert.equal(searchDiscovery([{ title: 'Transaction', type: 'Article' }], 'transaction ownership').length, 0);
  assert.equal(PUBLIC_NAVIGATION.length, 4);
});
test('public index API supports read-only requests and contains no user notes or code', () => {
  const res = { headers: {}, code: 200, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; } };
  handler({ method: 'GET' }, res);
  assert.equal(res.code, 200);
  assert.match(res.headers['Cache-Control'], /public/);
  assert.ok(res.body.items.length > 50);
  assert.ok(!JSON.stringify(res.body).includes('starter'));
  handler({ method: 'POST' }, res);
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, 'GET');
});
