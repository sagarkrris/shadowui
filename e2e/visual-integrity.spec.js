import { test, expect } from '@playwright/test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { SYMPTOM_DIAGRAMS, BUILD_DIAGRAMS } from '../lib/learningDiagrams.mjs';
import { gotoSeededApp } from './helpers/app.js';
import { JAVA_INTERVIEW_QA, JAVA_TUTORIAL_CATALOG, slugifyJavaTutorial } from '../lib/javaDigest.mjs';

for (const width of [375, 1366]) test(`all ${JAVA_TUTORIAL_CATALOG.length} Java tutorials use genuine visual diagrams without repeated source at ${width}px`, async ({ page }, testInfo) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width, height: 900 });
  const reviewed = [];
  for (const tutorial of JAVA_TUTORIAL_CATALOG) {
    await page.goto(`/java/tutorial/${slugifyJavaTutorial(tutorial.title)}`);
    const diagram = page.locator('[data-flow-kind]');
    await expect(diagram).toHaveCount(1);
    const svg = diagram.locator('svg[data-diagram-artwork="authored-flow"]');
    await expect(svg).toBeVisible();
    expect(await svg.locator('[data-diagram-node]').count(), tutorial.title).toBeGreaterThan(0);
    expect(await svg.locator('[data-artwork-edge]').count(), tutorial.title).toBeGreaterThan(0);
    await expect(page.locator('[data-source-preserved], [data-diagram-source]')).toHaveCount(0);
    await expect(diagram.locator('pre:visible')).toHaveCount(0);
    await diagram.getByRole('button', { name: 'Text view', exact: true }).click();
    await expect(svg).toBeHidden();
    await expect(diagram.getByRole('region', { name: /original relationships$/ })).toHaveText(tutorial.diagram.trim());
    await expect(diagram.locator('pre')).toHaveCount(1);
    await diagram.getByRole('button', { name: 'Diagram', exact: true }).click();
    await expect(svg).toBeVisible();
    await expect(diagram.locator('pre:visible')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), tutorial.title).toBe(true);
    reviewed.push(tutorial.title);
    if (['Modules', 'Spring profiles', 'Java Memory Management'].includes(tutorial.title)) {
      await diagram.getByRole('button', { name: 'Fit to panel', exact: true }).click();
      await svg.screenshot({ path: testInfo.outputPath(`${slugifyJavaTutorial(tutorial.title)}-${width}.png`) });
    }
  }
  await testInfo.attach('tutorial-diagram-audit', { body: JSON.stringify({ width, reviewed }, null, 2), contentType: 'application/json' });
});

const routes = [
  ...listTechBlogs().map(blog => `/tech-blogs/${blog.id}`),
  ...Object.keys(SYMPTOM_DIAGRAMS).map(slug => `/symptoms/${slug}`),
  ...Object.keys(BUILD_DIAGRAMS).map(slug => `/build/${slug}`),
];

for (const width of [375, 1366]) test(`all ${routes.length} illustrated readers have intact labels and images at ${width}px`, async ({ page }, testInfo) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width, height: 900 });
  const seen = new Set();
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response.status(), route).toBe(200);
    const diagrams = page.locator('[data-course-diagram]');
    await expect(page.locator('[data-source-preserved]')).toHaveCount(0);
    expect(await diagrams.count(), route).toBeGreaterThan(0);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => diagrams.evaluateAll(figures => figures.flatMap(figure => {
      const key = figure.dataset.courseDiagram;
      const svg = figure.querySelector('svg');
      const issues = [];
      if (!svg.hasAttribute('data-diagram-artwork') && !svg.hasAttribute('data-illustrated-diagram')) issues.push(`${key}: old diagram renderer`);
      if (!svg.getAttribute('aria-labelledby')) issues.push(`${key}: missing accessible name`);
      for (const group of svg.querySelectorAll('[data-diagram-node]')) {
        const box = group.querySelector('rect').getBBox();
        for (const text of group.querySelectorAll('text')) {
          const bounds = text.getBBox();
          if (bounds.x < box.x + 3 || bounds.x + bounds.width > box.x + box.width - 3 || bounds.y < box.y || bounds.y + bounds.height > box.y + box.height) issues.push(`${key}/${group.dataset.diagramNode}: label outside node: ${text.textContent}`);
        }
      }
      return issues;
    })), { message: route }).toEqual([]);
    for (const key of await diagrams.evaluateAll(items => items.map(item => item.dataset.courseDiagram))) seen.add(key);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBeTruthy();
    expect(await page.locator('img').evaluateAll(images => images.filter(img => !img.hasAttribute('alt') || (img.complete && img.naturalWidth === 0)).map(img => img.src)), route).toEqual([]);
  }
  await testInfo.attach('visual-coverage', { body: JSON.stringify({ width, routes, diagrams: [...seen] }, null, 2), contentType: 'application/json' });
});

