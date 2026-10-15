import { test, expect } from '@playwright/test';
import { PUBLIC_NAVIGATION } from '../lib/publicNavigation.mjs';

test.use({ serviceWorkers: 'block' });

test('public pages keep the InterviewIQ watermark visible without blocking controls', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const watermark = page.locator('.brand-watermark');
    await expect(watermark).toHaveCSS('opacity', '1');
    await expect(watermark).toHaveCSS('pointer-events', 'none');
    await expect(watermark.getByText('InterviewIQ', { exact: true }).first()).toBeVisible();
    expect((await watermark.boundingBox()).width).toBeLessThan(100);
    await expect(watermark).toHaveCSS('transform', 'none');
    await page.getByRole('button', { name: 'Preview cache capacity 3', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Cache preview result' })).toContainText('4 hits; 3 misses');
    await page.screenshot({ path: `/private/tmp/interviewiq-watermark-${width}.png` });
  }
});

test('every public menu destination resolves and menus close with Escape', async ({ page, request }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Reading navigation', exact: true });
  for (const group of PUBLIC_NAVIGATION) {
    const trigger = navigation.getByRole('button', { name: group.label, exact: true });
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    for (const item of group.items) {
      await expect(navigation.getByRole('link', { name: new RegExp(item.title) })).toBeVisible();
      expect((await request.get(item.href)).status(), item.href).toBe(200);
    }
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  }
});

test('search opens by keyboard, filters real content, and restores focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Search learning library', exact: true });
  await trigger.focus();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Search the learning library' });
  const input = dialog.getByRole('searchbox', { name: 'Search all learning content' });
  await expect(input).toBeFocused();
  await input.fill('cache');
  await dialog.getByRole('button', { name: 'Labs', exact: true }).click();
  const cache = dialog.getByRole('link', { name: /Caching: reuse and eviction/ });
  await expect(cache).toBeVisible();
  await input.fill('no-such-learning-topic');
  await expect(dialog.getByRole('heading', { name: 'No matches yet' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Clear filters' }).click();
  await expect(input).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await input.fill('single-flight');
  await dialog.getByRole('button', { name: 'Challenges', exact: true }).click();
  await dialog.getByRole('link', { name: /Coalesce concurrent cache misses/ }).click();
  await expect(page).toHaveURL(/\/build\/practice\/single-flight-cache$/);
});

test('failed catalogue loads retain shortcuts and can be retried; saved notes stay local', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('interviewiq.learningNotebook.v1', JSON.stringify([{ id: 'private-note', href: '/labs/cache', title: 'My private cache explanation', evidence: 'Private evidence text' }])));
  let fail = true;
  const requests = [];
  page.on('request', request => { if (request.url().includes('/api/discovery')) requests.push(request.url()); });
  await page.route('**/api/discovery', async route => {
    if (fail) return route.fulfill({ status: 503, json: { error: 'Unavailable' } });
    return route.fulfill({ json: { items: [{ title: 'Caching: reuse and eviction', href: '/labs/cache', category: 'Interactive lab', type: 'Lab', description: 'Fixed teaching model' }] } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Search learning library', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status')).toContainText('could not load');
  await expect(dialog.getByRole('link', { name: /Learning hub/ })).toBeVisible();
  await dialog.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(dialog.getByRole('link', { name: /My private cache explanation/ })).toBeVisible();
  expect(requests.every(url => !url.includes('private'))).toBe(true);
  fail = false;
  await dialog.getByRole('button', { name: 'Retry loading library' }).click();
  await expect(dialog.getByRole('status')).toContainText('results');
  await dialog.getByRole('button', { name: 'Labs', exact: true }).click();
  await expect(dialog.getByRole('link', { name: /Caching: reuse/ })).toBeVisible();
});

test('homepage preview computes changed cache outcomes and course category filters recover', async ({ page }) => {
  await page.goto('/');
  const result = page.getByRole('status', { name: 'Cache preview result' });
  await expect(result).toContainText('3 hits; 4 misses');
  await page.getByRole('button', { name: 'Preview cache capacity 1', exact: true }).click();
  await expect(result).toContainText('1 hits; 6 misses');
  await page.getByRole('button', { name: 'Preview cache capacity 3', exact: true }).click();
  await expect(result).toContainText('4 hits; 3 misses');
  await page.goto('/learn');
  await page.getByLabel('Course category', { exact: true }).selectOption('Java backend correctness');
  await page.getByRole('searchbox', { name: 'Search courses and lessons' }).fill('Java Money');
  await expect(page.getByRole('status').filter({ hasText: 'courses and collections' })).toHaveText('1 courses and collections');
  await page.getByRole('searchbox', { name: 'Search courses and lessons' }).fill('no-such-topic');
  await expect(page.getByText('No matching course. Try a broader topic.')).toBeVisible();
});

test('notebook search finds evidence and status filters preserve saved notes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('interviewiq.learningNotebook.v1', JSON.stringify([
    { id: 'first', href: '/labs/cache', title: 'Cache choices', evidence: 'Check eviction ordering', completed: true },
    { id: 'second', href: '/labs/queues', title: 'Queue choices', evidence: 'Bound work', completed: false },
  ])));
  await page.goto('/notebook');
  await page.getByRole('searchbox', { name: 'Search your notebook' }).fill('eviction');
  await expect(page.getByRole('heading', { name: 'Cache choices' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Queue choices' })).toHaveCount(0);
  await page.getByLabel('Activity status').selectOption('In progress');
  await expect(page.getByText('No notes match. Try a broader search or another activity status.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search your notebook' }).fill('');
  await expect(page.getByRole('heading', { name: 'Queue choices' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('interviewiq.learningNotebook.v1')).length)).toBe(2);
});

test('article navigation stays available and learning-hub navigation is not duplicated', async ({ page }) => {
  await page.goto('/java/hashmap-internals#answer');
  await expect(page.getByRole('navigation', { name: 'Reading navigation', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Search learning library', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/system-design/visual-guide');
  await expect(page.getByRole('navigation', { name: 'Reading navigation', exact: true })).toHaveCount(1);
});

for (const width of [390, 768, 1440]) test(`public redesign fits, scrolls and remains accessible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/learn', '/labs', '/notebook']) {
    await page.goto(path);
    const shell = page.locator('[data-reader-scroll]');
    expect(await shell.evaluate(element => element.scrollWidth - element.clientWidth), path).toBeLessThanOrEqual(1);
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    expect(await page.evaluate(async () => (await window.axe.run('[data-reader-scroll]', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations), path).toEqual([]);
    if (path === '/') {
      await page.screenshot({ path: `/private/tmp/interviewiq-ui/home-${width}.png` });
      await page.mouse.move(width / 2, 500); await page.mouse.wheel(0, 600);
      await expect.poll(() => shell.evaluate(element => element.scrollTop)).toBeGreaterThan(20);
    }
  }
  await page.goto('/');
  if (width <= 800) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('navigation', { name: 'Reading navigation', exact: true }).getByRole('button', { name: 'Learn', exact: true }).click();
  await page.getByRole('navigation', { name: 'Reading navigation', exact: true }).getByRole('link', { name: /Interactive labs/ }).click();
  await expect(page).toHaveURL(/\/labs$/);
  await page.getByRole('button', { name: 'Search learning library', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  expect(await page.evaluate(async () => (await window.axe.run('dialog', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
  await page.screenshot({ path: `/private/tmp/interviewiq-ui/search-${width}.png` });
  expect(errors).toEqual([]);
});
