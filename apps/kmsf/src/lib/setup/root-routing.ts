import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import type { AppSessionUser } from "@/lib/auth/session";
import type { ProjectSetupConfig } from "@/lib/setup/project-setup-config";

export type RootRouteResolution =
  | { kind: "redirect"; href: string }
  | { kind: "render-welcome" };

type RootRouteInput = {
  isAppSessionActive: boolean;
  setupConfig: ProjectSetupConfig | null;
  setupRequired: boolean;
  user: AppSessionUser | null;
};

export function resolveRootRoute({
  isAppSessionActive,
  setupConfig,
  setupRequired,
  user,
}: RootRouteInput): RootRouteResolution {
  if (setupRequired) {
    return { kind: "redirect", href: "/setup/initial-admin" };
  }

  if (user && !isAppSessionActive) {
    return { kind: "redirect", href: formatAppSessionExpiryRoute("session-expired") };
  }

  if (user) {
    return { kind: "redirect", href: "/dashboard" };
  }

  if (setupConfig?.authMode === "manual") {
    return { kind: "render-welcome" };
  }

  return { kind: "redirect", href: "/sign-in" };
}
