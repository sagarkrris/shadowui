import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  mockDsaChallenges,
} from "./helpers/app.js";

const guidedStages = [
  "Pattern Atlas",
  "Visual Playground",
  "Explain-Then-Code",
  "Interview Challenges",
  "Drill Room",
  "Practice as Mock",
];

test.describe("DSA Visual Lab", () => {
  test("verifies guided stages and generated interview challenge answering", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: "Fresh Mock Array Trap" })).toBeVisible();

    await page.getByRole("button", { name: /Only discard a side/ }).click();
    await expect(page.getByText("Why it works")).toBeVisible();
    await expect(page.getByText("Trick note: Moving both pointers can skip the answer.")).toBeVisible();
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
});
