import { test, expect } from '@playwright/test';
import { WORKSPACE_TABS } from '../lib/workspaces.mjs';
import { ADVICE_FAILS_ARTICLES } from '../lib/adviceFails.mjs';
import { EXPLAIN_LOGS } from '../lib/explainThisLog.mjs';
import { PUBLIC_STACK_GUIDES } from '../lib/seoGuides.mjs';
import { PUBLIC_RESOURCES } from '../lib/publicContent.mjs';
import { PUBLIC_NAVIGATION } from '../lib/publicNavigation.mjs';
import { gotoSeededApp, javaBackendProfile } from './helpers/app.js';

test.use({ serviceWorkers: 'block', colorScheme: 'light' });

async function checkLayout(page, testInfo, scope) {
  await page.screenshot({ path: testInfo.outputPath('initial-view.png') });
  const metrics = await page.evaluate(selector => {
    const root = document.querySelector(selector);
    const header = document.querySelector('#app-header');
    return {
      overflow: root.scrollWidth - root.clientWidth,
      viewportOverflow: document.documentElement.scrollWidth - innerWidth,
      headerHeight: header?.getBoundingClientRect().height || 0,
      headings: [...root.querySelectorAll('h1,h2')].filter(el => el.getClientRects().length).map(el => el.textContent.trim()),
    };
  }, scope);
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const violations = await page.evaluate(async selector => (await window.axe.run(selector, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations, scope);
  await testInfo.attach('layout-review', { body: JSON.stringify({ ...metrics, violations }, null, 2), contentType: 'application/json' });
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(metrics.viewportOverflow).toBeLessThanOrEqual(1);
  expect(violations).toEqual([]);
}

for (const width of [390, 1280]) {
  for (const workspace of [{ id: 'chat', label: 'Today' }, ...WORKSPACE_TABS]) {
    test(`${workspace.label} workspace layout at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await gotoSeededApp(page, { profile: javaBackendProfile, selectedCat: 'Java Core', selectedSub: 'OOP', activeTab: workspace.id, skipReadyCheck: true });
      await expect(page.locator('.chat-scroll').getByRole('heading').first()).toBeVisible();
      if (workspace.id !== 'chat') {
        await expect(page.locator('#session-actions')).toBeHidden();
        if (width > 760) {
          expect(await page.locator('#app-header').evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(75);
          await page.getByLabel('Workspace options', { exact: true }).click();
          await expect(page.getByRole('button', { name: 'Session tools', exact: true })).toBeVisible();
          await page.getByLabel('Workspace options', { exact: true }).press('Escape');
        }
      }
      if (['canvas', 'designLab', 'dsaLab', 'javaDigest'].includes(workspace.id)) {
        const guide = page.locator('.workspace-guidance');
        await expect(guide).not.toHaveAttribute('open', '');
        await expect(guide.locator('.answer-at-a-glance')).toBeHidden();
        await guide.locator('summary').click();
        await expect(guide.getByText('Worked example', { exact: true })).toBeVisible();
        await guide.locator('summary').click();
      }
      if (workspace.id === 'interviewReady') {
        const checklist = page.locator('.workspace-guidance');
        await expect(checklist.getByText('Lead with the direct answer in the first sentence.')).toBeHidden();
        await checklist.locator('summary').click();
        await expect(checklist.getByText('Lead with the direct answer in the first sentence.')).toBeVisible();
        await checklist.locator('summary').click();
      }
      await checkLayout(page, testInfo, 'main');
      expect(errors).toEqual([]);
    });
  }
  const routes = [...new Set(['/', ...PUBLIC_NAVIGATION.flatMap(group => group.items.map(item => item.href)), '/tech-blogs', '/java/hashmap-internals', '/tech-blogs/java-money-production', '/advice-fails', `/advice-fails/${ADVICE_FAILS_ARTICLES[0].slug}`, '/explain-log', `/explain-log/${EXPLAIN_LOGS[0].slug}`, '/guides', `/guides/${PUBLIC_STACK_GUIDES[0].stack}/${PUBLIC_STACK_GUIDES[0].slug}`, '/resources', `/resources/${PUBLIC_RESOURCES[0].slug}`, '/java', '/share/readiness', '/spring/spring-boot-interview-questions', '/sql/sql-interview-questions', '/java/listicle/java-interview-questions', '/reset-password', '/privacy', '/corrections', '/requests', '/sign-in'])].filter(path => path !== '/practice');
  for (const route of routes) {
    test(`public ${route} layout at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      expect((await page.goto(route)).status()).toBe(200);
      await expect(page.locator('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
      if (['/spring/spring-boot-interview-questions', '/sql/sql-interview-questions', '/java/listicle/java-interview-questions'].includes(route)) {
        await page.locator('main details').filter({ has: page.getByLabel('Answer at a glance', { exact: true }) }).first().locator('summary').click();
        await expect(page.getByLabel('Answer at a glance', { exact: true }).first()).toBeVisible();
      }
      await checkLayout(page, testInfo, 'main');
      expect(errors).toEqual([]);
    });
  }
}
