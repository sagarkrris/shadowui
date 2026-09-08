import { expect, test } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

const blogTitle = "From Java 8 to Java 26: How Java Quietly Reinvented Itself";

for (const viewport of [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 375, height: 812 },
]) {
  test(`keeps the Tech Blog reader scrollable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
    await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
    await page.getByText(blogTitle, { exact: true }).click();

    const dialog = page.getByRole("dialog", { name: `${blogTitle} full lesson` });
    const reader = dialog.locator(".java-digest-reader-scroll");
    const checkpoint = dialog.getByText("Interview checkpoint", { exact: true });
    await expect(reader).toBeVisible();

    const scrollState = await reader.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
    });

    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
    expect(scrollState.scrollTop).toBeGreaterThan(0);
    await expect(checkpoint).toBeVisible();
  });
}
