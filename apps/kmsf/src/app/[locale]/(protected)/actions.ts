"use server";

import { redirect } from "next/navigation";

import { clearAppSessionCookie } from "@/lib/auth/app-session.server";
import { clearLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import { isLevel3Admin } from "@/lib/auth/access-policy";
import { getGoogleIdentityState } from "@/lib/auth/google-identity";
import {
  resetRuntimeAuthProviderCache,
  resolveRuntimeAuthProvider,
} from "@/lib/auth/providers/runtime-auth-provider";
import { getCurrentUser, type AppSessionUser } from "@/lib/auth/session";
import { appendLocalSystemResetAuditEvent } from "@/lib/auth/system-reset-audit.local-json.server";
import { createLocalSystemResetBackup } from "@/lib/auth/system-reset-backup.server";
import {
  formatSystemResetErrorRoute,
  formatSystemResetSuccessRoute,
  isSystemResetConfirmationValid,
  normalizeSystemResetMode,
  type SystemResetMode,
} from "@/lib/auth/system-reset";
import type { SystemResetActor } from "@/lib/auth/system-reset-audit";
import {
  profileSchema,
  sanitizeEmailInput,
  sanitizeUsernameInput,
} from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  listAllSupabaseAuthUsers,
  resetSupabaseFactorySystem,
  verifySupabaseAccountPassword,
} from "@/lib/supabase/account-admin";
import { updateManagerProfile } from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { getAppUrl, hasSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  appendSupabaseSystemResetAuditEvent,
  insertSupabaseSystemResetBackup,
} from "@/lib/supabase/system-reset-audit";
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

