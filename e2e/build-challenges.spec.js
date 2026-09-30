import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { BUILD_CHALLENGES } from '../lib/buildChallenges.mjs';
test.use({ serviceWorkers: 'block' });

test('catalog supports combined filtering and preserves guided projects', async ({ page }) => {
  await page.goto('/build');
  await expect(page.getByRole('status')).toHaveText(`${BUILD_CHALLENGES.length} challenges shown`);
  await expect(page.getByRole('link', { name: 'Dependency-injection container', exact: true })).toBeVisible();
  await page.getByLabel('Track', { exact: true }).selectOption('Concurrency');
  await page.getByLabel('Difficulty', { exact: true }).selectOption('Hard');
  await expect(page.getByRole('status')).toHaveText('1 challenges shown');
  await page.getByLabel('Search challenges').fill('no such challenge');
  await expect(page.getByText('No challenges match.', { exact: false })).toBeVisible();
});

test('offline mobile practice saves, invalidates evidence, downloads exact draft and exposes hints', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('**/api/build-challenge', route => route.fulfill({ json: { configured: false } }));
  await page.goto('/build/practice/cache-expiry');
  const editor = page.getByLabel('Java implementation');
  await expect(editor).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Run examples' })).toBeDisabled();
  const draft = `${await editor.inputValue()}\n// saved draft`;
  await editor.fill(draft);
  await page.getByLabel('Your reasoning').fill('Compare both TTL and version.');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.reload();
  await expect(editor).toHaveValue(draft);
  await expect(page.getByLabel('Your reasoning')).toHaveValue('Compare both TTL and version.');
  await expect(page.getByRole('checkbox')).toBeChecked();
  await editor.fill(`${draft}\n// changed`);
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download code and tests', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Main.java');
  const source = await readFile(await download.path(), 'utf8');
  expect(source).toContain('// changed');
  expect(source).toContain('CHECKS PASSED: cache-expiry v1 all');
  await page.getByText('Hint 1', { exact: true }).click();
  await expect(page.getByText('Check freshness and version separately.', { exact: true })).toBeVisible();
  await page.getByText('Reference implementation and trade-offs', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('runner submission uses current draft, basic checks do not complete progress, full checks do', async ({ page }) => {
  let posted;
  await page.route('**/api/build-challenge', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true } });
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { passed: true, mode: posted.mode, output: 'PASS', message: 'Practice checks passed.' } });
  });
  await page.goto('/build/practice/cache-expiry');
  await page.getByLabel('Java implementation').fill('class Solution {} // current');
  await page.getByRole('button', { name: 'Run examples' }).click();
  await expect(page.getByRole('heading', { name: 'Checks passed', exact: true })).toBeVisible();
  expect(posted.code).toBe('class Solution {} // current');
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Run all failure checks' }).click();
  await expect(page.getByText('Progress: All runner checks passed', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Progress: All runner checks passed', { exact: false })).toBeVisible();
  await page.getByLabel('Java implementation').fill('class Solution {} // edited');
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
});

test('editing cancels pending results and AI failures cannot certify code', async ({ page }) => {
  let pending;
  await page.route('**/api/build-challenge', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true } });
    pending = route;
  });
  await page.route('**/api/evaluate', route => route.fulfill({ status: 503, json: { error: 'AI review unavailable' } }));
  await page.goto('/build/practice/cache-expiry');
  await page.getByRole('button', { name: 'Run all failure checks' }).click();
  await expect(page.getByRole('button', { name: 'Cancel run' })).toBeVisible();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await page.getByLabel('Java implementation').fill('class Solution {} // new');
  await pending.fulfill({ json: { passed: true, mode: 'all', output: 'stale' } });
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Checks passed', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review my implementation' }).click();
  await expect(page.getByRole('status')).toContainText('AI review unavailable');
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
});

test('all challenge routes, reverse lesson links and sitemap are wired', async ({ page, request }) => {
  for (const c of BUILD_CHALLENGES) {
    await page.goto(`/build/practice/${c.id}`);
    await expect(page.getByRole('heading', { name: c.title, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Learn the concept first' })).toHaveAttribute('href', `/tech-blogs/${c.lesson}`);
  }
  await page.goto('/tech-blogs/java-background-jobs');
  await expect(page.getByRole('region', { name: 'Related coding challenges' }).getByRole('link')).toHaveCount(4);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const c of BUILD_CHALLENGES) expect(sitemap).toContain(`/build/practice/${c.id}`);
});

test('failed runner checks preserve draft and do not record a pass', async ({ page }) => {
  await page.route('**/api/build-challenge', route => route.fulfill({ json: route.request().method()==='GET' ? { configured: true } : { passed: false, mode: 'all', output: 'AssertionError: contract failed', message: 'Checks did not pass.' } }));
  await page.goto('/build/practice/cache-expiry');
  await page.getByRole('button', { name: 'Run all failure checks' }).click();
  await expect(page.getByRole('heading', { name: 'Checks failed', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Test result' })).toContainText('AssertionError');
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Progress: Not verified.', { exact: false })).toBeVisible();
});
