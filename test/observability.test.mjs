import assert from 'node:assert/strict';
import test from 'node:test';
import { withApiObservability } from '../lib/apiObservability.mjs';
import { recordMetric, reportServerError } from '../lib/observability.mjs';
import { deliverTelemetry } from '../lib/telemetryDelivery.mjs';
import { createAnalyticsHandler } from '../pages/api/analytics.js';

function response() {
  return { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
}
function capture(t) {
  const events = [];
  for (const level of ['log', 'warn', 'error']) t.mock.method(console, level, event => events.push({ level, ...event }));
  return events;
}

test('unhandled API failures retain correlation and status without exposing the exception payload', async t => {
  const events = capture(t), res = response();
  await withApiObservability('/api/example', async () => { throw Object.assign(new Error('password=PRIVATE; SELECT private_answer'), { code: 'ECONNRESET' }); })({ method: 'POST', headers: { 'x-request-id': 'req_valid123' } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.requestId, 'req_valid123');
  assert.equal(events.find(e => e.event === 'request.unhandled').error.code, 'ECONNRESET');
  assert.equal(events.find(e => e.event === 'request.completed').level, 'error');
  assert.ok(events.every(e => e.requestId === 'req_valid123'));
  assert.ok(!JSON.stringify(events).includes('PRIVATE'));
});

test('caught storage failures preserve the safe response and log a diagnostic code', async t => {
  const events = capture(t), res = response();
  const handler = createAnalyticsHandler({ env: { PRODUCT_ANALYTICS_ENABLED: 'true', DATABASE_URL: 'unused' }, rateLimit: async () => ({ ok: true }), store: { remove: async () => { throw Object.assign(new Error('postgres://user:PRIVATE@host/database'), { code: '08006' }); } } });
  await withApiObservability('/api/analytics', handler)({ method: 'DELETE', requestId: 'req_replaced', headers: { host: 'site.test', origin: 'https://site.test', 'content-type': 'application/json', 'x-request-id': 'req_storage123' }, body: { visitorId: '11111111-1111-4111-8111-111111111111', password: 'PRIVATE' } }, res);
  assert.equal(res.statusCode, 503);
  const event = events.find(e => e.event === 'analytics.storage_failed');
  assert.equal(event.requestId, 'req_storage123');
  assert.equal(event.error.code, '08006');
  assert.ok(!JSON.stringify(events).includes('PRIVATE'));
});

test('error reporting logs locally even with no external service configured', async t => {
  const events = capture(t);
  t.mock.method(globalThis, 'fetch', () => { throw Error('Must not fetch'); });
  const previous = process.env.ERROR_TRACKING_WEBHOOK_URL;
  delete process.env.ERROR_TRACKING_WEBHOOK_URL;
  try {
    await reportServerError(new Error('PRIVATE'), { route: '/api/auth', requestId: 'req_local123' });
    assert.equal(events[0].event, 'server.failed');
    assert.equal(events[0].requestId, 'req_local123');
    assert.ok(!JSON.stringify(events).includes('PRIVATE'));
  } finally {
    if (previous === undefined) delete process.env.ERROR_TRACKING_WEBHOOK_URL;
    else process.env.ERROR_TRACKING_WEBHOOK_URL = previous;
  }
});

test('webhook HTTP and network failures are visible without logging secrets or changing the application result', async () => {
  const warnings = [], logger = { warn: (event, meta) => warnings.push({ event, ...meta }) };
  const base = { endpoint: 'https://PRIVATE.example/token', token: 'PRIVATE', channel: 'errors', logger };
  let options;
  const sent = await deliverTelemetry({ error: { name: 'Error' } }, { ...base, fetchImpl: async (_url, input) => { options = input; return { ok: false, status: 503 }; } });
  assert.equal(sent, false);
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.redirect, 'error');
  assert.equal(options.headers.Authorization, 'Bearer PRIVATE');
  assert.equal(warnings[0].status, 503);
  await deliverTelemetry({}, { ...base, fetchImpl: () => { throw Error('PRIVATE'); } });
  assert.equal(warnings[1].reason, 'network_or_timeout');
  assert.ok(!JSON.stringify(warnings).includes('PRIVATE'));
  assert.equal(await deliverTelemetry({}, { ...base, fetchImpl: async () => ({ ok: true }) }), true);
  assert.equal(await deliverTelemetry({}, { logger }), false);
});

test('metrics uses only the credential belonging to the selected destination', t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', (url, { headers }) => {
    calls.push([url, headers.Authorization]);
    return Promise.resolve({ ok: true });
  });
  const keys = ['METRICS_WEBHOOK_URL', 'METRICS_WEBHOOK_TOKEN', 'ERROR_TRACKING_WEBHOOK_URL', 'ERROR_TRACKING_TOKEN'];
  const previous = keys.map(key => process.env[key]);
  try {
    process.env.METRICS_WEBHOOK_URL = 'https://metrics.example';
    process.env.ERROR_TRACKING_WEBHOOK_URL = 'https://errors.example';
    process.env.ERROR_TRACKING_TOKEN = 'error-token';
    delete process.env.METRICS_WEBHOOK_TOKEN;
    recordMetric('test.separate_anonymous');
    process.env.METRICS_WEBHOOK_TOKEN = 'metrics-token';
    recordMetric('test.separate_authenticated');
    delete process.env.METRICS_WEBHOOK_URL;
    recordMetric('test.fallback');
    assert.deepEqual(calls, [
      ['https://metrics.example', undefined],
      ['https://metrics.example', 'Bearer metrics-token'],
      ['https://errors.example', 'Bearer error-token'],
    ]);
  } finally {
    for (const [index, key] of keys.entries()) {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }
  }
});
