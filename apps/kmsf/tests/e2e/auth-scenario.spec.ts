import { expect, test, type Page } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

type AuthScenarioAccount = {
  email: string;
  password: string;
  username: string;
};

type BrowserIssue = {
  checkpoint: string;
  message: string;
  type: string;
};

function installBrowserIssueTrap(page: Page) {
  const issues: BrowserIssue[] = [];
  let checkpoint = "init";

  page.on("console", (message) => {
    if (["error", "warning", "warn"].includes(message.type())) {
      issues.push({
        checkpoint,
        message: message.text(),
        type: message.type(),
      });
    }
  });

  page.on("pageerror", (error) => {
    issues.push({
      checkpoint,
      message: error.message,
      type: "pageerror",
    });
  });

  return async function expectNoBrowserIssues(nextCheckpoint: string) {
    checkpoint = nextCheckpoint;
    await expect
      .poll(() => issues, {
        message: `Unexpected browser console/page issues at ${nextCheckpoint}`,
        timeout: 100,
      })
      .toEqual([]);
  };
}

async function gotoAndSettle(
  page: Page,
  path: string,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await expectNoBrowserIssues(`goto:${path}`);
}

async function fillAccountForm(page: Page, prefix: string, account: AuthScenarioAccount) {
  await page.locator(`#${prefix}-username`).fill(account.username);
  await page.locator(`#${prefix}-email`).fill(account.email);
  await page.locator(`#${prefix}-password`).fill(account.password);
  await page.locator(`#${prefix}-password-confirm`).fill(account.password);
}

async function createInitialAdminIfRequired(
  page: Page,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
  account: AuthScenarioAccount,
) {
  await gotoAndSettle(page, "/", expectNoBrowserIssues);

  const setupRequired = page.url().includes("/setup/initial-admin");
  if (!setupRequired) {
    if (process.env.KMSF_EXPECT_INITIAL_SETUP === "1") {
      throw new Error(`Expected initial setup route, but current URL is ${page.url()}`);
    }

    return false;
  }

  await completeInitialSetupWizard(page, account);
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expectNoBrowserIssues("initial-admin-created");

  return true;
}

async function signUpMember(
  page: Page,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
  account: AuthScenarioAccount,
) {
  await gotoAndSettle(page, "/sign-up", expectNoBrowserIssues);
  await fillAccountForm(page, "sign-up", account);
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/sign-in?success=registered", { timeout: 20_000 });
  await expect(page.getByRole("status")).toContainText("회원 가입이 완료되었습니다.");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.locator("#login-username").fill(account.username);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expectNoBrowserIssues(`member-created:${account.username}`);
}

async function signInWithUsername(
  page: Page,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
  account: Pick<AuthScenarioAccount, "password" | "username">,
) {
  await gotoAndSettle(page, "/sign-in", expectNoBrowserIssues);
  await page.locator("#login-username").fill(account.username);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expectNoBrowserIssues(`sign-in:${account.username}`);
}

async function signOut(
  page: Page,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 10_000 });
  await expectNoBrowserIssues("sign-out");
}

async function expectMainPages(
  page: Page,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
) {
  for (const [path, heading, expectedUrl] of [
    ["/dashboard", "대시보드", /\/dashboard$/],
    ["/chart-sample", "차트 샘플", /\/chart-sample$/],
    ["/data-table-sample", "데이터 테이블 샘플", /\/data-table-sample$/],
    ["/analytics", "차트 샘플", /\/chart-sample$/],
    ["/settings", "설정", /\/settings$/],
  ] as const) {
    await gotoAndSettle(page, path, expectNoBrowserIssues);
    await expect(page).toHaveURL(expectedUrl);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expectNoBrowserIssues(`page:${path}`);
  }
}

async function deleteCurrentAccount(
  page: Page,
  expectNoBrowserIssues: (checkpoint: string) => Promise<void>,
  password: string,
) {
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
  await expectNoBrowserIssues("account-deleted");
}

test("initial setup, member signup, page navigation, logout, and deletion follow the active auth provider", async ({
  page,
}) => {
  const expectNoBrowserIssues = installBrowserIssueTrap(page);
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const adminAccount = {
    email: `scenario_admin_${runId}@mailinator.com`,
    password: "Admin00@!",
    username: "admin",
  };
  const memberAccount = {
    email: `scenario_member_${runId}@mailinator.com`,
    password: "Member00@!",
    username: `member${runId.slice(-8)}`,
  };

  const createdAdmin = await createInitialAdminIfRequired(
    page,
    expectNoBrowserIssues,
    adminAccount,
  );

  if (createdAdmin) {
    await signOut(page, expectNoBrowserIssues);
    await signInWithUsername(page, expectNoBrowserIssues, adminAccount);
    await signOut(page, expectNoBrowserIssues);
  }

  await signUpMember(page, expectNoBrowserIssues, memberAccount);
  await expectMainPages(page, expectNoBrowserIssues);

  await signOut(page, expectNoBrowserIssues);
  await signInWithUsername(page, expectNoBrowserIssues, memberAccount);
  await deleteCurrentAccount(page, expectNoBrowserIssues, memberAccount.password);

  await page.locator("#login-username").fill(memberAccount.username);
  await page.locator("#login-password").fill(memberAccount.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText("ID 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
  await expectNoBrowserIssues("deleted-account-rejected");
});
