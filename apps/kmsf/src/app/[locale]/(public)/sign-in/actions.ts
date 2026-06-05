"use server";

import { redirect } from "next/navigation";

import {
  buildAccountLoginGuardIdentifier,
  buildUnknownLoginGuardIdentifier,
  getLoginLockRemainingSeconds,
  hashLoginIdentifier,
} from "@/lib/auth/login-guard";
import { touchAppSessionCookie } from "@/lib/auth/app-session.server";
import { setLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import { createSupabaseAccountWithManager } from "@/lib/supabase/account-admin";
import {
  accountSchema,
  createEmptyAccountFieldErrors,
  createEmptySignInFieldErrors,
  getAccountFieldErrors,
  sanitizeEmailInput,
  sanitizeUsernameInput,
  getSignInFieldErrors,
  signInSchema,
  type AccountFieldErrors,
  type AccountFields,
  type SignInFieldErrors,
  type SignInFields,
} from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  findManagerLoginIdentity,
  isAuthEmailTaken,
  isManagerUsernameTaken,
  touchManagerLastSignedIn,
} from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { getAppUrl, hasSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";

export type SignInFormState = {
  authError: "auth" | "locked" | "security" | null;
  fields: SignInFields;
  fieldErrors: SignInFieldErrors;
  lockedRemainingSeconds: number | null;
};

export type SignUpFormState = {
  authError: "auth" | "security" | null;
  fields: AccountFields;
  fieldErrors: AccountFieldErrors;
};

function buildSignInState(
  fields: SignInFields,
  options?: {
    authError?: SignInFormState["authError"];
    fieldErrors?: Partial<SignInFieldErrors>;
    lockedRemainingSeconds?: number | null;
  },
): SignInFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptySignInFieldErrors(),
      ...options?.fieldErrors,
    },
    lockedRemainingSeconds: options?.lockedRemainingSeconds ?? null,
  };
}

function buildSignUpState(
  fields: AccountFields,
  options?: {
    authError?: SignUpFormState["authError"];
    fieldErrors?: Partial<AccountFieldErrors>;
  },
): SignUpFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptyAccountFieldErrors(),
      ...options?.fieldErrors,
    },
  };
}

