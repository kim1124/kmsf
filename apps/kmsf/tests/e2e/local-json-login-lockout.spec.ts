import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";
import { e2eAdminAccount } from "./utils/shared-accounts";

const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
const lockoutAccount = {
  email: `lockout_${runId}@local.test`,
  password: "Lock00@!",
  username: `lock${runId.slice(-8)}`,
};

test.skip(
  Boolean(process.env.KMSF_AUTH_PROVIDER && process.env.KMSF_AUTH_PROVIDER !== "local-json"),
  "local-json login lockout requires local-json or runtime fallback auth",
);

test.afterEach(async () => {
  const dbPath = process.env.KMSF_LOCAL_AUTH_DB_PATH;

  if (!dbPath?.startsWith("/private/tmp/kmsf-")) {
    return;
  }

  try {
    const rawDb = await readFile(dbPath, "utf8");
    const db = JSON.parse(rawDb) as {
      accounts?: Array<{ email?: string; id?: string; username?: string }>;
      loginAttemptStates?: Array<{ identifierHash?: string }>;
      loginAuditEvents?: Array<{ identifierHash?: string }>;
    };
    const hashGuardIdentifier = (value: string) =>
      createHash("sha256")
        .update(`local-json:${value.trim().toLowerCase()}`)
        .digest("hex");
    const identifierHashes = new Set([
      hashGuardIdentifier(`identifier:${lockoutAccount.username}`),
      hashGuardIdentifier(`identifier:${lockoutAccount.email}`),
    ]);
    const accounts = db.accounts ?? [];
    const lockoutAccounts = accounts.filter(
      (account) =>
        account.username === lockoutAccount.username || account.email === lockoutAccount.email,
    );

    for (const account of lockoutAccounts) {
      if (account.id) {
        identifierHashes.add(hashGuardIdentifier(`account:${account.id}`));
      }
    }

    db.accounts = accounts.filter(
      (account) =>
        account.username !== lockoutAccount.username && account.email !== lockoutAccount.email,
    );
    db.loginAttemptStates = (db.loginAttemptStates ?? []).filter(
      (state) => !state.identifierHash || !identifierHashes.has(state.identifierHash),
    );
    db.loginAuditEvents = (db.loginAuditEvents ?? []).filter(
      (event) => !event.identifierHash || !identifierHashes.has(event.identifierHash),
    );

    await writeFile(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
});

test("local-json blocks login for 300 seconds after 3 failed attempts", async ({ page }) => {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await completeInitialSetupWizard(page, {
      email: e2eAdminAccount.email,
      password: e2eAdminAccount.password,
    });
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  }

  if (page.url().includes("/dashboard")) {
    await page.getByRole("button", { name: "프로필 메뉴" }).click();
    await page.getByRole("button", { name: "로그아웃", exact: true }).click();
    await page.waitForURL("**/sign-in", { timeout: 20_000 });
  }

  await page.goto("/sign-up");
  await page.locator("#sign-up-username").fill(lockoutAccount.username);
  await page.locator("#sign-up-email").fill(lockoutAccount.email);
  await page.locator("#sign-up-password").fill(lockoutAccount.password);
  await page.locator("#sign-up-password-confirm").fill(lockoutAccount.password);
  await page.getByRole("button", { name: "회원 가입", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  await page.getByRole("button", { name: "프로필 메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page.waitForURL("**/sign-in", { timeout: 20_000 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.locator("#login-username").fill(lockoutAccount.username);
    await page.locator("#login-password").fill("Wrong00@!");
    await page.getByRole("button", { name: "로그인", exact: true }).click();
  }

  await expect(page.getByRole("dialog")).toContainText(
    /여러번 로그인 시도가 실패하여 \d+ 초간 로그인 할 수 없습니다./,
  );

  await page.keyboard.press("Escape");
  await page.locator("#login-password").fill(lockoutAccount.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(page.getByRole("dialog")).toContainText(
    /여러번 로그인 시도가 실패하여 \d+ 초간 로그인 할 수 없습니다./,
  );
  await expect(page).toHaveURL(/\/sign-in$/);
});
