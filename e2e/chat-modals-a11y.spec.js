import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  mockChat,
} from "./helpers/app.js";

test.describe("Chat, modals, latency states, and accessibility smoke", () => {
  test("sends a mocked chat message, shows loading state, and clears the conversation", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: `data: ${JSON.stringify({ text: "Score: 8/10\nStrengths: Clear answer.\nGaps: Add complexity analysis." })}\n\ndata: [DONE]\n\n`,
      });
    });
    await gotoSeededApp(page);

    await page.getByLabel("Message composer").fill("Explain React state trade-offs.");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
    await expect(page.getByText("Explain React state trade-offs.")).toBeVisible();
    await expect(page.getByText("Score: 8/10")).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Score: 8/10")).toHaveCount(0);
    await assertHealthyApp(page);
  });

  test("opens and closes Info, Analyze Screen, and Record Review modals", async ({ page }) => {
    await gotoSeededApp(page);

    await page.getByRole("button", { name: "Info" }).click();
    await expect(page.getByText("InterviewIQ", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "x" }).click();
    await expect(page.getByText("Voice Input")).toHaveCount(0);

    await page.getByRole("button", { name: "Analyze Screen" }).click();
    await expect(page.getByRole("dialog")).toContainText("Analyze Screen");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Record Review" }).click();
    await expect(page.getByRole("dialog")).toContainText("Recording Review");
    await page.getByRole("button", { name: "x" }).click();
    await assertHealthyApp(page);
  });

  test("has accessible labels and keyboard navigation for core interview controls", async ({ page }) => {
    await mockChat(page, "Score: 6/10\nStrengths: Good start.\nGaps: Add testing strategy.");
    await gotoSeededApp(page);

    await expect(page.getByLabel("Message composer")).toBeVisible();
    await expect(page.getByLabel("Difficulty level")).toBeVisible();
    await expect(page.getByLabel("Interview calibration mode")).toBeVisible();
    await expect(page.getByLabel("Round Strategy Mode")).toBeVisible();
    await expect(page.getByLabel("AI Interview Panel Mode")).toBeVisible();

    await page.keyboard.press("Tab");
    const firstFocusedLabel = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "");
    expect(firstFocusedLabel.trim().length).toBeGreaterThan(0);

    await page.getByLabel("Message composer").focus();
    await page.keyboard.type("Use keyboard to send this answer.");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Score: 6/10")).toBeVisible();
  });
});
