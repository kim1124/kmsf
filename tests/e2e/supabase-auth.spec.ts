import { expect, test } from "@playwright/test";

async function expectMainPages(page: import("@playwright/test").Page, prefix: string) {
  for (const [path, heading] of [
    ["/dashboard", "대시보드"],
    ["/chart-sample", "차트 샘플"],
    ["/data-table-sample", "데이터 테이블 샘플"],
    ["/settings", "설정"],
  ] as const) {
    await page.goto(`http://localhost:3000${path}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    test.info().annotations.push({
      type: "page-check",
      description: `${prefix}:${path}:${heading}`,
    });
  }
}

test("initial admin setup, auth flow, page checks, and member deletion", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const initialAdminUsername = `owner${runId.slice(-6)}`;
  const adminEmail = `admin_${runId}@mailinator.com`;
  const kimEmail = `kim1124_${runId}@mailinator.com`;
  let adminLoginUsername = "admin";
  let expectedAdminLabel = "admin";

  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await page.locator("#initial-admin-username").fill(initialAdminUsername);
    await page.locator("#initial-admin-email").fill(adminEmail);
    await page.locator("#initial-admin-password").fill("admin00@!");
    await page.locator("#initial-admin-password-confirm").fill("admin00@!");
    await page.getByRole("button", { name: "관리자 계정 생성", exact: true }).click();
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    adminLoginUsername = initialAdminUsername;
    expectedAdminLabel = initialAdminUsername;
  } else {
    test.skip(
      true,
      "This scenario requires a clean environment with no existing manager account.",
    );
  }

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expectMainPages(page, expectedAdminLabel);

  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await expect(page.getByText(expectedAdminLabel).first()).toBeVisible();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 10000 });

  await page.goto("http://localhost:3000/sign-up");
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-up-username").fill("kim1124");
  await page.locator("#sign-up-email").fill(kimEmail);
  await page.locator("#sign-up-password").fill("kim112400@!");
  await page.locator("#sign-up-password-confirm").fill("kim112400@!");
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expectMainPages(page, "kim1124");

  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await expect(page.getByText("kim1124").first()).toBeVisible();

  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await page.locator("#delete-account-confirmation").fill("DELETE");
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await page.waitForURL("**/sign-in?success=deleted", { timeout: 20000 });
  await expect(page.getByText("회원 탈퇴가 완료되었습니다.")).toBeVisible();

  await page.locator("#login-username").fill("kim1124");
  await page.locator("#login-password").fill("kim112400@!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 15000 });
  await expect(page.getByText("ID 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
});
