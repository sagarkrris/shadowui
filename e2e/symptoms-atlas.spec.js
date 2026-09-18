import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { SYMPTOMS } from '../lib/engineeringSymptoms.mjs';
test.use({ serviceWorkers: 'block' });
test('reader can search by symptom, filter, recover from no results and download a reproduction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Search engineering symptoms →' }).click();
  await page.getByRole('searchbox', { name: 'Search symptoms' }).fill('duplicate messages');
  await expect(page.getByRole('status')).toHaveText('1 symptom found');
  await page.getByRole('button', { name: 'Databases', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No matching entry yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search and filters' }).click();
  await page.getByRole('link', { name: 'Messages are processed twice' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Messages are processed twice');
  await expect(page.getByText('Evidence that weakens it', { exact: true })).toHaveCount(3);
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download duplicate-delivery.py' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('duplicate-delivery.py');
  expect(await readFile(await download.path(), 'utf8')).toContain('INSERT OR IGNORE INTO processed');
});
test('copy works and blocked clipboard leaves the source readable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } }));
  await page.goto('/symptoms/low-cpu-slow-requests');
  await page.getByRole('button', { name: 'Copy example' }).click();
  expect(await page.evaluate(() => window.__copied)).toContain('ThreadPoolExecutor');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('blocked'); }; });
  await page.getByRole('button', { name: 'Copy example' }).click();
  await expect(page.getByRole('status')).toContainText('Clipboard unavailable');
  await page.getByText('Read the complete runnable example', { exact: true }).click();
  await expect(page.getByLabel('Runnable Python example')).toBeVisible();
});
for (const width of [390, 412, 768, 1440]) test(`entries and code scroll at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/symptoms");
  expect(await page.locator("[data-reader-scroll]").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  for (const { slug } of SYMPTOMS) {
    await page.goto(`/symptoms/${slug}#reproduce`);
    await expect(page.getByRole('heading', { name: 'Try it yourself: a minimal reproduction' })).toBeInViewport();
    await page.getByText('Read the complete runnable example', { exact: true }).click();
    expect(await page.locator('[data-reader-scroll]').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await page.getByRole('heading', { name: 'References and corrections' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'References and corrections' })).toBeInViewport();
  }
});
test('ten symptoms have real lesson, scenario and practice destinations', async ({ page }) => {
  await page.goto('/symptoms');
  await expect(page.getByRole('status')).toHaveText('10 symptoms found');
  await page.getByRole('button', { name: 'Spring', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('2 symptoms found');
  for (const entry of SYMPTOMS) {
    await page.goto(`/symptoms/${entry.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.title);
    await expect(page.getByRole('link', { name: /^Lesson:/ })).toHaveAttribute('href', `/java/${entry.learningPath[0]}`);
    await page.getByRole('link', { name: 'Practice: work through the scenario and its rubric' }).click();
    await expect(page.getByRole('heading', { name: 'Practice the existing scenario' })).toBeInViewport();
    await expect(page.getByLabel('Your scenario response')).toBeEnabled();
  }
});
test('public scenario practice persists drafts and reveals the existing rubric', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/symptoms/hashmap-entry-disappears');
  await page.getByRole('link', { name: /^Scenario:/ }).click();
  await page.getByLabel('Your scenario response').fill('Inspect key mutability and test equivalent instances.');
  await page.reload();
  await expect(page.getByLabel('Your scenario response')).toHaveValue('Inspect key mutability and test equivalent instances.');
  await page.getByText('Compare with the existing answer outline and rubric', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Self-review rubric' })).toBeVisible();
  await page.goto('/scenarios/not-a-scenario');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});
