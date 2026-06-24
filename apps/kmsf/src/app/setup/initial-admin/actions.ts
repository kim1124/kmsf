"use server";

import { redirect } from "next/navigation";

import {
  resetRuntimeAuthProviderCache,
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
import {
  normalizeGnbRegions,
  type GnbRegion,
} from "@/lib/layout/gnb-layout-config";
import type {
  AppConfigStorageMode,
  AuthMode,
  DbMode,
  MenuSourceMode,
} from "@/lib/setup/project-setup-config";
import { hasSupabaseSecretKey } from "@/lib/supabase/env";
import {
  isAuthEmailTaken,
  isManagerUsernameTaken,
  isInitialSetupRequired,
} from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeProjectSetupConfig } from "@/lib/setup/project-setup-config";
import { checkSupabaseSetupAvailability } from "@/lib/supabase/setup-availability";

type InitialSetupAuthProvider = Exclude<AuthProviderKind, "manual">;

type InitialAdminFields = AccountFields & {
  appConfigStorageMode: AppConfigStorageMode;
  authMode: AuthMode;
  authProvider: InitialSetupAuthProvider;
  dbMode: DbMode;
  displayName: string;
  gnbRegions: GnbRegion[];
  menuSourceMode: MenuSourceMode;
};

type InitialAdminFieldErrors = AccountFieldErrors & {
  displayName: string | null;
};

export type InitialAdminFormState = {
  authError:
    | "auth.failed"
    | "duplicate.username"
    | "security.invalid"
    | "setup.write-failed"
    | "supabase.unavailable"
    | null;
  fields: InitialAdminFields;
  fieldErrors: InitialAdminFieldErrors;
  setupComplete: boolean;
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
    setupComplete: false,
  };
}

function normalizeInitialSetupAuthProvider(value: FormDataEntryValue | null): InitialSetupAuthProvider {
  return value === "supabase" ? "supabase" : "local-json";
}

function normalizeInitialSetupDbMode(value: FormDataEntryValue | null): DbMode {
  if (
    value === "none" ||
    value === "dev-local-db" ||
    value === "sqlite" ||
    value === "external-adapter" ||
    value === "supabase"
  ) {
    return value;
  }

  return "dev-local-db";
}

function normalizeInitialSetupAuthMode(
  value: FormDataEntryValue | null,
  dbMode: DbMode,
): AuthMode {
  if (dbMode === "none") {
    return "manual";
  }

  if (dbMode === "supabase") {
    return value === "manual" ? "manual" : "supabase";
  }

  return value === "manual" ? "manual" : "kmsf-managed";
}

function normalizeInitialSetupAppConfigStorageMode(
  value: FormDataEntryValue | null,
  dbMode: DbMode,
): AppConfigStorageMode {
  if (value === "manual" || value === "local-storage") {
    return value;
  }

  if (value === "connected-db" && dbMode !== "none") {
    return "connected-db";
  }

  return dbMode === "none" ? "local-storage" : "connected-db";
}

function normalizeInitialSetupMenuSourceMode(
  value: FormDataEntryValue | null,
  dbMode: DbMode,
  authMode: AuthMode,
): MenuSourceMode {
  if (value === "app-routes") {
    return "app-routes";
  }

  if (value === "settings-ui" && dbMode !== "none" && authMode !== "manual") {
    return "settings-ui";
  }

  return "manual";
}

async function writeInitialSetupConfig(input: {
  appConfigStorageMode: AppConfigStorageMode;
  authMode: AuthMode;
  dbMode: DbMode;
  gnbRegions: GnbRegion[];
  menuSourceMode: MenuSourceMode;
}) {
  await writeProjectSetupConfig({
    appConfigStorageMode: input.appConfigStorageMode,
    authMode: input.authMode,
    dbMode: input.dbMode,
    gnbLayout: { enabledRegions: input.gnbRegions },
    menuSourceMode: input.menuSourceMode,
  });
  resetRuntimeAuthProviderCache();
}

