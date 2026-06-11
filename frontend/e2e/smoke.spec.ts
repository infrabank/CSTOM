import { test, expect } from "@playwright/test";
import { ERROR_BOUNDARY_TEXT, SMOKE_ROUTES } from "./helpers";

/**
 * Smoke tests for every authenticated admin list page.
 *
 * Each test navigates to a route and asserts:
 *  - the page heading is visible (page rendered, not redirected to /login)
 *  - the error boundary ("오류가 발생했습니다") is NOT shown
 *
 * Tests are tolerant of empty data: an empty-state message inside the table is
 * acceptable, so we do not assert on table rows.
 */
test.describe("Admin pages smoke", () => {
  for (const [route, heading] of SMOKE_ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);

      // Did not bounce to the login page (auth session valid).
      await expect(page).toHaveURL(new RegExp(route.replace("/", "\\/")));

      // Heading present.
      await expect(
        page.getByRole("heading", { name: heading })
      ).toBeVisible();

      // Error boundary must not be rendered.
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
  }
});
