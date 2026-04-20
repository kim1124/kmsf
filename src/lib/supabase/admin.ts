import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey, hasSupabaseServiceRoleKey } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseServiceRoleKey()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
