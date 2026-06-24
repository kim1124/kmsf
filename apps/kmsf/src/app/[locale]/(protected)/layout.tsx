import { BarChart3, FileText, Home, LayoutDashboard, Settings, TableProperties } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getThemeCookie } from "@/lib/auth/demo-session";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { canAccessRoute, type ProtectedRouteId } from "@/lib/auth/access-policy";
import { getCurrentUser } from "@/lib/auth/session";
import { readProjectSetupConfig } from "@/lib/setup/project-setup-config";
import { getCsrfToken } from "@/lib/security/csrf";
import { discoverAppPageRoutes } from "@/lib/navigation/app-route-discovery";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

type ProtectedLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "navigation" });
  const setupRequired = await isInitialSetupRequired();
  const user = await getCurrentUser();
  const theme = await getThemeCookie();
  const csrfToken = await getCsrfToken();
  const setupConfig = await readProjectSetupConfig();
  // eslint-disable-next-line react-hooks/purity -- server-rendered footer seed must use request-time clock
  const initialServerTime = Date.now();

  if (setupRequired) {
    redirect("/setup/initial-admin");
  }

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
  }

  if (!user) {
    redirect("/sign-in");
  }

  const staticNavItems: Array<{
    caption: string;
    href: string;
    icon: ReactNode;
    label: string;
    routeId: ProtectedRouteId;
  }> = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: t("dashboard"),
      caption: t("dashboardCaption"),
      routeId: "dashboard",
    },
    {
      href: "/data-table-sample",
      icon: <TableProperties className="h-4 w-4" />,
      label: t("tableSample"),
      caption: t("tableSampleCaption"),
      routeId: "data-table-sample",
    },
    {
      href: "/chart-sample",
      icon: <BarChart3 className="h-4 w-4" />,
      label: t("chartSample"),
      caption: t("chartSampleCaption"),
      routeId: "chart-sample",
    },
    {
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      label: t("settings"),
      caption: t("settingsCaption"),
      routeId: "settings",
    },
  ];
  const discoveredNavItems =
    setupConfig?.menuSourceMode === "app-routes"
      ? (await discoverAppPageRoutes()).map((route) => ({
          caption:
            route.routeId === "dashboard"
              ? t("dashboardCaption")
              : route.routeId === "data-table-sample"
                ? t("tableSampleCaption")
                : route.routeId === "chart-sample"
                  ? t("chartSampleCaption")
                  : route.routeId === "settings"
                    ? t("settingsCaption")
                    : route.href,
          href: route.href,
          icon:
            route.routeId === "home" ? (
              <Home className="h-4 w-4" />
            ) : route.routeId === "dashboard" ? (
              <LayoutDashboard className="h-4 w-4" />
            ) : route.routeId === "data-table-sample" ? (
              <TableProperties className="h-4 w-4" />
            ) : route.routeId === "chart-sample" ? (
              <BarChart3 className="h-4 w-4" />
            ) : route.routeId === "settings" ? (
              <Settings className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            ),
          label:
            route.routeId === "dashboard"
              ? t("dashboard")
              : route.routeId === "data-table-sample"
                ? t("tableSample")
                : route.routeId === "chart-sample"
                  ? t("chartSample")
                  : route.routeId === "settings"
                    ? t("settings")
                    : route.label,
          routeId: route.routeId,
        }))
      : null;
  const navItems = discoveredNavItems ?? staticNavItems;

  return (
    <AppShell
      csrfToken={csrfToken}
      initialTheme={theme}
      initialServerTime={initialServerTime}
      locale={locale}
      gnbLayout={setupConfig?.gnbLayout}
      navItems={navItems.filter(
        (item) =>
          item.routeId === "home" || canAccessRoute(user, item.routeId as ProtectedRouteId),
      )}
      user={user}
    >
      {children}
    </AppShell>
  );
}
