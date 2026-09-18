import { test, expect } from "@playwright/test";

const sizes = [
  { name: "small-phone", width: 320, height: 568 },
  { name: "iphone", width: 390, height: 844 },
  { name: "android", width: 412, height: 915 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];
const routes = ["/detective", "/detective/the-report-from-another-tenant"];
test.use({ serviceWorkers: "block" });
for (const size of sizes) {
  for (const route of routes) {
    test(`${route} accepts native scrolling on ${size.name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      // A real wheel gesture must move content; clicking below the fold can hide a locked scroller.
      if (route.includes("/detective/")) {
        await page.locator("summary").click();
        await page.locator("[data-detective-scroll]").evaluate(el => { el.scrollTop = 0; });
      }
      const main = page.locator("main");
      const before = await main.evaluate(el => el.getBoundingClientRect().top);
      await page.mouse.move(size.width / 2, size.height / 2);
      await page.mouse.wheel(0, 600);
      await expect.poll(() => main.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(before - 20);
      const scroll = page.locator("[data-detective-scroll]");
      await expect(scroll).toBeVisible();
      expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
      // End-of-page content must be reachable with native keyboard scrolling as well.
      await scroll.focus();
      await page.keyboard.press("End");
      await expect.poll(() => scroll.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(3);
      await page.keyboard.press("Home");
      await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeLessThan(3);
    });
  }
}

test("Android-sized touch swipe scrolls the case without trapping the gesture", async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== "chromium", "Native touch injection uses Chromium's device protocol.");
  const context = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseURL}/detective/the-report-from-another-tenant`);
  await expect(page.getByRole("button", { name: /01 \/ Two request traces/ })).toBeEnabled();
  const scroll = page.locator("[data-detective-scroll]");
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 200, y: 720 }] });
  for (let y = 670; y >= 220; y -= 50) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 200, y }] });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(100);
  // Rotation/resizing must retain a usable scroll range rather than locking the page.
  await page.setViewportSize({ width: 915, height: 412 });
  await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByText("No account or AI response required.")).toBeInViewport();
  await context.close();
});
