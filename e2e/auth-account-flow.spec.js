import { expect, test } from "@playwright/test";

const verifiedUser = { id: "user-1", email: "candidate@example.com", emailVerified: true };

async function mockCsrfAndMe(page, { user = null } = {}) {
  await page.route("**/api/auth**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("action") === "csrf") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) });
    if (url.searchParams.get("action") === "me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user }) });
    return route.continue();
  });
}

test.describe("Authentication and account lifecycle", () => {
  test("signup exposes password strength, loading state, and verification confirmation", async ({ page }) => {
    await page.route("**/api/auth**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") === "csrf") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) });
      if (url.searchParams.get("action") === "me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) });
      if (url.searchParams.get("action") === "register") return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ user: { ...verifiedUser, emailVerified: false }, emailDelivery: { delivered: true, configured: true } }) });
      return route.continue();
    });
    await page.goto("/sign-up");
    await page.getByLabel("Email").fill("candidate@example.com");
    const password = page.getByLabel("Password");
    await password.fill("LongerPassword42!");
    await expect(page.getByLabel("Password strength")).toContainText("Strong");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("button", { name: "Creating account…" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Verification email sent");
  });

  test("verification endpoint accepts a provider link", async ({ page }) => {
    await page.route("**/api/auth?action=verify**", (route) => route.fulfill({ status: 200, contentType: "text/plain", body: "Email verified. You can return to InterviewIQ and sign in." }));
    const response = await page.goto("/api/auth?action=verify&token=verification-token");
    expect(response.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Email verified");
  });

  test("forgot-password and reset-password flows complete with visible progress", async ({ page }) => {
    await page.route("**/api/auth**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") === "csrf") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) });
      if (url.searchParams.get("action") === "me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) });
      if (url.searchParams.get("action") === "forgot" || url.searchParams.get("action") === "reset") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return route.continue();
    });
    await page.goto("/reset-password");
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("reset instructions");

    await page.goto("/reset-password?token=reset-token");
    await page.getByLabel("New password").fill("NewLongPassword42!");
    await page.getByLabel("Confirm password").fill("NewLongPassword42!");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByRole("status")).toContainText("password has been reset");
  });

  test("password recovery transparently refreshes a stale CSRF token", async ({ page }) => {
    let csrfRequests = 0;
    let forgotRequests = 0;
    await page.route("**/api/auth**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") === "csrf") {
        csrfRequests += 1;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: `csrf-${csrfRequests}` }) });
      }
      if (url.searchParams.get("action") === "forgot") {
        forgotRequests += 1;
        return route.fulfill({ status: forgotRequests === 1 ? 403 : 200, contentType: "application/json", body: JSON.stringify(forgotRequests === 1 ? { error: "CSRF validation failed." } : { ok: true }) });
      }
      return route.continue();
    });
    await page.goto("/reset-password");
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("reset instructions");
    expect(csrfRequests).toBe(2);
    expect(forgotRequests).toBe(2);
  });

  test("sign-in describes invalid credentials accurately", async ({ page }) => {
    await page.route("**/api/auth**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") === "csrf") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) });
      if (url.searchParams.get("action") === "me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) });
      if (url.searchParams.get("action") === "login") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid email or password." }) });
      return route.continue();
    });
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByLabel("Password").fill("WrongPassword42!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText("Invalid email or password.");
  });

  test("sign-in reports unavailable security setup only after submission", async ({ page }) => {
    let loginRequests = 0;
    await page.route("**/api/auth**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") === "csrf") return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Unavailable" }) });
      if (url.searchParams.get("action") === "me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) });
      if (url.searchParams.get("action") === "login") { loginRequests += 1; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: verifiedUser }) }); }
      return route.continue();
    });
    await page.goto("/sign-in");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByLabel("Password").fill("LongerPassword42!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText("Security setup is unavailable. Refresh and try again.");
    expect(loginRequests).toBe(0);
  });

  test("forgot password does not show a security error before submission", async ({ page }) => {
    let forgotRequests = 0;
    await page.route("**/api/auth**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") === "csrf") return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Unavailable" }) });
      if (url.searchParams.get("action") === "forgot") { forgotRequests += 1; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }); }
      return route.continue();
    });
    await page.goto("/reset-password");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("alert")).toContainText("Security setup is unavailable. Please try again.");
    expect(forgotRequests).toBe(0);
  });

  test("authenticated users can export and delete their account", async ({ page }) => {
    await mockCsrfAndMe(page, { user: verifiedUser });
    const accountRequests = [];
    await page.route("**/api/account**", async (route) => {
      accountRequests.push({ method: route.request().method(), url: route.request().url() });
      if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ exportVersion: 1, user: verifiedUser, state: {}, audits: [] }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, deletionVerified: true }) });
    });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
    await page.getByRole("button", { name: "Account" }).click();
    await expect(page.getByRole("heading", { name: "Account sync" })).toBeVisible();
    await page.getByRole("button", { name: "Export data" }).click();
    await expect.poll(() => accountRequests.some((request) => request.method === "GET")).toBe(true);
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete account" }).click();
    await expect.poll(() => accountRequests.some((request) => request.method === "DELETE")).toBe(true);
  });
});
