import { test, expect } from "@playwright/test";

const courses = [
  ["Distributed Transactions and Data Consistency: Recovering Safely", "/tech-blogs/distributed-transactions-data-consistency", "Capstone: Recover a partially completed order"],
  ["Caching Patterns in Java: Speed Without Losing Correctness", "/tech-blogs/caching-patterns-java", "Capstone: Stabilize a hot catalog"],
  ["Spring Boot Security: Identity, Authorization, and Safe Defaults", "/tech-blogs/spring-boot-security", "Capstone: Secure a multi-tenant order API"],
  ["Resilience Engineering: Containing Failure Before It Spreads", "/tech-blogs/resilience-engineering", "Capstone: Stop a dependency outage from cascading"],
  ["Microservices Migration Patterns: From Monolith to Safe Change", "/tech-blogs/microservices-migration-patterns", "Capstone: Extract order history safely"],
];

for (const [title, path, capstone] of courses) {
  test(`public course renders ${title}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: capstone, exact: true })).toBeVisible();
    await expect(page.getByText("When to avoid:", { exact: true })).toHaveCount(6);
    const diagram = page.locator("article > div[aria-label$='diagram']").first();
    await expect(diagram).toHaveCSS("white-space", "pre-wrap");
    await expect(diagram).toContainText("→");
    if (path.endsWith("/spring-boot-security")) {
      await expect(page.locator("pre").filter({ hasText: "class OrdersSecurity" })).toContainText("JwtDecoder");
      await expect(page.locator("pre").filter({ hasText: "class OrdersSecurity" })).toContainText("SCOPE_orders.read");
    }
  });
}
