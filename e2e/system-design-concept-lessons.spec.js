import { test, expect } from '@playwright/test';
import { SYSTEM_DESIGN_VISUAL_GUIDE } from '../lib/systemDesignVisualGuide.mjs';

test.use({ serviceWorkers: 'block' });
const concepts = SYSTEM_DESIGN_VISUAL_GUIDE.sections.flatMap(section => section.concepts);

for (const width of [390, 1280]) test(`all fifty interview lessons work from beginner to deep dive at ${width}px`, async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width, height: 900 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/system-design/visual-guide#foundation');
  await expect(page.locator('.reader-tools')).toBeVisible();
  await expect(page.locator('[data-concept]')).toHaveCount(50);
  for (const concept of concepts) {
    const lesson = page.locator('[data-concept]').filter({ has: page.getByRole('heading', { level: 3, name: concept.name, exact: true }) });
    await expect(lesson.getByText(concept.beginner, { exact: true })).toBeVisible();
    await expect(lesson.getByRole('region', { name: `${concept.name} interview answer`, exact: true })).toContainText(concept.interviewAnswer);
    await expect(lesson.getByText(concept.deepDive, { exact: true })).toBeHidden();
  }
  await page.getByRole('button', { name: 'Expand all learning levels', exact: true }).click();
  await expect(page.locator('[data-concept-level][open]')).toHaveCount(200);
  for (const concept of concepts) await expect(page.getByText(concept.deepDive, { exact: true })).toBeVisible();
  expect(await page.locator('main').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
  await page.getByRole('button', { name: 'Collapse all learning levels', exact: true }).click();
  await expect(page.locator('[data-concept-level][open]')).toHaveCount(0);
  const scalability = page.locator('[data-concept="Scalability"]');
  const deep = scalability.locator('details').filter({ has: page.locator('summary').filter({ hasText: '4 · Deep dive' }) });
  await deep.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(deep).toHaveAttribute('open', '');
  await scalability.getByRole('button', { name: 'Bookmark Scalability', exact: true }).click();
  await page.reload();
  await expect(scalability.getByRole('button', { name: 'Bookmark Scalability', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/system-design/visual-guide#read-scalability');
  await expect(page.locator('.reader-tools')).toBeVisible();
  const heading = scalability.getByRole('heading', { level: 3, name: 'Scalability', exact: true });
  await expect(heading).toBeInViewport();
  await expect.poll(() => heading.evaluate(el => el.getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('lesson search finds deep explanation and independent section links still work', async ({ page }) => {
  await page.goto('/system-design/visual-guide');
  await page.getByRole('searchbox', { name: 'Search within this article' }).fill('stale fill');
  await page.locator('.reader-tools').getByRole('button', { name: 'Cache', exact: true }).click();
  await expect(page).toHaveURL(/#read-cache$/);
  await expect(page.getByRole('heading', { name: 'Cache', level: 3, exact: true })).toBeInViewport();
  await page.goto('/system-design/visual-guide#read-saga');
  await expect(page.getByRole('heading', { name: 'Saga', level: 3, exact: true })).toBeInViewport();
  await expect(page.locator('[data-concept="Saga"]')).toContainText('Distributed transactions are not impossible');
});
