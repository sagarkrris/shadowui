import { test, expect } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

for (const width of [390, 1440]) test(`AI curriculum and attempt-before-reveal at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await gotoSeededApp(page, { activeTab: 'course', homeDemoSeen: true });
  await expect(page.getByRole('heading', { name: 'AI for Software Engineers', exact: true, level: 1 })).toBeVisible();
  const project = page.getByRole('region', { name: 'Progressive project' });
  const download = page.waitForEvent('download');
  await project.getByRole('link', { name: /Download the complete lab/ }).click();
  expect((await download).suggestedFilename()).toBe('interviewiq-lab.mjs');
  await expect(page.locator('article[id^="module-"]')).toHaveCount(6);
  const last = page.getByRole('region', { name: 'Classroom: AI-assisted coding and delivery' });
  await last.getByText('Compare with the expected solution').click();
  await expect(last.getByText(/A useful prompt names/)).toBeVisible();
  const studio = page.getByRole('region', { name: 'Interview studio' });
  await studio.getByLabel('Experience level').selectOption('Intermediate');
  const question = studio.getByRole('article').first();
  const reveal = question.getByRole('button', { name: 'Reveal answer and follow-up' });
  await expect(reveal).toBeDisabled();
  await expect(question.getByText('Strong answer:', { exact: true })).toHaveCount(0);
  await question.getByLabel('Your attempt').fill('Filter authorized notes before ranking, then test the private top result.');
  await reveal.click();
  await expect(question.getByText('Explained follow-up:', { exact: true })).toBeVisible();
  await question.getByLabel('Your attempt').fill('');
  await expect(question.getByText('Strong answer:', { exact: true })).toHaveCount(0);
  await studio.getByLabel('Experience level').selectOption('Senior');
  await expect(studio.getByRole('article')).toHaveCount(4);
  expect(await studio.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `/private/tmp/ai-course-${width}.png` });
});

for (const width of [390, 1440]) test(`visual lessons and context budget at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await gotoSeededApp(page, { activeTab: 'course', homeDemoSeen: true });
  await expect(page.getByRole('region', { name: 'How to learn this course' })).toBeVisible();
  const lessonModule = page.locator('#module-llm-foundations');
  const visual = lessonModule.getByRole('region', { name: 'Visual guide: What actually goes into a model request?' });
  await visual.getByRole('button', { name: /2.*Application → model/ }).click();
  await expect(visual.getByRole('button', { name: /2.*Application → model/ })).toHaveAttribute('aria-pressed', 'true');
  const budget = lessonModule.getByRole('region', { name: 'Context budget explorer' });
  await expect(budget.getByRole('status')).toContainText('Fits: 1,000 tokens');
  await budget.getByRole('button', { name: 'Double baseline history' }).click();
  await expect(budget.getByRole('status')).toContainText('Blocked before generation: 600');
  await budget.getByRole('button', { name: 'Show 20% headroom' }).click();
  await expect(budget.getByRole('status')).toContainText('Fits: 1,600');
  await budget.getByRole('button', { name: 'Reset budget' }).click();
  await budget.getByRole('checkbox').check();
  await expect(budget.getByRole('status')).toContainText('Blocked before generation: 500');
  await budget.getByRole('button', { name: 'Reset budget' }).click();
  await expect(budget.getByRole('checkbox')).not.toBeChecked();
  await expect(lessonModule.getByRole('heading', { name: '90-minute teaching plan' })).toBeHidden();
  await lessonModule.getByText('Teacher notes and 90-minute teaching plan', { exact: true }).click();
  await expect(lessonModule.getByRole('heading', { name: '90-minute teaching plan' })).toBeVisible();
  await lessonModule.getByText('Teacher notes and 90-minute teaching plan', { exact: true }).click();
  for (const path of ['genai', 'rag']) {
    const section = page.locator(`#beginner-${path}`);
    for (let index = 0; index < 6; index++) {
      await section.getByLabel('Choose a lesson').selectOption(String(index));
      const guide = section.getByRole('region', { name: /^Visual guide:/ });
      await expect(guide).toBeVisible();
      expect(await guide.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    }
  }
  const advanced = page.locator('#advanced-workshops');
  const ids = await advanced.getByLabel('Choose a workshop').locator('option').evaluateAll(options => options.map(option => option.value));
  for (const id of ids) {
    await advanced.getByLabel('Choose a workshop').selectOption(id);
    await expect(advanced.getByRole('region', { name: /^Visual guide:/ })).toBeVisible();
  }
  await lessonModule.scrollIntoViewIfNeeded();
  expect(await lessonModule.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await visual.evaluate(el => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: `/private/tmp/ai-visual-course-${width}.png` });
});
