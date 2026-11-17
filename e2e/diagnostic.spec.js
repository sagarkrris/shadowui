import { test, expect } from '@playwright/test';
import { DIAGNOSTIC_KEY } from '../lib/diagnostic.mjs';

test.use({ serviceWorkers: 'block' });

test('baseline evidence leads to a budgeted journey, different retest, notebook and resumable export', async ({ page }) => {
  await page.goto('/diagnostic');
  await expect(page.getByRole('heading', { name: 'Find your next learning step', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start optional baseline' }).click();
  const jvm = page.getByRole('group', { name: /A static map keeps every completed request/ });
  await jvm.getByRole('radio', { name: /Find the retaining path/ }).check();
  const concurrency = page.getByRole('group', { name: /Two threads each execute counter/ });
  await concurrency.getByRole('radio', { name: 'The final value must be 2.', exact: true }).check();
  await concurrency.getByRole('textbox').fill('I assumed volatile made the increment atomic.');
  await page.getByRole('button', { name: 'Review evidence and build my plan' }).click();
  const javaResult = page.getByRole('region', { name: 'Java / JVM', exact: true });
  await expect(javaResult.getByText('Baseline correct', { exact: true })).toBeVisible();
  const concurrentResult = page.getByRole('region', { name: 'Concurrency', exact: true });
  await expect(concurrentResult.getByText('Review suggested', { exact: true })).toBeVisible();
  await expect(concurrentResult).toContainText('I assumed volatile made the increment atomic.');
  await expect(page.getByRole('region', { name: 'System design', exact: true }).getByText('Not observed', { exact: true })).toBeVisible();
  await expect(concurrentResult.getByRole('link', { name: 'Open the focused exercise' })).toHaveAttribute('href', '/labs/concurrency');
  await concurrentResult.getByText('Read the complete explanation and primary references', { exact: true }).click();
  await expect(concurrentResult.getByRole('heading', { name: 'A complete answer', exact: true })).toBeVisible();
  await page.getByLabel('Time per study session').selectOption('15');
  await expect(page.getByText('15 illustrative sessions at 15 minutes', { exact: true })).toBeVisible();
  await page.getByLabel('Time per study session').selectOption('60');
  await expect(page.getByText('4 illustrative sessions at 60 minutes', { exact: true })).toBeVisible();
  await concurrentResult.getByRole('button', { name: 'Retest Concurrency', exact: true }).click();
  await expect(concurrentResult.getByRole('group', { name: /A shared count needs an exact atomic increment/ })).toBeVisible();
  await concurrentResult.getByRole('radio', { name: /AtomicInteger.incrementAndGet/ }).check();
  await concurrentResult.getByRole('button', { name: 'Check retest', exact: true }).click();
  await expect(concurrentResult).toContainText('Retest correct');
  await page.getByRole('button', { name: 'Save progress', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Concurrency', exact: true })).toContainText('Retest correct');
  await expect(page.getByLabel('Time per study session')).toHaveValue('60');
  await page.getByRole('button', { name: 'Save journey to notebook' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Journey saved to My notebook' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export diagnostic JSON' }).click();
  expect((await download).suggestedFilename()).toBe('interviewiq-diagnostic.json');
  const data = JSON.parse(await page.getByLabel('Copy your diagnostic JSON').inputValue());
  expect(data.answers['concurrency-retest'].choice).toBe(0);
  expect(data.evidence.find(item => item.id === 'system-design').status).toBe('Not observed');
  await page.getByRole('link', { name: 'My notebook', exact: true }).first().click();
  await expect(page.getByRole('link', { name: 'My diagnostic learning journey', exact: true })).toBeVisible();
});

test('unsupported saved format is preserved until an explicit diagnostic-only clear', async ({ page }) => {
  await page.addInitScript(key => {
    localStorage.setItem(key, JSON.stringify({ version: 99, future: 'keep me' }));
    localStorage.setItem('diagnostic-test-other-data', 'keep other learning');
  }, DIAGNOSTIC_KEY);
  await page.goto('/diagnostic');
  await expect(page.getByRole('button', { name: 'Save progress', exact: true })).toBeDisabled();
  await expect(page.getByText(/It has been kept unchanged/)).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).future, DIAGNOSTIC_KEY)).toBe('keep me');
  await page.getByRole('button', { name: 'Clear diagnostic progress', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save progress', exact: true })).toBeEnabled();
  expect(await page.evaluate(key => localStorage.getItem(key), DIAGNOSTIC_KEY)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('diagnostic-test-other-data'))).toBe('keep other learning');
});

test('skipping all answers stays unobserved on mobile and storage failures do not claim a save', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(key => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name, value) { if (name === key) throw new Error('quota'); return write.call(this, name, value); };
  }, DIAGNOSTIC_KEY);
  await page.goto('/diagnostic');
  await page.getByRole('button', { name: 'Start optional baseline' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'Review evidence and build my plan' }).click();
  await expect(page.getByText('Not observed', { exact: true })).toHaveCount(5);
  await page.getByRole('button', { name: 'Save progress', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Could not save diagnostic' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your connected learning journey' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
