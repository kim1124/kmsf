import { expect, test } from "@playwright/test";

test.skip(
  process.env.KMSF_AUTH_PROVIDER !== "local-json",
  "local-json auth flow requires KMSF_AUTH_PROVIDER=local-json",
);

test("local-json sign-up, sign-in, settings, and account deletion", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const username = `local${runId.slice(-8)}`;
  const email = `${username}@local.test`;
  const password = "Local00@!";

  await page.goto("/sign-up");
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-up-username").fill(username);
  await page.locator("#sign-up-email").fill(email);
  await page.locator("#sign-up-password").fill(password);
  await page.locator("#sign-up-password-confirm").fill(password);
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("로컬 JSON", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await page.locator("#delete-account-confirmation").fill("DELETE");
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await page.waitForURL("**/sign-in?success=deleted", { timeout: 20_000 });
  await expect(page.getByText("회원 탈퇴가 완료되었습니다.")).toBeVisible();

  await page.locator("#login-username").fill(username);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByText("ID 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
});
