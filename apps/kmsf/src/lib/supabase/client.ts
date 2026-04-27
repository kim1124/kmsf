import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseApiKey } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseApiKey(),
  );
}
