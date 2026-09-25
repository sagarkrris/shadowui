import { test, expect } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

const pages = [
  ["java-observability-opentelemetry", ["observeSignals", "observeSpans", "observeContext", "observeCardinality", "observeSampling", "observeRecovery"]],
  ["api-gateway-production-patterns", ["gatewayTrust"]],
  ["load-balancing-algorithms", ["lbPipeline", "lbScores", "lbRing"]],
  ["real-time-communication-patterns", ["realtimePoll", "realtimeSse", "realtimeSocket", "realtimeWebhook"]],
  ["distributed-transactions-data-consistency", ["saga"]],
  ["caching-patterns-java", ["cache", "cacheRace"]],
  ["resilience-engineering", ["breaker"]],
  ["java-memory-management-evolution", ["memory"]],
  ["sql-performance-interviews", ["sql"]],
  ["leetcode-patterns", ["pointers", "window", "stack", "bfs"]],
  ["spring-boot-configuration", ["configuration"]],
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
      const firstAnswer = page.locator("details").filter({
        has: page.locator("summary").filter({ hasText: /^Sample answer$/ }),
      }).first();
      await firstAnswer.locator("summary").click();
      await expect(firstAnswer.locator("p")).toBeVisible();
    });
  }
}

test("diagram text view preserves branch meaning on mobile and supports keyboard switching", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/tech-blogs/caching-patterns-java");
  const diagram = page.locator('[data-course-diagram="cache"]').first();
  const textButton = diagram.getByRole("button", { name: "Text view", exact: true });
  await textButton.focus();
  await page.keyboard.press("Enter");
  await expect(textButton).toHaveAttribute("aria-pressed", "true");
  await expect(diagram.getByRole("img")).toBeHidden();
  await expect(diagram.getByRole("listitem").filter({ hasText: "hit" })).toContainText("Return value");
  await expect(diagram.getByRole("listitem").filter({ hasText: "miss" })).toContainText("Load source");
  expect(await diagram.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
  await diagram.screenshot({ path: testInfo.outputPath("mobile-text-view.png") });
  await diagram.getByRole("button", { name: "Diagram", exact: true }).click();
  await expect(diagram.getByRole("img")).toBeVisible();
  await expect(textButton).toHaveAttribute("aria-pressed", "false");
});

test("observability diagram card visual check", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/tech-blogs/java-observability-opentelemetry");
  await page.locator('[data-course-diagram="observeSignals"]').screenshot({ path: testInfo.outputPath("observability-card.png") });
});

test("workspace displays observability chapter illustrations", async ({ page }) => {
  await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
  await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
  const title = "Production Java Observability: Logs, Metrics, and Traces";
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `${title} full lesson` });
  await expect(dialog.locator('[data-course-diagram="observeSignals"]').first().getByRole("img")).toBeVisible();
  for (const key of ["observeSpans", "observeContext", "observeCardinality", "observeSampling", "observeRecovery"]) {
    await expect(dialog.locator(`[data-course-diagram="${key}"]`).getByRole("img")).toHaveCount(1);
  }
});

test("workspace selects configuration course and its diagram", async ({ page }) => {
  await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
  await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
  const title = "Spring Boot Configuration: Safe Defaults, Secrets, and Rollouts";
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `${title} full lesson` });
  await expect(dialog.locator("[data-course-diagram='configuration']").first()).toBeVisible();
  await expect(dialog.getByText("valid HTTPS endpoint required", { exact: false }).first()).toBeVisible();
});

test("workspace opens the gateway course with its trust diagram", async ({ page }) => {
  await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
  await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
  const title = "API Gateways: Routing, Trust, Traffic, and Recovery";
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `${title} full lesson` });
  await expect(dialog.locator("[data-course-diagram='gatewayTrust']").first()).toBeVisible();
  await expect(dialog.getByText("2. Identity at the edge and authorization in services", { exact: true }).first()).toBeVisible();
});

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
