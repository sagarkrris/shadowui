import { expect, test } from '@playwright/test';
import { LANDING_TRACKS } from '../lib/landingTracks.mjs';

for (const width of [375, 1366]) {
  test(`role onboarding previews public paths at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const selector = page.getByRole('region', { name: 'Choose your target role' });
    for (const track of LANDING_TRACKS) {
      const button = selector.getByRole('button', { name: `${track.label} ${track.detail}`, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(selector.getByRole('heading', { name: `Recommended starting path for ${track.label}` })).toBeVisible();
      await expect(selector.getByRole('link', { name: 'Start this path now →' })).toHaveAttribute('href', track.modules[0][2]);
      for (const [, title, href] of track.modules) await expect(selector.getByRole('link', { name: title, exact: true })).toHaveAttribute('href', href);
    }
    await page.screenshot({ path: test.info().outputPath(`interviewiq-hero-${width}.png`), fullPage: false });
    await selector.getByRole('button', { name: 'Set up AI mock drills' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Next: AI setup →' }).click();
    await expect(dialog.getByRole('heading', { name: 'Check AI availability' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close mock setup' }).click();
    await expect(dialog).not.toBeVisible();
    await selector.getByRole('button', { name: 'Senior Backend Java / Spring', exact: true }).click();
    await selector.getByRole('link', { name: 'Start this path now →' }).click();
    await expect(page).toHaveURL(/\/tech-blogs\/connection-pool-full-is-database-slow$/);
    await expect(page.getByRole('heading', { name: 'Your connection pool is full. Is the database actually slow?', exact: true })).toBeVisible();
  });
}
