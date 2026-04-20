"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  accountSchema,
  createEmptyAccountFieldErrors,
  createEmptySignInFieldErrors,
  getAccountFieldErrors,
  getSignInFieldErrors,
  signInSchema,
  type AccountFieldErrors,
  type AccountFields,
  type SignInFieldErrors,
  type SignInFields,
} from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildManagerRecord,
  findManagerLoginEmail,
  isAuthEmailTaken,
  isManagerUsernameTaken,
} from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { getAppUrl, hasSupabaseServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/env";

export type SignInFormState = {
  authError: "auth" | "security" | null;
  fields: SignInFields;
  fieldErrors: SignInFieldErrors;
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
  },
): SignInFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptySignInFieldErrors(),
      ...options?.fieldErrors,
    },
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
    username: formData.get("username"),
    password: formData.get("password"),
  });

  const fields = {
    username: String(formData.get("username") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildSignInState(fields, { authError: "security" });
  }

  if (!parsed.success || !isSupabaseConfigured()) {
    return buildSignInState(fields, {
      fieldErrors: !parsed.success ? getSignInFieldErrors(parsed.error) : undefined,
      authError: parsed.success ? "auth" : null,
    });
  }

  const email = await findManagerLoginEmail(parsed.data.username);

  if (!email) {
    return buildSignInState(fields, { authError: "auth" });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return buildSignInState(fields, { authError: "auth" });
  }

  redirect(`/dashboard`);
}

export async function signInWithGoogleAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/sign-in?error=security`);
  }

  if (!isSupabaseConfigured()) {
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
    username: formData.get("username"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    email: formData.get("email"),
  });

  const fields = {
    username: String(formData.get("username") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildSignUpState(fields, { authError: "security" });
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

  if (hasSupabaseServiceRoleKey()) {
    const admin = createSupabaseAdminClient();
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        username: parsed.data.username,
        role: "member",
      },
      app_metadata: {
        role: "member",
      },
    });

    error = createError;
    shouldSignIn = !createError;

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
        console.error("signUpAction manager sync failed", {
          code: managerError.code,
          message: managerError.message,
          userId: createData.user.id,
        });
        error = {
          code: managerError.code ?? undefined,
          message: managerError.message,
        };
        shouldSignIn = false;
      }
    }
  } else {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: parsed.data.password,
      options: {
        data: {
          username: parsed.data.username,
          role: "member",
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

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parsed.data.password,
  });

  if (signInError) {
    redirect(`/sign-in?error=auth`);
  }

  redirect(`/dashboard`);
}
