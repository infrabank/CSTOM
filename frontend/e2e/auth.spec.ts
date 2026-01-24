import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    // Check page elements
    await expect(page.getByRole("heading", { level: 1 }).or(page.locator("img[alt*='KRIHS']"))).toBeVisible();
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.getByLabel("이메일").fill("invalid@example.com");
    await page.getByLabel("비밀번호").fill("wrongpassword");
    await page.getByRole("button", { name: /로그인/ }).click();

    // Should show error message
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10000 });
  });

  test("should redirect to contracts on successful login", async ({ page }) => {
    await page.goto("/login");

    // Fill in valid credentials (assuming test user exists)
    await page.getByLabel("이메일").fill("admin@example.com");
    await page.getByLabel("비밀번호").fill("adminpass123");
    await page.getByRole("button", { name: /로그인/ }).click();

    // Should redirect to contracts page
    await expect(page).toHaveURL(/\/contracts/, { timeout: 10000 });
  });

  test("should disable submit button while loading", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("이메일").fill("test@example.com");
    await page.getByLabel("비밀번호").fill("password");

    const submitButton = page.getByRole("button", { name: /로그인/ });

    // Click and immediately check if button is disabled
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
  });
});
