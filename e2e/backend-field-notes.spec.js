import { test, expect } from '@playwright/test';
import { BACKEND_FIELD_NOTES } from '../lib/backendFieldNotes.mjs';
import { readFile } from 'node:fs/promises';
import { gotoSeededApp } from './helpers/app.js';
test.use({ serviceWorkers: 'block' });
for (const blog of BACKEND_FIELD_NOTES) test(`${blog.id}: discover, check misconception, download and bookmark`, async ({ page, request }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tech-blogs');
  await page.getByRole('link', { name: blog.title, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(blog.title);
  await expect(page.getByRole('searchbox', { name: 'Search within this article' })).toBeVisible();
  await page.getByRole('radio', { name: blog.misconception.options[0], exact: true }).check();
  await expect(page.getByRole('status').filter({ hasText: blog.misconception.feedback[0] })).toBeVisible();
  await page.getByRole('radio', { name: blog.misconception.options[blog.misconception.correct], exact: true }).check();
  await expect(page.getByRole('status').filter({ hasText: blog.misconception.feedback[blog.misconception.correct] })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download runnable example' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(blog.fixture);
  expect(await readFile(await download.path(), 'utf8')).toContain('assert');
  for (const link of blog.related) expect((await request.get(link.href)).status()).toBe(200);
  await page.getByRole('button', { name: 'Bookmark 2-minute overview', exact: true }).click();
  await page.goto('/notebook');
  await expect(page.getByRole('link', { name: '2-minute overview', exact: true })).toHaveAttribute('href', `/tech-blogs/${blog.id}#read-2-minute-overview`);
  expect(errors).toEqual([]);
});
test('articles are in home search, reading path, RSS and sitemap', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search articles', exact: true }).fill('payment');
  await expect(page.getByRole('link', { name: BACKEND_FIELD_NOTES[0].title, exact: true })).toBeVisible();
  await page.goto('/series/backend-failure-boundaries');
  for (const blog of BACKEND_FIELD_NOTES) await expect(page.getByRole('link', { name: blog.title, exact: true })).toBeVisible();
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const feed = await (await request.get('/rss.xml')).text();
  for (const blog of BACKEND_FIELD_NOTES) { expect(sitemap).toContain(`/tech-blogs/${blog.id}`); expect(feed).toContain(`/tech-blogs/${blog.id}`); }
});
test('new articles work in the existing practice workspace reader', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(BACKEND_FIELD_NOTES[0].title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${BACKEND_FIELD_NOTES[0].title} full lesson` });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'Open the article, runnable example, references and misconception check →' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(BACKEND_FIELD_NOTES[0].title);
  expect(errors).toEqual([]);
});
for (const width of [390, 768, 1440]) test(`articles scroll and remain accessible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const blog of BACKEND_FIELD_NOTES) {
    await page.goto(`/tech-blogs/${blog.id}`);
    await expect(page.getByRole('searchbox', { name: 'Search within this article' })).toBeVisible();
    await page.getByText('Read the complete example', { exact: true }).click();
    const scroll = page.locator('.reader-article-scroll');
    expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await page.mouse.move(width / 2, 500); await page.mouse.wheel(0, 400);
    await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    if (width === 390) {
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
      if (blog.id === BACKEND_FIELD_NOTES[0].id) { await page.getByRole('heading', { name: 'Follow the annotated trace' }).scrollIntoViewIfNeeded(); await page.screenshot({ path: '/private/tmp/blog-mobile.png' }); }
    }
  }
});
