import { expect, test } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

// Deterministic viewport-event regression, not a physical iOS keyboard test.
for (const size of [{ width: 390, height: 664 }, { width: 844, height: 390 }]) {
  test(`keyboard pan, blur and reopen at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.addInitScript(() => {
      const viewport = new EventTarget();
      Object.assign(viewport, { height: innerHeight, width: innerWidth, offsetTop: 0, scale: 1 });
      Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
    });
    await gotoSeededApp(page, { homeDemoSeen: true });
    const composer = page.getByRole("textbox", { name: "Message composer" });
    await expect(composer).toHaveCSS("font-size", "16px");
    const visibleHeight = size.height - 220;
    for (let repeat = 0; repeat < 2; repeat++) {
      await composer.focus();
      await page.evaluate((height) => {
        Object.assign(visualViewport, { height, offsetTop: 90 });
        visualViewport.dispatchEvent(new Event("resize"));
        visualViewport.dispatchEvent(new Event("scroll"));
      }, visibleHeight);
      await expect(page.locator(".app-shell")).toHaveAttribute("data-keyboard-open", "true");
      await expect(page.locator(".app-topbar")).toBeHidden();
      await expect(page.locator(".session-actions")).toBeHidden();
      const shell = await page.locator(".app-shell").boundingBox();
      expect(shell.y).toBe(90);
      expect(shell.height).toBeCloseTo(visibleHeight, 0);
      const input = await composer.boundingBox();
      expect(input.y).toBeGreaterThanOrEqual(shell.y);
      expect(input.y + input.height).toBeLessThanOrEqual(shell.y + shell.height);
      expect(await page.getByRole("log").evaluate(e => e.clientHeight)).toBeGreaterThan(50);
      await composer.fill("Keyboard regression draft");
      await composer.evaluate(e => e.blur());
      await expect(page.locator(".app-shell")).toHaveAttribute("data-keyboard-open", "true");
      await page.evaluate(() => {
        // iOS can leave offsetTop stale on the first dismissal event.
        visualViewport.height = innerHeight;
        visualViewport.dispatchEvent(new Event("resize"));
      });
      await expect(page.locator(".app-shell")).toHaveAttribute("data-keyboard-open", "false");
      await expect(page.locator(".app-shell")).toHaveCSS("top", "0px");
      await expect(composer).toHaveValue("Keyboard regression draft");
      await expect(page.getByRole("button", { name: "Navigation & settings" })).toBeVisible();
    }
  });
}
