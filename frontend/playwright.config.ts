import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Playwright E2E test configuration for CSTOM frontend.
 *
 * Strategy: real local Django backend (port 8000) + Next.js dev server
 * (port 3000) + a single real admin login captured once in global-setup and
 * reused via storageState. Server-rendered list pages fetch from Django during
 * SSR, so page.route() cannot mock them — we run the real backend instead.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const STORAGE_STATE = path.join(__dirname, "e2e", ".auth", "admin.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Generous timeouts tolerate Next.js dev-server cold compilation of routes.
  timeout: 60 * 1000,
  expect: { timeout: 15 * 1000 },
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Default to the authenticated admin session. Auth tests opt out.
    storageState: STORAGE_STATE,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // Real Django backend (sqlite, migrations applied, admin seeded).
      command:
        "python manage.py runserver 8000",
      cwd: path.join(__dirname, "..", "backend"),
      // Django admin login returns 200 on GET — a reliable readiness signal.
      url: "http://localhost:8000/admin/login/",
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
    },
  ],
});
