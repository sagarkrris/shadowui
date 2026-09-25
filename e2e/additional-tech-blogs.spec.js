import { test, expect } from "@playwright/test";

const courses = [
  ["API Gateways: Routing, Trust, Traffic, and Recovery", "/tech-blogs/api-gateway-production-patterns", "Capstone: Protect a ticket-sale launch"],
  ["Load Balancing Algorithms: Traffic, Affinity, and Failure", "/tech-blogs/load-balancing-algorithms", "Capstone: Balance a mixed API fleet safely"],
  ["Real-Time Communication: Polling, SSE, WebSockets, and Webhooks", "/tech-blogs/real-time-communication-patterns", "Capstone: Keep a parcel tracker correct through disconnects"],
  ["Distributed Transactions and Data Consistency: Recovering Safely", "/tech-blogs/distributed-transactions-data-consistency", "Capstone: Recover a partially completed order"],
  ["Caching Patterns in Java: Speed Without Losing Correctness", "/tech-blogs/caching-patterns-java", "Capstone: Stabilize a hot catalog"],
  ["Spring Boot Security: Identity, Authorization, and Safe Defaults", "/tech-blogs/spring-boot-security", "Capstone: Secure a multi-tenant order API"],
  ["Resilience Engineering: Containing Failure Before It Spreads", "/tech-blogs/resilience-engineering", "Capstone: Stop a dependency outage from cascading"],
  ["Microservices Migration Patterns: From Monolith to Safe Change", "/tech-blogs/microservices-migration-patterns", "Capstone: Extract order history safely"],
  ["Java API Evolution: Ship Compatible Contracts with Confidence", "/tech-blogs/java-api-evolution-contracts", "Capstone: Evolve an order-status API safely"],
  ["Spring Boot Configuration: Safe Defaults, Secrets, and Rollouts", "/tech-blogs/spring-boot-configuration", "Capstone: Roll out a new payment-provider configuration safely"],
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

test("low-level design course does not expose an external source attribution", async ({ page }) => {
  await page.goto("/tech-blogs/learn-low-level-design-from-zero");
  await expect(page.getByText("Source:", { exact: true })).toHaveCount(0);
});
