import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import { resolveSupabaseAuthorization } from "@/lib/auth/authorization";
import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import type { AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";

export type AccountDirectoryEntry = {
  createdAt: string | null;
  displayName: string;
  email: string;
  id: string;
  lastSignedInAt: string | null;
  level: number;
  role: AppRole;
  username: string;
};

export type AccountDirectoryResult = {
  accounts: AccountDirectoryEntry[];
  provider: AuthProviderKind;
  unavailableReason: "service-role-required" | "supabase-query-failed" | "supabase-unconfigured" | null;
};

type SupabaseManagerRecord = {
  avatar_url?: string | null;
  created_at?: string | null;
  display_name?: string | null;
  email?: string | null;
  id: string;
  last_signed_in_at?: string | null;
  level?: number | null;
  role?: string | null;
  status?: string | null;
  updated_at?: string | null;
  username?: string | null;
};

function getMetadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function getAccountDirectory(): Promise<AccountDirectoryResult> {
  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "local-json") {
    const { listKmsfManagedAccounts } = await import(
      "@/lib/auth/providers/kmsf-managed-auth-store"
    );
    const accounts = await listKmsfManagedAccounts();

    return {
      accounts: accounts.map((account) => ({
        createdAt: account.createdAt,
        displayName: account.displayName,
        email: account.email,
        id: account.id,
        lastSignedInAt: account.lastSignedInAt,
        level: account.level,
        role: account.role,
        username: account.username,
      })),
      provider: "local-json",
      unavailableReason: null,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      accounts: [],
      provider: "supabase",
      unavailableReason: "supabase-unconfigured",
    };
  }

  if (!hasSupabaseSecretKey()) {
    return {
      accounts: [],
      provider: "supabase",
      unavailableReason: "service-role-required",
    };
  }

  const admin = createSupabaseAdminClient();
  const [{ data: usersData, error: usersError }, { data: managerData, error: managerError }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 101 }),
      admin
        .from("manager")
        .select(
          "id, username, email, display_name, role, level, status, created_at, updated_at, last_signed_in_at",
        ),
    ]);

  if (usersError || managerError) {
    console.error("getAccountDirectory failed", {
      managerError,
      usersError,
    });

    return {
      accounts: [],
      provider: "supabase",
      unavailableReason: "supabase-query-failed",
    };
  }

  const managerById = new Map(
    ((managerData ?? []) as SupabaseManagerRecord[]).map((profile) => [profile.id, profile]),
  );
  const accounts = (usersData.users ?? []).map((user) => {
    const profile = managerById.get(user.id);
    const authorization = resolveSupabaseAuthorization({
      appMetadata: user.app_metadata,
      manager: profile ?? null,
    });
    const displayName =
      getMetadataText(profile?.display_name) ??
      getMetadataText(user.user_metadata?.full_name) ??
      profile?.username ??
      user.email?.split("@")[0] ??
      user.id;

    return {
      createdAt: profile?.created_at ?? user.created_at ?? null,
      displayName,
      email: profile?.email ?? user.email ?? "",
      id: user.id,
      lastSignedInAt: profile?.last_signed_in_at ?? user.last_sign_in_at ?? null,
      level: authorization.level,
      role: authorization.role,
      username: profile?.username ?? getMetadataText(user.user_metadata?.username) ?? displayName,
    };
  });

  return {
    accounts: accounts.sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? "")),
    provider: "supabase",
    unavailableReason: null,
  };
}
