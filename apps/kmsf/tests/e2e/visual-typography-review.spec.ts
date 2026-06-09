import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

const artifactDir = join(process.cwd(), "reports/artifacts/visual-typography");
const adminPassword = "admin00@!";

async function expectBaseTypography(page: Page) {
  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
}

async function expectNoRootHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(() => {
    const rootOverflow =
      document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const bodyOverflow = document.body.scrollWidth - window.innerWidth;

    return Math.max(rootOverflow, bodyOverflow);
  });

  expect(overflowX).toBeLessThanOrEqual(2);
}

async function capturePage(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  await expectBaseTypography(page);
  await expectNoRootHorizontalOverflow(page);
  await mkdir(artifactDir, { recursive: true });
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: join(artifactDir, `${name}.png`),
  });
}

async function signInAdmin(page: Page) {
  await page.locator("#login-username").fill("admin");
  await page.locator("#login-password").fill(adminPassword);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 20_000 });
}

test("captures final app visual typography review screenshots", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const adminEmail = `visual_${runId}@mailinator.com`;

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/setup/initial-admin");
  await expect(page.getByRole("heading", { name: "KMSF 초기 설정" })).toBeVisible();
  await capturePage(page, "app-desktop-setup-initial-admin");

  await completeInitialSetupWizard(page, {
    email: adminEmail,
    password: adminPassword,
  });
  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  for (const [path, heading, screenshotName] of [
    ["/dashboard", "대시보드", "app-desktop-dashboard"],
    ["/chart-sample", "차트 샘플", "app-desktop-chart-sample"],
    ["/data-table-sample", "데이터 테이블 샘플", "app-desktop-data-table-sample"],
    ["/settings", "설정", "app-desktop-settings"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await capturePage(page, screenshotName);
  }

  await signOut(page);
  await expect(page.getByRole("heading", { name: "KMSF 로그인" })).toBeVisible();
  await capturePage(page, "app-desktop-sign-in");

  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible();
  await capturePage(page, "app-desktop-sign-up");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sign-in");
  await signInAdmin(page);

  for (const [path, heading, screenshotName] of [
    ["/dashboard", "대시보드", "app-mobile-dashboard"],
    ["/chart-sample", "차트 샘플", "app-mobile-chart-sample"],
    ["/data-table-sample", "데이터 테이블 샘플", "app-mobile-data-table-sample"],
    ["/settings", "설정", "app-mobile-settings"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await capturePage(page, screenshotName);
  }

  await signOut(page);
  await expect(page.getByRole("heading", { name: "KMSF 로그인" })).toBeVisible();
  await capturePage(page, "app-mobile-sign-in");

  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible();
  await capturePage(page, "app-mobile-sign-up");
});
