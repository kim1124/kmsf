import { expect, test } from "@playwright/test";

test("header brand, footer clock, and active navigation behave correctly", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  await page.goto("http://127.0.0.1:3000");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await page.locator("#initial-admin-username").fill(`owner${runId.slice(-6)}`);
    await page.locator("#initial-admin-email").fill(`owner_${runId}@mailinator.com`);
    await page.locator("#initial-admin-password").fill("admin00@!");
    await page.locator("#initial-admin-password-confirm").fill("admin00@!");
    await page.getByRole("button", { name: "관리자 계정 생성", exact: true }).click();
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

  const dashboardLink = page.getByRole("link", { name: "KMSF" });
  await expect(dashboardLink).toBeVisible();
  await expect(page.getByText(/^현재 시간 : \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)).toBeVisible();

  const settingsLink = page.getByRole("link", { name: /설정|Settings/ }).first();

  await settingsLink.click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(settingsLink).toHaveAttribute("aria-current", "page");

  await dashboardLink.click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
