import { test, expect } from '@playwright/test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { gotoSeededApp } from './helpers/app.js';

for (const blog of listTechBlogs()) {
  test(`${blog.id} has a usable interactive demo`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/tech-blogs/${blog.id}`);
    const demo = page.getByRole('region', { name: 'Interactive course demo' });
    await expect(demo).toBeVisible();
    await expect(demo.getByRole('button', { name: 'Back', exact: true })).toBeDisabled();
    const initial = await demo.getByRole('group', { name: 'Current model state' }).innerText();
    await demo.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(demo.getByText(/^Step 2 of/)).toBeVisible();
    expect(await demo.getByRole('group', { name: 'Current model state' }).innerText()).not.toEqual(initial);
    await demo.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(demo.getByText(/^Step 1 of/)).toBeVisible();
    await expect(demo.getByRole('group', { name: 'Current model state' })).toHaveText(initial, { useInnerText: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
}

test('playback, input changes, replay, and keyboard controls remain consistent', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tech-blogs/load-balancing-algorithms');
  const demo = page.getByRole('region', { name: 'Interactive course demo' });
  await demo.getByRole('combobox', { name: 'Speed', exact: true }).selectOption('800');
  await demo.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(demo.getByText('Step 2 of 9')).toBeVisible();
  await demo.getByRole('button', { name: 'Pause', exact: true }).click();
  const progress = await demo.getByRole('progressbar').getAttribute('value');
  await page.waitForTimeout(1000); // A bounded wait verifies a stopped timer.
  await expect(demo.getByRole('progressbar')).toHaveAttribute('value', progress);
  await demo.getByLabel('Server C offline').check();
  await expect(demo.getByText('Step 1 of 9')).toBeVisible();
  await expect(demo.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  for (let i = 0; i < 8; i++) await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(demo.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await expect(demo.getByText('0 assigned · capacity 1 · offline', { exact: true })).toBeVisible();
  await demo.getByRole('button', { name: 'Replay', exact: true }).click();
  await expect(demo.getByText('Step 1 of 9')).toBeVisible();
  await demo.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption('hashing');
  await expect(demo.getByText('Step 1 of 4')).toBeVisible();
  await demo.getByRole('combobox', { name: 'Membership change', exact: true }).selectOption('remove');
  await demo.getByRole('button', { name: 'Next', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(demo.getByRole('heading', { name: 'Remove B at 50', exact: true })).toBeVisible();
});

test('scenario changes alter replay and stop playback', async ({ page }) => {
  await page.goto('/tech-blogs/real-time-communication-patterns');
  const demo = page.getByRole('region', { name: 'Interactive course demo' });
  await demo.getByRole('button', { name: 'Play', exact: true }).click();
  await demo.getByRole('combobox', { name: 'History on reconnect', exact: true }).selectOption('true');
  await expect(demo.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  for (let i = 0; i < 3; i++) await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(demo.getByRole('heading', { name: 'Install snapshot through 81' })).toBeVisible();
});

test('scripted scenarios differ and automatic playback stops at the last step', async ({ page }) => {
  await page.goto('/tech-blogs/caching-patterns-java');
  const demo = page.getByRole('region', { name: 'Interactive course demo' });
  await demo.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('1');
  await demo.getByRole('combobox', { name: 'Speed', exact: true }).selectOption('800');
  await demo.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(demo.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  await expect(demo.getByText('v1: stale', { exact: true })).toBeVisible();
  await demo.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('0');
  await expect(demo.getByText('Step 1 of 3')).toBeVisible();
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(demo.getByText('v1 fill rejected', { exact: true })).toBeVisible();
});

test('workspace reader shares the demos and resets when reopened', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  const title = 'Load Balancing Algorithms: Traffic, Affinity, and Failure';
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  const demo = dialog.getByRole('region', { name: 'Interactive course demo' });
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(demo.getByText('Step 2 of 9')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close lesson reader' }).click();
  await page.getByText(title, { exact: true }).click();
  await expect(demo.getByText('Step 1 of 9')).toBeVisible();
});

test('demo bookmarks and article search keep a stable target across selection and reload', async ({ page }) => {
  const path = '/tech-blogs/load-balancing-algorithms';
  const anchor = 'course-demo-load-balancing-algorithms';
  await page.goto(path);
  const demo = page.getByRole('region', { name: 'Interactive course demo' });
  await demo.getByRole('button', { name: 'Bookmark Explore the concept', exact: true }).click();
  await demo.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption('hashing');
  await expect(demo.getByRole('heading', { name: 'Explore the concept', exact: true })).toHaveAttribute('id', anchor);
  await expect(demo.getByRole('button', { name: 'Bookmark Explore the concept', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(demo.getByRole('button', { name: /^Bookmark / })).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Search within this article' }).fill('Four prehashed keys');
  const tools = page.getByRole('complementary', { name: 'Article tools and editorial details' });
  await tools.getByRole('button', { name: 'Explore the concept', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
  await expect(demo.getByRole('heading', { name: 'Explore the concept', exact: true })).toBeFocused();
  await page.reload();
  await expect(demo.getByRole('heading', { name: 'Explore the concept', exact: true })).toHaveAttribute('id', anchor);
  await expect(demo.getByRole('button', { name: 'Bookmark Explore the concept', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('replay and hashing highlight only values changed in the current step', async ({ page }) => {
  await page.goto('/tech-blogs/real-time-communication-patterns');
  const demo = page.getByRole('region', { name: 'Interactive course demo' });
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  const connection = demo.getByRole('group', { name: 'Current model state' }).locator('div').filter({ has: page.getByText('Connection', { exact: true }) });
  await expect(connection).toContainText('offline');
  await expect(connection).toContainText('Changed this step');
  await page.goto('/tech-blogs/load-balancing-algorithms');
  await demo.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption('hashing');
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(demo.getByText('Changed this step', { exact: true })).toHaveCount(1);
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(demo.getByText('Changed this step', { exact: true })).toHaveCount(0);
});
