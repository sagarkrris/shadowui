import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

test('practice popovers dismiss outside, preserve inside controls, and restore focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoSeededApp(page);
  const trigger = page.getByRole('button', { name: 'Workspace menu', exact: true });
  const menu = page.getByRole('region', { name: 'Tablet workspace menu' });
  await trigger.click();
  await expect(menu).toBeVisible();
  await menu.getByText('Choose a focused prep room.', { exact: true }).click();
  await expect(menu).toBeVisible();
  await page.getByRole('heading', { name: /^Practise / }).click();
  await expect(menu).toBeHidden();
  await trigger.click();
  await trigger.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('link', { name: 'Courses', exact: true }).focus();
  await expect(menu).toBeHidden();

  const controls = page.getByRole('button', { name: 'Prep controls', exact: true });
  const panel = page.getByRole('region', { name: 'Compact prep controls menu' });
  await controls.click();
  await expect(panel).toBeVisible();
  await page.getByRole('heading', { name: /^Practise / }).click();
  await expect(panel).toBeHidden();
  const options = page.getByLabel('Workspace options', { exact: true });
  await options.click();
  await expect(page.getByRole('button', { name: 'About & help', exact: true })).toBeVisible();
  await page.getByRole('heading', { name: /^Practise / }).click();
  await expect(page.getByRole('button', { name: 'About & help', exact: true })).toBeHidden();
});

for (const width of [390, 1440]) test(`session checklist and course discovery work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await gotoSeededApp(page);
  const courseLink = page.getByRole('link', { name: 'Browse in-depth courses', exact: false });
  await expect(courseLink).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Start mock', exact: true })).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('practice-home.png') });
  const plan = page.getByRole('region', { name: 'Your prep session' });
  await expect(plan).toBeHidden();
  await expect(page.getByRole('button', { name: 'Add evidence record' })).toBeHidden();
  await expect(page.getByLabel('Feedback depth')).toBeHidden();
  await expect(page.getByLabel('Message composer')).toBeVisible();
  await page.getByText('Study session plan', { exact: true }).click();
  const checkbox = plan.getByRole('checkbox').first();
  const label = plan.locator('label').filter({ has: page.getByRole('checkbox') }).first();
  await label.scrollIntoViewIfNeeded();
  const box = await checkbox.boundingBox();
  const text = await label.locator('span').boundingBox();
  expect(Math.abs(box.y - text.y)).toBeLessThanOrEqual(5);
  expect(text.x - box.x).toBeGreaterThanOrEqual(24);
  expect(box.width).toBe(18);
  await label.click();
  await expect(checkbox).toBeChecked();
  await expect(plan.getByRole('status')).toContainText('1 of 3 steps checked');
  await plan.getByRole('heading').evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: test.info().outputPath('practice-checklist.png') });
  await courseLink.click();
  await expect(page).toHaveURL(/\/learn#courses$/);
  await expect(page.getByRole('heading', { name: 'Courses, guides and tutorial library', exact: true })).toBeInViewport();
});

test('mobile workspace menu dismisses when the content is tapped', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await gotoSeededApp(page);
  await page.getByRole('navigation').getByRole('button', { name: 'More', exact: true }).click();
  const menu = page.getByRole('region', { name: 'Mobile workspace menu' });
  await expect(menu).toBeVisible();
  await page.getByRole('heading', { name: /^Practise / }).click();
  await expect(menu).toBeHidden();
});
