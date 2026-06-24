import type { Page } from "@playwright/test";

type InitialSetupAccount = {
  email: string;
  password: string;
};

export async function clickInitialSetupNext(page: Page) {
  const koNext = page.getByRole("button", { name: "다음", exact: true });

  if ((await koNext.count()) > 0) {
    await koNext.click();
    return;
  }

  await page.getByRole("button", { name: "Next", exact: true }).click();
}

export async function completeInitialSetupWizard(
  page: Page,
  account: InitialSetupAccount,
) {
  await clickInitialSetupNext(page);
  await clickInitialSetupNext(page);
  await page.getByRole("radio", { name: /Dev Local DB/ }).check();
  await clickInitialSetupNext(page);
  await page.getByRole("radio", { name: /KMSF-managed auth/ }).check();
  await clickInitialSetupNext(page);
  const connectedDb = page.getByRole("radio", { name: /연결된 DB|Connected DB/ });

  if ((await connectedDb.count()) > 0) {
    await connectedDb.check();
  }

  await clickInitialSetupNext(page);
  await page.getByRole("radio", { name: /Page 디렉터리|Page directory/ }).check();
  await clickInitialSetupNext(page);
  await page.locator("#initial-admin-email").fill(account.email);
  await page.locator("#initial-admin-password").fill(account.password);
  await page.locator("#initial-admin-password-confirm").fill(account.password);
  await clickInitialSetupNext(page);
}
