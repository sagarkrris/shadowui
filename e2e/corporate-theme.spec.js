import { test, expect } from '@playwright/test';
import { WORKSPACE_TABS } from '../lib/workspaces.mjs';
import { gotoSeededApp, javaBackendProfile } from './helpers/app.js';

test.use({ serviceWorkers: 'block', colorScheme: 'dark' });
for (const workspace of [{ id: 'chat', label: 'Today' }, ...WORKSPACE_TABS]) {
  test(`${workspace.label} keeps a readable dark workspace`, async ({ page }, testInfo) => {
    await gotoSeededApp(page, { profile: javaBackendProfile, selectedCat: 'Java Core', selectedSub: 'OOP', activeTab: workspace.id, skipReadyCheck: true });
    await expect(page.locator('.app-shell')).toHaveClass(/theme-dark/);
    await expect(page.locator('.chat-scroll').getByRole('heading').first()).toBeVisible();
    await expect(page.locator('#session-actions')).toBeHidden();
    await page.getByLabel('Workspace options', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'About & help', exact: true })).toBeVisible();
    await page.getByLabel('Workspace options', { exact: true }).press('Escape');
    await page.screenshot({ path: testInfo.outputPath('dark-workspace.png') });
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const violations = await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations);
    expect(violations).toEqual([]);
  });
}
