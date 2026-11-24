import { test, expect } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";

const title = "Microservices Design Patterns: Boundaries, Reliability, and Evolution";
const path = "/tech-blogs/microservices-design-patterns";

for (const width of [1366, 375]) {
  test(`public Microservices path exposes design guidance and runnable lab at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start here: chapters 1–4" })).toBeVisible();
    const chapter = page.locator("#lesson-5");
    const diagram = chapter.getByLabel("5. Saga and transactional outbox diagram");
    await expect(diagram).toHaveCSS("white-space", "pre-wrap");
    await expect(diagram).toContainText("Broker");
    expect(await diagram.textContent()).toContain("\n");
    await expect(chapter.locator("[data-course-interview-answer]")).toContainText("reconcile before compensating");
    await expect(chapter.getByText("Disadvantages:", { exact: true })).toBeVisible();
    const disclosure = chapter.getByText("Failure case and verification", { exact: true });
    await disclosure.focus();
    await disclosure.press("Enter");
    await expect(chapter.getByText("How to verify:", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Capstone: Split and operate an order platform" })).toBeVisible();
    await page.getByText("Approval and lost replies", { exact: true }).click();
    await expect(page.getByText(/order=CONFIRMED stock=RESERVED payment=CAPTURED/)).toBeVisible();
    const link = page.getByRole("link", { name: "Download CheckoutLab.java" });
    const response = await page.request.get(await link.getAttribute("href"));
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("class CheckoutLab");
    const spring = page.getByRole("region", { name: "Spring Boot capstone with PostgreSQL and Kafka" });
    const archive = spring.getByRole("link", { name: "Download the Spring Boot capstone" });
    const download = await page.request.get(await archive.getAttribute("href"));
    expect(download.ok()).toBe(true);
    expect((await download.body()).subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    await spring.getByText("Start Compose and check stock", { exact: true }).click();
    await expect(spring.getByText(/docker compose up --build -d/)).toBeVisible();
  });
}

test("workspace reader exposes experienced lessons and the same Java lab", async ({ page }) => {
  await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
  await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
  await page.getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `${title} full lesson` });
  await expect(dialog.getByText("When to avoid:", { exact: true })).toHaveCount(12);
  await expect(dialog.locator("[data-course-interview-answer]").first()).toContainText("competing orders");
  await dialog.getByText("Does CQRS require separate databases or event sourcing?", { exact: true }).click();
  await expect(dialog.getByText(/The separation is between the read and write models/)).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Download CheckoutLab.java" })).toHaveAttribute("download", "");
  await expect(dialog.getByRole("link", { name: "Download the Spring Boot capstone" })).toHaveAttribute("href", "/microservices-spring-lab.zip");
});
