import { expect, test } from "@playwright/test";
import { SENIOR_JAVA_DAILY_SETS } from "../lib/seniorJavaDaily.mjs";

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`daily Java navigation, full answers, and layout at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/senior-java-interview");
    await page.getByRole("link", { name: "Daily SDE-3 practice sets" }).click();
    await expect(page.getByRole("heading", { name: "Daily SDE-3 Java interview practice" })).toBeVisible();
    for (const [index, set] of SENIOR_JAVA_DAILY_SETS.entries()) {
      await page.goto("/senior-java-interview/daily");
      const link = page.locator(`a[href="/senior-java-interview/daily/${set.slug}"]`);
      await expect(link).toHaveCount(1);
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${set.slug}$`));
      await expect(page.locator("h1")).toHaveText(set.title);
      await expect(page.locator("article h3")).toHaveCount(12);
      await expect(page.locator("article").getByText("Say aloud:")).toHaveCount(12);
      await expect(page.locator("article").getByText("Follow-ups:", { exact: true })).toHaveCount(12);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.locator("[data-reader-scroll]").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      const nav = page.getByRole("navigation", { name: "Practice sets", exact: true });
      if (index > 0) await expect(nav.getByRole("link", { name: `← Set ${set.number - 1}` })).toHaveAttribute("href", `/senior-java-interview/daily/${SENIOR_JAVA_DAILY_SETS[index - 1].slug}`);
      if (index < SENIOR_JAVA_DAILY_SETS.length - 1) await expect(nav.getByRole("link", { name: `Set ${set.number + 1} →` })).toHaveAttribute("href", `/senior-java-interview/daily/${SENIOR_JAVA_DAILY_SETS[index + 1].slug}`);
      else await expect(nav.getByText("Latest set")).toBeVisible();
      const ids = await page.locator("article [id]").evaluateAll(elements => elements.map(element => element.id));
      expect(new Set(ids).size).toBe(ids.length);
      if (set.number === 5) {
        await expect(page.locator("article")).toContainText("S05-Q01–S05-Q12");
        const skip = page.getByRole("link", { name: "Skip to reading" });
        await skip.focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("#reader-main")).toBeFocused();
        await page.screenshot({ path: `/private/tmp/java-daily-set05-${viewport.width}-top.png` });
        await page.locator("article pre").last().scrollIntoViewIfNeeded();
        await page.screenshot({ path: `/private/tmp/java-daily-set05-${viewport.width}-coding.png` });
      }
    }
  });
}

test("daily sitemap has one entry per set and unknown dates return 404", async ({ page, request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const set of SENIOR_JAVA_DAILY_SETS) {
    expect(xml.split(`/senior-java-interview/daily/${set.slug}</loc>`).length - 1).toBe(1);
  }
  const response = await page.goto("/senior-java-interview/daily/2026-10-08-set-99");
  expect(response.status()).toBe(404);
});
