import { test, expect } from '@playwright/test';
import { gotoSeededApp, javaBackendProfile } from './helpers/app.js';

test.use({ serviceWorkers: 'block', colorScheme: 'light' });
for (const width of [390, 1280]) {
  test(`Company Prep controls are labelled and accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoSeededApp(page, { profile: javaBackendProfile, selectedCat: 'Java Core', selectedSub: 'OOP', activeTab: 'company', skipReadyCheck: true });
    await page.getByRole('navigation', { name: 'Company prep sections' }).getByRole('button', { name: 'Applications', exact: true }).click();
    const stage = page.getByRole('combobox', { name: 'Application stage', exact: true });
    const date = page.getByLabel('Follow-up date and time', { exact: true });
    await stage.selectOption('onsite');
    await date.fill('2026-10-20T10:00');
    await expect(stage).toHaveValue('onsite');
    await expect(date).toHaveValue('2026-10-20T10:00');
    for (const control of [stage, date]) {
      expect(await control.evaluate((element) => element.getBoundingClientRect().width - element.parentElement.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    }
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
  });
  test(`System Canvas revision entry remains readable in light mode at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoSeededApp(page, { profile: javaBackendProfile, selectedCat: 'Java Core', selectedSub: 'OOP', activeTab: 'canvas', skipReadyCheck: true });
    const summary = page.getByText('Editable architecture and revisions', { exact: true });
    await expect(summary).toHaveCSS('color', 'rgb(23, 50, 77)');
    await summary.click();
    await expect(page.getByRole('heading', { name: 'Design → Challenge → Revise → Explain' })).toBeVisible();
  });
}
