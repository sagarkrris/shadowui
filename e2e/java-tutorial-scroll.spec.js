import { expect, test } from "@playwright/test";

const tutorialPath = "/java/tutorial/jdk-vs-jre-vs-jvm";

for (const viewport of [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 375, height: 812 },
]) {
  test(`keeps Java tutorials vertically scrollable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(tutorialPath);

    const article = page.locator("main.tutorial-article-page");
    await expect(article).toBeVisible();
    await expect(page.getByRole("heading", { name: "JDK vs JRE vs JVM" })).toBeVisible();

    const scrollState = await article.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
    });

    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
    expect(scrollState.scrollTop).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: "Related tutorials" })).toBeVisible();
  });
}
