import { expect, test } from "@playwright/test";

test("the senior Java guide links through all new question parts", async ({ page }) => {
  await page.goto("/senior-java-interview");
  for (const part of [12, 13, 14, 15, 16, 21, 22]) {
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
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Production resilience, delivery and JVM operations/ }).click();
  await expect(page.locator("article h4").first()).toContainText("Q273");
  await expect(page.locator("article h4").last()).toContainText("Q292");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Micronaut and Spring Boot/ }).click();
  await expect(page.locator("article h4").first()).toContainText("Q293");
  await expect(page.locator("article h4").last()).toContainText("Q320");
  await expect(page.getByRole("link", { name: /InterviewAlgorithms\.java/ }).last()).toHaveAttribute("href", "/senior-java-interview/interview-algorithms");
});


for (const width of [390, 1280]) {
  test(`Part 21 learning ladders and corrected operations guidance are readable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/senior-java-interview/part-21");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Production resilience, delivery and JVM operations");
    const titles = await page.locator("article h4").allTextContents();
    expect(titles.map(title => Number(title.match(/^Q(\d+)/)?.[1]))).toEqual(Array.from({ length: 20 }, (_, i) => i + 273));
    await expect(page.locator("article strong").filter({ hasText: /^Tier [1-4] -/ })).toHaveCount(80);
    await expect(page.locator("article strong").filter({ hasText: /^Probe [1-3] / })).toHaveCount(60);
    await page.locator("article table").first().scrollIntoViewIfNeeded();
    await expect(page.locator("article table").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`part21-ladder-${width}.png`) });
    await page.goto("/senior-java-interview/part-21#q287-how-do-you-find-a-memory-leak-in-a-production-jvm");
    await expect(page.locator("#q287-how-do-you-find-a-memory-leak-in-a-production-jvm")).toBeInViewport();
    await expect(page.locator("article pre").filter({ hasText: "GC.class_histogram" })).toContainText("HIGH impact");
    await page.goto("/senior-java-interview/part-21#q289-what-are-structured-concurrency-and-scoped-values-a-later-version-comparison");
    await expect(page.locator("#q289-what-are-structured-concurrency-and-scoped-values-a-later-version-comparison")).toBeInViewport();
    await expect(page.locator("article p").filter({ hasText: "a sibling that ignores interruption can block closure indefinitely" })).toBeAttached();
    const code = page.locator("article pre").filter({ hasText: "StructuredTaskScope.ShutdownOnFailure" });
    await code.scrollIntoViewIfNeeded();
    await expect(code).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`part21-preview-${width}.png`) });
    await expect(page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Hibernate and SQL/ })).toHaveAttribute("href", "/senior-java-interview/part-16");
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("/senior-java-interview/part-21");
  });

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

// Exercise actual pagination, position transfer, keyboard operation, and reflow.
test("Book Mode flows the guide into facing pages and preserves its place", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/senior-java-interview/part-12");
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  const book = page.getByRole("dialog");
  const pages = book.getByRole("region", { name: "Book pages" });
  await expect(book).toBeVisible();
  await expect(book.getByRole("status")).toContainText("Pages 1–2 of");
  await expect(book.getByRole("button", { name: "Previous page", exact: false })).toBeDisabled();
  const before = await pages.innerText();
  await pages.focus();
  await pages.press("ArrowRight");
  await expect(book.getByRole("status")).toContainText("Pages 3–4 of");
  expect(await pages.innerText()).toBe(before); // One unchanged DOM; text is not dropped or duplicated.
  await expect.poll(() => pages.evaluate(element => element.scrollLeft)).toBeGreaterThan(500);
  await book.getByLabel("Book contents").selectOption({ label: (await book.getByLabel("Book contents").locator("option").last().textContent()).trim() });
  const finalHeading = page.locator("article h4").last();
  await expect(finalHeading).toBeInViewport();
  while (await book.getByRole("button", { name: "Next page", exact: false }).isEnabled()) await book.getByRole("button", { name: "Next page", exact: false }).click();
  await expect(page.locator("article > *").last()).toBeInViewport();
  await book.getByLabel("Book contents").selectOption(await book.getByLabel("Book contents").locator("option").last().getAttribute("value"));
  await book.getByRole("button", { name: "Exit Book Mode", exact: false }).click();
  await expect(book).toHaveCount(0);
  await expect(page.locator("article h4").last()).toBeInViewport();
  await page.reload();
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  await expect(page.locator("article h4").last()).toBeInViewport();
  await pages.press("Escape");
  await expect(book).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Book Mode" })).toBeFocused();
});

test("Book Mode settings, mobile pagination and section links remain readable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/senior-java-interview/part-12#q161-what-is-the-aba-problem-and-how-do-you-avoid-it");
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  const book = page.getByRole("dialog");
  await expect(page.locator("#q161-what-is-the-aba-problem-and-how-do-you-avoid-it")).toBeInViewport();
  await book.getByText("Reading settings", { exact: true }).click();
  await book.getByLabel("Theme", { exact: true }).selectOption("dark");
  await book.getByLabel("Text size", { exact: true }).selectOption("22");
  await book.getByLabel("Layout", { exact: true }).selectOption("single");
  await expect(book).toHaveAttribute("data-theme", "dark");
  await expect(book.getByRole("status")).toHaveText(/^Page \d+ of \d+$/);
  await book.getByText("Reading settings", { exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(book.getByRole("status")).toHaveText(/^Page \d+ of \d+$/);
  expect(await book.evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("#q161-what-is-the-aba-problem-and-how-do-you-avoid-it")).toBeInViewport();
  await book.getByRole("button", { name: "Exit Book Mode", exact: false }).click();
  await page.reload();
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  await expect(book).toHaveAttribute("data-theme", "dark");
  await book.getByText("Reading settings", { exact: true }).click();
  await expect(book.getByLabel("Text size", { exact: true })).toHaveValue("22");
  await book.getByText("Reading settings", { exact: true }).click();
  const contents = book.getByLabel("Book contents");
  await contents.selectOption(await contents.locator("option").last().getAttribute("value"));
  await expect(page.locator("article h4").last()).toBeInViewport();
  await book.getByRole("button", { name: "Exit Book Mode", exact: false }).click();
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  await expect(page.locator("article h4").last()).toBeInViewport();
});

test("Book Mode keeps long code and tables accessible, including the final page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/senior-java-interview/part-1a");
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  const originalText = await page.locator("article").textContent();
  const tableText = await page.locator("article table").first().textContent();
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  const modal = page.locator("dialog[open]").first();
  await modal.getByText("Reading settings", { exact: true }).click();
  await modal.getByLabel("Expand code or table").selectOption("0");
  const expanded = page.getByRole("dialog", { name: "Expanded code or table", exact: true });
  await expect(expanded).toBeVisible();
  expect(await expanded.locator("table").textContent()).toBe(tableText);
  await expanded.getByRole("button", { name: "Close expanded view" }).press("Escape");
  await expect(expanded).not.toBeVisible();
  await expect(modal).toBeVisible();
  await modal.getByText("Reading settings", { exact: true }).click();
  await expect.poll(() => modal.getByRole("status").textContent()).toMatch(/^Pages 1–2 of \d+$/);
  await page.screenshot({ path: test.info().outputPath("book-mode-desktop.png") });
  const pages = modal.getByRole("region", { name: "Book pages" });
  const sizes = await pages.locator("pre,table").evaluateAll(elements => elements.map(element => ({ height: element.getBoundingClientRect().height, limit: element.closest('[role="region"]').clientHeight })));
  expect(sizes.length).toBeGreaterThan(5);
  expect(sizes.every(size => size.height <= size.limit + 1)).toBe(true);
  expect(await page.locator("article").textContent()).toBe(originalText);
  const select = modal.getByLabel("Book contents");
  await select.selectOption(await select.locator("option").last().getAttribute("value"));
  await expect(page.locator("article h4").last()).toBeInViewport();
  // Jump directly to the final spread, then check the final authored block is reachable.
  await pages.focus();
  for (let i = 0; i < 10 && await modal.getByRole("button", { name: "Next page", exact: false }).isEnabled(); i++) await pages.press("ArrowRight");
  await expect(modal.getByRole("button", { name: "Next page", exact: false })).toBeDisabled();
  await expect(page.locator("article > *").last()).toBeInViewport();
  await pages.press("ArrowLeft");
  await expect(modal.getByRole("button", { name: "Next page", exact: false })).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(modal.getByRole("status")).toHaveText(/^Page \d+ of \d+$/);
  await page.screenshot({ path: test.info().outputPath("book-mode-mobile.png") });
  expect(errors).toEqual([]);
});

test("Book Mode tolerates unavailable storage and companion Java files", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage unavailable"); };
    Storage.prototype.setItem = () => { throw new Error("Storage unavailable"); };
  });
  await page.goto("/senior-java-interview/interview-algorithms");
  await page.getByRole("button", { name: "Open Book Mode" }).click();
  const modal = page.locator("dialog[open]").first();
  const code = modal.locator('pre');
  await expect(code).toContainText("class InterviewAlgorithms");
  await expect.poll(() => code.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await code.focus();
  await code.press("ArrowDown");
  await expect.poll(() => code.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await modal.getByRole("button", { name: "Exit Book Mode", exact: false }).click();
  await expect(modal).toHaveCount(0);
});

for (const width of [390, 1280]) {
  test(`Micronaut comparison ladders, bookmarks and chapter navigation work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/senior-java-interview');
    await page.locator('a[href="/senior-java-interview/part-22"]').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Micronaut and Spring Boot: foundations to internals');
    expect((await page.locator('article h4').allTextContents()).map(title => Number(title.match(/^Q(\d+)/)?.[1])))
      .toEqual(Array.from({ length: 28 }, (_, i) => i + 293));
    await expect(page.locator('article strong').filter({ hasText: /^Tier [1-4] -/ })).toHaveCount(112);
    await expect(page.locator('article strong').filter({ hasText: /^Probe [1-3] / })).toHaveCount(84);
    await page.locator('article table').last().scrollIntoViewIfNeeded();
    await expect(page.locator('article table').last()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`micronaut-comparison-${width}.png`) });
    await page.goto('/senior-java-interview/part-22#q299-how-does-micronaut-aop-differ-from-spring-proxy-aop');
    await expect(page.locator('#q299-how-does-micronaut-aop-differ-from-spring-proxy-aop')).toBeInViewport();
    await expect(page.locator('article blockquote').filter({ hasText: 'self-invocation' })).toContainText('proxy-target');
    await page.goto('/senior-java-interview/part-22#q312-how-would-you-decide-whether-to-migrate-a-spring-boot-service-to-micronaut');
    await expect(page.locator('#q312-how-would-you-decide-whether-to-migrate-a-spring-boot-service-to-micronaut')).toBeInViewport();
    for (const number of [313, 314, 315, 316, 317, 318, 319, 320]) {
      await page.getByRole('link', { name: `Q${number}`, exact: true }).click();
      await expect(page.locator(`article h4[id^="q${number}-"]`)).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`micronaut-deep-${width}.png`) });
    const nav = page.getByRole('navigation', { name: 'Guide pages, bottom' });
    await expect(nav.getByRole('link', { name: /Production resilience/ })).toHaveAttribute('href', '/senior-java-interview/part-21');
    await nav.getByRole('link', { name: /InterviewAlgorithms\.java/ }).click();
    await expect(page.locator('pre code')).toContainText('class InterviewAlgorithms');
    const sitemap = await page.request.get('/sitemap.xml');
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain('/senior-java-interview/part-22');
  });
}
