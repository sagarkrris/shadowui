import { expect, test } from "@playwright/test";
import { gotoSeededApp, mockChat } from "./helpers/app.js";
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
  // The development-only Next.js badge covers the mobile Home button.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await expectStableTop(scroller);
  await scroller.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  await page.getByRole("navigation").getByRole("button", { name: "Home", exact: true }).click();
  await openJava();
  await expectStableTop(scroller);
});

for (const width of [375, 1440]) {
  test(`long chat answers open at their beginning above review panels at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await mockChat(page, `Answer opening.\n\n${"A detailed explanation of the contract and its failure cases.\n\n".repeat(100)}`);
    await gotoSeededApp(page, { messages, skipReadyCheck: true });
    await expect(page.getByLabel("Conversation messages")).toHaveAttribute("aria-busy", "false");
    await page.getByLabel("Message composer").fill("Explain this contract.");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const scroller = page.getByLabel("Conversation messages");
    await expect(scroller).toHaveAttribute("aria-busy", "false");
    const answer = page.getByRole("article", { name: "InterviewIQ response", exact: true }).last();
    await expect(answer).toContainText("Answer opening.");
    await expect.poll(() => answer.evaluate(element => {
      const scroller = element.closest(".chat-scroll");
      return Math.abs(element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - parseFloat(getComputedStyle(scroller).paddingTop));
    })).toBeLessThan(2);
    await page.screenshot({ path: test.info().outputPath("answer-opening.png") });
  });
}

test("stream chunks and completion preserve the reader's chosen position", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    window.fetch = (input, options) => {
      if (input !== "/api/chat") return originalFetch(input, options);
      const encoder = new TextEncoder();
      return Promise.resolve(new Response(new ReadableStream({ start(controller) {
        window.appendChatText = text => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        window.finishChatText = () => { controller.enqueue(encoder.encode("data: [DONE]\n\n")); controller.close(); };
      } }), { headers: { "content-type": "text/event-stream" } }));
    };
  });
  await gotoSeededApp(page, { messages, skipReadyCheck: true });
  const scroller = page.getByLabel("Conversation messages");
  await expect(scroller).toHaveAttribute("aria-busy", "false");
  await page.getByLabel("Message composer").fill("Explain the mechanism.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => page.evaluate(() => typeof window.appendChatText)).toBe("function");
  await page.evaluate(() => window.appendChatText(`Opening of the answer.\n\n${"Mechanism and applied example.\n\n".repeat(100)}`));
  const answer = page.getByRole("article", { name: "InterviewIQ response", exact: true }).last();
  await expect(answer).toContainText("Opening of the answer.");
  await expect.poll(() => answer.evaluate(element => Math.abs(element.getBoundingClientRect().top - element.closest(".chat-scroll").getBoundingClientRect().top - 20))).toBeLessThan(2);
  // Read further into the answer, then receive another chunk.
  const position = await scroller.evaluate(element => { element.scrollTop += 180; return element.scrollTop; });
  await page.evaluate(() => window.appendChatText("Later chunk.\n\n".repeat(100)));
  await expect(answer).toContainText("Later chunk.");
  expect(await scroller.evaluate(element => element.scrollTop)).toBeCloseTo(position, 0);
  // Reading an older turn must also survive completion and the review controls returning.
  await scroller.evaluate(element => { element.scrollTop = 0; });
  await page.evaluate(() => { window.appendChatText("Final chunk."); window.finishChatText(); });
  await expect(scroller).toHaveAttribute("aria-busy", "false");
  await expect(answer).toContainText("Final chunk.");
  await expectStableTop(scroller);
});
