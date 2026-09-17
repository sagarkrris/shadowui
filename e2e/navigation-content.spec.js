import { expect, test } from "@playwright/test";
test.use({ serviceWorkers: "block" });
import {
  assertHealthyApp,
  gotoSeededApp,
  openSidebar,
} from "./helpers/app.js";

const expectedCategories = [
  ["React Core", "Hooks"], ["Next.js", "Routing"], ["UI Engineering", "Accessibility"],
  ["Frontend System Design", "Component Architecture"], ["Behavioral", "Ownership"],
];

test.describe("Feature B: navigation and content modules", () => {
  test("TC05 renders every personalized topic category and sub-topic without route errors", async ({ page }) => {
    await gotoSeededApp(page);
    await openSidebar(page);

    for (const [category, subtopic] of expectedCategories) {
      await page.getByRole("button", { name: category, exact: true }).click();
      await expect(page.getByRole("button", { name: subtopic, exact: true })).toBeVisible();
      await page.getByRole("button", { name: subtopic, exact: true }).click();
      await expect(page.locator("#app-header")).toContainText(subtopic);
      await assertHealthyApp(page);
    }
  });

  test("TC06 opens the Agentic UI Engineering course with visuals, videos, patterns, and tasks", async ({ page }) => {
    await gotoSeededApp(page);

    await page.getByRole("button", { name: "Workspace menu" }).click();
    await page.getByRole("button", { name: "Agentic UI Course", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Stack Implementation Tracks" })).toBeVisible();
    await expect(page.getByText("Practice task", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Capstone", { exact: true }).first()).toBeVisible();
    expect(await page.locator("iframe[title]").count()).toBeGreaterThan(0);
    await expect(page.getByRole("img", { name: "Agent loop from intent to action" }).first()).toBeVisible();
    const playLinks = page.locator('a[href*="youtube.com/watch"], a[href*="youtu.be/"]');
    expect(await playLinks.count()).toBeGreaterThan(0);
    await expect(playLinks.first()).toHaveAttribute("href", /youtube|youtu\.be/);
    await assertHealthyApp(page);
  });

  test("TC07 exposes the current free prep surface and no premium direct-access route", async ({ page }) => {
    await gotoSeededApp(page);
    await openSidebar(page);

    await expect(page.getByText(/React Prep.*Free/)).toBeVisible();
    await expect(page.getByText("Premium")).toHaveCount(0);

    const response = await page.goto("/premium");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
  });
});
