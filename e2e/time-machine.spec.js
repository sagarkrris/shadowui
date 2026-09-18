import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.use({ serviceWorkers: 'block' });
test('decisions carry forward, rewind safely, resume and produce a private-notes-free share link', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } }));
  await page.goto('/');
  await page.getByRole('link', { name: 'Revisit a database decision' }).click();
  await page.getByRole('radio', { name: 'Cache catalogue reads' }).check();
  await page.getByLabel('Your reasoning').fill('Private reasoning');
  await page.getByRole('button', { name: 'Record decision and move forward' }).click();
  await expect(page.locator('#decision-review')).toBeFocused();
  await page.getByRole('radio', { name: 'Require remote durable acknowledgement' }).check();
  await page.getByRole('button', { name: 'Record decision and move forward' }).click();
  await expect(page.getByText(/Catalogue cache: check/)).toBeVisible();
  await expect(page.getByText(/Remote standby: verify/)).toBeVisible();
  await page.reload();
  await expect(page.locator('#turning-point')).toHaveText('Month 18: deletion becomes a product requirement');
  await page.getByRole('button', { name: 'Rewind the last decision' }).click();
  await expect(page.locator('#turning-point')).toHaveText('Month 12: the primary region goes dark');
  await page.getByRole('button', { name: 'Undo rewind' }).click();
  await page.getByRole('radio', { name: 'Track deletion across copies and restores' }).check();
  await page.getByRole('button', { name: 'Record decision and move forward' }).click();
  await page.getByRole('button', { name: 'Copy decision link' }).click();
  const shared = await page.evaluate(() => window.__copied);
  expect(shared).toContain('path=v1.cache.sync.purge');
  expect(shared).not.toContain('Private');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download summary with my reasoning' }).click();
  const download = await pending;
  expect(await readFile(await download.path(), 'utf8')).toContain('Private reasoning');
  await page.goto(shared);
  await expect(page.getByRole('region', { name: 'Shared decision timeline' })).not.toContainText('Private reasoning');
  await expect(page.getByRole('region', { name: 'Your decision timeline' })).toContainText('Private reasoning');
});
for (const width of [390, 412, 768, 1440]) test(`shared paths scroll without overflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/time-machine/database-decisions?path=v1.shard.async.row');
  await expect(page.getByRole('region', { name: 'Shared decision timeline' })).toContainText('Shard orders');
  const scroll = page.locator('[data-reader-scroll]');
  expect(await scroll.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.getByRole('heading', { name: 'Mechanisms and references' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Mechanisms and references' })).toBeInViewport();
  await expect(page.getByRole('region', { name: 'Your decision timeline' })).toContainText('0 of 3');
});
test('invalid shared paths and blocked clipboard remain usable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('blocked'); } } }));
  await page.goto('/time-machine/database-decisions?path=v1.bad');
  await expect(page.getByText(/This shared path is invalid/)).toBeVisible();
  await page.getByRole('radio', { name: 'Tune the query and index first' }).check();
  await page.getByRole('button', { name: 'Record decision and move forward' }).click();
  await page.getByRole('button', { name: 'Copy decision link' }).click();
  await expect(page.getByLabel('Decision link', { exact: true })).toHaveValue(/path=v1.tune/);
});
test('before/after diagrams follow decisions and attribute inherited obligations', async ({ page }) => {
  await page.goto('/time-machine/database-decisions');
  for (const choice of ['Cache catalogue reads', 'Require remote durable acknowledgement', 'Track deletion across copies and restores']) {
    await page.getByRole('radio', { name: choice }).check();
    await page.getByRole('button', { name: 'Record decision and move forward' }).click();
  }
  const diagram = page.getByRole('figure', { name: 'Before and after design' }).last();
  await expect(diagram.getByRole('region', { name: 'Before design', exact: true })).not.toContainText('Deletion workflow');
  await expect(diagram.getByRole('region', { name: 'After design', exact: true })).toContainText('Deletion workflow');
  await expect(diagram).toContainText('Inherited obligation · Month 6');
  await expect(diagram).toContainText('Inherited obligation · Month 12');
  await expect(diagram).toContainText('New obligation · Month 18');
  await page.getByRole('button', { name: 'Rewind the last decision' }).click();
  await expect(page.getByRole('figure', { name: 'Before and after design' }).last()).not.toContainText('Deletion workflow');
});
for (const width of [390, 768, 1440]) test(`expanded shared design remains readable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/time-machine/database-decisions?path=v1.cache.sync.purge');
  const shared = page.getByRole('region', { name: 'Shared decision timeline' });
  await shared.getByText('Explore the before/after design', { exact: true }).last().click();
  const diagram = shared.getByRole('figure', { name: 'Before and after design' }).last();
  await expect(diagram.getByRole('region', { name: 'After design', exact: true })).toContainText('Catalogue cache');
  const scroll = page.locator('[data-reader-scroll]');
  expect(await scroll.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await diagram.getByText('Where the obligations came from', { exact: true }).scrollIntoViewIfNeeded();
  await expect(diagram.getByText('Where the obligations came from', { exact: true })).toBeInViewport();
  if (width === 1440) {
    await diagram.scrollIntoViewIfNeeded();
    await diagram.screenshot({ path: '/private/tmp/time-machine-design-desktop.png' });
  }
});
