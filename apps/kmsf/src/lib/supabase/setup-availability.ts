import type { SupabaseClient } from "@supabase/supabase-js";

import { INITIAL_ADMIN_USERNAME } from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseApiKey, getSupabaseSecretKey } from "@/lib/supabase/env";

type SupabaseSetupEnv = Partial<NodeJS.ProcessEnv>;

export type SupabaseSetupAvailabilityReason =
  | "missing-api-key"
  | "missing-secret-key"
  | "missing-url"
  | "ready"
  | "unavailable";

export type SupabaseSetupState = "fresh" | "remote-initialized" | "unknown";

export type SupabaseSetupInspection = {
  adminEmail: string | null;
  adminExists: boolean;
  managerCount: number | null;
  setupState: SupabaseSetupState;
};

export type SupabaseSetupAvailability = {
  adminEmail: string | null;
  adminExists: boolean;
  available: boolean;
  managerCount: number | null;
  reason: SupabaseSetupAvailabilityReason;
  setupState: SupabaseSetupState;
};

type SupabaseSetupAvailabilityOptions = {
  inspectSetupState?: (env: SupabaseSetupEnv) => Promise<SupabaseSetupInspection>;
  probeAuthHealth?: (env: SupabaseSetupEnv) => Promise<void>;
  verifyAdminAccess?: (env: SupabaseSetupEnv) => Promise<void>;
};

const UNKNOWN_SETUP_INSPECTION: SupabaseSetupInspection = {
  adminEmail: null,
  adminExists: false,
  managerCount: null,
  setupState: "unknown",
};

function getEnvSupabaseApiKey(env: SupabaseSetupEnv) {
  return env.SUPABASE_API_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

function getEnvSupabaseSecretKey(env: SupabaseSetupEnv) {
  return env.SUPABASE_SECRET_KEY ?? "";
}

async function probeSupabaseAuthHealth(env: SupabaseSetupEnv) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const apiKey = getEnvSupabaseApiKey(env);

  if (!supabaseUrl || !apiKey) {
    throw new Error("Supabase URL or API key is missing.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    cache: "no-store",
    headers: {
      apikey: apiKey,
    },
    signal: AbortSignal.timeout(1_500),
  });

  if (!response.ok) {
    throw new Error(`Supabase Auth health probe failed with HTTP ${response.status}.`);
  }
}

async function verifySupabaseAdminAccess() {
  const admin = createSupabaseAdminClient() as SupabaseClient;
  const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    throw new Error(error.message);
  }
}

async function inspectSupabaseSetupState() {
  const admin = createSupabaseAdminClient() as SupabaseClient;
  const { count, error: countError } = await admin
    .from("manager")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  const { data: adminRow, error: adminError } = await admin
    .from("manager")
    .select("email")
    .eq("username", INITIAL_ADMIN_USERNAME)
    .maybeSingle<{ email: string }>();

  if (adminError) {
    throw new Error(adminError.message);
  }

  const managerCount = count ?? 0;
  const adminEmail = adminRow?.email ?? null;
  const adminExists = Boolean(adminEmail);

  return {
    adminEmail,
    adminExists,
    managerCount,
    setupState: managerCount > 0 || adminExists ? "remote-initialized" : "fresh",
  } satisfies SupabaseSetupInspection;
}

function buildUnavailable(reason: Exclude<SupabaseSetupAvailabilityReason, "ready">) {
  return {
    ...UNKNOWN_SETUP_INSPECTION,
    available: false,
    reason,
  } satisfies SupabaseSetupAvailability;
}

export async function checkSupabaseSetupAvailability(
  env: SupabaseSetupEnv = process.env,
  options: SupabaseSetupAvailabilityOptions = {},
): Promise<SupabaseSetupAvailability> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    return buildUnavailable("missing-url");
  }

  if (!getEnvSupabaseApiKey(env)) {
    return buildUnavailable("missing-api-key");
  }

  if (!getEnvSupabaseSecretKey(env)) {
    return buildUnavailable("missing-secret-key");
  }

  try {
    await (options.probeAuthHealth ?? probeSupabaseAuthHealth)(env);
    await (options.verifyAdminAccess ?? verifySupabaseAdminAccess)(env);
    const inspection = await (options.inspectSetupState ?? inspectSupabaseSetupState)(env);

    return {
      ...inspection,
      available: true,
      reason: "ready",
    };
  } catch (error) {
    console.error("checkSupabaseSetupAvailability failed", { error });
    return buildUnavailable("unavailable");
  }
}

export async function getCurrentSupabaseSetupAvailability() {
  return checkSupabaseSetupAvailability({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_API_KEY: getSupabaseApiKey(),
    SUPABASE_SECRET_KEY: getSupabaseSecretKey(),
  });
}
