import { test, expect } from '@playwright/test';
const contentPaths = ['/tech-blogs/java-money-production', '/build/practice/webhook-version-gate', '/explain-log/blocked-pool-thread-dump'];

test('literal and encoded route placeholders recover to the log index; unknown slugs remain 404', async ({ request }) => {
  for (const path of ['/explain-log/[slug]', '/explain-log/%5Bslug%5D', '/explain-log/%5bslug%5d']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(308);
    expect(response.headers().location).toBe('/explain-log');
  }
  expect((await request.get('/explain-log/a-real-but-unknown-slug')).status()).toBe(404);
});
test('practice query variants are intentionally excluded and have one stable canonical', async ({ page, request }) => {
  for (const path of ['/practice', '/practice?workspace=java-digest', '/practice?workspace=java-digest&article=hashmap-internals']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag']).toBe('noindex, follow');
    const html = await response.text();
    expect(html).toMatch(/<meta name="robots" content="noindex, follow"/);
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"\s]+\/practice"/);
    await page.goto(path);
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /\/practice$/);
  }
  expect(await (await request.get('/robots.txt')).text()).not.toContain('Disallow: /practice');
});
test('correction variants preserve article context and consolidate to the correction log', async ({ page }) => {
  await page.route('**/api/reader-community', route => route.fulfill({ json: { available: false } }));
  await page.goto('/corrections?article=/tech-blogs/real-time-communication-patterns');
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /\/corrections$/);
  await expect(page.getByLabel('Affected page path')).toHaveValue('/tech-blogs/real-time-communication-patterns');
});
test('all three content pages are discoverable and indexable without JavaScript', async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  for (const path of contentPaths) {
    const link = page.locator(`a[href="${path}"]`).first();
    await expect(link).toBeAttached();
    expect((await link.innerText()).trim().length).toBeGreaterThan(10);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toMatch(/\[slug\]|%5Bslug%5D|\?workspace=/i);
  for (const path of contentPaths) {
    expect(sitemap).toContain(path);
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag'] || '').not.toMatch(/noindex/i);
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
    expect(new URL(canonical).pathname).toBe(path);
    expect(new URL(canonical).search).toBe('');
    const directives = await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.map(node => node.content));
    expect(directives.join(' ')).not.toMatch(/noindex/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await context.close();
});
