import { chromium, expect, type FullConfig } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, STORAGE_STATE } from "./helpers";

/**
 * Global setup: log in once as admin through the real login UI (which hits the
 * Next.js /api/auth/login route -> Django /api/token/) and persist the
 * resulting cookies to STORAGE_STATE so every authenticated test reuses the
 * session instead of logging in repeatedly.
 */
async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL || "http://localhost:3000";

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByLabel("이메일").fill(ADMIN_EMAIL);
  await page.getByLabel("비밀번호").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /로그인/ }).click();

  // Successful login redirects to /dashboard.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}

export default globalSetup;
