import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
  mockChat,
} from "./helpers/app.js";

async function expectNoMobileHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector("main");
    const chat = document.querySelector(".chat-scroll");
    const viewportRight = window.innerWidth;
    const visibleOffenders = [...document.querySelectorAll("main *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          tag: element.tagName,
          text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
          aria: element.getAttribute("aria-label") || "",
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          display: style.display,
          visibility: style.visibility,
        };
      })
      .filter((item) => (
        item.display !== "none"
        && item.visibility !== "hidden"
        && item.width > 1
        && item.height > 1
        && item.right > viewportRight + 1
      ));

    return {
      mainOverflow: main ? main.scrollWidth - main.clientWidth : 0,
      chatOverflow: chat ? chat.scrollWidth - chat.clientWidth : 0,
      visibleOffenders,
    };
  });

  expect(overflow, `${label} should not hide content off the right edge on mobile`).toEqual({
    mainOverflow: 0,
    chatOverflow: 0,
    visibleOffenders: [],
  });
}

async function openMobileMenuItem(page, name) {
  await page.getByRole("button", { name: "More" }).click();
  const menu = page.getByLabel("Mobile workspace menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name, exact: true }).click();
  await expect(menu).toHaveCount(0);
}

async function openWorkspaceItem(page, name, viewportWidth) {
  if (viewportWidth >= 1440) {
    await page.getByRole("button", { name }).click();
    return;
  }

  await page.getByRole("button", { name: "Workspace menu" }).click();
  const menu = page.getByLabel("Tablet workspace menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name, exact: true }).click();
  await expect(menu).toHaveCount(0);
}

async function expectNoDesktopHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector("main");
    const viewportRight = window.innerWidth;
    const visibleOffenders = [...document.querySelectorAll("main *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
          right: rect.right,
          display: style.display,
          visibility: style.visibility,
        };
      })
      .filter((item) => item.display !== "none" && item.visibility !== "hidden" && item.right > viewportRight + 1);

    return {
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      mainOverflow: main ? main.scrollWidth - main.clientWidth : 0,
      visibleOffenders,
    };
  });

  expect(overflow, `${label} should not clip visible content`).toEqual({
    documentOverflow: 0,
    mainOverflow: 0,
    visibleOffenders: [],
  });
}

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop-small", width: 1024, height: 768 },
  { name: "laptop-large", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("Non-functional UI/UX, responsiveness, and state management", () => {
  for (const viewport of viewports) {
    test(`renders usable core layout on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoSeededApp(page);

      await expect(page.getByLabel("Message composer")).toBeVisible();
      await page.getByLabel("Message composer").fill(`Responsive check on ${viewport.name}`);
      await expect(page.getByLabel("Message composer")).toHaveValue(`Responsive check on ${viewport.name}`);

      if (viewport.name === "mobile") {
        await expect(page.getByRole("navigation")).toBeVisible();
        await openMobileMenuItem(page, "Company");
        await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
      } else {
        await openWorkspaceItem(page, "Company Prep", viewport.width);
        await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
      }

      await assertHealthyApp(page);
    });
  }

  test("keeps System Canvas and Design Lab fully visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoSeededApp(page, {
      messages: [
        { role: "user", content: "Previous mobile test answer" },
        { role: "assistant", content: "Score: 7/10\nKeep practicing." },
      ],
    });

    await openMobileMenuItem(page, "Canvas");
    await expect(page.getByText("System Design Canvas + Studio")).toBeVisible();
    await expectNoMobileHorizontalOverflow(page, "System Canvas");

    await openMobileMenuItem(page, "Design Lab");
    await expect(page.getByRole("heading", { name: "Patterns, HLD, LLD, and interview practice" })).toBeVisible();
    await expectNoMobileHorizontalOverflow(page, "Design Lab");

    await openMobileMenuItem(page, "Scenario Bank");
    await expect(page.getByText("Scenario Bank")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Java and database real-time interview scenarios" })).toBeVisible();
    await expectNoMobileHorizontalOverflow(page, "Scenario Bank");
  });

  test("keeps all header controls reachable across supported desktop widths", async ({ page }) => {
    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoSeededApp(page);

      await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Topics" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Account" })).toBeVisible();

      if (viewport.width < 1440) {
        await expect(page.getByRole("button", { name: "Workspace menu" })).toBeVisible();
        await page.getByRole("button", { name: "Workspace menu" }).click();
        await expect(page.getByLabel("Tablet workspace menu")).toBeVisible();
        await expect(page.getByLabel("Tablet workspace menu").getByRole("button", { name: "Company Prep", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Close workspace menu" }).click();
      } else {
        await expect(page.getByRole("button", { name: "Company Prep" })).toBeVisible();
      }

      await expectNoDesktopHorizontalOverflow(page, `${viewport.width}px header`);
    }
  });

  test("keeps navigation stable across Course, Company Prep, Settings, and chat", async ({ page }) => {
    await mockChat(page, "Score: 7/10\nStrengths: Concise.\nGaps: Add trade-offs.");
    await gotoSeededApp(page);

    for (let index = 0; index < 3; index += 1) {
      await page.getByRole("button", { name: "Agentic UI Course" }).click();
      await expect(page.getByRole("heading", { name: "Stack Implementation Tracks" })).toBeVisible();
      await page.getByRole("button", { name: "Company Prep" }).click();
      await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();
      await page.getByRole("button", { name: "Info" }).click();
      await expect(page.getByText("Mock Interviews")).toBeVisible();
      await page.getByRole("button", { name: "x" }).click();
      await page.getByRole("button", { name: "Home" }).click();
      await expect(page.getByLabel("Message composer")).toBeVisible();
    }

    const usedHeap = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
    expect(usedHeap).toBeLessThan(250 * 1024 * 1024);
    await assertHealthyApp(page);
  });
});
