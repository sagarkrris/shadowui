import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Feature Flags: Targeting, Rollout, and Safe Retirement';
const path = '/tech-blogs/java-feature-flags-production';

async function verifyRollback(reader) {
  const demo = reader.getByRole('region', { name: 'Interactive course demo' });
  const state = demo.getByRole('group', { name: 'Current model state' });
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(state).toContainText('new / v3');
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(state).toContainText('new / v3');
  await expect(demo.getByText('With the percentage and targeting rules unchanged', { exact: false })).toBeVisible();
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(state).toContainText('established / v4');
  await expect(demo.getByText('The cohort version and bucket stay unchanged, but the variant changes.', { exact: false })).toBeVisible();
}

for (const width of [375, 1366]) test(`public feature-flag course preserves rollout boundaries at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 812 });
  const response = await page.goto(path);
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await verifyRollback(page);
  await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(page.getByText(/flag result is not authorization/)).toBeVisible();
  await expect(page.getByText(/At expiry, no delayed work and no verified removal returns EXPIRED/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Assign a stable feature cohort', exact: true })).toHaveAttribute('href', '/build/practice/stable-feature-rollout');
  const overview = page.locator('[data-course-diagram="featureFlag"]').first();
  await expect(overview.getByRole('img')).toBeVisible();
  await overview.getByRole('button', { name: 'Text view' }).click();
  await expect(overview.locator('dt').filter({ hasText: /^Resource authorization$/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('workspace reader exposes authored feature-flag answers, diagram, and practice link', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await verifyRollback(dialog);
  await expect(dialog.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(dialog.locator('[data-course-diagram="featureFlag"]').first()).toBeVisible();
  await expect(dialog.getByRole('region', { name: 'Related coding challenges' }).getByRole('link', { name: 'Assign a stable feature cohort', exact: true })).toBeVisible();
  const answers = dialog.locator('details');
  await expect(answers).toHaveCount(6);
  await answers.nth(3).locator('summary').click();
  await expect(answers.nth(3)).toContainText('policy has changed');
  await answers.nth(4).locator('summary').click();
  await expect(answers.nth(4)).toContainText('rollback changes later evaluations only');
  await answers.nth(5).locator('summary').click();
  await expect(answers.nth(5)).toContainText('the flag remains EXPIRED until its owner has approved and verified removal');
});
