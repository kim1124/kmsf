import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Supabase URL or service role key is missing.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const [{ data: users, error: usersError }, { count: managerCount, error: managerError }] =
  await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 101 }),
    admin.from("manager").select("id", { count: "exact", head: true }),
  ]);

if (usersError || managerError) {
  console.error("Supabase check failed.", {
    managerError: managerError?.message ?? null,
    usersError: usersError?.message ?? null,
  });
  process.exit(1);
}

console.log(
  JSON.stringify({
    authUserSampleCount: users.users.length,
    managerCount,
    status: "ok",
  }),
);
