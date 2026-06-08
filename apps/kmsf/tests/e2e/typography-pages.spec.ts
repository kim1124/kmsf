import { expect, test, type Page } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

async function expectBaseTypography(page: Page) {
  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
}

async function signUpMember(page: Page, runId: string) {
  await page.goto("/sign-up");
  await page.waitForLoadState("networkidle");
  await expectBaseTypography(page);
  await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible();

  await page.locator("#sign-up-username").fill(`typo${runId.slice(-8)}`);
  await page.locator("#sign-up-email").fill(`typo_${runId}@mailinator.com`);
  await page.locator("#sign-up-password").fill("member00@!");
  await page.locator("#sign-up-password-confirm").fill("member00@!");
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

async function ensureSignedIn(page: Page, runId: string) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await expectBaseTypography(page);
    await expect(page.getByRole("heading", { name: "KMSF 초기 설정" })).toBeVisible();
    await completeInitialSetupWizard(page, {
      email: `owner_${runId}@mailinator.com`,
      password: "admin00@!",
    });
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
    return;
  }

  if (page.url().includes("/sign-in")) {
    await expectBaseTypography(page);
    await expect(page.getByRole("heading", { name: "KMSF 로그인" })).toBeVisible();
    await signUpMember(page, runId);
  }
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 20_000 });
}

test("all main app pages use the shared Spoqa 12px typography baseline", async ({
  page,
}) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  await ensureSignedIn(page, runId);

  for (const [path, heading] of [
    ["/dashboard", "대시보드"],
    ["/chart-sample", "차트 샘플"],
    ["/data-table-sample", "데이터 테이블 샘플"],
    ["/settings", "설정"],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectBaseTypography(page);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  await page.goto("/analytics");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/chart-sample$/);
  await expectBaseTypography(page);

  await signOut(page);
  await expectBaseTypography(page);
  await expect(page.getByRole("heading", { name: "KMSF 로그인" })).toBeVisible();

  await page.goto("/sign-up");
  await page.waitForLoadState("networkidle");
  await expectBaseTypography(page);
  await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible();
});
