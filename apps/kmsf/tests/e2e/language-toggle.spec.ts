import { expect, test } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

test("language toggle switches dashboard copy without changing the route", async ({
  page,
}) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  await page.goto("http://127.0.0.1:3000");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await completeInitialSetupWizard(page, {
      email: `owner_${runId}@mailinator.com`,
      password: "admin00@!",
    });
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  } else if (page.url().includes("/sign-in")) {
    await page.goto("http://127.0.0.1:3000/sign-up");
    await page.waitForLoadState("networkidle");
    await page.locator("#sign-up-username").fill(`member${runId.slice(-6)}`);
    await page.locator("#sign-up-email").fill(`member_${runId}@mailinator.com`);
    await page.locator("#sign-up-password").fill("member00@!");
    await page.locator("#sign-up-password-confirm").fill("member00@!");
    await page.getByRole("button", { name: "회원 가입", exact: true }).click();
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  }

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "ko", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
});
