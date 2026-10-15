import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker(hostname) {
  const events = {}; const calls = [];
  const context = {
    self: { location: { hostname, origin: `https://${hostname}` }, addEventListener(name, handler) { events[name] = handler; } },
    URL, Response,
    caches: { match: async request => { calls.push(['cache', request.url]); return new Response('old script'); } },
    fetch: async request => { calls.push(['network', request.url]); return new Response('new document'); },
  };
  vm.runInNewContext(source, context);
  return { events, calls };
}
test('local preview requests bypass cached development scripts', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    const { events, calls } = worker(host);
    let intercepted = false;
    events.fetch({ request: { method: 'GET', url: `https://${host}/_next/static/chunks/pages/index.js` }, respondWith() { intercepted = true; } });
    assert.equal(intercepted, false);
    assert.deepEqual(calls, []);
  }
});
test('production documents still prefer the network and static chunks can use the cache', async () => {
  const { events, calls } = worker('interviewiq.example');
  let response;
  const request = { method: 'GET', mode: 'navigate', url: 'https://interviewiq.example/', headers: { get: () => 'text/html' } };
  events.fetch({ request, respondWith(value) { response = value; } });
  assert.equal(await (await response).text(), 'new document');
  assert.deepEqual(calls, [['network', request.url]]);
  events.fetch({ request: { ...request, mode: 'cors', url: 'https://interviewiq.example/_next/static/chunks/abc123.js', headers: { get: () => '' } }, respondWith(value) { response = value; } });
  assert.equal(await (await response).text(), 'old script');
});
