import { expect, test } from '@playwright/test';
import { INTERVIEW_TOPICS, topicHref } from '../lib/interviewTopics.mjs';

for (const width of [390, 1280]) {
  for (const topic of INTERVIEW_TOPICS) {
    test(`${topic.title}: topic answers, filters and bookmarks at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/senior-java-interview');
      await page.locator('section[aria-labelledby="interview-topics-title"]').getByRole('link', { name: topic.title, exact: true }).click();
      await expect(page).toHaveURL(topicHref(topic.slug));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${topic.title} interview questions`);
      await expect(page.locator('[data-interview-question]')).toHaveCount(topic.count);
      const foundation = page.locator('[data-interview-question]').first();
      const definition = await foundation.locator(':scope > p').nth(1).textContent();
      const explanation = await foundation.locator('blockquote').textContent();
      expect(explanation.replace(/^Tier 2 · How it works:\s*/, '').trim()).not.toBe(definition.replace(/^Tier 1 · Foundation:\s*/, '').trim());
      await page.getByLabel('Learning stage', { exact: true }).selectOption('internals');
      await expect(page.locator('[data-interview-question]')).toHaveCount(topic.count / 5);
      const first = page.locator('[data-interview-question]').first();
      await expect(first.locator('blockquote')).not.toBeEmpty();
      await first.locator('details').first().locator('summary').click();
      await expect(first.locator('details').first().locator('h4')).toHaveCount(2);
      await expect(first.locator('details').first().locator('p').first()).toBeVisible();
      await first.locator('details').nth(1).locator('summary').click();
      await expect(first.locator('details').nth(1)).toContainText('How to verify:');
      const bookmark = first.getByRole('link', { name: `Bookmark ${topic.slug}-003`, exact: true });
      await bookmark.click();
      await page.reload();
      await expect(page.locator(`#${topic.slug}-003`)).toBeInViewport();
      await expect(page.locator('[data-interview-question]')).toHaveCount(topic.count);
      await page.getByLabel('Search questions and answers', { exact: true }).fill('not-a-real-question-987654');
      await expect(page.locator('[data-interview-question]')).toHaveCount(0);
      await expect(page.getByRole('status')).toContainText(`0 of ${topic.count}`);
      await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
      await expect(page.locator('[data-interview-question]')).toHaveCount(topic.count);
      const annotationFilter = page.getByRole('checkbox', { name: 'Annotation internals only', exact: true });
      if (['spring-framework', 'spring-boot', 'hibernate', 'micronaut'].includes(topic.slug)) {
        await annotationFilter.check();
        const counts = { 'spring-framework': 50, 'spring-boot': 30, hibernate: 40, micronaut: 30 };
        await expect(page.locator('[data-interview-question]')).toHaveCount(counts[topic.slug]);
        const labels = await page.locator('[data-interview-question] > p:first-child').allTextContents();
        expect(labels.length).toBeGreaterThan(0);
        expect(labels.every(label => label.includes('· @'))).toBe(true);
      }
      await page.getByLabel('Learning stage', { exact: true }).selectOption('deep-dive');
      await page.getByRole('link', { name: topic.slug === 'java' ? 'Values and references' : (await page.locator('#coverage li a').first().textContent()), exact: true }).first().click();
      await expect(page.locator(`#${topic.slug}-001`)).toBeInViewport();
      await expect(page.getByRole('status')).toContainText(`${topic.count} of ${topic.count}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (['java', 'spring-framework', 'micronaut'].includes(topic.slug)) await page.screenshot({ path: testInfo.outputPath(`${topic.slug}-${width}.png`) });
      await page.locator('details').filter({ has: page.locator('summary', { hasText: 'Existing guide material by topic' }) }).last().locator('summary').click();
      const original = page.locator('details[open] a[href*="/senior-java-interview/part-"]').first();
      await expect(original).toBeVisible();
      const href = await original.getAttribute('href');
      await original.click();
      await expect(page).toHaveURL(url => `${url.pathname}${url.hash}` === href);
      await expect(page.locator(`[id="${href.split('#')[1]}"]`)).toBeInViewport();
    });
  }
}

test('topic index, public search and sitemap discover every topic while retaining additional subjects', async ({ page }) => {
  await page.goto('/senior-java-interview/topics');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Interview questions by topic');
  for (const topic of INTERVIEW_TOPICS) await expect(page.locator(`a[href="${topicHref(topic.slug)}"]`).first()).toBeVisible();
  await page.getByText(/Additional guide subjects and practice \(/).click();
  await expect(page.locator('details[open] a').first()).toBeVisible();
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const topic of INTERVIEW_TOPICS) expect(xml).toContain(topicHref(topic.slug));
  const response = await page.request.get('/api/discovery');
  const { items } = await response.json();
  for (const topic of INTERVIEW_TOPICS) expect(items.some(item => item.href === topicHref(topic.slug))).toBe(true);
});

test('topic reader Book Mode preserves answers and returns to the active question', async ({ page }) => {
  await page.goto('/senior-java-interview/topics/spring-framework#spring-framework-101');
  await expect(page.locator('#spring-framework-101')).toBeInViewport();
  await page.getByRole('button', { name: 'Open Book Mode', exact: true }).click();
  const dialog = page.locator('dialog[open]').first();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-interview-question]')).toHaveCount(150);
  await dialog.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
  await expect(page.locator('article[aria-label="Spring Framework question bank"] [data-interview-question]')).toHaveCount(150);
});

test('changing topics resets a previous topic search and stage', async ({ page }) => {
  await page.goto('/senior-java-interview/topics/spring-framework');
  await page.getByLabel('Learning stage', { exact: true }).selectOption('internals');
  await page.getByLabel('Search questions and answers', { exact: true }).fill('Autowired');
  await expect(page.getByRole('status')).not.toContainText('150 of 150');
  await page.getByRole('navigation', { name: 'Topic navigation' }).getByRole('link', { name: 'Spring Boot →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Spring Boot interview questions');
  await expect(page.getByLabel('Search questions and answers', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Learning stage', { exact: true })).toHaveValue('all');
  await expect(page.locator('[data-interview-question]')).toHaveCount(130);
});
