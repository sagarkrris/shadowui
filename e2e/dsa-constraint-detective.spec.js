import { test, expect } from '@playwright/test';
import { gotoSeededApp, mockDsaChallenges } from './helpers/app.js';

for (const width of [390, 1440]) test(`constraint detective explains changing assumptions at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await mockDsaChallenges(page, { fail: true });
  await gotoSeededApp(page, { activeTab: 'dsaLab', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Constraint Detective', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Constraint Detective: choose a DS from the clues', exact: true });
  const decision = panel.getByRole('article', { name: 'Worked constraint decision' });
  await expect(decision.getByRole('heading', { name: 'Two Sum: unsorted, original indices' })).toBeVisible();
  await expect(decision).toContainText('check the complement before inserting');
  await panel.getByLabel('Choose a constraint scenario').selectOption('sum-negative');
  await expect(decision).toContainText('Prefix sum + HashMap of prefix frequencies');
  await expect(decision).toContainText('5,000,050,000');
  await expect(decision).not.toContainText('value → earlier index');
  const followup = decision.getByText('Interviewer follow-up and explained answer', { exact: true });
  await followup.focus();
  await page.keyboard.press('Enter');
  await expect(decision.getByText(/Why not a set\?/)).toBeVisible();
  await panel.getByLabel('Choose a constraint scenario').selectOption('top-k');
  await expect(decision).toContainText('Min-heap of at most k values');
  await expect(decision).toContainText('Heap iteration is not sorted');
  await expect(decision.getByText(/Why a min-heap/)).not.toBeVisible();
  await panel.getByLabel('Choose a constraint scenario').selectOption('two-sum');
  await expect(decision).toContainText('two different indices');
  expect(await panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  for (const region of await panel.getByRole('region').all()) {
    expect(await region.evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(width);
  }
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const contrast = await panel.evaluate(async el => (await window.axe.run(el, { runOnly: ['color-contrast'] })).violations);
  expect(contrast).toEqual([]);
  await panel.getByRole('heading', { name: 'Constraint Detective: choose a DS from the clues', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath(`constraint-detective-${width}.png`), fullPage: true });
});
