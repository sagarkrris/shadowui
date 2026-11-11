import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('visited public lessons refresh online and fall back offline without caching private pages', async () => {
  const listeners = {}, stored = new Map(); let online = true;
  const cache = { addAll: async () => {}, put: async (key, value) => stored.set(key, value) };
  const caches = { open: async () => cache, match: async key => stored.get(typeof key === 'string' ? key : new URL(key.url).pathname), keys: async () => [], delete: async () => true };
  const response = text => ({ ok: true, type: 'basic', text, clone() { return response(text); } });
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), { self: { location: { hostname: 'example.com', origin: 'https://example.com' }, addEventListener: (name, fn) => { listeners[name] = fn; } }, caches, fetch: async () => { if (!online) throw new Error('offline'); return response('fresh lesson'); }, URL, Response, Promise });
  async function visit(path) {
    const pending = []; let answer;
    listeners.fetch({ request: { method: 'GET', url: `https://example.com${path}`, mode: 'navigate', headers: { get: () => 'text/html' } }, waitUntil: promise => pending.push(promise), respondWith: promise => { answer = promise; } });
    const result = await answer; await Promise.all(pending); return result;
  }
  await visit('/java/tutorial/hashmap'); assert.equal(stored.get('/java/tutorial/hashmap').text, 'fresh lesson');
  await visit('/practice'); assert.equal(stored.has('/practice'), false);
  await visit('/java/tutorial/hashmap?private=1'); assert.equal(stored.size, 1);
  online = false; assert.equal((await visit('/java/tutorial/hashmap')).text, 'fresh lesson');
  assert.equal((await visit('/java/tutorial/not-visited')).status, 503);
});
