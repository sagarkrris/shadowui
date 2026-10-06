import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Money: Minor Units, Rounding, FX, and Reconciliation';
async function verify(reader) {
  await expect(reader.getByText('Convert 100 USD minor units', { exact: false })).toBeVisible();
  await expect(reader.getByText('UNKNOWN with op-1', { exact: false })).toBeVisible();
  const diagram = reader.locator('[data-course-diagram="moneyFlow"]').first();
  await expect(diagram.getByRole('img')).toBeVisible();
  await diagram.getByRole('button', { name: 'Text view' }).click();
  await expect(diagram.locator('dt').filter({ hasText: /^Reconcile UNKNOWN$/ })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Allocate indivisible minor units', exact: true })).toBeVisible();
}
for (const width of [375, 1366]) test(`money corrections and diagrams at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/tech-blogs/java-money-production');
  await verify(page.locator('main'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
test('money corrections in workspace', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  await verify(page.getByRole('dialog', { name: `${title} full lesson` }));
});
