import { expect, test } from "@playwright/test";
import { gotoSeededApp } from "./helpers/app.js";
import { WORKSPACE_TABS } from "../lib/workspaces.mjs";

const messages = Array.from({ length: 20 }, (_, index) => ({ role: "assistant", content: `Saved message ${index + 1}. Explain the runtime contract, ownership, and recovery behavior.` }));

async function expectStableTop(scroller) {
  // Observe the entire smooth-scroll interval, not just its first frame.
  const maximum = await scroller.evaluate(element => new Promise(resolve => {
    let max = element.scrollTop;
    const start = performance.now();
    const sample = () => {
      max = Math.max(max, element.scrollTop);
      if (performance.now() - start < 900) requestAnimationFrame(sample);
      else resolve(max);
    };
    requestAnimationFrame(sample);
  }));
  expect(maximum).toBeLessThanOrEqual(1);
}

for (const width of [375, 1440]) {
  for (const workspace of WORKSPACE_TABS) {
    test(`${workspace.label} opens at the top with saved chat at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await gotoSeededApp(page, { activeTab: workspace.id, messages, skipReadyCheck: true });
      const scroller = page.getByLabel("Conversation messages");
      await expect(scroller).toHaveAttribute("aria-busy", "false");
      await expectStableTop(scroller);
    });
  }
}

test("reopening a workspace resets it while active chat still follows messages", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoSeededApp(page, { activeTab: "chat", messages, skipReadyCheck: true });
  const scroller = page.getByLabel("Conversation messages");
  await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  async function openJava() {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("region", { name: "Mobile workspace menu" }).getByRole("button", { name: /Java$/ }).click();
    await expect(page.getByRole("button", { name: "Tech Blogs", exact: true })).toBeVisible();
  }
  await openJava();
  await expectStableTop(scroller);
  await scroller.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  await page.getByRole("navigation").getByRole("button", { name: "Home", exact: true }).click();
  await openJava();
  await expectStableTop(scroller);
});
