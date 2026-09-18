import { test, expect } from '@playwright/test';
import { gotoSeededApp, mockDsaChallenges } from './helpers/app.js';

for (const width of [390, 768, 1440]) test(`study guide preserves readable state tables at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
  await mockDsaChallenges(page, { fail: true });
  await gotoSeededApp(page, { activeTab: 'dsaLab', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Blind 75 Visual Track', exact: true }).click();
  await page.getByRole('button', { name: /Best Time to Buy and Sell Stock/ }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('link', { name: 'State', exact: true }).click();
  const table = dialog.getByRole('table', { name: 'State', exact: true });
  await expect(table.getByRole('columnheader', { name: 'Variable', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Role', exact: true })).toBeVisible();
  await expect(table.getByRole('rowheader', { name: 'minPrice', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'Cheapest price seen so far', exact: true })).toBeVisible();
  expect(await table.evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(width);
  expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await expect(dialog.getByRole('table', { name: 'Test it yourself', exact: true }).getByRole('columnheader', { name: 'Expected', exact: true })).toBeAttached();
  await page.screenshot({ path: `/private/tmp/dsa-state-${width}-${test.info().project.name}.png` });
  await dialog.getByRole('link', { name: 'Java solution', exact: true }).click();
  await expect(dialog.getByLabel('Code example')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close study guide' }).click();
  await expect(dialog).toHaveCount(0);
});
