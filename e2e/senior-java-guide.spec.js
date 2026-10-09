import { expect, test } from "@playwright/test";

test("the senior Java guide links through all new question parts", async ({ page }) => {
  await page.goto("/senior-java-interview");
  for (const part of [12, 13, 14, 15, 16]) {
    await expect(page.locator(`a[href="/senior-java-interview/part-${part}"]`).first()).toBeVisible();
  }

  await page.locator('a[href="/senior-java-interview/part-12"]').first().click();
  await expect(page.locator("article h4").first()).toContainText("Q154");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Spring Boot, coding style, and leadership/ }).click();
  await expect(page.locator("article h4").first()).toContainText("S1 How does an annotation");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /System design, JVM, and coding/ }).click();
  await expect(page.locator("article h4").last()).toContainText("Q213");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Full system design and DP\/graph problems/ }).click();
  await expect(page.locator("article h4").first()).toContainText("Q214");
  await expect(page.locator("article h4").last()).toContainText("Q222");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Hibernate and SQL/ }).click();
  await expect(page.locator("article h4").first()).toContainText("H1 How do we make a connection");
  await expect(page.locator("article h4").last()).toContainText("Q244");
  await expect(page.getByRole("link", { name: /InterviewAlgorithms\.java/ }).last()).toHaveAttribute("href", "/senior-java-interview/interview-algorithms");
});


for (const width of [390, 1280]) {
  test(`learning explanations, follow-ups and coding reasoning are readable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/senior-java-interview/part-2");
    await expect(page.locator("article code").filter({ hasText: /^instanceof List<String>$/ })).toBeAttached();
    const explanation = page.locator("article p").filter({ hasText: "A List of an unknown subtype of Number" });
    await explanation.scrollIntoViewIfNeeded();
    await expect(explanation).toBeVisible();
    const followUp = page.locator("article p").filter({ hasText: "Does extends make the list immutable?" });
    await expect(followUp).toContainText("No;");
    await followUp.scrollIntoViewIfNeeded();
    await expect(followUp).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`answer-explanation-${width}.png`) });

    await page.goto("/senior-java-interview/part-15#q221-cheapest-flights-within-k-stops-bellman-ford-style");
    const heading = page.locator("#q221-cheapest-flights-within-k-stops-bellman-ford-style");
    await expect(heading).toBeInViewport();
    const reasoning = heading.locator("+ p");
    await expect(reasoning).toContainText("Explain before coding:");
    await expect(reasoning).toContainText("at most one flight");
    await expect(reasoning.locator("+ pre")).toContainText("long[] next = dist.clone()");

    await page.goto("/senior-java-interview/part-1a#topic-learning-order-start-with-the-foundations");
    await page.getByRole("link", { name: "terminology explanations", exact: true }).click();
    await expect(page).toHaveURL(/part-11#sde-3-terminology-and-follow-up-audit$/);
    await expect(page.locator("#sde-3-terminology-and-follow-up-audit")).toBeInViewport();
  });

  test(`remaining topic routes reach prerequisites before advanced questions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, slug, anchor, prefix] of [
      ["Stream foundations", "part-5", "stream-questions-before-pitfalls", "ST1"],
      ["Cache foundations", "part-5", "cache-questions-before-redis-patterns", "CA1"],
      ["Quality foundations", "part-5", "quality-questions-before-performance-and-flakiness", "QE1"],
      ["Terraform foundations", "part-7", "terraform-questions-before-state-internals", "TF1"],
      ["API foundations", "part-7", "api-questions-before-protocol-choices", "API1"],
    ]) {
      await page.goto("/senior-java-interview/part-1a#topic-learning-order-start-with-the-foundations");
      await page.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${slug}#${anchor}$`));
      await expect(page.locator(`#${anchor}`)).toBeInViewport();
      await expect(page.locator(`#${anchor} + h4`)).toContainText(prefix);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.goto("/senior-java-interview/part-8#ac-reactive-programming-spring-webflux");
    await page.getByRole("link", { name: "request contract", exact: true }).click();
    await expect(page).toHaveURL(/part-7#api-questions-before-protocol-choices$/);
    await expect(page.locator("#api-questions-before-protocol-choices")).toBeInViewport();
    await page.goto("/senior-java-interview/part-14#q194-design-a-distributed-cache");
    await expect(page.locator("#q194-design-a-distributed-cache")).toBeInViewport();
    await page.getByRole("link", { name: "requirements-first design sequence", exact: true }).click();
    await expect(page).toHaveURL(/part-1b#module-7-system-design-prompts-practice-45-min-each$/);
  });

  test(`foundations and saved advanced bookmarks remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/senior-java-interview/part-16#q223-what-goes-wrong-with-elementcollection-on-a-list");
    const saved = page.locator("#q223-what-goes-wrong-with-elementcollection-on-a-list");
    await expect(saved).toBeInViewport();
    await expect(saved).toContainText("Q223");
    const titles = await page.locator("article h4").allTextContents();
    expect(titles.findIndex(title => title.startsWith("H4 "))).toBeLessThan(titles.findIndex(title => title.startsWith("H7 ")));
    expect(titles.findIndex(title => title.startsWith("H7 "))).toBeLessThan(titles.findIndex(title => title.startsWith("Q223 ")));
    await page.goto("/senior-java-interview/part-13");
    await expect(page.locator("article h4").first()).toContainText("S1");
    await page.locator("article table").first().scrollIntoViewIfNeeded();
    await expect(page.locator("article table").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}


for (const width of [390, 1280]) {
  test(`topic paths route to foundations and concurrency follow-ups at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/senior-java-interview/part-1a");
    const topicMap = page.locator("article table").nth(1);
    await topicMap.scrollIntoViewIfNeeded();
    await expect(topicMap).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("link", { name: "Multithreading Questions", exact: true }).click();
    await expect(page).toHaveURL(/part-1a#multithreading-questions-foundations-to-senior-follow-ups$/);
    await expect(page.locator("#multithreading-questions-foundations-to-senior-follow-ups")).toBeInViewport();
    const ladder = await page.locator("article h4").allTextContents();
    expect(ladder.filter(title => /^T\d+ /.test(title)).map(title => title.match(/^T\d+/)?.[0])).toEqual(Array.from({ length: 16 }, (_, i) => `T${i + 1}`));
    await page.goto("/senior-java-interview/part-2");
    await page.getByRole("link", { name: "multithreading ladder", exact: true }).click();
    await expect(page).toHaveURL(/part-1a#multithreading-questions-foundations-to-senior-follow-ups$/);
    await expect(page.locator("#multithreading-questions-foundations-to-senior-follow-ups")).toBeInViewport();
    await page.goto("/senior-java-interview/part-2");
    await page.getByRole("link", { name: "Spring annotation ladder", exact: true }).click();
    await expect(page).toHaveURL(/part-13#spring-boot-annotations-usage-to-internals-to-senior-diagnosis$/);
    await expect(page.locator("#spring-boot-annotations-usage-to-internals-to-senior-diagnosis")).toBeInViewport();
    await page.goto("/senior-java-interview/part-12#q161-what-is-the-aba-problem-and-how-do-you-avoid-it");
    await expect(page.locator("#q161-what-is-the-aba-problem-and-how-do-you-avoid-it")).toBeInViewport();
    await page.getByRole("link", { name: "multithreading foundations", exact: true }).click();
    await expect(page).toHaveURL(/part-1a#multithreading-questions-foundations-to-senior-follow-ups$/);
  });
}
