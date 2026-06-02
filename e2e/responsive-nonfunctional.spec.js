import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  mockChat,
} from "./helpers/app.js";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("Non-functional UI/UX, responsiveness, and state management", () => {
  for (const viewport of viewports) {
    test(`renders usable core layout on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoSeededApp(page);

      await expect(page.getByLabel("Message composer")).toBeVisible();
      await page.getByLabel("Message composer").fill(`Responsive check on ${viewport.name}`);
      await expect(page.getByLabel("Message composer")).toHaveValue(`Responsive check on ${viewport.name}`);

      if (viewport.name === "mobile") {
        await expect(page.getByRole("navigation")).toBeVisible();
        await page.getByRole("button", { name: "Company", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
      } else {
        await page.getByRole("button", { name: "Company Prep" }).click();
        await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
      }

      await assertHealthyApp(page);
    });
  }

  test("keeps navigation stable across Course, Company Prep, Settings, and chat", async ({ page }) => {
    await mockChat(page, "Score: 7/10\nStrengths: Concise.\nGaps: Add trade-offs.");
    await gotoSeededApp(page);

    for (let index = 0; index < 3; index += 1) {
      await page.getByRole("button", { name: "Agentic UI Course" }).click();
      await expect(page.getByRole("heading", { name: "Stack Implementation Tracks" })).toBeVisible();
      await page.getByRole("button", { name: "Company Prep" }).click();
      await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
      await page.getByRole("button", { name: "Info" }).click();
      await expect(page.getByText("Mock Interviews")).toBeVisible();
      await page.getByRole("button", { name: "x" }).click();
      await page.getByRole("button", { name: "Home" }).click();
      await expect(page.getByLabel("Message composer")).toBeVisible();
    }

    const usedHeap = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
    expect(usedHeap).toBeLessThan(250 * 1024 * 1024);
    await assertHealthyApp(page);
  });
});
