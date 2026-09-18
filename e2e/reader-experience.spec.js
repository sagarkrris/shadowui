import { test, expect } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";
import { EDITORIAL_REQUESTS } from "../lib/readerCommunity.mjs";
test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/reader-community", route => route.fulfill({ json: { available: false, items: EDITORIAL_REQUESTS, error: "The shared board is not configured yet." } }));
  await page.route("**/api/digest-subscription", route => route.fulfill({ json: { available: false } }));
});
test("public homepage lets a new reader discover articles and paths without onboarding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Understand Java and backend failures through working examples.");
  await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: "/private/tmp/reader-home-desktop.png", fullPage: true });
  await page.getByRole("searchbox", { name: "Search articles" }).fill("slow sql");
  await expect(page.getByRole("status")).toHaveText("1 articles");
  await page.getByRole("link", { name: "How to Investigate a Slow SQL Query", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How to Investigate a Slow SQL Query");
  await expect(page.getByText("Runtime verification not yet recorded for this article.", { exact: false })).toBeVisible();
  await page.goto("/series/debug-spring-applications");
  await expect(page.getByText(/Java methods, exceptions/)).toBeVisible();
  await expect(page.getByRole("link", { name: "The rollback that never happened" })).toBeVisible();
});
test("article search, code copy, bookmarks and section links work across reloads", async ({ page }) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async text => { window.__copied = text; } } }));
  await page.goto("/java/hashmap-internals");
  await page.getByRole("button", { name: "Bookmark Say this first", exact: true }).click();
  await expect(page.getByText("Section bookmarked in this browser.", { exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search within this article" }).fill("HashMap");
  await expect(page.getByRole("status").filter({ hasText: "matching sections" })).not.toHaveText("0 matching sections");
  await page.getByRole("searchbox", { name: "Search within this article" }).fill("");
  await page.getByRole("button", { name: "Copy code example 1", exact: true }).click();
  expect(await page.evaluate(() => window.__copied)).toContain("Map");
  await page.getByRole("button", { name: "Share Say this first", exact: true }).click();
  const url = await page.evaluate(() => window.__copied);
  expect(url).toContain("#read-say-this-first");
  await page.goto(url);
  await expect(page.getByRole("button", { name: "Bookmark Say this first", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Say this first", exact: true })).toBeInViewport();
  expect(errors).toEqual([]);
});
test("reading homepage can resume the existing saved practice draft", async ({ page }) => {
  await gotoSeededApp(page);
  await page.getByLabel("Message composer").fill("Unfinished explanation about transaction boundaries");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("interviewprep.session.v1"))).toContain("Unfinished explanation");
  await page.goto("/");
  await page.getByRole("link", { name: "Resume unfinished practice" }).click();
  await expect(page.getByLabel("Message composer")).toHaveValue("Unfinished explanation about transaction boundaries");
  await page.goto("/?workspace=java-digest");
  await expect(page).toHaveURL(/\/practice\?workspace=java-digest/);
  await expect(page.getByLabel("Conversation messages")).toContainText("Java");
});
test("public correction log acknowledges the actual scroll defect", async ({ page }) => {
  await page.goto("/corrections?article=/java/hashmap-internals");
  await expect(page.getByRole("heading", { name: "Production Detective did not respond to normal scrolling" })).toBeVisible();
  await expect(page.getByLabel("Affected page path")).toHaveValue("/java/hashmap-internals");
  await expect(page.getByRole("button", { name: "Submit for review" })).toBeDisabled();
});
test("shared request voting and moderated submissions show honest acknowledgements", async ({ page }) => {
  let items = structuredClone(EDITORIAL_REQUESTS); let submission;
  await page.route("**/api/reader-community", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: true, items } });
    const body = route.request().postDataJSON();
    if (body.action === "vote") { items = items.map(item => item.id === body.id ? { ...item, votes: 1, voted: true } : item); return route.fulfill({ json: { available: true, items } }); }
    submission = body; return route.fulfill({ status: 202, json: { receipt: "test-receipt", message: "Received for editorial review. This submission is not public yet." } });
  });
  await page.goto("/requests");
  await page.getByRole("button", { name: "Vote for this topic" }).first().click();
  await expect(page.getByRole("button", { name: "Voted ✓" })).toBeDisabled();
  await page.getByLabel("Short title").fill("Explain connection pool exhaustion");
  await page.getByLabel(/What is confusing/).fill("How do I distinguish a leaked connection from a slow database query?");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/Reference: test-receipt/)).toBeVisible();
  expect(submission.kind).toBe("request");
  await expect(page.getByRole("heading", { name: "Explain connection pool exhaustion" })).toHaveCount(0);
});
test("digest requires an unchecked explicit consent and only promises confirmation", async ({ page }) => {
  let signup;
  await page.route("**/api/digest-subscription", route => { if (route.request().method() === "GET") return route.fulfill({ json: { available: true } }); signup = route.request().postDataJSON(); return route.fulfill({ status: 202, json: { message: "Check your email to confirm. You are not subscribed until you confirm." } }); });
  await page.goto("/digest");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByLabel("Email address").fill("reader@example.test");
  await expect(page.getByRole("button", { name: "Send confirmation email" })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send confirmation email" }).click();
  expect(signup).toEqual({ email: "reader@example.test", consent: true });
  await expect(page.getByRole("status")).toContainText("not subscribed until");
});
for (const width of [390, 768, 1440]) {
  test(`public reading scrolls at ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/java/hashmap-internals", "/tech-blogs/design-patterns-in-18-minutes"]) {
      await page.goto(route);
      if (route !== "/") await expect(page.getByRole("searchbox", { name: "Search within this article" })).toBeVisible();
      const scroll = page.locator(route === "/" ? "[data-reader-scroll]" : ".reader-article-scroll");
      await page.mouse.move(width / 2, 500); await page.mouse.wheel(0, 600);
      await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(20);
      expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    }
  });
}

test("reader homepage and article controls pass automated accessibility checks", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/java/hashmap-internals"]) {
    await page.goto(route);
    if (route !== "/") await expect(page.getByRole("searchbox", { name: "Search within this article" })).toBeVisible();
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    expect(await page.evaluate(async () => (await window.axe.run("main", { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations)).toEqual([]);
  }
});

test("article-to-article navigation keeps tools attached to the current content", async ({ page }) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/java/hashmap-internals");
  await expect(page.getByRole("searchbox", { name: "Search within this article" })).toBeVisible();
  await page.getByRole("link", { name: "HashMap vs ConcurrentHashMap: Differences and Use Cases", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("HashMap vs ConcurrentHashMap: Differences and Use Cases");
  await expect(page.getByRole("searchbox", { name: "Search within this article" })).toHaveCount(1);
  await page.getByRole("button", { name: "Bookmark Say this first", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("interviewiq.readerBookmarks.v1"))[0].href)).toContain("/java/hashmap-vs-concurrenthashmap#");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How HashMap Works Internally in Java");
  await expect(page.getByRole("searchbox", { name: "Search within this article" })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("successful sign-in returns to the separate practice route", async ({ page }) => {
  let signedIn = false;
  const user = { id: "reader-test", email: "reader@example.test", emailVerified: true };
  await page.route("**/api/auth**", route => {
    const action = new URL(route.request().url()).searchParams.get("action");
    if (action === "login") { signedIn = true; return route.fulfill({ json: { user, csrfToken: "test-csrf" } }); }
    if (action === "me") return route.fulfill({ json: { user: signedIn ? user : null } });
    return route.fulfill({ json: { csrfToken: "test-csrf" } });
  });
  await page.route("**/api/state", route => route.fulfill({ json: { state: null } }));
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("reader@example.test");
  await page.getByLabel("Password", { exact: true }).fill("ExamplePassword42!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.locator(".header-account-actions").getByRole("button", { name: /Account/ })).toBeVisible();
});