export async function createInitialAdminAction(
  _prevState: InitialAdminFormState,
  formData: FormData,
) {
  const dbMode = normalizeInitialSetupDbMode(formData.get("dbMode"));
  const authMode = normalizeInitialSetupAuthMode(formData.get("authMode"), dbMode);
  const appConfigStorageMode = normalizeInitialSetupAppConfigStorageMode(
    formData.get("appConfigStorageMode"),
    dbMode,
  );
  const menuSourceMode = normalizeInitialSetupMenuSourceMode(
    formData.get("menuSourceMode"),
    dbMode,
    authMode,
  );
  const authProvider = dbMode === "supabase" && authMode === "supabase" ? "supabase" : "local-json";
  const fields = {
    appConfigStorageMode,
    authMode,
    authProvider: normalizeInitialSetupAuthProvider(authProvider),
    dbMode,
    displayName: INITIAL_ADMIN_DISPLAY_NAME,
    gnbRegions: normalizeGnbRegions(formData.getAll("gnbRegions")),
    menuSourceMode,
    username: INITIAL_ADMIN_USERNAME,
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildState(fields, { authError: "security.invalid" });
  }

  const shouldCreateAdmin = dbMode !== "none" && authMode !== "manual";

  if (!shouldCreateAdmin) {
    try {
      await writeInitialSetupConfig({
        appConfigStorageMode,
        authMode: "manual",
        dbMode,
        gnbRegions: fields.gnbRegions,
        menuSourceMode,
      });
    } catch (error) {
      console.error("createInitialAdminAction manual setup config write failed", { error });
      return buildState(fields, { authError: "setup.write-failed" });
    }

    return {
      ...buildState(fields),
      setupComplete: true,
    };
  }

  const parsed = accountSchema.safeParse(fields);

  if (!parsed.success) {
    return buildState(fields, {
      fieldErrors: getAccountFieldErrors(parsed.error),
    });
  }

  const supabaseAvailability =
    fields.authProvider === "supabase"
      ? await checkSupabaseSetupAvailability()
      : null;

  if (supabaseAvailability?.setupState === "remote-initialized") {
    try {
      await writeInitialSetupConfig({
        appConfigStorageMode,
        authMode: "supabase",
        dbMode: "supabase",
        gnbRegions: fields.gnbRegions,
        menuSourceMode,
      });
    } catch (error) {
      console.error("createInitialAdminAction existing supabase setup link failed", {
        email: supabaseAvailability.adminEmail,
        error,
      });
      return buildState(fields, { authError: "setup.write-failed" });
    }

    redirect("/sign-in");
  }

  const setupRequired = await isInitialSetupRequired();

  if (!setupRequired) {
    redirect("/sign-in");
  }

  if (fields.authProvider === "supabase" && !supabaseAvailability?.available) {
    return buildState(fields, { authError: "supabase.unavailable" });
  }

  const effectiveProvider =
    fields.authProvider === "supabase" && supabaseAvailability?.available
      ? "supabase"
      : "local-json";

  if (effectiveProvider === "local-json") {
    const { createKmsfManagedAccount } = await import(
      "@/lib/auth/providers/kmsf-managed-auth-store"
    );

    try {
      await writeInitialSetupConfig({
        appConfigStorageMode,
        authMode,
        dbMode,
        gnbRegions: fields.gnbRegions,
        menuSourceMode,
      });
      await createKmsfManagedAccount({
        displayName: INITIAL_ADMIN_DISPLAY_NAME,
        username: parsed.data.username,
        email: parsed.data.email,
        level: ADMIN_LEVEL,
        password: parsed.data.password,
        role: "admin",
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "duplicate_username") {
          return buildState(fields, { authError: "duplicate.username" });
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

    return {
      ...buildState(fields),
      setupComplete: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [usernameTaken, emailTaken] = await Promise.all([
    isManagerUsernameTaken(parsed.data.username),
    isAuthEmailTaken(parsed.data.email),
  ]);

  if (usernameTaken || emailTaken) {
    if (usernameTaken && !emailTaken) {
      return buildState(fields, { authError: "duplicate.username" });
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
        return buildState(fields, { authError: "duplicate.username" });
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
    await writeInitialSetupConfig({
      appConfigStorageMode,
      authMode: "supabase",
      dbMode: "supabase",
      gnbRegions: fields.gnbRegions,
      menuSourceMode,
    });
  } catch (error) {
    console.error("createInitialAdminAction setup config write failed", { error });
    return buildState(fields, { authError: "setup.write-failed" });
  }

  return {
    ...buildState(fields),
    setupComplete: true,
  };
}
