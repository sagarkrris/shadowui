import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Connection Pools: Ownership, Timeouts, and Safe Release';
const path = '/tech-blogs/java-connection-pools';

for (const width of [375, 1366]) {
  test(`public connection-pool course exposes ownership guidance and diagrams at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Interactive course demo' })).toBeVisible();
    const diagram = page.getByLabel('1. Treat checkout as owned, bounded work diagram');
    await expect(diagram).toHaveCSS('white-space', 'pre-wrap');
    await expect(diagram).toContainText('cancelled caller');
    await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(6);
    await expect(page.getByRole('link', { name: 'Budget a database connection checkout', exact: true })).toHaveAttribute('href', '/build/practice/connection-acquisition-budget');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
}

test('workspace reader keeps connection-pool guidance and self-check answers available', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.getByText('When to avoid:', { exact: true })).toHaveCount(6);
  const answer = dialog.locator('details').first();
  await answer.locator('summary').click();
  await expect(answer).toContainText('cancellation');
  await expect(dialog.getByRole('region', { name: 'Related coding challenges' }).getByRole('link', { name: 'Budget a database connection checkout', exact: true })).toBeVisible();
});
