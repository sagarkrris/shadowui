import { expect, test } from "@playwright/test";

test("the senior Java guide links through all new question parts", async ({ page }) => {
  await page.goto("/senior-java-interview");
  for (const part of [12, 13, 14, 15, 16]) {
    await expect(page.locator(`a[href="/senior-java-interview/part-${part}"]`).first()).toBeVisible();
  }

  await page.locator('a[href="/senior-java-interview/part-12"]').first().click();
  await expect(page.locator("article h4").first()).toContainText("Q154");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Spring Boot, coding style, and leadership/ }).click();
  await expect(page.locator("article h4").first()).toContainText("Q174");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /System design, JVM, and coding/ }).click();
  await expect(page.locator("article h4").last()).toContainText("Q213");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Full system design and DP\/graph problems/ }).click();
  await expect(page.locator("article h4").first()).toContainText("Q214");
  await expect(page.locator("article h4").last()).toContainText("Q222");
  await page.getByRole("navigation", { name: "Guide pages, bottom" }).getByRole("link", { name: /Hibernate and SQL/ }).click();
  await expect(page.locator("article h4").first()).toContainText("Q223");
  await expect(page.locator("article h4").last()).toContainText("Q244");
  await expect(page.getByRole("link", { name: /InterviewAlgorithms\.java/ }).last()).toHaveAttribute("href", "/senior-java-interview/interview-algorithms");
});
