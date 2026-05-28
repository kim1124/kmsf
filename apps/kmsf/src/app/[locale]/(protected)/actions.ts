"use server";

import { redirect } from "next/navigation";

import { clearAppSessionCookie } from "@/lib/auth/app-session.server";
import { clearLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import { isLevel3Admin } from "@/lib/auth/access-policy";
import { getGoogleIdentityState } from "@/lib/auth/google-identity";
import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import {
  formatSystemResetErrorRoute,
  formatSystemResetSuccessRoute,
  isSystemResetConfirmationValid,
} from "@/lib/auth/system-reset";
import {
  profileSchema,
  sanitizeEmailInput,
  sanitizeUsernameInput,
} from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  resetSupabaseFactorySystem,
  verifySupabaseAccountPassword,
} from "@/lib/supabase/account-admin";
import { updateManagerProfile } from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { getAppUrl, hasSupabaseServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearProjectSetupConfig } from "@/lib/setup/project-setup-config";

export async function signOutAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?accountError=security`);
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "supabase" && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();
  redirect(`/sign-in`);
}

export async function resetSystemAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(formatSystemResetErrorRoute("security"));
  }

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const currentUser = await getCurrentUser();

  if (!currentUser || !isLevel3Admin(currentUser)) {
    redirect(formatSystemResetErrorRoute("unauthorized"));
  }

  if (!isSystemResetConfirmationValid(confirmation)) {
    redirect(formatSystemResetErrorRoute("confirmation"));
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "local-json") {
    const { resetLocalJsonAuthStore, verifyLocalJsonAccountPassword } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );
    const passwordValid = await verifyLocalJsonAccountPassword(currentUser.id, password);

    if (!passwordValid) {
      console.error("resetSystemAction local-json password verification failed", {
        userId: currentUser.id,
      });
      redirect(formatSystemResetErrorRoute("auth"));
    }

    try {
      await resetLocalJsonAuthStore();
      await clearProjectSetupConfig();
      await clearLocalJsonSessionCookie();
      await clearAppSessionCookie();
    } catch (error) {
      console.error("resetSystemAction local-json reset failed", { error });
      redirect(formatSystemResetErrorRoute("reset"));
    }

    redirect(formatSystemResetSuccessRoute());
  }

  if (!isSupabaseConfigured() || !hasSupabaseServiceRoleKey()) {
    redirect(formatSystemResetErrorRoute("service-role"));
  }

  let passwordValid = false;

  try {
    passwordValid = await verifySupabaseAccountPassword(currentUser.email, password);
  } catch (error) {
    console.error("resetSystemAction Supabase password verification failed", {
      error,
      userId: currentUser.id,
    });
    redirect(formatSystemResetErrorRoute("auth"));
  }

  if (!passwordValid) {
    console.error("resetSystemAction Supabase password verification rejected", {
      userId: currentUser.id,
    });
    redirect(formatSystemResetErrorRoute("auth"));
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    await resetSupabaseFactorySystem();
    await clearLocalJsonSessionCookie();
    await clearAppSessionCookie();
  } catch (error) {
    console.error("resetSystemAction Supabase reset failed", { error, userId: currentUser.id });
    redirect(formatSystemResetErrorRoute("reset"));
  }

  redirect(formatSystemResetSuccessRoute());
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

  if (!parsed.success) {
    return { error: "validation" };
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "unauthorized" };
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "local-json") {
    const { updateLocalJsonAccount, LocalJsonAuthStoreError } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );

    try {
      const updated = await updateLocalJsonAccount(currentUser.id, {
        username: parsed.data.username,
        email: parsed.data.email,
        password: parsed.data.password || undefined,
      });

      return updated ? { success: true } : { error: "unauthorized" };
    } catch (error) {
      if (error instanceof LocalJsonAuthStoreError) {
        return { error: "duplicate" };
      }

      console.error("updateProfileAction local-json failed", { error });
      return { error: "auth" };
    }
  }

  if (!isSupabaseConfigured()) {
    return { error: "validation" };
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

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (runtimeProvider.provider === "local-json") {
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

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (!isSupabaseConfigured() || runtimeProvider.provider === "local-json") {
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

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (!isSupabaseConfigured() || runtimeProvider.provider === "local-json") {
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
