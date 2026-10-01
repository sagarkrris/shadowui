import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java File Uploads: Streaming, Validation, Quarantine, and Safe Delivery';
const path = '/tech-blogs/java-file-uploads-production';

for (const width of [375, 1366]) test(`public file-upload course preserves lifecycle boundaries at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 812 });
  const response = await page.goto(path);
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(page.getByText(/UNKNOWN, not CLEAN/)).toBeVisible();
  await expect(page.getByText(/A signed storage URL usually remains usable/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enforce an upload byte budget', exact: true })).toHaveAttribute('href', '/build/practice/upload-byte-budget');
  const overview = page.locator('[data-course-diagram="fileUpload"]').first();
  await expect(overview.getByRole('img')).toBeVisible();
  await overview.getByRole('button', { name: 'Text view' }).click();
  await expect(overview.locator('dt').filter({ hasText: /^Private object version$/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('workspace reader exposes file-upload answers, diagrams, and practice link', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  await expect(dialog.locator('[data-course-diagram="fileDeletion"]')).toBeVisible();
  await expect(dialog.getByRole('region', { name: 'Related coding challenges' }).getByRole('link', { name: 'Enforce an upload byte budget', exact: true })).toBeVisible();
  const answers = dialog.locator('details');
  await expect(answers).toHaveCount(6);
  await answers.nth(2).locator('summary').click();
  await expect(answers.nth(2)).toContainText('immutable recorded version');
  await answers.nth(4).locator('summary').click();
  await expect(answers.nth(4)).toContainText('resource owner or read grant');
  await expect(answers.nth(4)).toContainText('application deletion alone does not invalidate it');
});
