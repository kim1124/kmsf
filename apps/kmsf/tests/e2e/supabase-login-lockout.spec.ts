import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  buildAccountLoginGuardIdentifier,
  hashLoginIdentifier,
} from "../../src/lib/auth/login-guard";

function loadRemoteSupabaseEnvFallback() {
  const envPath = join(process.cwd(), ".env.development");

  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (
      key !== "NEXT_PUBLIC_SUPABASE_URL" &&
      key !== "SUPABASE_SECRET_KEY"
    ) {
      continue;
    }

    if (process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadRemoteSupabaseEnvFallback();

const remoteSupabaseEnabled = process.env.KMSF_E2E_REMOTE_SUPABASE === "1";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

test.skip(
  !remoteSupabaseEnabled || !supabaseUrl || !supabaseSecretKey,
  "remote Supabase E2E requires KMSF_E2E_REMOTE_SUPABASE=1 and Supabase server env",
);

function createAdminClient() {
  return createClient(supabaseUrl!, supabaseSecretKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function createRemoteAccount(
  admin: SupabaseClient,
  input: {
    email: string;
    password: string;
    username: string;
  },
) {
  const { data, error } = await admin.auth.admin.createUser({
    app_metadata: {
      level: 1,
      role: "member",
    },
    email: input.email,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      username: input.username,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Supabase remote E2E user was not created.");
  }

  const timestamp = new Date().toISOString();
  const { error: managerError } = await admin.from("manager").upsert(
    {
      avatar_url: null,
      created_at: timestamp,
      display_name: input.username,
      email: input.email,
      id: data.user.id,
      last_signed_in_at: null,
      level: 1,
      role: "member",
      status: "active",
      updated_at: timestamp,
      username: input.username,
    },
    { onConflict: "id" },
  );

  if (managerError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(managerError.message);
  }

  return data.user.id;
}

async function cleanupRemoteAccount(
  admin: SupabaseClient,
  input: {
    identifierHash: string;
    userId: string | null;
  },
) {
  await admin.rpc("clear_login_attempt_state", {
    p_identifier_hash: input.identifierHash,
    p_provider: "supabase",
  });

  if (!input.userId) {
    return;
  }

  await admin.from("manager").delete().eq("id", input.userId);
  await admin.auth.admin.deleteUser(input.userId);
}

test("@supabase-remote locks a Supabase account after repeated wrong passwords", async ({
  page,
}) => {
  const admin = createAdminClient();
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const account = {
    email: `lockout_${runId}@mailinator.com`,
    password: "Member00@!",
    username: `lock${runId.slice(-8)}`,
  };
  let userId: string | null = null;
  let identifierHash = "";

  try {
    userId = await createRemoteAccount(admin, account);
    identifierHash = hashLoginIdentifier(
      "supabase",
      buildAccountLoginGuardIdentifier(userId),
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.goto("/sign-in");
      await page.waitForLoadState("networkidle");
      await page.locator("#login-username").fill(account.username);
      await page.locator("#login-password").fill("Wrong00@!");
      await page.getByRole("button", { name: "로그인", exact: true }).click();
    }

    await expect(page.getByRole("dialog", { name: "로그인 차단" })).toBeVisible();
    await expect(page.getByText(/로그인 시도가 실패/)).toBeVisible();
  } finally {
    if (identifierHash) {
      await cleanupRemoteAccount(admin, {
        identifierHash,
        userId,
      });
    }
  }
});
