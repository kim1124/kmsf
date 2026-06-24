import { NextResponse } from "next/server";

import { getCurrentSupabaseSetupAvailability } from "@/lib/supabase/setup-availability";

export async function GET() {
  const availability = await getCurrentSupabaseSetupAvailability();

  return NextResponse.json(availability, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
