import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { e2eAdminAccount } from "./utils/shared-accounts";

test.describe.configure({ retries: 0 });

const localDbPath =
  process.env.KMSF_LOCAL_AUTH_DB_PATH ??
  `${process.cwd()}/.local/auth.db.json`;

async function readLocalAuthDb() {
  const rawDb = await readFile(localDbPath, "utf8");

  return JSON.parse(rawDb) as {
    accounts: Array<{
      displayName: string;
      email: string;
      level: number;
      passwordHash: string;
      username: string;
    }>;
  };
}

test("initial setup wizard configures local auth and creates a level 3 admin", async ({
  page,
}) => {
  await page.goto("/setup/initial-admin");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "KMSF 초기 설정" })).toBeVisible();
  const paddingBottom = await page
    .locator("main")
    .evaluate((element) => Number.parseFloat(window.getComputedStyle(element).paddingBottom));

  expect(paddingBottom).toBeGreaterThanOrEqual(64);
  await expect(page.getByRole("radio", { name: /Supabase 설정/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Local DB 설정/ })).toBeChecked();
  await expect(page.getByText("ODBC와 설치형 DB 연동은 계획 항목입니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "이전" })).toHaveCount(0);

  await page.getByRole("button", { name: "다음", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Admin 관리 계정" })).toBeVisible();
  await expect(page.getByText("관리자 Level 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "이전", exact: true })).toBeVisible();
  await expect(page.locator("#initial-admin-username")).toHaveCount(0);
  await expect(page.locator("#initial-admin-display-name")).toHaveCount(0);
  await expect(page.locator("#initial-admin-email")).toBeVisible();
  await expect(page.locator("#initial-admin-password")).toBeVisible();
  await expect(page.locator("#initial-admin-password-confirm")).toBeVisible();

  const [emailBox, passwordBox, confirmBox] = await Promise.all([
    page.locator("#initial-admin-email").boundingBox(),
    page.locator("#initial-admin-password").boundingBox(),
    page.locator("#initial-admin-password-confirm").boundingBox(),
  ]);

  expect(emailBox).toBeTruthy();
  expect(passwordBox).toBeTruthy();
  expect(confirmBox).toBeTruthy();
  expect(emailBox!.y).toBeLessThan(passwordBox!.y);
  expect(passwordBox!.y).toBeLessThan(confirmBox!.y);

  await page.locator("#initial-admin-email").fill(e2eAdminAccount.email);
  await page.locator("#initial-admin-password").fill(e2eAdminAccount.password);
  await page.locator("#initial-admin-password-confirm").fill(e2eAdminAccount.password);
  await page.getByRole("button", { name: "다음", exact: true }).click();

  await expect(page.getByText("초기 설정을 진행하는 중입니다...")).toBeVisible();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "시스템 정보" })).toBeVisible();
  await expect(page.getByRole("link", { name: "계정 관리" })).toBeVisible();
  await expect(page.getByText("Local DB", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "계정 관리" }).click();
  await expect(page).toHaveURL(/\/settings\?section=accounts$/);
  await expect(page.getByRole("columnheader", { name: "ID" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "이름" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "E-mail" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "가입일자" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "최근 접속 시간" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "비고" })).toBeVisible();
  const adminRow = page.getByRole("row").filter({ hasText: e2eAdminAccount.email });
  await expect(adminRow.getByRole("cell", { name: e2eAdminAccount.username, exact: true })).toHaveCount(
    2,
  );

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  const db = await readLocalAuthDb();

  expect(db.accounts).toContainEqual(
    expect.objectContaining({
      displayName: e2eAdminAccount.displayName,
      email: e2eAdminAccount.email,
      level: 3,
      username: e2eAdminAccount.username,
    }),
  );

  const adminAccount = db.accounts.find(
    (account) => account.username === e2eAdminAccount.username,
  );
  expect(adminAccount).toBeTruthy();

  const originalPasswordHash = adminAccount!.passwordHash;
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "계정 정보 변경", exact: true }).click();
  const profileDialog = page.getByRole("dialog", { name: "계정 정보 변경" });
  await expect(profileDialog.getByText("Level 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveCount(0, { timeout: 500 });
  await expect(profileDialog.getByRole("button", { name: "회원 탈퇴", exact: true })).toHaveClass(
    /text-red-/,
  );
  await expect(page.locator("#profile-password")).toHaveValue("");
  await expect(page.locator("#profile-password-confirm")).toHaveValue("");
  await expect(page.locator("#profile-username")).toHaveValue(e2eAdminAccount.username);
  await page.locator("#profile-username").fill(e2eAdminAccount.username);
  await page.locator("#profile-email").fill(e2eAdminAccount.email);
  await page.getByRole("button", { name: "취소", exact: true }).click();

  const updatedRawDb = await readFile(localDbPath, "utf8");
  expect(updatedRawDb).not.toContain(e2eAdminAccount.password);
  expect(adminAccount!.passwordHash).toBe(originalPasswordHash);

  await expect(page.getByRole("button", { name: "로그아웃", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 20_000 });

  await page.locator("#login-username").fill(e2eAdminAccount.username);
  await page.locator("#login-password").fill(e2eAdminAccount.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
});
