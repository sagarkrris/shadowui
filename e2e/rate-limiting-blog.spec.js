import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Rate Limiting: Fairness, Identity, and Distributed Enforcement';
const path = '/tech-blogs/java-rate-limiting';
async function verifyAdmissionTrace(reader) {
  const demo = reader.getByRole('region', { name: 'Interactive course demo' });
  const state = demo.getByRole('group', { name: 'Current model state' });
  const quota = state.locator('div').filter({ hasText: /^Quota tokens/ }).locator('span');
  const outcome = state.locator('div').filter({ hasText: /^Request outcome/ }).locator('span');
  await expect(quota).toHaveText('2');
  for (const [tokens, result] of [['1', 'accepted'], ['0', 'accepted'], ['0', 'rejected']]) {
    await demo.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(quota).toHaveText(tokens);
    await expect(outcome).toHaveText(result);
  }
  await expect(demo.getByText('No quota tokens remain.', { exact: false })).toBeVisible();
  await expect(demo.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
}
for (const width of [375, 1366]) test(`public rate-limiting course exposes bounded admission at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 812 }); await page.goto(path);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Interactive course demo' })).toBeVisible();
  await verifyAdmissionTrace(page);
  const overview = page.locator('[data-course-diagram="rateLimit"]').first();
  await expect(overview.getByRole('img')).toBeVisible();
  await expect(overview.getByRole('region')).toHaveAttribute('tabindex', '0');
  const diagram = page.getByLabel('1. Start with the resource and trusted identity diagram');
  await expect(diagram).toContainText('trusted tenant');
  await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(page.getByRole('link', { name: 'Enforce a rolling request limit', exact: true })).toHaveAttribute('href', '/build/practice/window-rate-limiter');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});
test('workspace reader keeps rate-limit answers and practice visible', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click(); await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await verifyAdmissionTrace(dialog);
  await expect(dialog.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await dialog.locator('details').first().locator('summary').click();
  await expect(dialog.locator('details').first()).toContainText('authenticated');
  await expect(dialog.getByRole('region', { name: 'Related coding challenges' }).getByRole('link', { name: 'Enforce a rolling request limit', exact: true })).toBeVisible();
});
