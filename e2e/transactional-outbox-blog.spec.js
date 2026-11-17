import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';
const slug = 'java-transactional-outbox';
const title = 'Java Transactional Outbox: Commit Once, Publish Reliably';
for (const width of [375, 1366]) test(`outbox reader preserves duplicate delivery at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto(`/tech-blogs/${slug}`);
  const diagram = page.locator('[data-course-diagram="transactionalOutbox"]').first();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible(); await expect(diagram.getByRole('img')).toBeVisible();
  await diagram.getByRole('button', { name: 'Text view', exact: true }).click(); await expect(diagram.getByText('Idempotent consumer', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});
test('workspace reader exposes outbox recovery ownership', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true }); await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click(); await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` }); await expect(dialog.locator('[data-course-diagram="transactionalOutbox"]').first()).toBeVisible(); await expect(dialog.getByText('Claim relay work without two current owners', { exact: false })).toBeVisible();
});
