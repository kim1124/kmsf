import { cache } from "react";

import { getLocalJsonSessionUserId } from "@/lib/auth/local-session.server";
import { resolveSupabaseAuthorization } from "@/lib/auth/authorization";
import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import type { AppRole } from "@/lib/auth/roles";
import { ensureManagerProfile, getManagerProfile } from "@/lib/supabase/manager";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppSessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  level: number;
  role: AppRole;
  avatarInitials: string;
  avatarDataUrl: string | null;
  authMode: "demo" | "password" | "google" | "supabase" | "local-json";
  isAuthenticated: boolean;
};

function getInitials(value: string) {
  const tokens = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("") || "KM";
}

export const getCurrentUser = cache(async (): Promise<AppSessionUser | null> => {
  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "local-json") {
    const { findLocalJsonAccountById } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );
    const userId = await getLocalJsonSessionUserId();
    const localUser = userId ? await findLocalJsonAccountById(userId) : null;

    if (!localUser) {
      return null;
    }

    return {
      id: localUser.id,
      email: localUser.email,
      username: localUser.username,
      displayName: localUser.displayName,
      level: localUser.level,
      role: localUser.role,
      avatarInitials: getInitials(localUser.displayName),
      avatarDataUrl: null,
      authMode: "local-json",
      isAuthenticated: true,
    };
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const displayName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name
      ? user.user_metadata.full_name
      : user.email.split("@")[0];
  const metadataUsername =
    typeof user.user_metadata?.username === "string" && user.user_metadata.username
      ? user.user_metadata.username
      : displayName;
  const metadataAvatarUrl =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers.filter((provider): provider is string => typeof provider === "string")
    : [];
  const authMode = providers.includes("google")
    ? "google"
    : providers.includes("email")
      ? "password"
      : "supabase";

  await ensureManagerProfile({
    avatarUrl: metadataAvatarUrl,
    displayName,
    email: user.email,
    id: user.id,
    username: metadataUsername,
  });

  const managerProfile = await getManagerProfile(user.id);
  const authorization = resolveSupabaseAuthorization({
    appMetadata: user.app_metadata,
    manager: managerProfile,
  });

  if (authorization.status !== "active") {
    return null;
  }

  const username = managerProfile?.username ?? displayName;
  const email = managerProfile?.email ?? user.email;
  const resolvedDisplayName = managerProfile?.display_name ?? displayName;
  const avatarUrl =
    managerProfile?.avatar_url ?? metadataAvatarUrl;

  return {
    id: user.id,
    email,
    username,
    displayName: resolvedDisplayName,
    level: authorization.level,
    role: authorization.role,
    avatarInitials: getInitials(resolvedDisplayName || username),
    avatarDataUrl: avatarUrl,
    authMode,
    isAuthenticated: true,
  };
});
