import {
  resetRuntimeAuthProviderCache,
} from "@/lib/auth/providers/runtime-auth-provider";
import { DEFAULT_GNB_REGIONS } from "@/lib/layout/gnb-layout-config";
import {
  readProjectSetupConfig,
  writeProjectSetupConfig,
  type ProjectSetupConfigInput,
} from "@/lib/setup/project-setup-config";
import { getCurrentSupabaseSetupAvailability } from "@/lib/supabase/setup-availability";

export type ExistingSupabaseSetupLinkResult =
  | { adminEmail: string | null; linked: true }
  | { linked: false };

export function buildExistingSupabaseSetupConfig(): ProjectSetupConfigInput {
  return {
    appConfigStorageMode: "connected-db",
    authMode: "supabase",
    dbMode: "supabase",
    gnbLayout: { enabledRegions: [...DEFAULT_GNB_REGIONS] },
    menuSourceMode: "manual",
  };
}

export async function linkExistingSupabaseSetupIfDetected(): Promise<ExistingSupabaseSetupLinkResult> {
  if (process.env.KMSF_DISABLE_EXISTING_SUPABASE_SETUP_LINK === "1") {
    return { linked: false };
  }

  const setupConfig = await readProjectSetupConfig();

  if (setupConfig) {
    return { linked: false };
  }

  const availability = await getCurrentSupabaseSetupAvailability();

  if (!availability.available || availability.setupState !== "remote-initialized") {
    return { linked: false };
  }

  await writeProjectSetupConfig(buildExistingSupabaseSetupConfig());
  resetRuntimeAuthProviderCache();

  return {
    adminEmail: availability.adminEmail,
    linked: true,
  };
}
