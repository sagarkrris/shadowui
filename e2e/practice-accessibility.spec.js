import { test, expect } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await page.route('**/api/dsa-challenges', route => route.fulfill({ status: 503, json: { error: 'Offline fixture' } })); });
for (const workspace of ['chat', 'canvas', 'dsaLab']) {
  test(`${workspace}: mobile zoom, reduced motion and WCAG audit`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoSeededApp(page, { activeTab: workspace, homeDemoSeen: true, skipReadyCheck: true });
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
    expect(violations).toEqual([]);
    await page.setViewportSize({ width: 780, height: 844 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  });
}
