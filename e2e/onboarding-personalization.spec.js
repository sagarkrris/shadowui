import { expect, test } from "@playwright/test";
import {
  completeOnboarding,
  gotoCleanApp,
  openSidebar,
  reactJavaProfile,
  SESSION_STORAGE_KEY,
} from "./helpers/app.js";

test.describe("Feature A: onboarding and personalization", () => {
  test("TC01 completes valid onboarding and opens the personalized dashboard", async ({ page }) => {
    await gotoCleanApp(page);

    await completeOnboarding(page, reactJavaProfile);

    await expect(page.getByText("Select a topic from the sidebar")).toBeVisible();
    await expect(page.getByText("React", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start mock round" })).toBeVisible();
  });

  test("TC02 validates empty and excessively long setup fields", async ({ page }) => {
    await gotoCleanApp(page);

    await expect(page.getByRole("button", { name: "Personalize Prep" })).toBeDisabled();
    await expect(page.getByText("Complete name, position, experience, and tech stack to continue.")).toBeVisible();

    await page.getByLabel("Name").fill("N".repeat(81));
    await page.getByLabel("Position").fill("P".repeat(121));
    await page.getByLabel("Years of experience").selectOption("8+ years");
    await page.getByLabel("Tech stack").fill("S".repeat(161));

    await expect(page.getByRole("button", { name: "Personalize Prep" })).toBeDisabled();
    await expect(page.getByText("Name must be 80 characters or fewer.")).toBeVisible();
    await expect(page.getByText("Position must be 120 characters or fewer.")).toBeVisible();
    await expect(page.getByText("Tech stack must be 160 characters or fewer.")).toBeVisible();
  });

  test("TC03 previews stack-specific sidebar topics while the tech stack changes", async ({ page }) => {
    await gotoCleanApp(page);
    await page.getByLabel("Tech stack").fill("React");
    await openSidebar(page);

    await expect(page.getByText("React Prep", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Frontend" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Backend" })).toHaveCount(0);

    await page.getByLabel("Tech stack").fill("Java Spring Boot");
    await expect(page.getByText("Java Prep", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Backend" })).toBeVisible();
  });

  test("TC04 persists personalization after reload", async ({ page }) => {
    await gotoCleanApp(page);
    await completeOnboarding(page, reactJavaProfile);

    await page.reload();

    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByText("Tell me your interview target")).toHaveCount(0);
    const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key)), SESSION_STORAGE_KEY);
    expect(stored.snapshot.candidateProfile).toMatchObject(reactJavaProfile);
  });

  test("escapes setup input instead of executing markup", async ({ page }) => {
    await gotoCleanApp(page);

    await completeOnboarding(page, {
      name: '<script>alert("xss")</script>',
      position: "Frontend Engineer",
      experience: "2-4 years",
      stack: "React",
    });

    await expect(page.locator("script", { hasText: "xss" })).toHaveCount(0);
    await expect(page.getByText('<script>alert("xss")</script>')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__INTERVIEWIQ_ALERTED__)).toBe(false);
  });
});
