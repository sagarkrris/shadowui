import { test, expect } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';
import { JAVA_RELEASE_PATH } from '../lib/javaReleasePath.mjs';
import { slugifyJavaTutorial } from '../lib/javaDigest.mjs';

for (const width of [375, 1366]) test(`Java release path distinguishes permanent and opt-in lessons at ${width}px`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/java/releases');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Java 8–26 release learning path');
  for (const release of JAVA_RELEASE_PATH) {
    const card = page.locator(`#java-${release.release}`);
    await expect(card.locator('h2')).toContainText(`Java ${release.release}:`);
    expect(await card.locator('li a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(release.lessons.map(title => `/java/tutorial/${slugifyJavaTutorial(title)}`));
  }
  await expect(page.locator('#java-23')).toContainText('String templates were withdrawn');
  await page.locator('#java-26').getByRole('link', { name: 'Primitive patterns in Java 26', exact: true }).click();
  await expect(page.locator('#start-here strong')).toHaveText('Preview lab — JDK 26 only');
  await expect(page.getByRole('heading', { name: 'Compile the complete example', exact: true }).locator('..').locator('code')).toContainText('--release 26 --enable-preview');
  await expect(page.getByRole('heading', { name: 'Run the complete example', exact: true }).locator('..').locator('code')).toContainText('java --enable-preview');
  await page.locator('#diagram').scrollIntoViewIfNeeded();
  await expect(page.locator('#diagram svg[data-diagram-artwork]')).toBeVisible();
  expect(await page.locator('article').evaluate(element => element.scrollWidth <= element.clientWidth + 2)).toBe(true);
  await page.screenshot({ path: test.info().outputPath(`java26-preview-${width}.png`) });
  await page.goto('/java/tutorial/vector-api-in-java-26');
  await expect(page.locator('#start-here strong')).toHaveText('Incubator module — JDK 26 only');
  await expect(page.getByRole('heading', { name: 'Compile the complete example', exact: true }).locator('..').locator('code')).toContainText('--add-modules jdk.incubator.vector');
  await expect(page.getByRole('heading', { name: 'Compile the complete example', exact: true }).locator('..').locator('code')).not.toContainText('--enable-preview');
  await page.goto('/java/tutorial/scoped-values');
  await expect(page.locator('#start-here strong')).toHaveText('Permanent feature');
  await expect(page.getByRole('heading', { name: 'Compile the complete example', exact: true }).locator('..').locator('code')).toContainText('--release 25');
  await expect(page.getByRole('heading', { name: 'Compile the complete example', exact: true }).locator('..').locator('code')).not.toContainText('--enable-preview');
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('/java/releases</loc>');
});

test('Java Digest exposes the release path and the same Java 26 preview source', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('navigation', { name: 'Java Digest sections' }).getByRole('button', { name: 'Tutorial Library', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open the detailed Java 8–26 release path →', exact: true })).toHaveAttribute('href', '/java/releases');
  await page.getByRole('textbox', { name: 'Find a Java tutorial' }).fill('Primitive patterns in Java 26');
  const card = page.locator('.java-digest-card').filter({ hasText: 'Primitive patterns in Java 26' });
  await expect(card).toHaveCount(1);
  await card.getByText('Read full chapter', { exact: true }).click();
  await expect(card).toContainText('26 only · preview');
  await expect(card).toContainText('javac --release 26 --enable-preview');
  await expect(card).toContainText('value instanceof int exact');
  await expect(card).toContainText('Interview follow-up:');
});
