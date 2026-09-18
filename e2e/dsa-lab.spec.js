import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  mockDsaChallenges,
  mockChat,
} from "./helpers/app.js";

const guidedStages = [
  "Pattern Atlas",
  "Visual Playground",
  "Explain-Then-Code",
  "Interview Challenges",
  "Drill Room",
];

test.use({ serviceWorkers: 'block' });

test.describe("DSA Visual Lab", () => {
  test("verifies guided stages and generated interview challenge answering", async ({ page }) => {
    await mockChat(page, 'Explain the invariant for your chosen algorithm.');
    await mockDsaChallenges(page);
    await gotoSeededApp(page, { activeTab: "dsaLab", selectedCat: "DSA", selectedSub: "Arrays & Strings" });

    await expect(page.getByText("DSA Visual Lab", { exact: false })).toBeVisible();

    for (const stage of guidedStages) {
      await page.getByRole("button", { name: stage }).click();
      await assertHealthyApp(page);
    }

    await page.getByRole("button", { name: "Interview Challenges" }).click();
    await expect(page.getByRole("heading", { name: "Fresh Mock Array Trap" })).toBeVisible();
    await expect(page.getByText("Generated")).toBeVisible();

    await page.getByRole("button", { name: "Refresh Questions" }).click();
    await expect(page.getByRole('button', { name: 'Refresh Questions', exact: true })).toBeEnabled();
    await expect(page.getByRole("heading", { name: "Fresh Mock Array Trap" })).toBeVisible();

    await page.getByRole("button", { name: /Only discard a side/ }).click();
    await expect(page.getByText("Why it works", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Trick note: Moving both pointers can skip the answer.")).toBeVisible();
    await page.locator('button:not([aria-label])').filter({ hasText: /^Practice as Mock$/ }).click();
    await assertHealthyApp(page);
  });

  test("falls back to the local larger bank when challenge generation fails", async ({ page }) => {
    await mockDsaChallenges(page, { fail: true });
    await gotoSeededApp(page, { activeTab: "dsaLab", selectedCat: "DSA", selectedSub: "Arrays & Strings" });

    await page.getByRole("button", { name: "Interview Challenges" }).click();

    expect(await page.getByText("Local fallback").count()).toBeGreaterThan(0);
    await expect(page.getByText("Question bank")).toBeVisible();
    await expect(page.getByText("Tricky interview coding, MCQ, and quantitative questions.")).toBeVisible();
    await assertHealthyApp(page);
  });

  test("opens the beginner foundations path and launches a visual lesson", async ({ page }) => {
    await mockDsaChallenges(page, { fail: true });
    await gotoSeededApp(page, { activeTab: "dsaLab", selectedCat: "DSA", selectedSub: "Arrays & Strings" });

    await page.getByRole("button", { name: "Foundations Path" }).click();
    await expect(page.getByText("A gentle path from pictures to problem-solving")).toBeVisible();
    await expect(page.getByText("Programming prerequisites")).toBeVisible();
    await expect(page.locator('summary').filter({ hasText: /^Common beginner mistake$/ })).toHaveCount(5);
    await expect(page.getByText("Big-O from zero")).toBeVisible();
    await expect(page.getByText("Rule of thumb", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("First guided problem", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Open visual lesson" }).click();
    await expect(page.getByRole('heading', { name: 'Scan the first value', exact: true })).toBeVisible();
    await assertHealthyApp(page);
  });

  test("browses the complete DSA curriculum by level", async ({ page }) => {
    await mockDsaChallenges(page, { fail: true });
    await gotoSeededApp(page, { activeTab: "dsaLab", selectedCat: "DSA", selectedSub: "Arrays & Strings" });

    await page.getByRole("button", { name: "Complete Curriculum" }).click();
    await expect(page.getByText("A start-to-interview roadmap")).toBeVisible();
    await expect(page.locator('summary').filter({ hasText: /^Dynamic Programming/ })).toBeVisible();
    await page.getByRole("button", { name: "Advanced" }).click();
    await expect(page.locator('summary').filter({ hasText: /^Greedy Algorithms/ })).toBeVisible();
    await assertHealthyApp(page);
  });
});
