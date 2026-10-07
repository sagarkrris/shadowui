import { expect, test } from "@playwright/test";

test("all three daily Java sets and answers are reachable from the guide", async ({ page }) => {
  await page.goto("/senior-java-interview");
  await page.getByRole("link", { name: "Daily SDE-3 practice sets" }).click();
  await expect(page.getByRole("heading", { name: "Daily SDE-3 Java interview practice" })).toBeVisible();
  for (const number of [1, 2, 3]) {
    await page.goto("/senior-java-interview/daily");
    const slug = `2026-10-07-set-0${number}`;
    await expect(page.locator(`a[href="/senior-java-interview/daily/${slug}"]`)).toBeVisible();
    await page.locator(`a[href="/senior-java-interview/daily/${slug}"]`).click();
    await expect(page.locator("article h3")).toHaveCount(12);
    await expect(page.locator("article").getByText("Say aloud:")).toHaveCount(12);
  }
});
