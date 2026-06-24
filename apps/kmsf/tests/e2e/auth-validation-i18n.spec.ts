import { expect, test } from "@playwright/test";

import { clickInitialSetupNext } from "./utils/initial-setup";

const baseURL = "http://127.0.0.1:3000";

async function reachInitialAdminValidationStep(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: /KMSF 초기 설정|KMSF Initial Setup/ })).toBeVisible();

  await clickInitialSetupNext(page);
  await clickInitialSetupNext(page);
  await page.getByRole("radio", { name: /Dev Local DB/ }).check();
  await clickInitialSetupNext(page);
  await page.getByRole("radio", { name: /KMSF-managed auth/ }).check();
  await clickInitialSetupNext(page);
  await clickInitialSetupNext(page);
  await clickInitialSetupNext(page);

  await expect(page.locator("#initial-admin-email")).toBeVisible();
}

async function expectTranslatedValidation(
  page: import("@playwright/test").Page,
  locale: "ko" | "en",
) {
  const expectedUsernameMessage =
    locale === "ko"
      ? "ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."
      : "The ID must be 5-32 letters, numbers, or an email-style value.";
  const expectedEmailMessage =
    locale === "ko"
      ? "올바른 E-mail 주소를 입력해 주세요."
      : "Enter a valid E-mail address.";
  const expectedPasswordMessage =
    locale === "ko"
      ? "비밀번호는 6자~32자의 영문과 특수문자를 포함해야 합니다."
      : "The password must be 6-32 characters and include letters and special characters.";

  await page.context().clearCookies();

  if (locale === "en") {
    await page.context().addCookies([
      {
        name: "NEXT_LOCALE",
        value: "en",
        url: baseURL,
      },
    ]);
  }

  await page.goto(`${baseURL}/sign-in`);
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await reachInitialAdminValidationStep(page);
  }

  const isInitialSetupPage = page.url().includes("/setup/initial-admin");
  const identifierSelector = isInitialSetupPage ? "#initial-admin-email" : "#login-username";
  const passwordSelector = isInitialSetupPage ? "#initial-admin-password" : "#login-password";
  const identifierMessage = isInitialSetupPage ? expectedEmailMessage : expectedUsernameMessage;

  await expect(
    page.getByText(identifierMessage, { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(expectedPasswordMessage, { exact: true })).toHaveCount(0);

  await page.locator(identifierSelector).fill("kim");
  await expect(page.getByText(identifierMessage, { exact: true })).toHaveCount(0);

  await page.locator(passwordSelector).fill("1234");
  await expect(page.getByText(identifierMessage, { exact: true })).toBeVisible();
  await expect(page.getByText(expectedPasswordMessage, { exact: true })).toHaveCount(0);

  await page.locator(identifierSelector).focus();
  await expect(page.getByText(expectedPasswordMessage, { exact: true })).toBeVisible();
  await expect(page.getByText("username.invalid")).toHaveCount(0);
  await expect(page.getByText("email.invalid")).toHaveCount(0);
  await expect(page.getByText("password.invalid")).toHaveCount(0);
}

test("validation messages render translated text for ko and en locales", async ({ page }) => {
  await expectTranslatedValidation(page, "ko");
  await expectTranslatedValidation(page, "en");
});
