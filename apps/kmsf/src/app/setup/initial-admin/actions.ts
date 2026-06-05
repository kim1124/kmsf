"use server";

import { redirect } from "next/navigation";

import { touchAppSessionCookie } from "@/lib/auth/app-session.server";
import { setLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import {
  resetRuntimeAuthProviderCache,
  resolveRuntimeAuthProvider,
} from "@/lib/auth/providers/runtime-auth-provider";
import { createSupabaseAccountWithManager } from "@/lib/supabase/account-admin";
import {
  accountSchema,
  createEmptyAccountFieldErrors,
  getAccountFieldErrors,
  INITIAL_ADMIN_USERNAME,
  sanitizeEmailInput,
  type AccountFieldErrors,
  type AccountFields,
} from "@/lib/auth/validation";
import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import { hasSupabaseSecretKey } from "@/lib/supabase/env";
import {
  isAuthEmailTaken,
  isManagerUsernameTaken,
  isInitialSetupRequired,
  touchManagerLastSignedIn,
} from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeProjectSetupConfig } from "@/lib/setup/project-setup-config";

type InitialSetupAuthProvider = AuthProviderKind;

type InitialAdminFields = AccountFields & {
  authProvider: InitialSetupAuthProvider;
  displayName: string;
};

type InitialAdminFieldErrors = AccountFieldErrors & {
  displayName: string | null;
};

export type InitialAdminFormState = {
  authError: "auth.failed" | "security.invalid" | null;
  fields: InitialAdminFields;
  fieldErrors: InitialAdminFieldErrors;
};

const ADMIN_LEVEL = 3;
const INITIAL_ADMIN_DISPLAY_NAME = "admin";

function buildState(
  fields: InitialAdminFields,
  options?: {
    authError?: InitialAdminFormState["authError"];
    fieldErrors?: Partial<InitialAdminFieldErrors>;
  },
): InitialAdminFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptyAccountFieldErrors(),
      displayName: null,
      ...options?.fieldErrors,
    },
  };
}

function normalizeInitialSetupAuthProvider(value: FormDataEntryValue | null): InitialSetupAuthProvider {
  return value === "supabase" ? "supabase" : "local-json";
}

export async function createInitialAdminAction(
  _prevState: InitialAdminFormState,
  formData: FormData,
) {
  const fields = {
    authProvider: normalizeInitialSetupAuthProvider(formData.get("authProvider")),
    displayName: INITIAL_ADMIN_DISPLAY_NAME,
    username: INITIAL_ADMIN_USERNAME,
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildState(fields, { authError: "security.invalid" });
  }

  const parsed = accountSchema.safeParse(fields);

  if (!parsed.success) {
    return buildState(fields, {
      fieldErrors: getAccountFieldErrors(parsed.error),
    });
  }

  const setupRequired = await isInitialSetupRequired();

  if (!setupRequired) {
    redirect("/sign-in");
  }

  const runtimeProvider = await resolveRuntimeAuthProvider();
  const effectiveProvider =
    fields.authProvider === "supabase" && runtimeProvider.provider === "supabase"
      ? "supabase"
      : "local-json";

  if (effectiveProvider === "local-json") {
    const { createLocalJsonAccount, LocalJsonAuthStoreError } = await import(
      "@/lib/auth/providers/local-json-auth-store"
    );
    let account: Awaited<ReturnType<typeof createLocalJsonAccount>>;

    try {
      await writeProjectSetupConfig("local-json");
      resetRuntimeAuthProviderCache();
      account = await createLocalJsonAccount({
        displayName: INITIAL_ADMIN_DISPLAY_NAME,
        username: parsed.data.username,
        email: parsed.data.email,
        level: ADMIN_LEVEL,
        password: parsed.data.password,
        role: "admin",
      });
    } catch (error) {
      if (error instanceof LocalJsonAuthStoreError) {
        if (error.code === "duplicate_username") {
          return buildState(fields, { authError: "auth.failed" });
        }

        return buildState(fields, {
          fieldErrors: {
            email: "duplicate.email",
          },
        });
      }

      console.error("createInitialAdminAction local-json failed", { error });
      return buildState(fields, { authError: "auth.failed" });
    }

    await setLocalJsonSessionCookie(account.id);
    await touchAppSessionCookie();
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const [usernameTaken, emailTaken] = await Promise.all([
    isManagerUsernameTaken(parsed.data.username),
    isAuthEmailTaken(parsed.data.email),
  ]);

  if (usernameTaken || emailTaken) {
    if (usernameTaken && !emailTaken) {
      return buildState(fields, { authError: "auth.failed" });
    }

    return buildState(fields, {
      fieldErrors: {
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

  if (hasSupabaseSecretKey()) {
    const { error: createError } = await createSupabaseAccountWithManager({
      displayName: INITIAL_ADMIN_DISPLAY_NAME,
      email: normalizedEmail,
      emailConfirm: true,
      level: ADMIN_LEVEL,
      password: parsed.data.password,
      role: "admin",
      username: parsed.data.username,
    });

    error = createError;
  } else {
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: parsed.data.password,
      options: {
        data: {
          full_name: INITIAL_ADMIN_DISPLAY_NAME,
          username: parsed.data.username,
        },
      },
    });

    error = signUpError;
  }

  if (error) {
    console.error("createInitialAdminAction failed", {
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

      if (conflictUsername && !conflictEmail) {
        return buildState(fields, { authError: "auth.failed" });
      }

      return buildState(fields, {
        fieldErrors: {
          email: conflictEmail ? "duplicate.email" : null,
        },
      });
    }

    return buildState(fields, { authError: "auth.failed" });
  }

  try {
    await writeProjectSetupConfig("supabase");
    resetRuntimeAuthProviderCache();
  } catch (error) {
    console.error("createInitialAdminAction setup config write failed", { error });
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parsed.data.password,
  });

  if (signInError) {
    redirect("/sign-in?success=confirm-email");
  }

  if (signInData.user) {
    await touchManagerLastSignedIn(signInData.user.id);
  }

  await touchAppSessionCookie();
  redirect("/dashboard");
}
