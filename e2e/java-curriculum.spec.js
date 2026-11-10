import { test, expect } from '@playwright/test';
import { JAVA_CURATED_TUTORIAL_CATALOG as course, slugifyJavaTutorial } from '../lib/javaDigest.mjs';
import { getJavaCurriculumGroups } from '../lib/javaCurriculum.mjs';

for (const group of getJavaCurriculumGroups(course)) test(`Java chapter navigation follows roadmap: ${group.title}`, async ({ page }) => {
  test.setTimeout(120000);
  for (const lesson of group.steps) {
    await page.goto(`/java/tutorial/${slugifyJavaTutorial(lesson.title)}`);
    await expect(page.getByRole('heading', { level: 1, name: lesson.title, exact: true })).toBeVisible();
    const footer = page.locator('article > footer');
    const previous = course[lesson.chapterNumber - 2];
    const next = course[lesson.chapterNumber];
    await expect(footer.locator('a')).toHaveCount(Number(!!previous) + Number(!!next));
    if (previous) await expect(footer.getByRole('link', { name: `← ${previous.title}`, exact: true })).toHaveAttribute('href', `/java/tutorial/${slugifyJavaTutorial(previous.title)}`);
    if (next) await expect(footer.getByRole('link', { name: `${next.title} →`, exact: true })).toHaveAttribute('href', `/java/tutorial/${slugifyJavaTutorial(next.title)}`);
    await expect(page.locator('#interview-follow-up')).toContainText(lesson.followUp);
    await expect(page.locator('#diagram figure').first()).toBeAttached();
    const solution = page.locator('#retention-exercise details');
    await expect(solution.locator('p')).not.toBeVisible();
    await solution.locator('summary').click();
    await expect(solution.locator('p')).toHaveText(lesson.solution);
  }
});

for (const width of [375, 1366]) test(`beginner source, diagram and next link work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/java/tutorial/generics');
  await expect(page.locator('#example')).toContainText('public class LessonExample');
  await expect(page.locator('#example')).toContainText('Box<String>');
  await expect(page.getByText('javac -d out LessonExample.java', { exact: true })).toBeVisible();
  await page.locator('#diagram').scrollIntoViewIfNeeded();
  await expect(page.locator('#diagram figure').first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath(`java-generics-${width}.png`) });
  expect(await page.locator('article').evaluate(element => element.scrollWidth <= element.clientWidth + 2)).toBe(true);
  await page.locator('article > footer').getByRole('link', { name: 'Wildcards and PECS →', exact: true }).click();
  await expect(page).toHaveURL(/wildcards-and-pecs$/);
});

test('roadmap renders the same complete order and retains historical progress', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('interviewiq.javaRoadmapProgress.v1', JSON.stringify(['catalog-33', 'catalog-103'])));
  await page.goto('/java/roadmap');
  const checklist = page.getByRole('region', { name: 'Complete chapter checklist' });
  await expect(checklist).toContainText(`2 of ${course.length} chapters complete`);
  const links = await checklist.locator('ol a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
  expect(links).toEqual(course.map(lesson => `/java/tutorial/${slugifyJavaTutorial(lesson.title)}`));
  for (const label of ['Generics complete', 'Java Memory Management complete']) await expect(checklist.getByRole('checkbox', { name: label, exact: true, includeHidden: true })).toBeChecked();
});
