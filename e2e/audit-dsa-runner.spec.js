import { test, expect } from '@playwright/test';
import { gotoSeededApp, mockChat, mockDsaChallenges } from './helpers/app.js';

test('stock visualizer shows real profit frames and recalculates custom prices', async ({ page }) => {
  await mockDsaChallenges(page, { fail: true });
  await gotoSeededApp(page, { activeTab: 'dsaLab' });
  await page.getByRole('button', { name: 'Blind 75 Visual Track', exact: true }).click();
  await page.getByRole('button', { name: /Best Time to Buy and Sell Stock/ }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Open visualizer', exact: true }).click();
  await page.getByRole('button', { name: "Go to step 5: Compare today's sale profit", exact: true }).click();
  const panel = page.getByRole('region', { name: 'Single-trade State Panel', exact: true });
  await expect(panel).toContainText('Current price');
  await expect(panel).toContainText('Minimum buy price');
  await expect(panel).toContainText('Best profit');
  await expect(panel).not.toContainText(/Left edge|Right edge/);
  await page.getByRole('textbox', { name: 'Visualize', exact: true }).fill('2,4,1');
  await page.getByRole('button', { name: 'Visualize', exact: true }).first().click();
  await page.getByRole('button', { name: 'Go to step 3: Keep the best profit', exact: true }).click();
  await expect(panel).toContainText('2');
  await expect(page.getByText('For prices [2, 4, 1], the best single-trade profit is 2.', { exact: false }).first()).toBeVisible();
});

test('Java exercise runner opens without chat calls and keeps separate exercise drafts', async ({ page }) => {
  const requests = await mockChat(page);
  let execution;
  await page.route('**/api/run-code/health', route => route.fulfill({ json: { runnable: true, summary: 'Java runner available' } }));
  await page.route('**/api/run-code', route => {
    execution = route.request().postDataJSON();
    return route.fulfill({ json: { stdout: 'Exercise output\n', exitCode: 0 } });
  });
  await gotoSeededApp(page, { activeTab: 'javaDigest' });
  await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
  const open = title => page.getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).getByRole('button', { name: 'Open runner', exact: true }).click();
  await open('Reverse a string');
  const runner = page.getByRole('region', { name: 'Java practice runner', exact: true });
  await expect(runner).toBeFocused();
  await expect(runner.getByLabel('Main.java')).toHaveValue(/reverse\("A😀B"\)/);
  await runner.getByLabel('Main.java').fill('class Main { public static void main(String[] args) { System.out.println("draft"); } }');
  await open('Count character frequency');
  await expect(runner.getByLabel('Main.java')).toHaveValue(/Exercise: Count character frequency/);
  await open('Reverse a string');
  await expect(runner.getByLabel('Main.java')).toHaveValue(/println\("draft"\)/);
  expect(requests).toHaveLength(0);
  await runner.getByRole('button', { name: 'Run Java', exact: true }).click();
  await expect(runner).toContainText('Exercise output');
  expect(execution).toMatchObject({ language: 'java', javaVersion: 17 });
  expect(execution.code).toContain('println("draft")');
  const download = page.waitForEvent('download');
  await runner.getByRole('button', { name: 'Download Main.java' }).click();
  expect((await download).suggestedFilename()).toBe('Main.java');
});

test('unconfigured exercise runner explains local execution and disables online Run', async ({ page }) => {
  await page.route('**/api/run-code/health', route => route.fulfill({ json: { runnable: false, summary: 'Online runner is not configured.' } }));
  await gotoSeededApp(page, { activeTab: 'javaDigest' });
  await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Reverse a string', exact: true }) }).getByRole('button', { name: 'Open runner', exact: true }).click();
  const runner = page.getByRole('region', { name: 'Java practice runner', exact: true });
  await expect(runner).toContainText('Online runner is not configured.');
  await expect(runner.getByRole('button', { name: 'Run Java', exact: true })).toBeDisabled();
  await expect(runner.getByRole('button', { name: 'Download Main.java' })).toBeEnabled();
  await expect(runner).toContainText('javac --release 17 Main.java');
});
