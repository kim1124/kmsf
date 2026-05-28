import { createClient, type User } from "@supabase/supabase-js";

import { clearProjectSetupConfig } from "@/lib/setup/project-setup-config";
import type { AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseApiKey } from "@/lib/supabase/env";
import { buildManagerRecord } from "@/lib/supabase/manager";

const SUPABASE_AUTH_LIST_PAGE_SIZE = 1000;

export class SupabaseAccountAdminError extends Error {
  constructor(
    public readonly code:
      | "delete_failed"
      | "manager_delete_failed"
      | "service_role_required",
    message: string,
  ) {
    super(message);
    this.name = "SupabaseAccountAdminError";
  }
}

export async function createSupabaseAccountWithManager(input: {
  displayName?: string;
  email: string;
  emailConfirm?: boolean;
  level?: number;
  password: string;
  role: AppRole;
  username: string;
}) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = input.email.toLowerCase();
  const role = input.role;
  const level = input.level ?? (role === "admin" ? 3 : 1);
  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: input.emailConfirm ?? true,
    user_metadata: {
      ...(input.displayName ? { full_name: input.displayName } : null),
      username: input.username,
    },
    app_metadata: {
      level,
      role,
    },
  });

  if (error || !data.user) {
    return { error: error ?? { message: "Supabase user was not created." }, user: null };
  }

  const { error: managerError } = await admin.from("manager").upsert(
    buildManagerRecord({
      displayName: input.displayName,
      email: normalizedEmail,
      id: data.user.id,
      level,
      role,
      username: input.username,
    }),
    { onConflict: "id" },
  );

  if (managerError) {
    await admin.auth.admin.deleteUser(data.user.id);

    return {
      error: {
        code: managerError.code ?? undefined,
        message: managerError.message,
      },
      user: null,
    };
  }

  return { error: null, user: data.user };
}

export async function listAllSupabaseAuthUsers(options?: { pageSize?: number }) {
  const admin = createSupabaseAdminClient();
  const users: User[] = [];
  const pageSize = options?.pageSize ?? SUPABASE_AUTH_LIST_PAGE_SIZE;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });

    if (error) {
      throw error;
    }

    const pageUsers = data.users ?? [];
    users.push(...pageUsers);

    if (pageUsers.length < pageSize) {
      return users;
    }

    page += 1;
  }
}

export async function verifySupabaseAccountPassword(email: string, password: string) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getSupabaseApiKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (data.session) {
    await client.auth.signOut();
  }

  return !error && Boolean(data.user);
}

export async function resetSupabaseFactorySystem() {
  const admin = createSupabaseAdminClient();
  const users = await listAllSupabaseAuthUsers();
  const { data: managerRows, error: managerReadError } = await admin
    .from("manager")
    .select("id");

  if (managerReadError) {
    throw new SupabaseAccountAdminError("manager_delete_failed", managerReadError.message);
  }

  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      throw new SupabaseAccountAdminError("delete_failed", error.message);
    }
  }

  const managerIds = (managerRows ?? [])
    .map((row) => ("id" in row && typeof row.id === "string" ? row.id : null))
    .filter((id): id is string => Boolean(id));

  for (let start = 0; start < managerIds.length; start += 100) {
    const chunk = managerIds.slice(start, start + 100);
    const { error } = await admin.from("manager").delete().in("id", chunk);

    if (error) {
      throw new SupabaseAccountAdminError("manager_delete_failed", error.message);
    }
  }

  await clearProjectSetupConfig();
}
