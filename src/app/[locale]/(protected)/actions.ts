"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateManagerProfile } from "@/lib/supabase/manager";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { hasSupabaseServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?accountError=security`);
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect(`/sign-in`);
}

const updateProfileSchema = z
  .object({
    locale: z.string().default("ko"),
    username: z.string().trim().min(3),
    email: z.email().trim(),
    password: z.string().trim().optional(),
    passwordConfirm: z.string().trim().optional(),
    avatarDataUrl: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.passwordConfirm) {
        return (data.password?.length ?? 0) >= 4;
      }
      return true;
    },
    {
      message: "password-too-short",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.password || data.passwordConfirm) {
        return data.password === data.passwordConfirm;
      }
      return true;
    },
    {
      message: "password-mismatch",
      path: ["passwordConfirm"],
    }
  );

export async function updateProfileAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    return { error: "security" };
  }

  const parsed = updateProfileSchema.safeParse({
    locale: formData.get("locale"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    avatarDataUrl: formData.get("avatarDataUrl"),
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
    password: parsed.data.password,
    data: {
      username: parsed.data.username,
      avatar_url: parsed.data.avatarDataUrl || null,
    },
  });

  if (authError) {
    return { error: "auth" };
  }

  const { error: managerError } = await updateManagerProfile({
    id: currentUser.id,
    username: parsed.data.username,
    email: parsed.data.email,
    avatarUrl: parsed.data.avatarDataUrl || null,
  });

  if (managerError) {
    return { error: "duplicate" };
  }

  return { success: true };
}

const deleteAccountSchema = z.object({
  locale: z.string().default("ko"),
  confirmation: z.literal("DELETE"),
});

export async function deleteAccountAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(`/settings?accountError=security`);
  }

  const parsed = deleteAccountSchema.safeParse({
    locale: formData.get("locale"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success || !isSupabaseConfigured()) {
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

  redirect(`/sign-in?success=deleted`);
}
