import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const appDir = dirname(fileURLToPath(import.meta.url));
const projectDir = join(appDir, "..");

const { loadEnvConfig } = nextEnv;

loadEnvConfig(projectDir, true);

const allowDestructiveReset = process.env.KMSF_ALLOW_DESTRUCTIVE_AUTH_RESET === "1";

if (!allowDestructiveReset) {
  console.error(
    "Refusing to reset auth state. Set KMSF_ALLOW_DESTRUCTIVE_AUTH_RESET=1 to confirm.",
  );
  process.exit(1);
}

const summary = {
  localJsonRemoved: false,
  managerRowsRemoved: 0,
  setupConfigRemoved: false,
  supabaseUsersRemoved: 0,
  supabaseSkipped: false,
};

async function resetLocalJsonAuthDb() {
  const dbPath =
    process.env.KMSF_LOCAL_AUTH_DB_PATH ?? join(projectDir, ".local", "auth.db.json");

  if (!existsSync(dbPath)) {
    return;
  }

  await rm(dbPath, { force: true });
  summary.localJsonRemoved = true;
}

async function resetProjectSetupConfig() {
  const fileName = process.env.KMSF_SETUP_CONFIG_FILE;
  const safeFileName =
    fileName && /^[A-Za-z0-9._-]+$/.test(fileName) ? fileName : "setup.config.json";
  const configPath = join(process.cwd(), ".local", safeFileName);

  if (!existsSync(configPath)) {
    return;
  }

  await rm(configPath, { force: true });
  summary.setupConfigRemoved = true;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function resetSupabaseManager(admin) {
  const { data, error: selectError } = await admin.from("manager").select("id");

  if (selectError) {
    throw new Error(`Failed to read manager rows: ${selectError.message}`);
  }

  const ids = (data ?? []).map((row) => row.id).filter(Boolean);

  if (ids.length === 0) {
    return;
  }

  const { error: deleteError } = await admin.from("manager").delete().in("id", ids);

  if (deleteError) {
    throw new Error(`Failed to delete manager rows: ${deleteError.message}`);
  }

  summary.managerRowsRemoved = ids.length;
}

async function listAllSupabaseUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`Failed to list Supabase users: ${error.message}`);
    }

    const pageUsers = data.users ?? [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      return users;
    }

    page += 1;
  }
}

async function resetSupabaseUsers(admin) {
  const users = await listAllSupabaseUsers(admin);

  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      throw new Error(`Failed to delete Supabase user ${user.id}: ${error.message}`);
    }

    summary.supabaseUsersRemoved += 1;
  }
}

async function main() {
  await resetLocalJsonAuthDb();
  await resetProjectSetupConfig();

  const admin = getSupabaseAdminClient();

  if (!admin) {
    summary.supabaseSkipped = true;
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  await resetSupabaseManager(admin);
  await resetSupabaseUsers(admin);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
