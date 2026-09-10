import { expect, test } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

for (const size of [{ width: 390, height: 664 }, { width: 375, height: 667 }, { width: 844, height: 390 }]) {
  test(`Home preserves reading space and reachable controls at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.route("**/api/dsa-challenges**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ challenges: [] }) }));
    await gotoSeededApp(page, { homeDemoSeen: true });
    // Next's development-only badge covers the landscape settings button.
    // It does not ship in the production layout under test.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    const content = page.getByRole("log");
    const contentHeight = await content.evaluate(e => e.clientHeight);
    console.log(`Home ${size.width}x${size.height}: ${contentHeight}px content`);
    expect(contentHeight).toBeGreaterThan(size.height * 0.45);
    await page.screenshot({ path: test.info().outputPath("home-layout.png") });
    await expect(page.locator(".dashboard-section-nav")).toHaveCSS("position", "relative");
    await page.getByRole("button", { name: "Prep settings", exact: true }).click();
    const settings = page.getByRole("region", { name: "Compact prep controls menu" });
    await expect(settings.getByRole("combobox", { name: "Difficulty level" })).toBeVisible();
    expect(await page.locator("main").evaluate(e => e.scrollLeft)).toBe(0);
    await page.getByRole("button", { name: "Navigation & settings" }).click();
    await page.getByRole("button", { name: "Navigation & settings" }).click();
    await expect(page.getByRole("button", { name: "Workspace menu", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Workspace menu", exact: true }).click();
    const menu = page.getByRole("region", { name: "Tablet workspace menu" });
    await menu.getByRole("button", { name: /DSA Lab/ }).click();
    await expect(page.getByRole("heading", { name: "Interview Pattern Theater" })).toBeVisible();
    expect(await page.locator("main").evaluate(e => e.scrollLeft)).toBe(0);
    await page.getByRole("button", { name: "Session actions", exact: true }).click();
    await expect(page.getByRole("button", { name: "Import Session", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Session actions", exact: true }).click();
    await page.screenshot({ path: test.info().outputPath("mobile-layout.png") });
  });
}

test("expanded Q&A uses readable light-theme colors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.emulateMedia({ colorScheme: "light" });
  await gotoSeededApp(page, { activeTab: "interviewReady", homeDemoSeen: true });
  await page.getByRole("button", { name: /Reveal polished answer/ }).first().click();
  const answer = page.locator(".qa-expanded-answer").first();
  await expect(answer).toHaveCSS("background-color", "rgb(241, 245, 249)");
  await expect(answer.locator("p").first()).toHaveCSS("color", "rgb(23, 50, 77)");
  await expect(answer.locator("h4").first()).toHaveCSS("color", "rgb(23, 50, 77)");
  expect(await page.locator("main").evaluate(e => e.scrollLeft)).toBe(0);
});

test("Product of Array Except Self returns its own Java code", async ({ request }) => {
  const response = await request.get("/api/blind75-guide?problemId=product-of-array-except-self&mapping=2");
  expect(response.ok()).toBeTruthy();
  const chapter = await response.json();
  expect(chapter.sourceOrder).toBe(7);
  expect(chapter.sections.find(s => s.heading === "Java solution").content).toContain("productExceptSelf");
  const missing = await request.get("/api/blind75-guide?problemId=binary-search&mapping=2");
  expect(missing.status()).toBe(404);
});
