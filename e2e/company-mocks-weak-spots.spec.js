import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  mockChat,
} from "./helpers/app.js";

test.describe("Features C and D: company prep, mock rounds, and weak spots", () => {
  test("TC08 searches seeded and unknown companies with useful result states", async ({ page }) => {
    await gotoSeededApp(page, { activeTab: "company" });

    await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
    await expect(page.getByText("Amazon Interview Console")).toBeVisible();

    await page.getByLabel("Company search").fill("Google");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Google Interview Console")).toBeVisible();
    await expect(page.getByText("No curated local dataset yet")).toBeVisible();

    await page.getByLabel("Company search").fill("zzzxxy-not-a-company");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Zzzxxy-not-a-company Interview Console")).toBeVisible();
    await expect(page.getByText("Generic prep")).toBeVisible();
    await assertHealthyApp(page);
  });

  test("TC09 toggles interview and learning practice modes", async ({ page }) => {
    await gotoSeededApp(page);

    await expect(page.getByLabel("Message composer")).toHaveAttribute("placeholder", /Type your answer/);

    await page.getByRole("button", { name: "practice" }).click();
    await expect(page.getByLabel("Message composer")).toHaveAttribute("placeholder", /Ask anything/);

    await page.getByRole("button", { name: "interview" }).click();
    await expect(page.getByLabel("Message composer")).toHaveAttribute("placeholder", /Type your answer/);
  });

  test("TC10 sends calibrated difficulty and panel settings when a mock starts", async ({ page }) => {
    const chatRequests = await mockChat(page, "Score: 7/10\nStrengths: Good framing.\nGaps: Add trade-offs.\nFollow-up: What changes at scale?");
    await gotoSeededApp(page, { selectedCat: "System Design", selectedSub: "Caching Strategies" });

    await page.getByLabel("Difficulty level").selectOption("Lead");
    await page.getByLabel("Interview calibration mode").selectOption("barRaiser");
    await page.getByLabel("Round Strategy Mode").selectOption("systemDesign");
    await page.getByRole("button", { name: "Start mock round" }).click();

    await expect(page.getByText("Score: 7/10")).toBeVisible();
    expect(chatRequests.at(-1).messages.at(-1).content).toContain("Difficulty: Lead");
    expect(chatRequests.at(-1).messages.at(-1).content).toContain("Bar Raiser");
    expect(chatRequests.at(-1).messages.at(-1).content).toContain("Round Strategy Mode: System Design");
  });

  test("TC11 and TC12 update weak spots immediately after poor database feedback", async ({ page }) => {
    await mockChat(page, "Score: 3/10\nStrengths: You named a table.\nGaps: Databases were weak: missing SQL indexing, transactions, schema trade-offs, and query tuning.\nImproved Version: Discuss indexes, isolation, constraints, and read/write patterns.");
    await gotoSeededApp(page, { selectedCat: "Databases", selectedSub: "SQL Design" });

    await page.getByLabel("Message composer").fill("I would store everything in one table and hope it works.");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Score: 3/10")).toBeVisible();

    await page.getByRole("button", { name: "Company Prep" }).click();

    await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
    await expect(page.getByText("Databases", { exact: true })).toBeVisible();
    await expect(page.getByText("Weak spot load")).toBeVisible();
    await assertHealthyApp(page);
  });
});
