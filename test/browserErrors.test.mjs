import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBrowserError, createBrowserErrorReporter, installBrowserErrorReporting } from '../lib/browserErrors.mjs';
import { createClientErrorsHandler } from '../pages/api/client-errors.js';

function response() { return { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } }; }
function request(body) { return { method: 'POST', headers: { host: 'site.test', origin: 'https://site.test', 'content-type': 'application/json' }, body }; }

test('diagnostic envelopes drop free text, stack traces, URLs and unknown fields', () => {
  assert.deepEqual(normalizeBrowserError({ kind: 'runtime_error', route: '/practice?token=PRIVATE', line: -2, column: 99, message: 'PRIVATE', stack: 'PRIVATE', email: 'PRIVATE' }), { kind: 'runtime_error', route: '/other', line: 0, column: 99 });
  assert.equal(normalizeBrowserError({ kind: 'PRIVATE' }), null);
  assert.equal(normalizeBrowserError({ kind: 'render_error', route: '/java/[slug]' }).route, '/java/[slug]');
});

test('browser reporting deduplicates events, caps volume and contains sync and async transport failures', async () => {
  const reports = [];
  const report = createBrowserErrorReporter({ maxReports: 2, send: payload => { reports.push(payload); return Promise.reject(Error('offline')); } });
  report({ kind: 'runtime_error', route: '/practice' });
  report({ kind: 'runtime_error', route: '/practice' });
  report({ kind: 'render_error', route: '/practice' });
  report({ kind: 'unhandled_rejection', route: '/practice' });
  assert.equal(reports.length, 2);
  assert.doesNotThrow(() => createBrowserErrorReporter({ send: () => { throw Error('blocked'); } })({ kind: 'render_error' }));
  await new Promise(resolve => setImmediate(resolve));
});

test('browser listeners report errors and rejected promises and clean up on navigation', () => {
  const target = new EventTarget(), reports = [];
  const cleanup = installBrowserErrorReporting(target, '/practice', event => reports.push(event));
  target.dispatchEvent(Object.assign(new Event('error'), { lineno: 42, colno: 8, message: 'PRIVATE' }));
  target.dispatchEvent(new Event('unhandledrejection'));
  assert.equal(reports.length, 2);
  assert.equal(reports[0].line, 42);
  assert.ok(!JSON.stringify(reports).includes('PRIVATE'));
  cleanup();
  target.dispatchEvent(new Event('error'));
  assert.equal(reports.length, 2);
});

test('diagnostic endpoint rejects foreign origins, unsupported events, methods and excess volume', async t => {
  const logs = []; t.mock.method(console, 'error', e => logs.push(e));
  const handler = createClientErrorsHandler({ rateLimit: () => ({ ok: true }) });
  const good = response(); await handler(request({ kind: 'render_error', route: '/practice', message: 'PRIVATE' }), good);
  assert.equal(good.statusCode, 202);
  assert.equal(logs[0].event, 'browser.failed');
  assert.equal(logs[0].route, '/api/client-errors');
  assert.equal(logs[0].pageRoute, '/practice');
  assert.ok(!JSON.stringify(logs).includes('PRIVATE'));
  const foreign = response(); await handler({ ...request({ kind: 'runtime_error' }), headers: { host: 'site.test', origin: 'https://other.test' } }, foreign); assert.equal(foreign.statusCode, 403);
  const invalid = response(); await handler(request({ kind: 'unsupported' }), invalid); assert.equal(invalid.statusCode, 400);
  const method = response(); await handler({ method: 'GET' }, method); assert.equal(method.statusCode, 405);
  const limited = response(); await createClientErrorsHandler({ rateLimit: () => ({ ok: false, retryAfter: 60 }) })(request({ kind: 'runtime_error' }), limited); assert.equal(limited.statusCode, 429);
});