function buildSystemResetActor(user: AppSessionUser): SystemResetActor {
  return {
    email: user.email,
    id: user.id,
    username: user.username,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown system reset error.";
}

async function clearSystemResetRuntimeState(options?: { signOutSupabase?: boolean }) {
  if (options?.signOutSupabase) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearProjectSetupConfig();
  resetRuntimeAuthProviderCache();
  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();
}

async function executeLocalJsonSystemReset(input: {
  actor: SystemResetActor;
  mode: SystemResetMode;
}) {
  const {
    readLocalJsonAuthStoreSnapshot,
    resetLocalJsonAuthStore,
  } = await import("@/lib/auth/providers/local-json-auth-store");
  const snapshot = await readLocalJsonAuthStoreSnapshot();
  const backup = await createLocalSystemResetBackup({
    actor: input.actor,
    mode: input.mode,
    provider: "local-json",
    snapshot: {
      authStore: snapshot,
    },
  });

  await appendLocalSystemResetAuditEvent({
    actorEmail: input.actor.email,
    actorId: input.actor.id,
    actorUsername: input.actor.username,
    backupRef: backup.ref,
    errorMessage: null,
    mode: input.mode,
    provider: "local-json",
    status: "started",
  });

  try {
    if (input.mode === "factory") {
      await resetLocalJsonAuthStore();
    }

    await clearSystemResetRuntimeState();
    await appendLocalSystemResetAuditEvent({
      actorEmail: input.actor.email,
      actorId: input.actor.id,
      actorUsername: input.actor.username,
      backupRef: backup.ref,
      errorMessage: null,
      mode: input.mode,
      provider: "local-json",
      status: "success",
    });
  } catch (error) {
    await appendLocalSystemResetAuditEvent({
      actorEmail: input.actor.email,
      actorId: input.actor.id,
      actorUsername: input.actor.username,
      backupRef: backup.ref,
      errorMessage: getErrorMessage(error),
      mode: input.mode,
      provider: "local-json",
      status: "failed",
    });

    throw error;
  }
}

async function readSupabaseSystemResetSnapshot() {
  const admin = createSupabaseAdminClient();
  const [users, managerResult] = await Promise.all([
    listAllSupabaseAuthUsers(),
    admin
      .from("manager")
      .select("id, username, email, display_name, role, level, status, created_at, updated_at, last_signed_in_at"),
  ]);

  if (managerResult.error) {
    throw managerResult.error;
  }

  return {
    authUsers: users.map((user) => ({
      appMetadata: user.app_metadata,
      createdAt: user.created_at,
      email: user.email ?? null,
      id: user.id,
      lastSignInAt: user.last_sign_in_at ?? null,
      userMetadata: user.user_metadata,
    })),
    managerRows: managerResult.data ?? [],
  };
}

async function executeSupabaseSystemReset(input: {
  actor: SystemResetActor;
  mode: SystemResetMode;
}) {
  const snapshot = await readSupabaseSystemResetSnapshot();
  const backup = await insertSupabaseSystemResetBackup({
    actor: input.actor,
    mode: input.mode,
    provider: "supabase",
    snapshot,
  });

  await appendSupabaseSystemResetAuditEvent({
    actorEmail: input.actor.email,
    actorId: input.actor.id,
    actorUsername: input.actor.username,
    backupRef: backup.ref,
    errorMessage: null,
    mode: input.mode,
    provider: "supabase",
    status: "started",
  });

  try {
    await clearSystemResetRuntimeState({ signOutSupabase: true });

    if (input.mode === "factory") {
      await resetSupabaseFactorySystem();
    }

    await appendSupabaseSystemResetAuditEvent({
      actorEmail: input.actor.email,
      actorId: input.actor.id,
      actorUsername: input.actor.username,
      backupRef: backup.ref,
      errorMessage: null,
      mode: input.mode,
      provider: "supabase",
      status: "success",
    });
  } catch (error) {
    await appendSupabaseSystemResetAuditEvent({
      actorEmail: input.actor.email,
      actorId: input.actor.id,
      actorUsername: input.actor.username,
      backupRef: backup.ref,
      errorMessage: getErrorMessage(error),
      mode: input.mode,
      provider: "supabase",
      status: "failed",
    });

    throw error;
  }
}

export async function resetSystemAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(formatSystemResetErrorRoute("security"));
  }

  const mode = normalizeSystemResetMode(formData.get("mode"));
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const riskAccepted = formData.get("riskAccepted") === "on";
  const currentUser = await getCurrentUser();

  if (!currentUser || !isLevel3Admin(currentUser)) {
    redirect(formatSystemResetErrorRoute("unauthorized"));
  }

  if (!riskAccepted) {
    redirect(formatSystemResetErrorRoute("risk"));
  }

  if (!isSystemResetConfirmationValid(mode, confirmation)) {
    redirect(formatSystemResetErrorRoute("confirmation"));
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();
  const actor = buildSystemResetActor(currentUser);

  if (runtimeProvider.provider === "local-json") {
    const { verifyLocalJsonAccountPassword } = await import(
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
      await executeLocalJsonSystemReset({
        actor,
        mode,
      });
    } catch (error) {
      console.error("resetSystemAction local-json reset failed", { error });
      redirect(formatSystemResetErrorRoute("reset"));
    }

    redirect(formatSystemResetSuccessRoute(mode));
  }

  if (!isSupabaseConfigured() || !hasSupabaseSecretKey()) {
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
    await executeSupabaseSystemReset({
      actor,
      mode,
    });
  } catch (error) {
    console.error("resetSystemAction Supabase reset failed", { error, userId: currentUser.id });
    redirect(formatSystemResetErrorRoute("reset"));
  }

  redirect(formatSystemResetSuccessRoute(mode));
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

export type DeleteAccountFormState = {
  error: "delete" | "password" | "security" | "service-role" | "validation" | null;
};

export async function deleteAccountAction(
  _prevState: DeleteAccountFormState,
  formData: FormData,
): Promise<DeleteAccountFormState> {
  if (!(await verifyCsrfToken(formData))) {
    return { error: "security" };
  }

  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "password" };
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/sign-in`);
  }

  if (runtimeProvider.provider === "local-json") {
    const { deleteLocalJsonAccount, verifyLocalJsonAccountPassword } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );
    const passwordValid = await verifyLocalJsonAccountPassword(currentUser.id, password);

    if (!passwordValid) {
      return { error: "password" };
    }

    await deleteLocalJsonAccount(currentUser.id);
    await clearLocalJsonSessionCookie();
    await clearAppSessionCookie();

    redirect(`/sign-in?success=deleted`);
  }

  if (!isSupabaseConfigured()) {
    return { error: "validation" };
  }

  if (!hasSupabaseSecretKey()) {
    return { error: "service-role" };
  }

  let passwordValid = false;

  try {
    passwordValid = await verifySupabaseAccountPassword(currentUser.email, password);
  } catch (error) {
    console.error("deleteAccountAction Supabase password verification failed", {
      error,
      userId: currentUser.id,
    });
    return { error: "password" };
  }

  if (!passwordValid) {
    return { error: "password" };
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
    return { error: "delete" };
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
