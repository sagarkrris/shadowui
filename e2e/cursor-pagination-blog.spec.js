import { test, expect } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Cursor Pagination: Stable Pages Through Changing Data';

for (const width of [375, 1366]) {
  test(`cursor pagination public reader and diagram work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tech-blogs/java-cursor-pagination');
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Capstone: Page an order history without inventing consistency', exact: true })).toBeVisible();
    await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(6);
    const diagram = page.locator('[data-course-diagram="cursorPagination"]').first();
    await expect(diagram.getByRole('img')).toBeVisible();
    await expect(diagram.getByRole('region')).toHaveAttribute('tabindex', '0');
    if (width === 375) expect(await diagram.getByRole('region').evaluate(el => el.scrollWidth > el.clientWidth)).toBeTruthy();
    await diagram.screenshot({ path: testInfo.outputPath(`cursor-pagination-${width}.png`) });
  });
}

test('cursor pagination is discoverable in the workspace reader', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.locator('[data-course-diagram="cursorPagination"]').first()).toBeVisible();
  await expect(dialog.getByText('5. Expire stale cursors and recover deliberately', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('region', { name: 'Related coding challenges' }).getByRole('link', { name: 'Continue after a stable cursor boundary', exact: true })).toBeVisible();
});
