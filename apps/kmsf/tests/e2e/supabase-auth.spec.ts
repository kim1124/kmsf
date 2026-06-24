import { expect, test } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

async function expectMainPages(page: import("@playwright/test").Page, prefix: string) {
  for (const [path, heading] of [
    ["/dashboard", "대시보드"],
    ["/chart-sample", "차트 샘플"],
    ["/data-table-sample", "데이터 테이블 샘플"],
    ["/settings", "설정"],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    test.info().annotations.push({
      type: "page-check",
      description: `${prefix}:${path}:${heading}`,
    });
  }
}

async function createInitialAdminIfRequired(
  page: import("@playwright/test").Page,
  input: {
    email: string;
    password: string;
    username: string;
  },
) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  if (!page.url().includes("/setup/initial-admin")) {
    return null;
  }

  await completeInitialSetupWizard(page, input);
  await expect(page.getByRole("heading", { name: "설정이 완료되었습니다." })).toBeVisible({
    timeout: 20000,
  });
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await signInWithUsername(page, input);

  return "admin";
}

async function signUpMember(
  page: import("@playwright/test").Page,
  input: {
    email: string;
    password: string;
    username: string;
  },
) {
  await page.goto("/sign-up");
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-up-username").fill(input.username);
  await page.locator("#sign-up-email").fill(input.email);
  await page.locator("#sign-up-password").fill(input.password);
  await page.locator("#sign-up-password-confirm").fill(input.password);
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/sign-in?success=registered", { timeout: 20000 });
  await expect(page.getByRole("status")).toContainText("회원 가입이 완료되었습니다.");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.locator("#login-username").fill(input.username);
  await page.locator("#login-password").fill(input.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 10000 });
}

async function signInWithUsername(
  page: import("@playwright/test").Page,
  input: {
    password: string;
    username: string;
  },
) {
  await page.locator("#login-username").fill(input.username);
  await page.locator("#login-password").fill(input.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

async function signInFromCurrentPage(
  page: import("@playwright/test").Page,
  input: {
    password: string;
    username: string;
  },
) {
  if (!page.url().includes("/sign-in")) {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");
  }

  await signInWithUsername(page, input);
}

async function deleteCurrentAccount(page: import("@playwright/test").Page, password: string) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "계정 정보 변경", exact: true }).click();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await page.locator("#delete-account-password").fill(password);
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await page.waitForURL("**/sign-in?success=deleted", { timeout: 20000 });
  await expect(page.getByRole("status")).toContainText("회원 탈퇴가 완료되었습니다.");
  await expect(page).toHaveURL(/\/sign-in$/);
}

async function deleteInitialAdminForCleanup(
  page: import("@playwright/test").Page,
  password: string,
) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "계정 정보 변경", exact: true }).click();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await page.locator("#delete-account-password").fill(password);
  await page.getByRole("button", { name: "탈퇴 진행", exact: true }).click();
  await page.waitForURL("**/setup/initial-admin**", { timeout: 20000 });
  await expect(page.getByRole("heading", { name: "KMSF 초기 설정" })).toBeVisible();
}

test("@supabase-remote supabase setup, sign-up, sign-in, page checks, and member deletion", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const adminEmail = `admin_${runId}@mailinator.com`;
  const memberUsername = `kim${runId.slice(-8)}`;
  const memberEmail = `${memberUsername}@mailinator.com`;
  const memberPassword = "kim112400@!";
  const adminPassword = "admin00@!";
  let createdInitialAdmin = false;

  try {
    const createdAdminUsername = await createInitialAdminIfRequired(page, {
      email: adminEmail,
      password: adminPassword,
      username: "admin",
    });

    createdInitialAdmin = Boolean(createdAdminUsername);

    if (createdAdminUsername) {
      await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
      await expectMainPages(page, createdAdminUsername);
      await signOut(page);
    }

    await signUpMember(page, {
      email: memberEmail,
      password: memberPassword,
      username: memberUsername,
    });
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
    await expectMainPages(page, memberUsername);

    await page.getByRole("button", { name: "프로필 메뉴" }).click();
    await expect(page.getByText(memberUsername).first()).toBeVisible();
    await page.getByRole("button", { name: "로그아웃", exact: true }).click();
    await page.waitForURL("**/sign-in", { timeout: 10000 });

    await signInWithUsername(page, {
      password: memberPassword,
      username: memberUsername,
    });
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
    await deleteCurrentAccount(page, memberPassword);

    await page.locator("#login-username").fill(memberUsername);
    await page.locator("#login-password").fill(memberPassword);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText("ID 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
  } finally {
    if (createdInitialAdmin) {
      await signInFromCurrentPage(page, {
        password: adminPassword,
        username: "admin",
      });
      await deleteInitialAdminForCleanup(page, adminPassword);
    }
  }
});
