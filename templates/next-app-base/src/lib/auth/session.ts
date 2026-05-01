import { cache } from "react";

import { getLocalJsonSessionUserId } from "@/lib/auth/local-session.server";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { normalizeRole, type AppRole } from "@/lib/auth/roles";
import { ensureManagerProfile, getManagerProfile } from "@/lib/supabase/manager";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppSessionUser = {
  id: string;
  email: string;
  displayName: string;
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
  if (isLocalJsonAuthEnabled()) {
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
      displayName: localUser.username,
      role: localUser.role,
      avatarInitials: getInitials(localUser.username),
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

  const role =
    normalizeRole(
      typeof user.app_metadata?.role === "string"
        ? user.app_metadata.role
        : typeof user.user_metadata?.role === "string"
          ? user.user_metadata.role
          : null,
    ) ?? "member";

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
    id: user.id,
    username: metadataUsername,
    email: user.email,
    avatarUrl: metadataAvatarUrl,
  });

  const managerProfile = await getManagerProfile(user.id);
  const username = managerProfile?.username ?? displayName;
  const email = managerProfile?.email ?? user.email;
  const avatarUrl =
    managerProfile?.avatar_url ?? metadataAvatarUrl;

  return {
    id: user.id,
    email,
    displayName: username,
    role,
    avatarInitials: getInitials(username),
    avatarDataUrl: avatarUrl,
    authMode,
    isAuthenticated: true,
  };
});
