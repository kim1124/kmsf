import { NextResponse } from "next/server";

import { touchAppSessionCookie } from "@/lib/auth/app-session.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(null, { status: 204 });
  }

  await touchAppSessionCookie();

  return new NextResponse(null, { status: 204 });
}
