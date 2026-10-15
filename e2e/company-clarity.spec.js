import { test, expect } from '@playwright/test';
import { gotoSeededApp, javaBackendProfile, mockChat } from './helpers/app.js';

test.use({ serviceWorkers: 'block' });
const sections = page => page.getByRole('navigation', { name: 'Company prep sections' });
for (const colorScheme of ['light', 'dark']) for (const width of [390, 1280]) {
  test(`Company Prep presents one task and keeps secondary tools reachable at ${width}px in ${colorScheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width, height: 900 });
    await gotoSeededApp(page, { profile: javaBackendProfile, selectedCat: 'Java Core', selectedSub: 'OOP', activeTab: 'company' });
    await expect(page.getByRole('button', { name: 'Practise this round' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Amazon Prep Room' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Provider Status' })).toBeHidden();
    await expect(page.getByRole('heading', { name: /Application Tracker/ })).toBeHidden();
    await expect(page.locator('#session-actions')).toBeHidden();
    if (width > 760) {
      expect(await page.locator('#app-header').evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(75);
      await page.getByLabel('Workspace options', { exact: true }).click();
      await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Session tools', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Export Session', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Session tools', exact: true }).click();
      await page.getByLabel('Workspace options', { exact: true }).press('Escape');
    }
    await sections(page).getByRole('button', { name: 'Applications', exact: true }).click();
    await page.getByPlaceholder('Company', { exact: true }).fill('Draft company');
    await page.getByLabel('Follow-up date and time', { exact: true }).fill('2026-10-20T10:00');
    await sections(page).getByRole('button', { name: 'Prep brief', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Amazon Prep Room' })).toBeVisible();
    await sections(page).getByRole('button', { name: 'Practice questions', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Latest DSA Patterns' })).toBeVisible();
    await sections(page).getByRole('button', { name: 'Progress & sources', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Provider Status' })).toBeVisible();
    await sections(page).getByRole('button', { name: 'Applications', exact: true }).click();
    await expect(page.getByPlaceholder('Company', { exact: true })).toHaveValue('Draft company');
    await expect(page.getByLabel('Follow-up date and time', { exact: true })).toHaveValue('2026-10-20T10:00');
    await sections(page).getByRole('button', { name: 'Overview', exact: true }).click();
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
    expect(await page.locator('.workspace-content').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`company-${width}-${colorScheme}.png`) });
  });
}

test('practised rounds survive reload and the recommended mock uses the current company and role', async ({ page }) => {
  const requests = await mockChat(page, 'Let us practise this round.');
  await gotoSeededApp(page, { profile: javaBackendProfile, selectedCat: 'Java Core', selectedSub: 'OOP', activeTab: 'company' });
  await expect(page.getByRole('button', { name: 'Practise this round' })).toBeVisible();
  const rounds = page.getByRole('heading', { name: 'Round Map' }).locator('..').locator('..').locator('..');
  await rounds.getByRole('button', { name: 'Practiced', exact: true }).first().click();
  await expect(page.getByText('1 of 4 rounds practised', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 of 4 rounds practised', { exact: false })).toBeVisible();
  await page.getByLabel('Company search', { exact: true }).fill('Google');
  await page.getByLabel('Role context', { exact: true }).fill('Senior Java engineer');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('Google · Recommended practice')).toBeVisible();
  await page.getByRole('button', { name: 'Practise this round', exact: true }).click();
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(requests.at(-1).messages.at(-1).content).toContain('Google');
  expect(requests.at(-1).messages.at(-1).content).toContain('Senior Java engineer');
});

test('workspace options keep help and profile editing usable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoSeededApp(page, { profile: javaBackendProfile, activeTab: 'company', selectedCat: 'Java Core', selectedSub: 'OOP' });
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'About & help', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Built for focused interview preparation.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close about', exact: true }).click();
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Priya');
});
