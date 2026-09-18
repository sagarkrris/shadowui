import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test('home routes by intent and passes symptom search to the atlas', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Diagnose a problem', 'Learn a concept', 'Practice for an interview']) await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search engineering symptoms' }).fill('rollback');
  await page.getByRole('button', { name: 'Find diagnostic steps' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search symptoms', exact: true })).toHaveValue('rollback');
});
test('journey resumes, keeps editable exercise and exports a reflection', async ({ page }) => {
  await page.goto('/learn/spring-transactions');
  await page.getByRole('checkbox', { name: 'I completed step 1: Observe' }).check();
  await page.getByLabel('Java exercise', { exact: true }).fill('// my saved implementation');
  await page.getByRole('button', { name: 'Save exercise draft' }).click();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'I completed step 1: Observe' })).toBeChecked();
  await expect(page.getByLabel('Java exercise', { exact: true })).toHaveValue('// my saved implementation');
  await page.getByLabel('What failed?', { exact: true }).fill('The self call missed transaction advice.');
  await page.getByLabel('Which evidence supports your conclusion?').fill('No active transaction; auto commit was true.');
  await page.getByLabel('What would you change, and what could it break?').fill('Use an injected collaborator; external payment still needs recovery.');
  await page.getByLabel('What would change your mind?').fill('Evidence of an outer transaction.');
  await page.getByRole('button', { name: 'Compare explanation' }).click();
  await expect(page.getByRole('heading', { name: 'Compare your reasoning' })).toBeVisible();
  await page.goto('/notebook');
  await expect(page.getByText('Evidence of an outer transaction.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Export notes as Markdown' }).click();
  await expect(page.getByLabel('Notebook export — select and copy')).toContainText('No active transaction');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Understand Spring transaction boundaries →' })).toBeVisible();
});
test('detective start appears in notebook and reflection persists', async ({ page }) => {
  await page.goto('/detective/the-rollback-that-never-happened');
  await page.getByRole('button', { name: /Request trace/ }).click();
  await page.getByLabel('What failed?', { exact: true }).fill('My draft diagnosis');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.reload();
  await expect(page.getByLabel('What failed?', { exact: true })).toHaveValue('My draft diagnosis');
  await page.goto('/notebook');
  await expect(page.getByRole('link', { name: 'The rollback that never happened', exact: true })).toBeVisible();
});
test('weekly share is stable, spoiler-free and has a clipboard fallback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } }, configurable: true }));
  await page.goto('/weekly/2026-09-18-transaction-boundaries');
  await page.getByRole('button', { name: 'Copy weekly challenge link' }).click();
  await expect(page.getByLabel('Spoiler-free link', { exact: true })).toHaveValue(/\/weekly\/2026-09-18-transaction-boundaries$/);
  await page.getByRole('link', { name: 'Open the investigation' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The rollback that never happened');
});
test('blocked storage gives an honest failure while comparison stays available', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.goto('/learn/spring-transactions');
  await page.getByLabel('What failed?', { exact: true }).fill('boundary');
  await page.getByLabel('Which evidence supports your conclusion?').fill('trace');
  await page.getByLabel('What would you change, and what could it break?').fill('proxy');
  await page.getByRole('button', { name: 'Compare explanation' }).click();
  await expect(page.getByText('Could not save. Copy your answers before leaving this page.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compare your reasoning' })).toBeVisible();
});
for (const width of [390, 768, 1440]) test(`new reading surfaces scroll and fit at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const route of ['/learn/spring-transactions', '/notebook', '/weekly/2026-09-18-transaction-boundaries', '/explore']) {
    await page.goto(route);
    const scroll = page.locator('[data-reader-scroll]');
    expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    if (await scroll.evaluate(el => el.scrollHeight > el.clientHeight)) {
      await page.mouse.move(width / 2, 500); await page.mouse.wheel(0, 500);
      await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
  }
});
test('new learning pages and detective reflection pass accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/learn/spring-transactions', '/notebook', '/weekly/2026-09-18-transaction-boundaries', '/detective/the-rollback-that-never-happened']) {
    await page.goto(route);
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    expect(await page.evaluate(async () => (await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
    if (route === '/learn/spring-transactions') {
      await page.getByRole('heading', { name: 'Before and after the repair' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: '/private/tmp/learning-journey-mobile.png' });
    }
  }
});
