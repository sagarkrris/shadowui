import { test, expect } from '@playwright/test';
import { gotoSeededApp, javaBackendProfile } from './helpers/app.js';

for (const viewport of [{ width: 390, height: 750 }, { width: 634, height: 650 }, { width: 1280, height: 800 }]) {
  test(`More actions remain reachable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await gotoSeededApp(page, { profile: javaBackendProfile, activeTab: 'company', skipReadyCheck: true });
    if (viewport.width < 1024) {
      const navigation = page.getByRole('button', { name: 'Navigation & settings', exact: true });
      if (await navigation.getAttribute('aria-expanded') === 'false') await navigation.click();
    }
    const more = page.getByLabel('Workspace options', { exact: true });
    await more.click();
    const help = page.getByRole('button', { name: 'About & help', exact: true });
    // Opening More must reveal an action immediately, before browser auto-scrolling.
    await expect.poll(() => help.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return element === hit || element.contains(hit);
    })).toBe(true);
    await help.scrollIntoViewIfNeeded();
    // Visibility alone does not detect a dropdown clipped by a scroll container.
    await help.click({ trial: true });
    const tools = page.locator('details').filter({ has: more }).getByRole('button', { name: 'Session tools', exact: true });
    await tools.scrollIntoViewIfNeeded();
    await expect.poll(() => tools.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return element === hit || element.contains(hit);
    })).toBe(true);
    await tools.focus();
    await page.keyboard.press('Escape');
    await expect(more).toBeFocused();
    await expect(help).toBeHidden();
    await more.press('Enter');
    await help.click();
    await expect(page.getByRole('dialog', { name: 'Built for focused interview preparation.' })).toBeVisible();
  });
}