for (const width of [375, 1366]) test(`tutorial branches and new project diagrams remain understandable at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/java/tutorial/dependency-inversion');
  const flow = page.locator('[data-flow-kind="source"]');
  await expect(flow.locator('[data-artwork-edge]')).toHaveCount(2);
  await expect(flow.locator('pre:visible')).toHaveCount(0);
  await flow.getByRole('button', { name: 'Text view', exact: true }).click();
  await expect(flow).toContainText('policy → owned port ← infrastructure adapter');
  await expect(flow.getByRole('listitem')).toHaveCount(5);
  await flow.screenshot({ path: testInfo.outputPath('reverse-dependency-flow.png') });
  await page.goto('/build/inverted-index');
  const diagram = page.locator('[data-course-diagram="buildIndex"]');
  await diagram.getByRole('button', { name: 'Text view' }).click();
  await expect(diagram.getByRole('listitem').filter({ hasText: 'intersection' })).toHaveCount(2);
  await diagram.screenshot({ path: testInfo.outputPath('index-text-view.png') });
  await diagram.getByRole('button', { name: 'Diagram', exact: true }).click();
  await diagram.screenshot({ path: testInfo.outputPath('index-graph.png') });
});

test('AI alternatives have comparison cues and complete explanations', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'course', homeDemoSeen: true });
  const beginner = page.locator('#beginner-genai');
  await beginner.getByLabel('Choose a lesson').selectOption('4');
  const guide = beginner.getByRole('region', { name: 'Visual guide: Match the missing capability' });
  await expect(guide).toContainText('not consecutive steps');
  await expect(guide.locator('[data-visual-steps]')).not.toContainText('→');
  await expect(guide.locator('[data-visual-steps]')).not.toContainText('✓');
});

test('design revision preserves full names of isolated components', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await gotoSeededApp(page, { activeTab: 'designLab', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Revise a design', exact: true }).click();
  const workshop = page.getByRole('region', { name: 'Design revision workspace' });
  await workshop.getByText('Edit components and assumptions', { exact: true }).click();
  await workshop.getByRole('button', { name: 'Add component', exact: true }).click();
  const name = 'Isolated notification reconciliation processor with no connections';
  await workshop.getByLabel('Component name', { exact: true }).last().fill(name);
  await workshop.getByText('Edit components and assumptions', { exact: true }).click();
  await expect(workshop.getByRole('list', { name: 'Initial design: complete component names' })).toContainText(name);
  await expect(workshop.getByRole('img', { name: 'Initial design architecture diagram' })).toHaveAttribute('viewBox', /^0 0 300 /);
});

test('workspace mechanisms retain every authored step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('navigation', { name: 'Java Digest sections' }).getByRole('button', { name: 'Interview Q&A', exact: true }).click();
  const entries = JAVA_INTERVIEW_QA.filter(entry => entry.diagramSteps?.length >= 2);
  const diagrams = page.locator('[data-mechanism-diagram]');
  await expect(diagrams).toHaveCount(entries.length);
  for (let index = 0; index < entries.length; index++) {
    const diagram = diagrams.nth(index);
    const authored = diagram.getByRole('list', { name: 'Mechanism at a glance components', exact: true, includeHidden: true });
    const details = await authored.locator('li button > span').allTextContents();
    expect(details).toEqual(entries[index].diagramSteps);
    await expect(diagram.locator('[data-artwork-edge]')).toHaveCount(entries[index].diagramSteps.length - 1);
    await expect(diagram.locator(':scope > ol')).toHaveCount(0);
  }
});

test('interviewer image loads with alternative text', async ({ page }) => {
  await gotoSeededApp(page);
  await page.getByRole('button', { name: 'Open Tech Buddy', exact: true }).click();
  const portrait = page.locator('img[src*="tech-buddy-interviewer"]');
  await expect(portrait).toBeVisible();
  expect(await portrait.getAttribute('alt')).toBeTruthy();
  await expect.poll(() => portrait.evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
});
