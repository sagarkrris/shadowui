import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../pages/api/build-challenge.js';
import { resetRateLimits } from '../lib/requestSecurity.mjs';
function response() { return { statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(v) { this.statusCode=v; return this; }, json(v) { this.body=v; return this; } }; }
test('practice API exposes availability without secrets and rejects unsafe request methods/origins', async () => {
  const get = response(); await handler({ method: 'GET', headers: {} }, get);
  assert.equal(typeof get.body.configured, 'boolean');
  assert.deepEqual(Object.keys(get.body), ['configured']);
  assert.equal(get.headers['Cache-Control'], 'no-store');
  for (const [method, headers, status] of [['DELETE', {}, 405], ['POST', {}, 403], ['POST', { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, 403]]) {
    const res=response(); await handler({method, headers},res); assert.equal(res.statusCode,status);
  }
});
test('practice API validates submissions, stays offline by default and rate limits attempts', async () => {
  const keys = ['REQUIRE_AUTH', 'JAVA_RUNNER_URL', 'UPSTASH_REDIS_REST_URL'];
  const prior = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.REQUIRE_AUTH = '0';
    delete process.env.JAVA_RUNNER_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    resetRateLimits();
    process.env.REQUIRE_AUTH = '1';
    const unauthenticated = response();
    await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: {} }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);
    process.env.REQUIRE_AUTH = '0';
    const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: {} };
    const invalid = response(); await handler(req, invalid); assert.equal(invalid.statusCode, 400);
    req.body = { id: 'cache-expiry', code: 'class Solution {}', mode: 'all' };
    const offline = response(); await handler(req, offline); assert.equal(offline.statusCode, 503);
    for (let i=0; i<5; i++) { const res=response(); await handler(req,res); if(i===4) { assert.equal(res.statusCode,429); assert.ok(res.headers['Retry-After']); } }
  } finally {
    for (const key of keys) { if(prior[key]===undefined) delete process.env[key]; else process.env[key]=prior[key]; }
    resetRateLimits();
  }
});
