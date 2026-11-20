import { test, expect } from '@playwright/test';

test('browser failures produce bounded, private diagnostic reports in the production app', async ({ page }) => {
  const reports = [];
  const statuses = [];
  const referrers = [];
  await page.route(/^https:\/\//, route => route.abort());
  page.on('response', response => {
    if (new URL(response.url()).pathname !== '/api/client-errors') return;
    reports.push(response.request().postDataJSON());
    statuses.push(response.status());
    referrers.push(response.request().headers().referer);
  });

  await page.goto('/sign-up?token=PRIVATE', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect.poll(async () => {
    await page.evaluate(() => {
      const error = () => new ErrorEvent('error', {
        message: 'PRIVATE answer and token',
        filename: 'https://site.test/private?token=PRIVATE',
        lineno: 42,
        colno: 8,
      });
      window.dispatchEvent(error());
      window.dispatchEvent(error());
      window.dispatchEvent(new Event('unhandledrejection'));
    });
    return reports.length;
  }).toBe(2);
  expect(statuses).toEqual([202, 202]);
  expect(JSON.stringify(referrers)).not.toContain('PRIVATE');
  reports.sort((a, b) => a.kind.localeCompare(b.kind));
  expect(reports).toEqual([
    { kind: 'runtime_error', route: '/sign-up', line: 42, column: 8 },
    { kind: 'unhandled_rejection', route: '/sign-up', line: 0, column: 0 },
  ]);
  expect(JSON.stringify(reports)).not.toContain('PRIVATE');
  await expect(page.locator('body')).not.toContainText('This page couldn’t load');
});

test('diagnostic ingestion preserves request correlation and rejects foreign origins', async ({ request, baseURL }) => {
  const good = await request.post('/api/client-errors', { headers: { Origin: baseURL, 'X-Request-Id': 'req_browser_e2e' }, data: { kind: 'render_error', route: '/practice', message: 'PRIVATE' } });
  expect(good.status()).toBe(202);
  expect(good.headers()['x-request-id']).toBe('req_browser_e2e');
  const foreign = await request.post('/api/client-errors', { headers: { Origin: 'https://foreign.test' }, data: { kind: 'render_error' } });
  expect(foreign.status()).toBe(403);
});
