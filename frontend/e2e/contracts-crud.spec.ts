import { test, expect } from "@playwright/test";

/**
 * Full CRUD happy path for contracts (사업) against the real backend.
 *
 *  1. Create via /contracts/new form
 *  2. Verify it appears in the /contracts list
 *  3. Open detail, edit the 계약 금액 (contract amount) field
 *  4. Verify the change persisted on the detail page
 *
 * Note: contracts cannot be deleted (backend forbids it), so each run creates a
 * uniquely-named contract to stay independent.
 */
test.describe("Contracts CRUD", () => {
  // Serial: detail/edit steps depend on the created contract.
  test.describe.configure({ mode: "serial" });

  const unique = Date.now();
  const contractName = `E2E 사업 ${unique}`;
  const clientOrg = `E2E 발주처 ${unique}`;
  const initialAmount = "100000000";
  const updatedAmount = "250000000";

  test("creates a contract and shows it on the detail page", async ({
    page,
  }) => {
    await page.goto("/contracts/new");

    await page.getByLabel("사업명").fill(contractName);
    await page.getByLabel("발주처").fill(clientOrg);
    await page.getByLabel("시작일").fill("2026-01-01");
    await page.getByLabel("종료일").fill("2026-12-31");
    await page.getByLabel("계약 금액").fill(initialAmount);

    await page.getByRole("button", { name: "등록" }).click();

    // Redirects to the new contract's detail page (/contracts/{id}).
    // Generous timeout: the dev server cold-compiles the server action and the
    // detail route on first run.
    await expect(page).toHaveURL(/\/contracts\/\d+$/, { timeout: 45000 });
    await expect(
      page.getByRole("heading", { name: contractName })
    ).toBeVisible();
    await expect(page.getByText(initialAmount)).toBeVisible();
  });

  test("appears in the contracts list", async ({ page }) => {
    await page.goto("/contracts");
    // The newest contract sorts first; assert its link is present.
    await expect(
      page.getByRole("link", { name: contractName })
    ).toBeVisible();
  });

  test("edits the contract amount and persists the change", async ({
    page,
  }) => {
    // Reach the detail page via the list link.
    await page.goto("/contracts");
    await page.getByRole("link", { name: contractName }).click();
    await expect(page).toHaveURL(/\/contracts\/\d+$/);

    // Go to the edit form.
    await page.getByRole("link", { name: "수정" }).click();
    await expect(page).toHaveURL(/\/contracts\/\d+\/edit$/, { timeout: 45000 });

    // The edit form's labels are not associated via htmlFor, so target the
    // field by its form name attribute. The backend stores the amount as a
    // Decimal, so it comes back as "100000000.00" — assert the prefix, then
    // overwrite with the new value.
    const amountField = page.locator('input[name="contract_amount"]');
    await expect(amountField).toHaveValue(
      new RegExp(`^${initialAmount}`),
      { timeout: 30000 }
    );
    await amountField.fill(updatedAmount);

    await page.getByRole("button", { name: "저장" }).click();

    // Back on the detail page with the updated amount.
    await expect(page).toHaveURL(/\/contracts\/\d+$/, { timeout: 45000 });
    await expect(page.getByText(updatedAmount)).toBeVisible();
    await expect(page.getByText(initialAmount)).toHaveCount(0);
  });
});
