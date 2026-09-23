import { test, expect } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

const title = "Java Design Patterns with Diagrams: From Problem to Production";
const path = "/tech-blogs/java-design-patterns-with-diagrams";

for (const width of [1366, 375]) {
  test(`public pattern course preserves diagrams and exposes guidance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const diagram = page.getByLabel("4. Decorator and Proxy: controlled composition diagram");
    await expect(diagram).toHaveCSS("white-space", "pre-wrap");
    await expect(diagram).toContainText("AuthorizedPayment");
    expect(await diagram.textContent()).toContain("\n");
    await expect(page.getByRole("heading", { name: "Capstone: Refactor a checkout workflow" })).toBeVisible();
    const answer = page.locator("details").filter({ has: page.locator("summary", { hasText: /^Sample answer$/ }) }).first();
    await answer.locator("summary").click();
    await expect(answer.locator("p")).toContainText("changing decision");
    await expect(page.getByText("When to avoid:", { exact: true })).toHaveCount(7);
    await expect(page.locator("main")).not.toContainText("brute-force");
  });
}

test("workspace reader exposes pattern guidance and answers", async ({ page }) => {
  await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
  await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `${title} full lesson` });
  await expect(dialog.getByText("When to avoid:", { exact: true })).toHaveCount(7);
  const answer = dialog.locator("details").first();
  await answer.locator("summary").click();
  await expect(answer.locator("p")).toContainText("changing decision");
  await expect(dialog).not.toContainText("brute-force");
});
