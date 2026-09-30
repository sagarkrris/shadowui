import { expect, test } from '@playwright/test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DEMOS, COURSE_DEMO_ASSIGNMENTS } from '../lib/courseDemos.mjs';
import { BUILD_CHALLENGES } from '../lib/buildChallenges.mjs';
import { gotoSeededApp } from './helpers/app.js';

// No hand-maintained course list: every new catalog entry joins the executed browser gate.
const courses = listTechBlogs();

async function verifyDemo(reader, course) {
  const region = reader.getByRole('region', { name: 'Interactive course demo', exact: true });
  await expect(region).toBeVisible();
  for (const id of COURSE_DEMO_ASSIGNMENTS[course.id]) {
    if (COURSE_DEMO_ASSIGNMENTS[course.id].length > 1) await region.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption(id);
    const demo = COURSE_DEMOS[id];
    await expect(region.getByRole('heading', { name: demo.title, exact: true })).toBeVisible();
    if (demo.kind === 'trace') {
      for (let scenario = 0; scenario < demo.scenarios.length; scenario++) {
        await region.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption(String(scenario));
        await region.getByRole('list', { name: 'Demo steps' }).getByRole('button').last().click();
        const last = demo.scenarios[scenario].steps.at(-1);
        await expect(region.getByRole('heading', { name: last[0], exact: true })).toBeVisible();
        const state = region.getByRole('group', { name: 'Current model state' });
        for (const value of last[2]) await expect(state).toContainText(value);
        await region.getByRole('button', { name: 'Reset', exact: true }).click();
        await expect(region.getByRole('progressbar', { name: 'Demo progress' })).toHaveAttribute('value', '1');
      }
    } else {
      await region.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(region.getByRole('progressbar', { name: 'Demo progress' })).toHaveAttribute('value', '2');
    }
  }
}

async function verifyLesson(reader, course) {
  if (course.format !== 'field-note') {
    await expect(reader.getByText('When to avoid:', { exact: true })).toHaveCount(course.chapters.length);
    const answers = reader.locator('details').filter({ has: reader.page().locator('summary', { hasText: /^Sample answer$/ }) });
    await expect(answers).toHaveCount(course.chapters.length);
    await answers.last().locator('summary').click();
    await expect(answers.last()).toContainText(course.chapters.at(-1).answer);
  }
  for (const challenge of BUILD_CHALLENGES.filter(c => c.lesson === course.id)) {
    await expect(reader.getByRole('link', { name: challenge.title, exact: true })).toHaveAttribute('href', `/build/practice/${challenge.id}`);
  }
}

for (const course of courses) {
  for (const width of [375, 1366]) test(`${course.id}: public reader and demos at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(`/tech-blogs/${course.id}`);
    expect(response.status()).toBe(200);
    await expect(page.getByRole('heading', { name: course.title, exact: true })).toBeVisible();
    await verifyLesson(page.locator('main'), course);
    await verifyDemo(page.locator('main'), course);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });

  test(`${course.id}: workspace reader`, async ({ page }) => {
    await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
    await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
    await page.getByText(course.title, { exact: true }).click();
    const dialog = page.getByRole('dialog', { name: `${course.title} full lesson` });
    await expect(dialog).toBeVisible();
    await verifyLesson(dialog, course);
    await verifyDemo(dialog, course);
    await dialog.getByRole('button', { name: 'Close lesson reader' }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test('every course is discoverable in the public index and sitemap', async ({ page, request }) => {
  await page.goto('/tech-blogs');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const course of courses) {
    await expect(page.locator(`a[href="/tech-blogs/${course.id}"]`).first()).toBeVisible();
    expect(xml).toContain(`/tech-blogs/${course.id}</loc>`);
  }
});
