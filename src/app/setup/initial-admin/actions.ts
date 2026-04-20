"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  accountSchema,
  createEmptyAccountFieldErrors,
  getAccountFieldErrors,
  type AccountFieldErrors,
  type AccountFields,
} from "@/lib/auth/validation";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/env";
import {
  buildManagerRecord,
  isAuthEmailTaken,
  isManagerUsernameTaken,
  isInitialSetupRequired,
} from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InitialAdminFormState = {
  authError: "auth.failed" | "security.invalid" | null;
  fields: AccountFields;
  fieldErrors: AccountFieldErrors;
};

function buildState(
  fields: AccountFields,
  options?: {
    authError?: InitialAdminFormState["authError"];
    fieldErrors?: Partial<AccountFieldErrors>;
  },
): InitialAdminFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptyAccountFieldErrors(),
      ...options?.fieldErrors,
    },
  };
}

export async function createInitialAdminAction(
  _prevState: InitialAdminFormState,
  formData: FormData,
) {
  const fields = {
    username: String(formData.get("username") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
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

  const supabase = await createSupabaseServerClient();
  const [usernameTaken, emailTaken] = await Promise.all([
    isManagerUsernameTaken(parsed.data.username),
    isAuthEmailTaken(parsed.data.email),
  ]);

  if (usernameTaken || emailTaken) {
    return buildState(fields, {
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

  if (hasSupabaseServiceRoleKey()) {
    const admin = createSupabaseAdminClient();
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        username: parsed.data.username,
        role: "admin",
      },
      app_metadata: {
        role: "admin",
      },
    });

    error = createError;

    if (!createError && createData.user) {
      const { error: managerError } = await admin.from("manager").upsert(
        buildManagerRecord({
          id: createData.user.id,
          username: parsed.data.username,
          email: normalizedEmail,
        }),
        { onConflict: "id" },
      );

      if (managerError) {
        console.error("createInitialAdminAction manager sync failed", {
          code: managerError.code,
          message: managerError.message,
          userId: createData.user.id,
        });
        error = {
          code: managerError.code ?? undefined,
          message: managerError.message,
        };
      }
    }
  } else {
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: parsed.data.password,
      options: {
        data: {
          username: parsed.data.username,
          role: "admin",
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

      return buildState(fields, {
        fieldErrors: {
          username: conflictUsername ? "duplicate.username" : null,
          email: conflictEmail ? "duplicate.email" : null,
        },
      });
    }

    return buildState(fields, { authError: "auth.failed" });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parsed.data.password,
  });

  if (signInError) {
    redirect("/sign-in?success=confirm-email");
  }

  redirect("/dashboard");
}
