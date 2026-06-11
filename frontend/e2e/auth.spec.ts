import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers";

// Auth tests exercise the login page itself, so they must start unauthenticated
// (override the default admin storageState from the config).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    // KRIHS branding image is present (matches both desktop + mobile logos).
    await expect(page.locator("img[alt*='KRIHS']").first()).toBeVisible();
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("이메일").fill("invalid@example.com");
    await page.getByLabel("비밀번호").fill("wrongpassword");
    await page.getByRole("button", { name: /로그인/ }).click();

    // The login route surfaces "Invalid credentials" for a failed auth.
    // Assert by visible text rather than a brittle Tailwind class.
    await expect(page.getByText("Invalid credentials")).toBeVisible();
    // Stayed on the login page.
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect to dashboard on successful login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("이메일").fill(ADMIN_EMAIL);
    await page.getByLabel("비밀번호").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /로그인/ }).click();

    // Login redirects to /dashboard.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  });

  test("should disable submit button while loading", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("이메일").fill("test@example.com");
    await page.getByLabel("비밀번호").fill("password");

    const submitButton = page.getByRole("button", { name: /로그인/ });

    await submitButton.click();
    await expect(submitButton).toBeDisabled();
  });
});