export async function signInAction(
  _prevState: SignInFormState,
  formData: FormData,
) {
  const parsed = signInSchema.safeParse({
    locale: formData.get("locale"),
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    password: formData.get("password"),
  });

  const fields = {
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    password: String(formData.get("password") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildSignInState(fields, { authError: "security" });
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (parsed.success && runtimeProvider.provider === "local-json") {
    const {
      getLocalJsonLoginLock,
      recordLocalJsonLoginBlocked,
      recordLocalJsonLoginFailure,
      recordLocalJsonLoginSuccess,
      verifyLocalJsonCredentials,
    } = await import("@/lib/auth/providers/local-json-auth-store");
    const lock = await getLocalJsonLoginLock(parsed.data.username);

    if (lock.status === "locked") {
      await recordLocalJsonLoginBlocked(parsed.data.username);
      return buildSignInState(fields, {
        authError: "locked",
        lockedRemainingSeconds: lock.remainingSeconds,
      });
    }

    const account = await verifyLocalJsonCredentials(parsed.data.username, parsed.data.password);

    if (!account) {
      const failure = await recordLocalJsonLoginFailure(parsed.data.username);

      if (failure.status === "locked") {
        return buildSignInState(fields, {
          authError: "locked",
          lockedRemainingSeconds: failure.remainingSeconds,
        });
      }

      return buildSignInState(fields, { authError: "auth" });
    }

    await recordLocalJsonLoginSuccess(parsed.data.username, account.id);
    await setLocalJsonSessionCookie(account.id);
    await touchAppSessionCookie();
    redirect(`/dashboard`);
  }

  if (!parsed.success || !isSupabaseConfigured()) {
    return buildSignInState(fields, {
      fieldErrors: !parsed.success ? getSignInFieldErrors(parsed.error) : undefined,
      authError: parsed.success ? "auth" : null,
    });
  }

  const loginIdentity = await findManagerLoginIdentity(parsed.data.username);
  const guardIdentifier = loginIdentity
    ? buildAccountLoginGuardIdentifier(loginIdentity.id)
    : buildUnknownLoginGuardIdentifier(parsed.data.username);
  const identifierHash = hashLoginIdentifier("supabase", guardIdentifier);
  const {
    checkLoginGuard,
    recordLoginBlocked,
    recordLoginFailure,
    recordLoginSuccess,
  } = await import("@/lib/supabase/login-guard");
  const guard = await checkLoginGuard({
    identifierHash,
    provider: "supabase",
  });

  if (guard.locked) {
    await recordLoginBlocked({
      identifierHash,
      provider: "supabase",
      reason: "lockout",
    });
    return buildSignInState(fields, {
      authError: "locked",
      lockedRemainingSeconds: getLoginLockRemainingSeconds(guard.lockedUntil.toISOString()),
    });
  }

  if (!loginIdentity) {
    const failure = await recordLoginFailure({
      identifierHash,
      provider: "supabase",
      reason: "unknown_identifier",
    });

    if (failure.locked) {
      return buildSignInState(fields, {
        authError: "locked",
        lockedRemainingSeconds: getLoginLockRemainingSeconds(failure.lockedUntil.toISOString()),
      });
    }

    return buildSignInState(fields, { authError: "auth" });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginIdentity.email,
    password: parsed.data.password,
  });

  if (error) {
    const failure = await recordLoginFailure({
      identifierHash,
      provider: "supabase",
      reason: "invalid_credentials",
    });

    if (failure.locked) {
      return buildSignInState(fields, {
        authError: "locked",
        lockedRemainingSeconds: getLoginLockRemainingSeconds(failure.lockedUntil.toISOString()),
      });
    }

    return buildSignInState(fields, { authError: "auth" });
  }

  if (data.user) {
    await recordLoginSuccess({
      accountId: data.user.id,
      identifierHash,
      provider: "supabase",
    });
    await touchManagerLastSignedIn(data.user.id);
  }

  await touchAppSessionCookie();
  redirect(`/dashboard`);
}

export async function signInWithGoogleAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/sign-in?error=security`);
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (!isSupabaseConfigured() || runtimeProvider.provider === "local-json") {
    redirect(`/sign-in?error=oauth`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data.url) {
    redirect(`/sign-in?error=oauth`);
  }

  redirect(data.url as never);
}

export async function signUpAction(
  _prevState: SignUpFormState,
  formData: FormData,
) {
  const parsed = accountSchema.safeParse({
    locale: formData.get("locale"),
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
  });

  const fields = {
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildSignUpState(fields, { authError: "security" });
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (parsed.success && runtimeProvider.provider === "local-json") {
    const { createLocalJsonAccount, LocalJsonAuthStoreError } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );
    let account;

    try {
      account = await createLocalJsonAccount({
        username: parsed.data.username,
        email: parsed.data.email,
        password: parsed.data.password,
        role: "member",
      });
    } catch (error) {
      if (error instanceof LocalJsonAuthStoreError) {
        return buildSignUpState(fields, {
          fieldErrors: {
            username: error.code === "duplicate_username" ? "duplicate.username" : null,
            email: error.code === "duplicate_email" ? "duplicate.email" : null,
          },
        });
      }

      console.error("signUpAction local-json failed", { error });
      return buildSignUpState(fields, { authError: "auth" });
    }

    await setLocalJsonSessionCookie(account.id);
    await touchAppSessionCookie();
    redirect(`/dashboard`);
  }

  if (!parsed.success || !isSupabaseConfigured()) {
    return buildSignUpState(fields, {
      fieldErrors: !parsed.success ? getAccountFieldErrors(parsed.error) : undefined,
      authError: parsed.success ? "auth" : null,
    });
  }

  const supabase = await createSupabaseServerClient();
  const [usernameTaken, emailTaken] = await Promise.all([
    isManagerUsernameTaken(parsed.data.username),
    isAuthEmailTaken(parsed.data.email),
  ]);

  if (usernameTaken || emailTaken) {
    return buildSignUpState(fields, {
      fieldErrors: {
        username: usernameTaken ? "duplicate.username" : null,
        email: emailTaken ? "duplicate.email" : null,
      },
    });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  let error:
    | {
        code?: string;
        message: string;
        status?: number;
      }
    | null = null;
  let shouldSignIn = false;

  if (hasSupabaseSecretKey()) {
    const { error: createError, user } = await createSupabaseAccountWithManager({
      email: normalizedEmail,
      password: parsed.data.password,
      role: "member",
      username: parsed.data.username,
    });

    error = createError;
    shouldSignIn = !createError;
    shouldSignIn = Boolean(user);
  } else {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: parsed.data.password,
      options: {
        data: {
          username: parsed.data.username,
        },
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      },
    });

    error = signUpError;
    shouldSignIn = Boolean(data.session);
  }

  if (error) {
    console.error("signUpAction failed", {
      code: error.code,
      message: error.message,
      status: error.status ?? null,
      email: normalizedEmail,
      username: parsed.data.username,
    });

    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("duplicate") ||
      error.code === "user_already_exists"
    ) {
      const [conflictUsername, conflictEmail] = await Promise.all([
        isManagerUsernameTaken(parsed.data.username),
        isAuthEmailTaken(normalizedEmail),
      ]);

      return buildSignUpState(fields, {
        fieldErrors: {
          username: conflictUsername ? "duplicate.username" : null,
          email: conflictEmail ? "duplicate.email" : null,
        },
      });
    }

    return buildSignUpState(fields, { authError: "auth" });
  }

  if (!shouldSignIn) {
    redirect(`/sign-in?success=confirm-email`);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parsed.data.password,
  });

  if (signInError) {
    redirect(`/sign-in?error=auth`);
  }

  if (signInData.user) {
    await touchManagerLastSignedIn(signInData.user.id);
  }

  await touchAppSessionCookie();
  redirect(`/dashboard`);
}
