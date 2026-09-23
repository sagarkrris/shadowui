import { test, expect } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

const pages = [
  ["distributed-transactions-data-consistency", ["saga"]],
  ["caching-patterns-java", ["cache", "cacheRace"]],
  ["resilience-engineering", ["breaker"]],
  ["java-memory-management-evolution", ["memory"]],
  ["sql-performance-interviews", ["sql"]],
  ["leetcode-patterns", ["pointers", "window", "stack", "bfs"]],
];

for (const width of [375, 1366]) {
  for (const [slug, keys] of pages) {
    test(`${slug} diagrams stay readable at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/tech-blogs/${slug}`);
      for (const key of keys) {
        const diagram = page.locator(`[data-course-diagram="${key}"]`).first();
        await expect(diagram).toBeVisible();
        const svg = diagram.locator("svg");
        const metrics = await svg.evaluate(element => ({
          scale: element.getScreenCTM().a,
          labelSize: Math.min(...Array.from(element.querySelectorAll("text"),
            text => Number(text.getAttribute("font-size")))),
        }));
        expect(metrics.scale).toBeGreaterThanOrEqual(0.99);
        expect(metrics.labelSize).toBeGreaterThanOrEqual(12);
        const region = diagram.getByRole("region");
        await expect(region).toHaveAttribute("tabindex", "0");
        if (width === 375) {
          expect(await region.evaluate(el => el.scrollWidth > el.clientWidth)).toBeTruthy();
          await region.evaluate(el => { el.scrollLeft = el.scrollWidth; });
          expect(await region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
        }
        if (key === "cacheRace") {
          await region.evaluate(el => { el.scrollLeft = 0; });
          await diagram.screenshot({ path: testInfo.outputPath("cache-race.png") });
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
      const firstAnswer = page.locator("details").first();
      await firstAnswer.locator("summary").click();
      await expect(firstAnswer.locator("p")).toBeVisible();
    });
  }
}

test("workspace selects cache diagram explicitly and supports horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
  await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
  const title = "Caching Patterns in Java: Speed Without Losing Correctness";
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `${title} full lesson` });
  await expect(dialog.locator("[data-course-diagram='cache']").first()).toBeVisible();
  await expect(dialog.getByText("Production Java boundary", { exact: true })).toHaveCount(0);
  const region = dialog.locator("[data-course-diagram='cache']").first().getByRole("region");
  expect(await region.evaluate(el => el.scrollWidth > el.clientWidth)).toBeTruthy();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
});
