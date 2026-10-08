import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Webhooks in Production: Verify, Deduplicate, Recover';

async function verifyCorrections(reader) {
  await expect(reader.locator('pre, p').filter({ hasText: 'final class WebhookSignatureExample' })).toContainText('mac.doFinal(body)');
  await expect(reader.locator('pre, p').filter({ hasText: 'final class WebhookOutcomeExample' })).toContainText('case UNKNOWN -> Outcome.RECONCILE');
  await expect(reader.getByText(/A persisted operation K7 is dispatched/)).toBeVisible();
  const answers = reader.locator('details').filter({ has: reader.page().locator('summary', { hasText: /^Sample answer$/ }) });
  await answers.nth(0).locator('summary').click();
  await expect(answers.nth(0)).toContainText('An unsigned timestamp can be replaced');
  await answers.nth(4).locator('summary').click();
  await expect(answers.nth(4)).toContainText('Neither cancellation nor rollback proves');
  const diagram = reader.locator('[data-course-diagram="webhookBoundary"]').first();
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram.getByRole('img')).toBeVisible();
  await expect(reader.getByRole('heading', { name: 'A lost response is not a failed payment', exact: true })).toBeVisible();
}

for (const width of [375, 1366]) {
  test(`corrected webhook public lesson at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tech-blogs/java-webhooks-production');
    await verifyCorrections(page.locator('main'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.locator('[data-course-diagram="webhookBoundary"]').first().screenshot({ path: testInfo.outputPath('webhook-diagram.png') });
  });
}

test('corrected webhook workspace reader', async ({ page }, testInfo) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `${title} full lesson` });
  await verifyCorrections(dialog);
  await dialog.screenshot({ path: testInfo.outputPath('webhook-workspace.png') });
});
