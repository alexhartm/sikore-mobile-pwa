import { defineConfig, devices } from "@playwright/test";

const runsLiveContract = process.env.SIKORE_LIVE_TEST === "1";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: `${runsLiveContract ? "" : "VITE_SIKORE_SCRIPT_URL=./fake-sikore.js "}npm run build && npm run preview -- --host 127.0.0.1`,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], serviceWorkers: "block" },
      testIgnore: /(live-sikore|offline)\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["iPhone 13"], serviceWorkers: "block" },
      testIgnore: /(live-sikore|offline)\.spec\.ts/,
    },
    {
      name: "pwa",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /offline\.spec\.ts/,
    },
    {
      name: "live-sikore",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /live-sikore\.spec\.ts/,
    },
  ],
});
