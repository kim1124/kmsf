import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Supabase URL or secret key is missing.");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
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
