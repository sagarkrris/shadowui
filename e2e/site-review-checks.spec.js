import { expect, test } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
for (const path of ['/', '/java/tutorial/jdk-vs-jre-vs-jvm', '/labs/cache', '/java/roadmap', '/hld/url-shortener', '/digest']) {
  test(`mobile WCAG checks: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('HLD timer switches to notes and exposes a scored rubric after finishing', async ({ page }) => {
  await page.goto('/hld/url-shortener');
  await page.getByRole('button', { name: 'Start 45-minute practice', exact: true }).click();
  await expect(page.getByLabel('Requirements, diagram outline & trade-offs')).toBeVisible();
  await page.getByRole('button', { name: 'Finish and review' }).click();
  await page.getByLabel('Failure handling and recovery score').selectOption('2');
  await expect(page.getByText('Self-assessed score: 2 / 10 · 1/5 criteria reviewed.')).toBeVisible();
});
test('unavailable signup and assessment services provide working fallback guidance', async ({ page }) => {
  await page.route('**/api/digest-subscription', route => route.fulfill({ status: 503, json: { available: false } }));
  await page.goto('/digest');
  await expect(page.getByRole('button', { name: 'Send confirmation email' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Read the RSS feed' })).toHaveAttribute('href', '/rss.xml');
  await page.route('**/api/run-code/health', route => route.fulfill({ status: 503, json: { configured: false } }));
  await page.goto('/assessments');
  await expect(page.getByRole('button', { name: 'Run assessment checks' })).toBeDisabled();
  await expect(page.getByText('Online runner unavailable:', { exact: false })).toBeVisible();
});
test('public social cards render PNG and reject arbitrary paths', async ({ request }) => {
  const card = await request.get('/api/og?path=%2Fhld%2Furl-shortener');
  expect(card.status()).toBe(200);
  expect(card.headers()['content-type']).toContain('image/png');
  expect((await card.body()).subarray(1,4).toString()).toBe('PNG');
  expect((await request.get('/api/og?path=https://example.com')).status()).toBe(404);
});
