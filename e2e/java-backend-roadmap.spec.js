import { test, expect } from '@playwright/test';
import { JAVA_BACKEND_STAGES } from '../lib/javaBackendRoadmap.mjs';

test('roadmap resumes the earliest unfinished activity and preserves old chapter progress', async ({ page }) => {
  await page.goto('/java/roadmap');
  await page.evaluate(() => {
    localStorage.setItem('interviewiq.javaRoadmapProgress.v1', JSON.stringify(['catalog-1']));
    localStorage.setItem('interviewiq.javaBackendJourney.v1', JSON.stringify(['foundations:Learn', 'foundations:Learn', 'obsolete:Build']));
  });
  await page.reload();
  await expect(page.getByRole('link', { name: 'Continue: Java foundations · Experiment →' })).toHaveAttribute('href', '/java/hashmap-internals');
  await page.getByRole('checkbox', { name: 'Completed Java foundations: Experiment', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Continue: Java foundations · Build →' })).toHaveAttribute('href', '/build/inverted-index');
  await page.getByRole('checkbox', { name: 'Completed Java foundations: Learn', exact: true }).uncheck();
  await expect(page.getByRole('link', { name: 'Continue: Java foundations · Learn →' })).toBeVisible();
  await page.getByText('Core Java ·', { exact: false }).click();
  await expect(page.getByRole('checkbox', { name: 'JDK vs JRE vs JVM complete', exact: true })).toBeChecked();
});
test('blocked storage keeps the roadmap usable and reports unsaved progress', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.goto('/java/roadmap');
  await page.getByRole('checkbox', { name: 'Completed Java foundations: Learn', exact: true }).check();
  await expect(page.getByText('Could not save progress. Your checks will last only for this visit.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue: Java foundations · Experiment →' })).toBeVisible();
});
test('roadmap links resolve and fit mobile and desktop readers', async ({ page, request }) => {
  for (const href of new Set(JAVA_BACKEND_STAGES.flatMap(stage => stage.activities.map(a => a.href)))) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/java/roadmap');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Java Backend Engineer roadmap');
    expect(await page.locator('[data-reader-scroll]').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`java-backend-roadmap-${width}.png`) });
  }
});
test('home and reading paths expose the guided roadmap', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start the Java Backend Engineer roadmap →' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Java Backend Engineer roadmap');
  await page.goto('/series');
  await page.getByRole('link', { name: 'Java Backend Engineer roadmap', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Java Backend Engineer roadmap');
});

test('stage review saves an editable reflection into the existing notebook', async ({ page }) => {
  await page.goto('/java/roadmap#review-foundations');
  await page.locator('#review-foundations summary').click();
  await page.getByLabel('Review notes for Java foundations').fill('I chose a set to remove duplicate document IDs; replacement still needs stale terms removed.');
  await page.getByRole('button', { name: 'Save Java foundations reflection', exact: true }).click();
  await page.reload();
  await page.locator('#review-foundations summary').click();
  await expect(page.getByLabel('Review notes for Java foundations')).toHaveValue(/stale terms removed/);
  await page.goto('/notebook');
  await expect(page.getByText('I chose a set to remove duplicate document IDs;', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Export notes as Markdown' }).click();
  await expect(page.getByLabel('Notebook export — select and copy')).toContainText('stale terms removed');
});
