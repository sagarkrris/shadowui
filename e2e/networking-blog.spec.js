import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Production Networking for Java Services: DNS, TLS, HTTP, Proxies, and Deadlines';
const path = '/tech-blogs/java-service-networking';

for (const width of [375, 1366]) test(`public networking course preserves trust and deadline boundaries at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 812 });
  const response = await page.goto(path);
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(page.getByText(/business outcome is unknown/)).toBeVisible();
  await expect(page.getByText(/authenticated principal and resource ownership/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Derive a downstream timeout', exact: true })).toHaveAttribute('href', '/build/practice/downstream-timeout-budget');
  const overview = page.locator('[data-course-diagram="networkPath"]').first();
  await expect(overview.getByRole('img')).toBeVisible();
  await overview.getByRole('button', { name: 'Text view' }).click();
  await expect(overview.locator('dt').filter({ hasText: /^Verify TLS identity$/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('workspace reader exposes the complete networking course and authored answers', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(dialog.locator('[data-course-diagram="proxyTrust"]')).toBeVisible();
  await expect(dialog.getByRole('region', { name: 'Related coding challenges' }).getByRole('link', { name: 'Derive a downstream timeout', exact: true })).toBeVisible();
  const answers = dialog.locator('details');
  await expect(answers).toHaveCount(6);
  await answers.nth(3).locator('summary').click();
  await expect(answers.nth(3)).toContainText('reconcile');
});
