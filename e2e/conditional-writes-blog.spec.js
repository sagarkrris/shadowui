import { expect, test } from '@playwright/test';
import { gotoSeededApp } from './helpers/app.js';

const title = 'Java Conditional Writes with ETags and If-Match';
const route = '/tech-blogs/java-conditional-writes';
const practice = 'Merge a concurrent subtitle edit';

async function verifyRecoveryDiagram(reader) {
  const diagram = reader.locator('[data-course-diagram="conditionalRecovery"]');
  const canvas = diagram.getByRole('region', { name: /scrollable diagram/ });
  await expect(canvas).toHaveAttribute('tabindex', '0');
  await expect(canvas.getByRole('img')).toBeVisible();
  await diagram.getByRole('button', { name: 'Text view', exact: true }).focus();
  await reader.page().keyboard.press('Enter');
  await expect(canvas).toBeHidden();
  await expect(diagram.getByRole('listitem').filter({ hasText: 'receipt absent' }))
    .toContainText('Unknown outcome');
  await diagram.getByRole('button', { name: 'Diagram', exact: true }).click();
  await expect(canvas.getByRole('img')).toBeVisible();
  return diagram;
}

for (const width of [375, 1366]) {
  test(`conditional writes public course at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tech-blogs');
    await page.getByRole('link', { name: title, exact: true }).click();
    await expect(page).toHaveURL(route);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.locator('[data-course-diagram="conditionalEdit"]').first().getByRole('img'))
      .toBeVisible();
    await expect(page.getByText('When to avoid:', { exact: true })).toHaveCount(5);
    const answers = page.locator('summary').filter({ hasText: /^Sample answer$/ });
    await expect(answers).toHaveCount(5);
    for (const answer of await answers.all()) {
      await answer.click();
      await expect(answer.locator('..').locator('p')).toBeVisible();
    }
    await expect(page.getByRole('link', { name: practice, exact: true }))
      .toHaveAttribute('href', '/build/practice/merge-subtitle');
    const diagram = await verifyRecoveryDiagram(page.locator('main'));
    const canvas = diagram.getByRole('region', { name: /scrollable diagram/ });
    if (width === 375) {
      expect(await canvas.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await diagram.getByRole('button', { name: 'Fit to panel' }).click();
    await canvas.getByRole('img').screenshot({ path: testInfo.outputPath(`conditional-recovery-${width}.png`) });
  });
}

test('conditional writes workspace includes Java, the recovery diagram and practice', async ({ page }, testInfo) => {
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const reader = page.getByRole('dialog', { name: `${title} full lesson` });
  await expect(reader.getByText(/state\.compareAndSet\(before, after\)/)).toBeVisible();
  await expect(reader.getByRole('link', { name: practice, exact: true }))
    .toHaveAttribute('href', '/build/practice/merge-subtitle');
  const recovery = reader.locator('article').filter({
    has: page.getByRole('heading', { name: '5. Recover when the save response is lost', exact: true }),
  });
  await recovery.locator('summary').filter({ hasText: /^Sample answer$/ }).click();
  await expect(recovery.getByText(/confirmed rollback establishes/)).toBeVisible();
  const diagram = await verifyRecoveryDiagram(reader);
  await diagram.getByRole('button', { name: 'Fit to panel' }).click();
  await diagram.getByRole('img').screenshot({ path: testInfo.outputPath('conditional-recovery-workspace.png') });
  await reader.getByRole('button', { name: 'Close lesson reader' }).click();
  await expect(reader).toHaveCount(0);
});
