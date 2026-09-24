import { expect, test } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";
import { BACKEND_FIELD_NOTES } from "../lib/backendFieldNotes.mjs";

const blogTitle = "From Java 8 to Java 26: How Java Quietly Reinvented Itself";

for (const viewport of [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 375, height: 812 },
  { name: "mobile-wide", width: 390, height: 844 },
]) {
  test(`keeps the Tech Blog reader scrollable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
    await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
    await page.getByText(blogTitle, { exact: true }).click();

    const dialog = page.getByRole("dialog", { name: `${blogTitle} full lesson` });
    const reader = dialog.locator(".java-digest-reader-scroll");
    const checkpoint = dialog.getByText("Interview checkpoint", { exact: true });
    await expect(reader).toBeVisible();
    if (viewport.width < 600) {
      expect(await reader.locator("p").first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(15);
      expect(await dialog.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(viewport.width - 2);
      const close = dialog.getByRole("button", { name: "Close lesson reader" });
      expect(await close.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    const example = reader.locator(":scope > pre");
    expect(await example.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);

    const scrollState = await reader.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
    });

    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
    expect(scrollState.scrollTop).toBeGreaterThan(0);
    await expect(checkpoint).toBeVisible();
  });

  for (const blog of BACKEND_FIELD_NOTES) {
    test(`field note ${blog.id} shows complete content on ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await gotoSeededApp(page, { activeTab: "javaDigest", homeDemoSeen: true });
      await page.getByRole("button", { name: "Tech Blogs", exact: true }).click();
      if (viewport.width < 600) {
        const card = page.getByText(blog.title, { exact: true });
        if (blog === BACKEND_FIELD_NOTES[0]) {
          expect(await card.evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(viewport.height - 60);
        }
      }
      await page.getByText(blog.title, { exact: true }).click();
      const dialog = page.getByRole("dialog", { name: `${blog.title} full lesson` });
      const reader = dialog.locator(".java-digest-reader-scroll");
      const timeline = dialog.getByRole("region", { name: "Annotated event timeline" });
      await expect(timeline.getByRole("listitem")).toHaveCount(blog.trace.length);
      await timeline.getByText(blog.trace.at(-1)[2], { exact: true }).scrollIntoViewIfNeeded();
      await expect(timeline.getByText(blog.trace.at(-1)[2], { exact: true })).toBeInViewport();
      if (blog === BACKEND_FIELD_NOTES[0]) await page.screenshot({ path: testInfo.outputPath("reader.png") });
      expect(await timeline.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
      await expect(dialog.getByRole("img", { name: /System design reasoning loop/ })).toHaveCount(0);
      for (const chapter of blog.chapters) {
        const article = dialog.getByRole("article").filter({ has: page.getByRole("heading", { name: chapter.title, exact: true }) });
        await expect(article.getByText(chapter.example, { exact: true })).toHaveCount(1);
        await expect(article.getByText(chapter.exercise, { exact: false })).toHaveCount(1);
        const example = article.getByLabel(`Example for ${chapter.title}`);
        expect(await example.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
      }
      await expect(dialog.getByText(blog.misconception.question, { exact: true })).toHaveCount(1);
      await dialog.getByRole("radio", { name: blog.misconception.options[blog.misconception.correct], exact: true }).check();
      await expect(dialog.getByRole("status")).toHaveText(blog.misconception.feedback[blog.misconception.correct]);
      await dialog.getByText("Sample answer", { exact: true }).click();
      await expect(dialog.locator("details[open]")).toContainText(blog.misconception.options[blog.misconception.correct]);
      const buttons = dialog.getByRole("button", { name: "Mark chapter complete", exact: true });
      await buttons.first().click();
      await expect(dialog.getByRole("button", { name: "Chapter completed", exact: true })).toHaveCount(1);
      expect(await reader.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      await dialog.getByRole("button", { name: "Close lesson reader" }).click();
      await expect(dialog).toHaveCount(0);
    });
  }
}
