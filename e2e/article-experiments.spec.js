import { test, expect } from '@playwright/test';
import { EXPERIMENTS, EXPERIMENT_KEY } from '../lib/articleExperiments.mjs';
import { RESUME_KEY } from '../lib/learningResume.mjs';
import { DETECTIVE_CASES } from '../lib/productionDetective.mjs';
test.use({ serviceWorkers: 'block' });
for (const [id, model] of Object.entries(EXPERIMENTS)) test(`predict, compare and resume ${id}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tech-blogs/${id}`);
  const experiment = page.getByRole('region', { name: 'Prediction experiment' });
  await expect(experiment.getByRole('button', { name: 'Run experiment' })).toBeDisabled();
  await experiment.getByLabel('Your prediction').selectOption('1');
  await experiment.getByLabel('Confidence', { exact: true }).selectOption('100');
  await experiment.getByRole('button', { name: 'Run experiment' }).click();
  await expect(experiment.getByRole('status').filter({ hasText: 'Observed:' })).toContainText('Your prediction differed.');
  await experiment.getByLabel('Why did your prediction hold or fail?').fill('I confused the observation with the guarantee.');
  await page.reload();
  await expect(experiment.getByLabel('Why did your prediction hold or fail?')).toHaveValue('I confused the observation with the guarantee.');
  await experiment.getByLabel(model.condition, { exact: true }).selectOption('1');
  await expect(experiment.getByText('Observed:', { exact: false })).toHaveCount(0);
  await experiment.getByLabel('Your prediction').selectOption('1');
  await experiment.getByRole('button', { name: 'Run experiment' }).click();
  await expect(experiment.getByRole('status').filter({ hasText: 'Observed:' })).toContainText(model.answers[1]);
  await expect(experiment.getByRole('status').filter({ hasText: 'Observed:' })).toContainText('Your prediction matched.');
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.run?.condition, EXPERIMENT_KEY + id)).toBe(1);
  await page.locator('#experiment').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.[0]?.href, RESUME_KEY)).toContain('#');
  await page.goto('/');
  const resume = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Continue where you left off' }) });
  await resume.getByRole('link').filter({ hasText: /→$/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/tech-blogs/${id}#`));
  await expect(experiment.getByLabel(model.condition, { exact: true })).toHaveValue('1');
  expect(await page.locator('.reader-article-scroll').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  expect(await page.evaluate(async () => (await window.axe.run('#experiment', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
  if (id === 'request-timed-out-did-payment-happen') {
    await experiment.getByLabel(model.condition, { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/private/tmp/experiment-${test.info().project.name}.png` });
  }
});
test('project chapter resumes without losing its saved implementation', async ({ page }) => {
  await page.goto('/build/connection-pool');
  const editor = page.getByRole('textbox', { name: 'Java implementation — chapter 2', exact: true });
  await editor.fill('// saved chapter two');
  await page.getByRole('button', { name: 'Save chapter 2 draft', exact: true }).click();
  await page.locator('#chapter-2').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.[0]?.href, RESUME_KEY)).toBe('/build/connection-pool#chapter-2');
  await page.goto('/');
  await page.getByRole('link', { name: 'Build a connection pool model →', exact: true }).click();
  await expect(editor).toHaveValue('// saved chapter two');
  await expect.poll(() => page.locator('#chapter-2').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(120);
});
test('unavailable storage leaves experiments usable and explains the limit', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('disabled'); }; });
  await page.goto('/tech-blogs/request-timed-out-did-payment-happen');
  await page.getByLabel('Your prediction').selectOption('0');
  await page.getByRole('button', { name: 'Run experiment' }).click();
  await expect(page.getByText('Observed: 1 charge.')).toBeVisible();
  await expect(page.getByText('Could not save this experiment. Keep this tab open to retain your work.')).toBeVisible();
});
test('recent investigation resumes inspected evidence', async ({ page }) => {
  const incident = DETECTIVE_CASES[0];
  await page.goto(`/detective/${incident.slug}`);
  await page.getByRole('button', { name: `01 / ${incident.evidence[0].title}` }).click();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.[0]?.href, RESUME_KEY)).toContain(`/detective/${incident.slug}`);
  await page.goto('/');
  const resume = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Continue where you left off' }) });
  await resume.getByRole('link', { name: `${incident.title} →`, exact: true }).click();
  await expect(page.getByText('1 of 3 clues inspected', { exact: true })).toBeVisible();
});
