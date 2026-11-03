import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const slug = 'java-idempotent-commands';
const title = 'Java Idempotent Commands: One Intent Through Retries and Uncertainty';
for (const width of [375, 1366]) test(`idempotent command reader preserves UNKNOWN at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/tech-blogs/${slug}`);
  const diagram = page.locator('[data-course-diagram="idempotencyCommand"]').first();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(diagram.getByRole('img')).toBeVisible();
  await diagram.getByRole('button', { name: 'Text view', exact: true }).click();
  await expect(diagram.locator('dt').filter({ hasText: 'UNKNOWN' })).toBeVisible();
  await expect(diagram.locator('dd').filter({ hasText: 'Reconcile same identity' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('workspace reader exposes idempotent command ownership and original-key recovery', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.locator('[data-course-diagram="idempotencyCommand"]').first()).toBeVisible();
  await expect(dialog.getByRole('img', { name: /Same provider key/ }).first()).toBeVisible();
});
