import { test, expect } from '@playwright/test';
import { PUBLIC_VERTICAL_LISTICLES } from '../lib/verticalContent.mjs';
import { PUBLIC_STACK_GUIDES } from '../lib/seoGuides.mjs';

test.use({ serviceWorkers: 'block' });

test('each public listicle delivers its advertised count and the last complete answer opens', async ({ page }) => {
  for (const item of PUBLIC_VERTICAL_LISTICLES) {
    const route = item.vertical === 'java' ? `/java/listicle/${item.slug}` : `/${item.vertical}/${item.slug}`;
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(item.title);
    const questions = page.locator('summary').filter({ has: page.locator('span') });
    await expect(questions).toHaveCount(Number(item.title.match(/Top (\d+)/)[1]));
    const last = questions.last();
    await last.click();
    const answer = last.locator('..');
    await expect(answer.getByRole('heading', { name: 'Worked example and assumptions', exact: true })).toBeVisible();
    await answer.getByText('Trade-offs, verification and follow-up', { exact: true }).click();
    await expect(answer.getByRole('heading', { name: 'How to verify it', exact: true })).toBeVisible();
    await expect(answer.getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
  }
});

test('all nine public guides have self-contained lessons and a working practice destination on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const item of PUBLIC_STACK_GUIDES) {
    await page.goto(`/guides/${item.stack}/${item.slug}`);
    await expect(page.getByRole('heading', { name: 'Worked interview questions and answers', exact: true })).toBeVisible();
    expect(await page.getByRole('heading', { name: 'A complete answer', exact: true }).count()).toBeGreaterThanOrEqual(3);
    const practice = page.getByRole('link', { name: 'Open practice workspace', exact: false });
    await expect(practice).toHaveAttribute('href', '/practice?workspace=chat');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test('HashMap public guide qualifies treeified collision lookup and links the precise source', async ({ page }) => {
  await page.goto('/java/hashmap-internals');
  await expect(page.locator('#answer > p').filter({ hasText: /Equal-hash keys without a distinguishing comparison/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /OpenJDK 21 HashMap/ })).toHaveAttribute('href', /jdk-21%2B35/);
});
