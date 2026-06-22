import { expect, test } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

test.skip(
  Boolean(process.env.KMSF_AUTH_PROVIDER && process.env.KMSF_AUTH_PROVIDER !== "local-json"),
  "local-json auth flow requires local-json or runtime fallback auth",
);

test("local-json sign-up, sign-in, settings, and account deletion", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const username = `local${runId.slice(-8)}`;
  const email = `${username}@local.test`;
  const password = "Local00@!";

  await page.goto("/sign-up");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await completeInitialSetupWizard(page, {
      email: `owner_${runId}@local.test`,
      password: "Admin00@!",
    });
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
    await page.getByRole("button", { name: "프로필 메뉴" }).click();
    await page.getByRole("button", { name: "로그아웃", exact: true }).click();
    await page.waitForURL("**/sign-in", { timeout: 20_000 });
    await page.goto("/sign-up");
    await page.waitForLoadState("networkidle");
  }

  await page.locator("#sign-up-username").fill(username);
  await page.locator("#sign-up-email").fill(email);
  await page.locator("#sign-up-password").fill(password);
  await page.locator("#sign-up-password-confirm").fill(password);
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/sign-in?success=registered", { timeout: 20_000 });
  await expect(page.getByRole("status")).toContainText("회원 가입이 완료되었습니다.");
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.locator("#login-username").fill(username);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("세션 인증 방식", { exact: true })).toBeVisible();
  await expect(page.getByText("현재 동작 인증", { exact: true })).toBeVisible();
  await expect(page.getByText("Local DB", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "계정 정보 변경", exact: true }).click();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await page.locator("#delete-account-password").fill("wrong-password");
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await expect(page.getByText("비밀번호가 올바르지 않습니다.")).toBeVisible();

  await page.locator("#delete-account-password").fill(password);
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await page.waitForURL("**/sign-in?success=deleted", { timeout: 20_000 });
  await expect(page.getByRole("status")).toContainText("회원 탈퇴가 완료되었습니다.");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.reload();
  await expect(page.getByText("회원 탈퇴가 완료되었습니다.")).toHaveCount(0);

  await page.locator("#login-username").fill(username);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByText("ID 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
});
