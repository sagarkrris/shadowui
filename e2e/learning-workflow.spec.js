import { test, expect } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';
const note = { id: 'my-note', title: 'My saved diagnosis', href: '/java/cache', evidence: 'Private learning evidence' };
test.use({ serviceWorkers: 'block' });
for (const width of [390, 1366]) test(`returning learners resume before the homepage hero at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('interviewiq.activeLearningPath.v1', 'system-design');
    localStorage.setItem('interviewiq.learningHub.v1', JSON.stringify({ weak: ['stage-system-design-storage'] }));
  });
  await page.goto('/');
  const resume = page.getByRole('link', { name: /Continue System Design: Storage and consistency/ });
  await expect(resume).toBeVisible();
  await expect(resume).toHaveAttribute('href', '/tech-blogs/distributed-transactions-data-consistency');
  expect((await resume.boundingBox()).y).toBeLessThan((await page.getByRole('heading', { level: 1 }).boundingBox()).y);
  expect(await page.locator('[data-reader-scroll]').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});
test('lesson quick start bypasses onboarding, preserves topic and offers personalization', async ({ page }) => {
  await page.goto('/learn/ai-engineering');
  const practice = page.getByRole('link', { name: 'Practise this lesson with Tech Buddy →' }).first();
  const href = await practice.getAttribute('href');
  const topic = new URL(href, 'http://localhost').searchParams.get('buddyTopic').slice(0, 180);
  await practice.click();
  await expect(page.getByRole('region', { name: 'Lesson quick start' })).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start lesson practice', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tech Buddy interview', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Current lesson' })).toContainText('Using quick-start defaults');
  await expect(page.getByLabel('Practice topic', { exact: true })).toHaveValue(topic);
  await expect(page.getByRole('link', { name: 'Back to lesson', exact: true })).toHaveAttribute('href', '/learn/ai-engineering');
  await page.getByRole('button', { name: 'Personalize practice profile', exact: true }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Learner');
});
test('notebook downloads Markdown, undoes deletion and previews readable backups', async ({ page }) => {
  await page.addInitScript(note => localStorage.setItem('interviewiq.learningNotebook.v1', JSON.stringify([note])), note);
  await page.goto('/notebook');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export notes as Markdown', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('my-engineering-notebook.md');
  await expect(page.getByLabel('Notebook export — select and copy')).toContainText(note.evidence);
  await page.getByRole('button', { name: `Remove ${note.title}`, exact: true }).click();
  await expect(page.getByRole('link', { name: note.title, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo remove note' }).click();
  await expect(page.getByRole('link', { name: note.title, exact: true })).toBeVisible();
  await page.getByText('Your data · Backup and restore', { exact: true }).click();
  const backup = { format: 'interviewiq-practice', version: 1, exportedAt: '2026-11-02T10:00:00Z', entries: { 'interviewiq.learningNotebook.v1': JSON.stringify([note]) } };
  await page.getByLabel('Preview backup to restore').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByText('Learning notebook: 1 notes', { exact: true })).toBeVisible();
  await expect(page.getByText(/Backup date:/)).toBeVisible();
  await expect(page.getByText(/characters$/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel restore' }).click();
  await expect(page.getByRole('link', { name: note.title, exact: true })).toBeVisible();
});
test('workspace search finds non-Java catalogue content and local notes without transmitting searches', async ({ page }) => {
  await page.route('**/api/discovery', route => {
    expect(new URL(route.request().url()).search).toBe('');
    expect(route.request().postData()).toBeNull();
    return route.fulfill({ json: { items: [{ title: 'React state contracts', href: '/guides/react/react-hooks-interview-questions', type: 'Lesson', category: 'React', description: 'Browser state and effects' }] } });
  });
  await page.addInitScript(note => localStorage.setItem('interviewiq.learningNotebook.v1', JSON.stringify([note])), note);
  await gotoSeededApp(page);
  // gotoSeededApp clears storage on its first visit; seed local notes before remounting search.
  await page.evaluate(note => localStorage.setItem('interviewiq.learningNotebook.v1', JSON.stringify([note])), note);
  await page.reload();
  await page.getByText('Explore lessons, questions, scenarios and saved work', { exact: true }).click();
  const search = page.getByLabel('Search learning and saved work', { exact: true });
  await search.fill('react contracts');
  await expect(page.getByRole('link', { name: 'React state contracts', exact: true })).toBeVisible();
  await search.fill('Private learning evidence');
  await expect(page.getByRole('link', { name: note.title, exact: true })).toBeVisible();
});
test('public search can reach results beyond the first thirty', async ({ page }) => {
  const items = Array.from({ length: 65 }, (_, i) => ({ title: `Cache lesson ${i + 1}`, href: `/java/lesson-${i + 1}`, type: 'Lesson', category: 'Java', description: 'Cache behavior' }));
  await page.route('**/api/discovery', route => route.fulfill({ json: { items } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Search learning library', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search the learning library' });
  await dialog.getByRole('searchbox').fill('cache');
  await expect(dialog.getByRole('status')).toContainText('Showing 30 of 65');
  await dialog.getByRole('button', { name: 'Show more results' }).click();
  await dialog.getByRole('button', { name: 'Show more results' }).click();
  await expect(dialog.getByRole('link', { name: /Cache lesson 65/ })).toBeVisible();
  await expect(dialog.getByRole('status')).toContainText('Showing 65 of 65');
});

test('homepage search discloses visible counts and can reveal every match', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search articles', exact: true }).fill('a');
  const count = page.getByRole('status').filter({ hasText: /Showing .* articles/ });
  await expect(count).toContainText('Showing 12 of');
  const total = Number((await count.textContent()).match(/of (\d+)/)[1]);
  expect(total).toBeGreaterThan(12);
  while (await page.getByRole('button', { name: 'Show more articles', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Show more articles', exact: true }).click();
  }
  await expect(count).toHaveText(`Showing ${total} of ${total} articles`);
});
test('notebook restores a previewed backup without removing unrelated saved work', async ({ page }) => {
  await page.goto('/notebook');
  await page.evaluate(() => localStorage.setItem('interviewiq.unrelated.v1', 'keep me'));
  await page.getByText('Your data · Backup and restore', { exact: true }).click();
  const backup = { format: 'interviewiq-practice', version: 1, entries: { 'interviewiq.learningNotebook.v1': JSON.stringify([note]) } };
  await page.getByLabel('Preview backup to restore').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Restore previewed backup', exact: true }).click();
  await expect(page.getByRole('link', { name: note.title, exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('interviewiq.unrelated.v1'))).toBe('keep me');
});
