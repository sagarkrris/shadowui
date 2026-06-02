import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  openSidebar,
} from "./helpers/app.js";

const expectedCategories = [
  ["Frontend", "React & Next.js"],
  ["Backend", "Java / Spring Boot"],
  ["Databases", "SQL Design"],
  ["Cloud & DevOps", "Docker"],
  ["DSA", "Arrays & Strings"],
  ["System Design", "HLD Patterns"],
  ["Behavioral", "Ownership"],
];

test.describe("Feature B: navigation and content modules", () => {
  test("TC05 renders every personalized topic category and sub-topic without route errors", async ({ page }) => {
    await gotoSeededApp(page);
    await openSidebar(page);

    for (const [category, subtopic] of expectedCategories) {
      await page.getByRole("button", { name: category }).click();
      await expect(page.getByText(subtopic)).toBeVisible();
      await page.getByText(subtopic).click();
      await expect(page.locator("header")).toContainText(subtopic);
      await assertHealthyApp(page);
    }
  });

  test("TC06 opens the Agentic UI Engineering course with visuals, videos, patterns, and tasks", async ({ page }) => {
    await gotoSeededApp(page);

    await page.getByRole("button", { name: "Agentic UI Course" }).click();

    await expect(page.getByRole("heading", { name: "Stack Implementation Tracks" })).toBeVisible();
    await expect(page.getByText("Practice task")).toBeVisible();
    await expect(page.getByText("Capstone")).toBeVisible();
    expect(await page.locator("iframe[title]").count()).toBeGreaterThan(0);
    await expect(page.getByRole("img", { name: "Agent loop from intent to action" })).toBeVisible();
    const playLinks = page.getByRole("link", { name: "Play video" });
    expect(await playLinks.count()).toBeGreaterThan(0);
    await expect(playLinks.first()).toHaveAttribute("href", /youtube|youtu\.be/);
    await assertHealthyApp(page);
  });

  test("TC07 exposes the current free prep surface and no premium direct-access route", async ({ page }) => {
    await gotoSeededApp(page);
    await openSidebar(page);

    await expect(page.getByText("Full Stack Prep - Free")).toBeVisible();
    await expect(page.getByText("Premium")).toHaveCount(0);

    const response = await page.goto("/premium");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
  });
});
