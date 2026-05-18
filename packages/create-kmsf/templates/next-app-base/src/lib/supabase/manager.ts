import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagerProfile = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
};

export function buildManagerRecord(input: {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
}) {
  const timestamp = new Date().toISOString();

  return {
    id: input.id,
    username: input.username,
    email: input.email,
    avatar_url: input.avatarUrl ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function ensureManagerProfile(input: {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
}) {
  if (!hasSupabaseServiceRoleKey()) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("manager")
    .upsert(buildManagerRecord(input), { onConflict: "id" });

  if (error) {
    console.error("ensureManagerProfile failed", {
      code: error.code,
      message: error.message,
      userId: input.id,
    });
  }
}

export const isInitialSetupRequired = cache(async () => {
  if (hasSupabaseServiceRoleKey()) {
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
    .select("id, username, email, avatar_url")
    .eq("id", userId)
    .maybeSingle<ManagerProfile>();

  if (error) {
    return null;
  }

  return data;
});

export async function findManagerLoginEmail(identifier: string) {
  const normalized = identifier.trim();

  if (normalized.includes("@")) {
    return normalized;
  }

  if (hasSupabaseServiceRoleKey()) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("manager")
      .select("email")
      .eq("username", normalized)
      .maybeSingle<{ email: string }>();

    if (!error && data?.email) {
      return data.email;
    }
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

  if (hasSupabaseServiceRoleKey()) {
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

  if (!normalized || !hasSupabaseServiceRoleKey()) {
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
