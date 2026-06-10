import { expect, test } from "@playwright/test";
import {
  assertHealthyApp,
  gotoSeededApp,
} from "./helpers/app.js";

async function openMobileMenuItem(page, name) {
  await page.getByRole("button", { name: "More" }).click();
  const menu = page.getByLabel("Mobile workspace menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name, exact: true }).click();
  await expect(menu).toHaveCount(0);
}

test.describe("Mobile bottom navigation menu", () => {
  test("opens More menu, navigates to a workspace, and closes after selection", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSeededApp(page);

    const bottomNav = page.getByRole("navigation");
    await expect(bottomNav.getByRole("button", { name: "Home" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Topics" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "More" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Company", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "More" }).click();
    const menu = page.getByLabel("Mobile workspace menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("button", { name: "Company", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Canvas", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Info", exact: true })).toBeVisible();

    await menu.getByRole("button", { name: "Canvas", exact: true }).click();
    await expect(menu).toHaveCount(0);
    await expect(page.getByText("System Design Canvas + Studio")).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "Canvas", exact: true })).toBeVisible();

    await openMobileMenuItem(page, "Company");
    await expect(page.getByRole("heading", { name: "Company Prep" })).toBeVisible();

    await assertHealthyApp(page);
  });
});
