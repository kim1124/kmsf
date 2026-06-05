import { cache } from "react";

import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import type { AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseSecretKey } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagerProfile = {
  avatar_url: string | null;
  display_name: string | null;
  email: string;
  id: string;
  last_signed_in_at: string | null;
  level: number | null;
  role: AppRole | null;
  status: "active" | "suspended" | null;
  username: string;
};

export function buildManagerRecord(input: {
  avatarUrl?: string | null;
  displayName?: string | null;
  email: string;
  id: string;
  lastSignedInAt?: string | null;
  level?: number;
  role?: AppRole;
  status?: "active" | "suspended";
  username: string;
}) {
  const timestamp = new Date().toISOString();
  const role = input.role ?? "member";

  return {
    avatar_url: input.avatarUrl ?? null,
    display_name: input.displayName ?? input.username,
    email: input.email,
    id: input.id,
    last_signed_in_at: input.lastSignedInAt ?? null,
    level: input.level ?? (role === "admin" ? 3 : 1),
    role,
    status: input.status ?? "active",
    username: input.username,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function ensureManagerProfile(input: {
  avatarUrl?: string | null;
  displayName?: string | null;
  email: string;
  id: string;
  username: string;
}) {
  if (!hasSupabaseSecretKey()) {
    return;
  }

  const timestamp = new Date().toISOString();
  const profileRecord = {
    avatar_url: input.avatarUrl ?? null,
    display_name: input.displayName ?? input.username,
    email: input.email,
    id: input.id,
    username: input.username,
    updated_at: timestamp,
  };
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("manager")
    .upsert(profileRecord, { onConflict: "id" });

  if (error) {
    console.error("ensureManagerProfile failed", {
      code: error.code,
      message: error.message,
      userId: input.id,
    });
  }
}

export async function touchManagerLastSignedIn(id: string) {
  if (!hasSupabaseSecretKey()) {
    return;
  }

  const timestamp = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("manager")
    .update({
      last_signed_in_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", id);

  if (error) {
    console.error("touchManagerLastSignedIn failed", {
      code: error.code,
      message: error.message,
      userId: id,
    });
  }
}

export const isInitialSetupRequired = cache(async () => {
  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "local-json") {
    const { hasLocalJsonAccounts } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );

    return !(await hasLocalJsonAccounts());
  }

  if (hasSupabaseSecretKey()) {
    const admin = createSupabaseAdminClient();
    const { count, error } = await admin
      .from("manager")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("isInitialSetupRequired admin query failed", {
        code: error.code,
        message: error.message,
      });
      return false;
    }

    return (count ?? 0) === 0;
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("manager")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("isInitialSetupRequired failed", {
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return (count ?? 0) === 0;
});

export const getManagerProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("manager")
    .select("id, username, email, avatar_url, display_name, role, level, status, last_signed_in_at")
    .eq("id", userId)
    .maybeSingle<ManagerProfile>();

  if (error) {
    return null;
  }

  return data;
});

export type ManagerLoginIdentity = Pick<ManagerProfile, "email" | "id" | "username">;

export async function findManagerLoginIdentity(
  identifier: string,
): Promise<ManagerLoginIdentity | null> {
  const normalized = identifier.trim();

  if (!normalized || !hasSupabaseSecretKey()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const column = normalized.includes("@") ? "email" : "username";
  const value = column === "email" ? normalized.toLowerCase() : normalized;
  const { data, error } = await admin
    .from("manager")
    .select("id, email, username")
    .eq(column, value)
    .maybeSingle<ManagerLoginIdentity>();

  if (error || !data?.id || !data.email || !data.username) {
    return null;
  }

  return data;
}

export async function findManagerLoginEmail(identifier: string) {
  const normalized = identifier.trim();

  const loginIdentity = await findManagerLoginIdentity(normalized);

  if (loginIdentity?.email) {
    return loginIdentity.email;
  }

  if (normalized.includes("@")) {
    return normalized.toLowerCase();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_manager_login_email", {
    login_username: normalized,
  });

  if (!error && typeof data === "string" && data) {
    return data;
  }

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("manager")
      .select("email")
      .eq("username", normalized)
      .maybeSingle<{ email: string }>();

    if (!fallbackError && fallbackData?.email) {
      return fallbackData.email;
    }
  }

  if (typeof data !== "string" || !data) {
    return null;
  }

  return data;
}

export async function isManagerUsernameTaken(username: string) {
  const normalized = username.trim();

  if (!normalized) {
    return false;
  }

  if (hasSupabaseSecretKey()) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("manager")
      .select("id")
      .eq("username", normalized)
      .maybeSingle<{ id: string }>();

    if (!error && data?.id) {
      return true;
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_manager_login_email", {
    login_username: normalized,
  });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("manager")
      .select("id")
      .eq("username", normalized)
      .maybeSingle<{ id: string }>();

    if (!fallbackError && fallbackData?.id) {
      return true;
    }

    return false;
  }

  return typeof data === "string" && data.length > 0;
}

export async function isAuthEmailTaken(email: string) {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !hasSupabaseSecretKey()) {
    return false;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    console.error("isAuthEmailTaken listUsers failed", {
      code: error.code,
      message: error.message,
      email: normalized,
    });
    return false;
  }

  return (data.users ?? []).some((user) => user.email?.toLowerCase() === normalized);
}

export async function updateManagerProfile(input: {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("manager")
    .update({
      username: input.username,
      email: input.email,
      avatar_url: input.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
}
