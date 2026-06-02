import { expect, test } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

test("header brand, footer clock, and active navigation behave correctly", async ({ page }) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("http://127.0.0.1:3000");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await completeInitialSetupWizard(page, {
      email: `owner_${runId}@mailinator.com`,
      password: "admin00@!",
    });
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

  await expect(page.locator("header").getByRole("button", { name: "프로필 메뉴" })).toHaveCount(0);
  const asideProfileButton = page.locator("aside").getByRole("button", { name: "프로필 메뉴" });
  await expect(asideProfileButton).toBeVisible();

  const triggerBox = await asideProfileButton.boundingBox();
  expect(triggerBox).not.toBeNull();
  await asideProfileButton.click();
  const profilePopover = page.getByTestId("profile-menu-popover");
  await expect(profilePopover).toBeVisible();
  const popoverBox = await profilePopover.boundingBox();
  expect(popoverBox).not.toBeNull();
  expect(popoverBox!.x).toBeGreaterThan(triggerBox!.x + triggerBox!.width - 1);

  await page.getByRole("link", { name: /설정|Settings/ }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("link", { name: /설정|Settings/ })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await dashboardLink.click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
