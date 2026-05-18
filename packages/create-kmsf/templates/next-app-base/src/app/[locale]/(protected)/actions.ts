"use server";

import { redirect } from "next/navigation";

import { clearAppSessionCookie } from "@/lib/auth/app-session.server";
import { clearLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import { getGoogleIdentityState } from "@/lib/auth/google-identity";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import {
  profileSchema,
  sanitizeEmailInput,
  sanitizeUsernameInput,
} from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateManagerProfile } from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { getAppUrl, hasSupabaseServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?accountError=security`);
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();
  redirect(`/sign-in`);
}

export async function updateProfileAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    return { error: "security" };
  }

  const avatarDataUrl = String(formData.get("avatarDataUrl") ?? "").trim();
  const parsed = profileSchema.safeParse({
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success || !isSupabaseConfigured()) {
    return { error: "validation" };
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "unauthorized" };
  }

  const supabase = await createSupabaseServerClient();
  const { error: authError } = await supabase.auth.updateUser({
    email: parsed.data.email,
    password: parsed.data.password || undefined,
    data: {
      username: parsed.data.username,
      avatar_url: avatarDataUrl.startsWith("data:image/") ? avatarDataUrl : null,
    },
  });

  if (authError) {
    return { error: "auth" };
  }

  const { error: managerError } = await updateManagerProfile({
    id: currentUser.id,
    username: parsed.data.username,
    email: parsed.data.email,
    avatarUrl: avatarDataUrl.startsWith("data:image/") ? avatarDataUrl : null,
  });

  if (managerError) {
    return { error: "duplicate" };
  }

  return { success: true };
}

export async function deleteAccountAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?accountError=security`);
  }

  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  if (confirmation !== "DELETE") {
    redirect(`/settings?accountError=validation`);
  }

  if (isLocalJsonAuthEnabled()) {
    const { deleteLocalJsonAccount } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect(`/sign-in`);
    }

    await deleteLocalJsonAccount(currentUser.id);
    await clearLocalJsonSessionCookie();
    await clearAppSessionCookie();

    redirect(`/sign-in?success=deleted`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`/settings?accountError=validation`);
  }

  if (!hasSupabaseServiceRoleKey()) {
    redirect(`/settings?accountError=service-role`);
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/sign-in`);
  }

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(currentUser.id);

  if (deleteAuthError) {
    console.error("deleteAccountAction auth delete failed", {
      code: deleteAuthError.code,
      message: deleteAuthError.message,
      status: deleteAuthError.status ?? null,
      userId: currentUser.id,
    });
    redirect(`/settings?accountError=delete`);
  }

  const { error: deleteManagerError } = await admin.from("manager").delete().eq("id", currentUser.id);

  if (deleteManagerError) {
    console.error("deleteAccountAction manager cleanup failed", {
      code: deleteManagerError.code,
      message: deleteManagerError.message,
      userId: currentUser.id,
    });
  }

  await supabase.auth.signOut();
  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();

  redirect(`/sign-in?success=deleted`);
}

export async function linkGoogleIdentityAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?googleError=security`);
  }

  if (!isSupabaseConfigured() || isLocalJsonAuthEnabled()) {
    redirect(`/settings?googleError=unavailable`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/settings?google=linked`,
    },
  });

  if (error || !data.url) {
    redirect(`/settings?googleError=link`);
  }

  redirect(data.url as never);
}

export async function unlinkGoogleIdentityAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?googleError=security`);
  }

  if (!isSupabaseConfigured() || isLocalJsonAuthEnabled()) {
    redirect(`/settings?googleError=unavailable`);
  }

  const { state, error: identityError } = await getGoogleIdentityState();

  if (identityError || !state.identity) {
    redirect(`/settings?googleError=missing`);
  }

  if (!state.canUnlink) {
    redirect(`/settings?googleError=single-identity`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.unlinkIdentity(state.identity);

  if (error) {
    redirect(`/settings?googleError=unlink`);
  }

  redirect(`/settings?google=unlinked`);
}
