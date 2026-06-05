import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";
import { e2eAdminAccount } from "./utils/shared-accounts";

type ScenarioAccount = {
  email: string;
  password: string;
  username: string;
};

test.describe.configure({ retries: 0 });

test.skip(
  Boolean(process.env.KMSF_AUTH_PROVIDER && process.env.KMSF_AUTH_PROVIDER !== "local-json"),
  "full operation scenario resets the local-json auth store only",
);

async function signIn(page: Page, account: ScenarioAccount) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await page.locator("#login-username").fill(account.username);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
}

async function expectSignInRejected(page: Page, account: ScenarioAccount) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await page.locator("#login-username").fill(account.username);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText("ID 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
}

async function signOut(page: Page) {
  const logoutButton = page.getByRole("button", { name: "로그아웃", exact: true });

  if (!(await logoutButton.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "프로필 메뉴" }).click();
  }

  await logoutButton.click();
  await page.waitForURL("**/sign-in", { timeout: 20_000 });
}

async function signUpMember(page: Page, account: ScenarioAccount) {
  await page.goto("/sign-up");
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-up-username").fill(account.username);
  await page.locator("#sign-up-email").fill(account.email);
  await page.locator("#sign-up-password").fill(account.password);
  await page.locator("#sign-up-password-confirm").fill(account.password);
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
}

async function updateCurrentAccount(page: Page, nextAccount: ScenarioAccount) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "계정 정보 변경", exact: true }).click();

  const profileDialog = page.getByRole("dialog", { name: "계정 정보 변경" });
  await expect(profileDialog).toBeVisible();
  await expect(profileDialog.getByText("Level 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveCount(0, { timeout: 500 });

  await page.locator("#profile-username").fill(nextAccount.username);
  await page.locator("#profile-email").fill(nextAccount.email);
  await page.locator("#profile-password").fill(nextAccount.password);
  await page.locator("#profile-password-confirm").fill(nextAccount.password);
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(profileDialog).toBeHidden({ timeout: 20_000 });
}

async function deleteCurrentAccount(page: Page) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "계정 정보 변경", exact: true }).click();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await page.locator("#delete-account-confirmation").fill("DELETE");
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await page.waitForURL("**/sign-in?success=deleted", { timeout: 20_000 });
  await expect(page.getByText("회원 탈퇴가 완료되었습니다.")).toBeVisible();
}

async function readLocalDbAccounts() {
  const dbPath = process.env.KMSF_LOCAL_AUTH_DB_PATH;

  expect(dbPath).toBeTruthy();

  const raw = await readFile(dbPath!, "utf8");
  const db = JSON.parse(raw) as {
    accounts: Array<{
      username: string;
    }>;
  };

  return db.accounts;
}

test("level3 admin, member lifecycle, and factory reset work end to end", async ({
  page,
}) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const memberAccount = {
    email: `scenario_member_${runId}@local.test`,
    password: "Member00@!",
    username: `member${runId.slice(-8)}`,
  };
  const updatedMemberAccount = {
    email: `scenario_member_updated_${runId}@local.test`,
    password: "Member01@!",
    username: `memberx${runId.slice(-8)}`,
  };

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await expect(page.getByRole("heading", { name: "KMSF 초기 설정" })).toBeVisible();
    await completeInitialSetupWizard(page, e2eAdminAccount);
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  } else {
    await signIn(page, e2eAdminAccount);
  }

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  await page.goto("/settings?section=accounts");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "계정 관리" })).toBeVisible();
  const adminRow = page.getByRole("row").filter({ hasText: e2eAdminAccount.email });
  await expect(adminRow.getByRole("cell", { name: e2eAdminAccount.username, exact: true })).toHaveCount(
    2,
  );
  await expect(page.getByText("Level 3 / 관리자")).toBeVisible();

  await signOut(page);
  await signIn(page, e2eAdminAccount);
  await signOut(page);

  await signUpMember(page, memberAccount);
  await expect
    .poll(async () => (await readLocalDbAccounts()).some((account) => account.username === memberAccount.username))
    .toBe(true);

  await updateCurrentAccount(page, updatedMemberAccount);
  await signOut(page);
  await expectSignInRejected(page, memberAccount);
  await signIn(page, updatedMemberAccount);
  await deleteCurrentAccount(page);
  await expectSignInRejected(page, updatedMemberAccount);
  await expect
    .poll(async () =>
      (await readLocalDbAccounts()).some(
        (account) => account.username === updatedMemberAccount.username,
      ),
    )
    .toBe(false);

  await signIn(page, e2eAdminAccount);
  await page.goto("/settings?section=accounts");
  await page.waitForLoadState("networkidle");
  await expect(adminRow.getByRole("cell", { name: e2eAdminAccount.username, exact: true })).toHaveCount(
    2,
  );
  await expect(page.getByRole("cell", { name: updatedMemberAccount.username, exact: true })).toHaveCount(
    0,
  );

  await page.goto("/settings?section=reset");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "시스템 초기화" })).toBeVisible();
  await page.getByRole("button", { name: "시스템 초기화", exact: true }).click();
  await page.getByLabel("설정 초기화").check();
  await page.locator("#system-reset-password").fill(e2eAdminAccount.password);
  await page.locator("#system-reset-risk-accepted").check();
  await page.locator("#system-reset-confirmation").fill("설정초기화");
  await page.getByRole("button", { name: "초기화 진행", exact: true }).click();
  await page.waitForURL("**/sign-in?success=settings-reset", { timeout: 20_000 });
  await expect(page.getByText("설정 초기화가 완료되었습니다. 다시 로그인해 주세요.")).toBeVisible();
  await signIn(page, e2eAdminAccount);
  await expect
    .poll(async () => (await readLocalDbAccounts()).some((account) => account.username === e2eAdminAccount.username))
    .toBe(true);

  await page.goto("/settings?section=reset");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "시스템 초기화" })).toBeVisible();
  await page.getByRole("button", { name: "시스템 초기화", exact: true }).click();
  await page.getByLabel("공장 초기화").check();
  await page.locator("#system-reset-password").fill(e2eAdminAccount.password);
  await page.locator("#system-reset-risk-accepted").check();
  await page.locator("#system-reset-confirmation").fill("공장초기화");
  await page.getByRole("button", { name: "초기화 진행", exact: true }).click();
  await page.waitForURL("**/setup/initial-admin?reset=success", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "KMSF 초기 설정" })).toBeVisible();
  await expect.poll(async () => await readLocalDbAccounts()).toHaveLength(0);
});
