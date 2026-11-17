import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('AI category merges both courses and unfiltered homepage pagination works', async ({ page }) => {
  await page.goto('/learn');
  await page.getByLabel('Course category', { exact: true }).selectOption('AI Engineering');
  await expect(page.getByRole('link', { name: 'AI for Software Engineers', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Production LLM Evaluation and Guardrails', exact: true })).toBeVisible();
  await page.goto('/');
  const count = page.getByRole('status').filter({ hasText: /Showing .* articles/ });
  await expect(count).toContainText('Showing 3 of');
  await page.getByRole('button', { name: 'Show more articles', exact: true }).click();
  await expect(count).not.toContainText('Showing 3 of');
});

test('notebook finds a legacy section bookmark through its parent title', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('interviewiq.readerBookmarks.v1', JSON.stringify([
    { href: '/java/tutorial/jdk-vs-jre-vs-jvm#read-expected-result', title: 'Expected result' },
  ])));
  await page.goto('/notebook');
  await page.getByRole('searchbox', { name: 'Search your notebook', exact: true }).fill('JDK');
  const bookmark = page.getByRole('link', { name: 'JDK vs JRE vs JVM — Expected result', exact: true });
  await expect(bookmark).toHaveAttribute('href', '/java/tutorial/jdk-vs-jre-vs-jvm#read-expected-result');
  await bookmark.click();
  await expect(page.getByRole('heading', { name: 'Expected result', exact: true })).toBeInViewport();
  await expect(page.getByRole('complementary', { name: 'Article tools and editorial details' })).toContainText('Updated 2026-11-11.');
});

test('zero cache capacity and invalid values never display a trace for another capacity', async ({ page }) => {
  await page.goto('/labs/cache');
  const input = page.getByLabel('Cache capacity', { exact: true });
  await input.fill('0');
  await expect(page.getByRole('status')).toHaveText('0 hits; 7 misses');
  await input.fill('1.5');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).toHaveText(/Enter a whole number/);
  await expect(page.getByRole('region', { name: 'Lab controls' }).getByRole('listitem')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await expect(input).toHaveValue('2');
  await expect(page.getByRole('status')).toHaveText('3 hits; 4 misses');
});

test('mobile SQL lesson buttons stay compact and do not intersect across tiers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/labs/sql');
  const nav = page.getByRole('navigation', { name: 'SQL lessons' });
  await expect(nav.getByRole('button')).toHaveCount(12);
  const rects = await nav.getByRole('button').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, height: rect.height };
  }));
  for (let i = 0; i < rects.length; i++) {
    expect(rects[i].height).toBeLessThan(120);
    for (let j = i + 1; j < rects.length; j++) {
      const overlapX = Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].x, rects[j].x);
      const overlapY = Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].y, rects[j].y);
      expect(overlapX > 1 && overlapY > 1, `lessons ${i + 1} and ${j + 1} overlap`).toBe(false);
    }
  }
});

test('preparation checkboxes identify the activity and preserve its progress separately', async ({ page }) => {
  await page.goto('/prepare');
  const first = page.getByRole('checkbox', { name: 'Completed Filter rows and handle NULL: exercise and explanation', exact: true });
  const second = page.getByRole('checkbox', { name: 'Completed Understand snapshots and staging: exercise and explanation', exact: true });
  await first.check();
  await expect(second).not.toBeChecked();
  await page.reload();
  await expect(first).toBeChecked();
  await expect(second).not.toBeChecked();
});

test('mobile resume stays compact while all saved destinations remain reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('interviewiq.activeLearningPath.v1', 'system-design');
    localStorage.setItem('interviewiq.learningResume.v1', JSON.stringify([{ href: '/java/hashmap-internals#answer', title: 'HashMap guide', section: 'Answer' }]));
  });
  await page.goto('/');
  const resume = page.getByRole('region', { name: 'Continue learning', exact: true });
  await expect(resume.getByRole('link', { name: /Continue System Design/ })).toBeVisible();
  expect((await resume.boundingBox()).height).toBeLessThan(330);
  await resume.getByText(/More saved work and shortcuts/).click();
  await expect(resume.getByRole('link', { name: /HashMap guide/ })).toBeVisible();
});
