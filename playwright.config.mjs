import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT || 3001;
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;
const browserMatrix = process.env.E2E_BROWSER_MATRIX === "1";

const chromiumProject = {
  name: "chromium",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: { width: 1366, height: 768 },
  },
};

const matrixProjects = [
  chromiumProject,
  {
    name: "firefox",
    use: {
      ...devices["Desktop Firefox"],
      baseURL,
      viewport: { width: 1366, height: 768 },
    },
  },
  {
    name: "webkit",
    use: {
      ...devices["Desktop Safari"],
      baseURL,
      viewport: { width: 1366, height: 768 },
    },
  },
  {
    name: "chrome",
    use: {
      ...devices["Desktop Chrome"],
      channel: "chrome",
      baseURL,
      viewport: { width: 1366, height: 768 },
    },
  },
  {
    name: "edge",
    use: {
      ...devices["Desktop Edge"],
      channel: "msedge",
      baseURL,
      viewport: { width: 1366, height: 768 },
    },
  },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: browserMatrix ? matrixProjects : [chromiumProject],
});
