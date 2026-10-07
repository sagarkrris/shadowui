import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Time in Production: Instants, Zones, Deadlines, and Schedules';
async function verify(reader) {
  await expect(reader.getByText('System.nanoTime readings may be negative', { exact: false })).toBeVisible();
  await expect(reader.getByText('One nanosecond before the due instant returns WAIT.', { exact: false })).toBeVisible();
  await expect(reader.getByText('local time is in a gap', { exact: false })).toBeVisible();
  await expect(reader.getByText('UNKNOWN', { exact: true }).first()).toBeVisible();
  const diagram = reader.locator('[data-course-diagram="scheduleIdentity"]').first();
  await expect(diagram.getByRole('img')).toBeVisible();
  await diagram.getByRole('button', { name: 'Text view' }).click();
  await expect(diagram.locator('dt').filter({ hasText: /^Durable run key$/ })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Spend a monotonic deadline budget', exact: true })).toBeVisible();
}
for (const width of [375, 1366]) test(`Java time course renders at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/tech-blogs/java-time-production');
  await verify(page.locator('main'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
test('Java time course renders in the workspace reader', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  await verify(page.getByRole('dialog', { name: `${title} full lesson` }));
});
