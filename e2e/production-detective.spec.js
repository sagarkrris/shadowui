import { test, expect } from "@playwright/test";
import { DETECTIVE_CASES, DETECTIVE_STORAGE_PREFIX } from "../lib/productionDetective.mjs";

test.use({ serviceWorkers: "block" });
for (const incident of DETECTIVE_CASES) {
  test(`${incident.topic}: investigate, recover progress, repair and experiment`, async ({ page }) => {
    let aiCalls = 0;
    await page.route("**/api/chat", route => { aiCalls++; return route.abort(); });
    await page.goto(`/detective/${incident.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: incident.title })).toBeVisible();
    const diagnosis = page.getByRole("radio", { name: incident.diagnoses.find(d => d.id === incident.diagnosis).label, exact: true });
    await expect(diagnosis).toBeDisabled();
    await page.getByRole("button", { name: `01 / ${incident.evidence[0].title}` }).click();
    await page.getByRole("button", { name: `02 / ${incident.evidence[1].title}` }).click();
    await page.reload();
    await expect(page.getByText("2 of 3 clues inspected", { exact: true })).toBeVisible();
    const wrong = incident.diagnoses.find(d => d.id !== incident.diagnosis);
    await page.getByRole("radio", { name: wrong.label, exact: true }).check();
    await expect(page.getByText(wrong.feedback, { exact: true })).toBeVisible();
    await diagnosis.check();
    const wrongFix = incident.fixes.find(f => f.id !== incident.fix);
    await page.getByRole("radio", { name: wrongFix.label, exact: true }).check();
    await expect(page.getByText(wrongFix.feedback, { exact: true })).toBeVisible();
    await page.getByRole("radio", { name: incident.fixes.find(f => f.id === incident.fix).label, exact: true }).check();
    await page.getByRole("button", { name: "Complete investigation" }).click();
    await expect(page.getByRole("heading", { name: "Investigation complete." })).toBeFocused();
    await expect(page.getByRole("heading", { name: "What actually happened" })).toBeVisible();
    if (incident.lab.kind === "map") { await page.getByRole("button", { name: "Run the trace" }).click(); await expect(page.getByText("null\n1", { exact: true })).toBeVisible(); }
    if (incident.lab.kind === "transaction") { await page.getByRole("checkbox", { name: "Call an injected transactional collaborator" }).check(); await expect(page.getByText(/Both balances unchanged/)).toBeVisible(); }
    if (incident.lab.kind === "retry") { await page.getByRole("slider", { name: /Total attempts/ }).fill("1"); await expect(page.getByText("1 leaf attempts per user request")).toBeVisible(); }
    if (incident.lab.kind === "index") { await page.getByRole("slider").fill("0"); await expect(page.getByText("200 work units")).toBeVisible(); }
    if (incident.lab.kind === "cache") { await page.getByRole("checkbox", { name: "Include the trusted tenant in the cache key" }).check(); await expect(page.getByText("Isolation preserved for these two requests.")).toBeVisible(); }
    await page.reload();
    await expect(page.getByRole("heading", { name: "Investigation complete." })).toBeVisible();
    expect(aiCalls).toBe(0);
    const completions = await page.evaluate(() => JSON.parse(localStorage.getItem("interviewiq.productEvents.v1") || "[]").filter(e => e.name === "detective_completed"));
    expect(completions).toHaveLength(1);
    await page.getByRole("link", { name: "All case files" }).click();
    await expect(page.getByRole("link").filter({ has: page.getByRole("heading", { name: incident.title }) })).toContainText("Completed · revisit");
  });
}

test("share opens the actual unspoiled case and records referral; clipboard fallback is truthful", async ({ page, context }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } }));
  await page.goto(`/detective/${DETECTIVE_CASES[0].slug}`);
  await page.getByRole("button", { name: "Copy challenge link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Challenge link copied" })).toBeVisible();
  const url = await page.getByRole("textbox", { name: "Spoiler-free challenge URL" }).inputValue();
  expect(new URL(url).search).toBe("?via=share");
  const referred = await context.newPage();
  await referred.goto(url);
  await expect(referred.getByRole("heading", { name: "What actually happened" })).toBeHidden();
  await expect(referred.getByRole("radio").first()).toBeDisabled();
  await expect.poll(() => referred.evaluate(() => JSON.parse(localStorage.getItem("interviewiq.productEvents.v1") || "[]").filter(e => e.name === "detective_share_visit").length)).toBe(1);
  await referred.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } }));
  await referred.getByRole("button", { name: "Copy challenge link" }).click();
  await expect(referred.getByText("Copy was unavailable. Select and copy the challenge link below.")).toBeVisible();
});

test("damaged or unavailable storage does not block learning", async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, '{"completed":true,"inspected":["fake"]}');
    const native = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (name === key) throw new Error("quota"); return native.call(this, name, value); };
  }, { key: DETECTIVE_STORAGE_PREFIX + DETECTIVE_CASES[0].slug });
  await page.goto(`/detective/${DETECTIVE_CASES[0].slug}`);
  await expect(page.getByRole("heading", { name: "Investigation complete." })).toHaveCount(0);
  await page.getByRole("button", { name: /01 \/ Worker log/ }).click();
  await expect(page.getByText(/Progress could not be saved/)).toBeVisible();
  await page.getByText("Read the explanation & experiment (spoilers)", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "What actually happened" })).toBeVisible();
});

test("public discovery, static explanation, canonical URL, sitemap and feed", async ({ page, browser, baseURL, request }) => {
  await page.goto("/detective");
  await expect(page.getByRole("heading", { name: "Pick an investigation" })).toBeVisible();
  expect(await page.locator('a[href^="/detective/"]').count()).toBe(6);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${baseURL}/detective/${DETECTIVE_CASES[0].slug}`);
  await staticPage.locator("summary").click();
  await expect(staticPage.getByRole("heading", { name: "What actually happened" })).toBeVisible();
  await expect(staticPage.locator('meta[name="description"]')).toHaveCount(1);
  await expect(staticPage.locator('meta[name="description"]')).toHaveAttribute("content", DETECTIVE_CASES[0].description);
  await expect(staticPage.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/detective\/the-vanishing-map-entry$/);
  await noJs.close();
  expect((await request.get("/detective/not-a-case")).status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const feed = await (await request.get("/rss.xml")).text();
  for (const incident of DETECTIVE_CASES) { expect(sitemap).toContain(`/detective/${incident.slug}`); expect(feed).toContain(`/detective/${incident.slug}`); }
});

test("mobile keyboard access and accessible evidence / completion views", async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/detective");
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  expect(await page.evaluate(async () => (await window.axe.run("main", { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations)).toEqual([]);
  await page.screenshot({ path: "/private/tmp/production-detective-index.png", fullPage: true });
  await page.goto(`/detective/${DETECTIVE_CASES[4].slug}`);
  await expect(page.getByRole("button", { name: /01 \/ Two request traces/ })).toBeEnabled();
  // macOS WebKit uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("link", { name: "Skip to case content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#detective-main")).toBeFocused();
  await page.getByRole("button", { name: /01 \/ Two request traces/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /01 \/ Two request traces/ })).toHaveAttribute("aria-pressed", "true");
  // Keep this keyboard test on keyboard input while the evidence panel reflows.
  await page.getByRole("button", { name: /02 \/ Cache lookup/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /02 \/ Cache lookup/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radio", { name: DETECTIVE_CASES[4].diagnoses[2].label }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: DETECTIVE_CASES[4].diagnoses[2].label })).toBeChecked();
  await page.getByRole("radio", { name: DETECTIVE_CASES[4].fixes[1].label }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: DETECTIVE_CASES[4].fixes[1].label })).toBeChecked();
  await page.getByRole("button", { name: "Complete investigation" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Investigation complete." })).toBeVisible();
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  expect(await page.evaluate(async () => (await window.axe.run("main", { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/private/tmp/production-detective-case.png", fullPage: true });
});

test("later-day return is measured once and reload does not inflate it", async ({ page }) => {
  const slug = DETECTIVE_CASES[1].slug;
  await page.addInitScript(slug => {
    const key = `interviewiq.detective.visit.${slug}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, "2020-01-01");
  }, slug);
  await page.goto(`/detective/${slug}`);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("interviewiq.productEvents.v1") || "[]").filter(e => e.name === "detective_returned").length)).toBe(1);
  await page.reload();
  await expect(page.getByRole("button", { name: /01 \/ Request trace/ })).toBeEnabled();
  const events = await page.evaluate(() => JSON.parse(localStorage.getItem("interviewiq.productEvents.v1") || "[]"));
  expect(events.filter(e => e.name === "detective_returned")).toHaveLength(1);
  expect(events.filter(e => e.name === "detective_viewed")).toHaveLength(1);
});

test("mobile pointer completes a case with notebook controls present", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/detective/${DETECTIVE_CASES[4].slug}`);
  await page.getByRole("button", { name: /01 \/ Two request traces/ }).click();
  await expect(page.getByRole("button", { name: /01 \/ Two request traces/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /02 \/ Cache lookup/ }).click();
  await page.getByRole("radio", { name: DETECTIVE_CASES[4].diagnoses[2].label }).check();
  await page.getByRole("radio", { name: DETECTIVE_CASES[4].fixes[1].label }).check();
  await page.getByRole("button", { name: "Complete investigation" }).click();
  await expect(page.getByRole("heading", { name: "Investigation complete." })).toBeVisible();
});
