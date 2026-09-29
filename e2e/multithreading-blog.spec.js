import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Multithreading: Correctness, Cancellation, and Production Interviews';
const path = '/tech-blogs/java-multithreading-production';

for (const width of [375, 1366]) {
  test(`public multithreading course renders answers and diagrams at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Real-world interview questions and answers', exact: true })).toBeVisible();
    const answer = page.getByText('When is volatile enough, and when is it not?', { exact: true });
    await answer.click();
    await expect(page.getByText(/does not make read-modify-write/)).toBeVisible();
    await expect(page.getByLabel('2. Make check-then-act transitions atomic diagram')).toContainText('one winner');
    await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
}

test('workspace reader exposes multithreading interview answers', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(dialog.getByText('Real-world interview questions and answers', { exact: true })).toBeVisible();
  await dialog.getByText('How do you stop a running task safely?', { exact: true }).click();
  await expect(dialog.getByText(/Cancellation is cooperative/)).toBeVisible();
});
