import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

export default async function RootPage() {
  const setupRequired = await isInitialSetupRequired();
  const user = await getCurrentUser();
  redirect(setupRequired ? "/setup/initial-admin" : user ? "/dashboard" : "/sign-in");
}
