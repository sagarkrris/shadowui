import { expect, test } from '@playwright/test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DEMOS, COURSE_DEMO_ASSIGNMENTS } from '../lib/courseDemos.mjs';
import { BUILD_CHALLENGES } from '../lib/buildChallenges.mjs';
import { gotoSeededApp } from './helpers/app.js';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { readFile } from 'node:fs/promises';

// No hand-maintained course list: every new catalog entry joins the executed browser gate.
const courses = listTechBlogs();

const illustratedLessons = [
  ['java-memory-management-evolution', 'memory'],
  ['api-gateway-production-patterns', 'gatewayTrust'],
  ['java-design-patterns-with-diagrams', 'patternStrategy'],
];

for (const [slug, key] of illustratedLessons) {
  for (const width of [375, 1366]) test(`${key}: illustration enlargement, accessible relationships and export at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/tech-blogs/${slug}`);
    const figure = page.locator(`[data-course-diagram="${key}"]`).first();
    const svg = figure.locator('[data-illustrated-diagram]');
    await expect(svg).toBeVisible();
    const connectors = await svg.locator('path[marker-end]').evaluateAll(paths => paths.map(path => ({
      moves: (path.getAttribute('d').match(/M/gi) || []).length,
      markerFound: Boolean(document.getElementById(path.getAttribute('marker-end').slice(5, -1))),
      hollow: path.getAttribute('stroke-dasharray') === '6 4',
    })));
    expect(connectors).toHaveLength(3);
    expect(connectors.every(path => path.moves === 1 && path.markerFound)).toBe(true);
    expect(connectors.filter(path => path.hollow)).toHaveLength(key === 'patternStrategy' ? 2 : 0);
    const originalWidth = await svg.evaluate(el => el.getBoundingClientRect().width);
    expect(originalWidth).toBeGreaterThanOrEqual(900);
    const clipped = await svg.locator('text').evaluateAll(labels => labels.filter(label => {
      const box = label.getBBox();
      const matrix = label.getCTM();
      const rootMatrix = label.ownerSVGElement.getCTM().inverse();
      const relative = rootMatrix.multiply(matrix);
      const topLeft = new DOMPoint(box.x, box.y).matrixTransform(relative);
      const bottomRight = new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(relative);
      return topLeft.x < 0 || topLeft.y < 0 || bottomRight.x > 900 || bottomRight.y > 540;
    }).map(label => label.textContent));
    expect(clipped).toEqual([]);
    await figure.getByRole('button', { name: 'Enlarge illustration', exact: true }).click();
    expect(await svg.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(originalWidth);
    const downloadEvent = page.waitForEvent('download');
    await figure.getByRole('button', { name: 'Download SVG', exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(`${key}-illustration.svg`);
    const exported = await readFile(await download.path(), 'utf8');
    expect(exported).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(exported).toContain('font-family="system-ui, sans-serif"');
    expect(exported).toContain(COURSE_DIAGRAMS[key].title);
    if (width === 1366) {
      const preview = await page.context().newPage();
      await preview.setViewportSize({ width: 960, height: 600 });
      await preview.goto(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(exported)}`);
      await expect(preview.getByRole('img')).toBeVisible();
      await preview.locator('svg').screenshot({ path: testInfo.outputPath(`${key}-export.png`) });
      await preview.close();
    }
    await figure.getByRole('button', { name: 'Text view', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(svg).toBeHidden();
    for (const [from, to, label] of COURSE_DIAGRAMS[key].edges) {
      const relation = figure.getByRole('listitem').filter({ hasText: label }).filter({ hasText: COURSE_DIAGRAMS[key].nodes.find(node => node[0] === from)[3] });
      await expect(relation).toContainText(COURSE_DIAGRAMS[key].nodes.find(node => node[0] === from)[3]);
      await expect(relation).toContainText(COURSE_DIAGRAMS[key].nodes.find(node => node[0] === to)[3]);
    }
    await figure.getByRole('button', { name: 'Diagram', exact: true }).click();
    await expect(figure.getByRole('button', { name: 'Reset illustration size' })).toHaveAttribute('aria-pressed', 'true');
    await figure.getByRole('button', { name: 'Reset illustration size' }).click();
    expect(await svg.evaluate(el => el.getBoundingClientRect().width)).toBe(originalWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await figure.screenshot({ path: testInfo.outputPath(`${key}-${width}.png`) });
  });

  test(`${key}: workspace uses the same illustration`, async ({ page }) => {
    await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
    await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
    const course = courses.find(item => item.id === slug);
    await page.getByText(course.title, { exact: true }).click();
    const dialog = page.getByRole('dialog', { name: `${course.title} full lesson` });
    await expect(dialog.locator(`[data-illustrated-diagram="${key}"]`).first()).toBeVisible();
  });
}

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
