import { expect, test } from '@playwright/test';
import { ADVICE_FAILS_ARTICLES } from '../lib/adviceFails.mjs';
import { EXPLAIN_LOGS } from '../lib/explainThisLog.mjs';

test.use({ serviceWorkers: 'block' });

const routes = [
  '/advice-fails', '/explain-log', '/resources', '/guides', '/java', '/java/roadmap',
  ...ADVICE_FAILS_ARTICLES.map(({ slug }) => `/advice-fails/${slug}`),
  ...EXPLAIN_LOGS.map(({ slug }) => `/explain-log/${slug}`),
];

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  for (const route of routes) {
    test(`${route} scrolls naturally at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      const heading = page.getByRole('heading', { level: 1 });
      const before = await heading.evaluate(el => el.getBoundingClientRect().top);
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      await page.mouse.wheel(0, 500);
      await expect.poll(() => heading.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(before - 20);
      await page.keyboard.press('End');
      await expect.poll(() => page.evaluate(() => {
        const el = document.scrollingElement;
        return el.scrollHeight - el.clientHeight - el.scrollTop;
      })).toBeLessThan(3);
      await expect(page.locator('main a').last()).toBeInViewport();
      expect(await page.evaluate(() => document.scrollingElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }
}

test('public page navigation resets document scrolling and preserves browser back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/advice-fails');
  const last = ADVICE_FAILS_ARTICLES.at(-1);
  await page.getByRole('link').filter({ hasText: last.title }).click();
  await expect(page).toHaveURL(new RegExp(`/advice-fails/${last.slug}$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await page.mouse.move(190, 500);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.goBack();
  await expect(page).toHaveURL(/\/advice-fails$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('When advice fails.');
  await page.keyboard.press('Home');
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
});

test('public pages accept touch scrolling and viewport rotation', async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== 'chromium', 'Touch injection uses the Chromium device protocol.');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  for (const route of ['/advice-fails', '/explain-log']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}${route}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 720 }] });
    for (let y = 670; y >= 220; y -= 50) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
    await expect(page.locator('main a').last()).toBeInViewport();
  }
  await context.close();
});

for (const route of ['/', '/detective', '/java/tutorial/jdk-vs-jre-vs-jvm']) {
  test(`${route} keeps its existing reader as the only scroll owner`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
  });
}
