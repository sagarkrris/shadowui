import { test, expect } from '@playwright/test';

const courses = [
  ['kubernetes-java-production', ['k8sResources', 'k8sProbes', 'k8sDrain', 'k8sScale', 'k8sTenancy', 'k8sRollout']],
  ['postgres-zero-downtime-migrations', ['pgClassify', 'pgExpand', 'pgBackfill', 'pgCutover', 'pgVerify', 'pgRollback']],
  ['opentelemetry-collector-production', ['otelTopology', 'otelOwnership', 'otelQueue', 'otelDurability', 'otelSecurity', 'otelOperations']],
  ['java-container-supply-chain-security', ['supplyInputs', 'supplyInventory', 'supplyProvenance', 'supplyVerification', 'supplyTriage', 'supplyPromotion']],
  ['production-llm-evals-guardrails', ['llmContract', 'llmDataset', 'llmGraders', 'llmRetrieval', 'llmTools', 'llmRelease']],
];

for (const width of [375, 1366]) {
  for (const [slug, keys] of courses) {
    test(`${slug}: six distinct accessible diagrams at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/tech-blogs/${slug}`);
      for (const key of keys) {
        const diagram = page.locator(`[data-course-diagram="${key}"]`);
        await expect(diagram).toHaveCount(1);
        await expect(diagram.locator('svg')).toBeVisible();
        const region = diagram.getByRole('region');
        await expect(region).toHaveAttribute('tabindex', '0');
        expect(await diagram.locator('svg').evaluate(svg => svg.getScreenCTM().a)).toBeGreaterThanOrEqual(0.99);
        if (width === 375) {
          expect(await region.evaluate(el => el.scrollWidth > el.clientWidth)).toBeTruthy();
          await region.evaluate(el => { el.scrollLeft = el.scrollWidth; });
          expect(await region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
        }
        await diagram.getByRole('button', { name: 'Text view', exact: true }).click();
        await expect(diagram.getByRole('heading', { name: 'Connections' })).toBeVisible();
        await expect(diagram.locator('svg')).toBeHidden();
        await diagram.getByRole('button', { name: 'Diagram', exact: true }).click();
        await expect(diagram.locator('svg')).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
      const answer = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: /^Sample answer$/ }) }).first();
      await answer.locator('summary').click();
      await expect(answer.locator('p')).toBeVisible();
      if (width === 1366) await page.locator(`[data-course-diagram="${keys[0]}"]`).screenshot({ path: testInfo.outputPath('chapter-diagram.png') });
    });
  }
}

test('visual guide can be found in Explore and the sitemap', async ({ page, request }) => {
  await page.goto('/explore');
  const link = page.locator('a[href="/system-design/visual-guide"]').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('50 System Design Concepts, Seen Clearly');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('/system-design/visual-guide</loc>');
});
