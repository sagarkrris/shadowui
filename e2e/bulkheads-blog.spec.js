import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const slug = 'java-bulkheads-backpressure';
const title = 'Java Bulkheads and Backpressure: Bounded Work Without Silent Loss';
for (const width of [375, 1366]) test(`bulkheads reader preserves overload meaning at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/tech-blogs/${slug}`);
  const diagram = page.locator('[data-course-diagram="bulkhead"]').first();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(diagram.getByRole('img')).toBeVisible();
  await diagram.getByRole('button', { name: 'Text view', exact: true }).click();
  await expect(diagram.getByRole('listitem').filter({ hasText: 'full' })).toContainText('Reject before dispatch');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('workspace reader exposes bulkhead owner and UNKNOWN recovery', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.locator('[data-course-diagram="bulkhead"]').first()).toBeVisible();
  await expect(dialog.getByText('Release only when the effect owner reaches a safe point', { exact: false })).toBeVisible();
});
