import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { TINY_SYSTEMS } from '../lib/tinySystems.mjs';
import { DETECTIVE_CASES, DETECTIVE_STORAGE_PREFIX } from '../lib/productionDetective.mjs';
test.use({ serviceWorkers: 'block' });
for (const project of TINY_SYSTEMS) test(`${project.slug}: discover, save, download and invalidate stale completion`, async ({ page }) => {
  await page.goto('/build');
  await page.getByRole('link', { name: project.title, exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Java implementation — chapter 1', exact: true });
  await editor.fill('// saved learner draft');
  await page.getByRole('button', { name: 'Save chapter 1 draft', exact: true }).click();
  await page.getByRole('checkbox', { name: 'I ran chapter 1 locally and its checks passed', exact: true }).check();
  await page.reload();
  await expect(editor).toHaveValue('// saved learner draft');
  await expect(page.getByRole('checkbox', { name: 'I ran chapter 1 locally and its checks passed', exact: true })).toBeChecked();
  await editor.fill('// changed code');
  await expect(page.getByRole('checkbox', { name: 'I ran chapter 1 locally and its checks passed', exact: true })).not.toBeChecked();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download chapter 1 code and tests' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('Main.java');
  expect(await readFile(await download.path(), 'utf8')).toBe('// changed code');
  await page.getByRole('button', { name: 'Save chapter 1 draft', exact: true }).click();
  await page.goto('/notebook');
  await expect(page.getByRole('link', { name: project.title, exact: true })).toBeVisible();
});
test('completed investigation becomes a persistent interview answer', async ({ page }) => {
  const incident = DETECTIVE_CASES[1];
  await page.addInitScript(({ incident, prefix }) => {
    localStorage.setItem(prefix + incident.slug, JSON.stringify({ inspected: incident.evidence.map(item => item.id), diagnosis: incident.diagnosis, fix: incident.fix, completed: true }));
  }, { incident, prefix: DETECTIVE_STORAGE_PREFIX });
  await page.goto(`/detective/${incident.slug}`);
  await page.getByRole('textbox', { name: 'Your interview answer', exact: true }).fill('The internal call bypassed the proxy. The log shows no transaction. Use an injected collaborator; external effects need recovery.');
  await page.getByRole('checkbox', { name: 'I named the failure mechanism.', exact: true }).check();
  await page.getByRole('button', { name: 'Save interview answer', exact: true }).click();
  await page.getByRole('button', { name: 'Compare with answer guide' }).click();
  await expect(page.getByRole('heading', { name: 'Answer guide', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Your interview answer', exact: true })).toHaveValue(/internal call bypassed/);
  await page.goto('/notebook');
  await expect(page.getByText(/external effects need recovery/)).toBeVisible();
  await page.getByRole('button', { name: 'Export notes as Markdown' }).click();
  await expect(page.getByRole('textbox', { name: /Notebook export/ })).toHaveValue(/Interview answer: The internal call/);
});
test('project storage errors are honest and published editions appear in RSS', async ({ page, request }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.goto('/build/retry-scheduler');
  await page.getByRole('button', { name: 'Save chapter 1 draft', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Could not save. Download your Java before leaving.');
  const feed = await (await request.get('/rss.xml')).text();
  expect(feed).toContain('/weekly/2026-09-18-transaction-boundaries');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const project of TINY_SYSTEMS) expect(sitemap).toContain(`/build/${project.slug}`);
  expect((await request.get('/build/does-not-exist')).status()).toBe(404);
});
for (const width of [390, 768, 1440]) test(`tiny systems remain readable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const project of TINY_SYSTEMS) {
    await page.goto(`/build/${project.slug}`);
    await page.getByText('Chapter 3 reference implementation', { exact: true }).click();
    const scroll = page.locator('[data-reader-scroll]');
    expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('heading', { name: 'Model boundaries', exact: true }).scrollIntoViewIfNeeded();
    await page.mouse.move(width / 2, 500); await page.mouse.wheel(0, 500);
    await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    if (width === 390) {
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
      if (project.slug === 'retry-scheduler') await page.screenshot({ path: '/private/tmp/tiny-system-mobile.png' });
    }
  }
});
