"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { isNavItemActive } from "@/components/layout/app-shell.utils";
import { LanguageToggle } from "@/components/layout/_components/language-toggle";
import { NotificationPopover } from "@/components/layout/_components/notification-popover";
import { ProfileMenu } from "@/components/layout/_components/profile-menu";
import { ServerTimeFooter } from "@/components/layout/_components/server-time-footer";
import { SessionMonitor } from "@/components/layout/_components/session-monitor";
import { SidebarDrawer } from "@/components/layout/_components/sidebar-drawer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AppSessionUser } from "@/lib/auth/session";
import {
  hasGnbRegion,
  normalizeGnbLayoutConfig,
  type GnbLayoutConfig,
} from "@/lib/layout/gnb-layout-config";
import {
  GNB_LAYOUT_STORAGE_EVENT,
  getGnbLayoutStorageKey,
  normalizeRuntimeGnbLayoutConfig,
  parseStoredRuntimeGnbLayoutConfig,
} from "@/lib/layout/gnb-layout-runtime";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  icon: ReactNode;
  label: string;
  caption: string;
};

type AppShellProps = {
  children: ReactNode;
  navItems: NavItem[];
  locale: string;
  user: AppSessionUser;
  initialTheme: "light" | "dark";
  csrfToken: string;
  gnbLayout?: GnbLayoutConfig;
  initialServerTime: number;
};

function readRuntimeGnbLayout(storageKey: string, setupGnbLayout: GnbLayoutConfig) {
  if (typeof window === "undefined") {
    return normalizeRuntimeGnbLayoutConfig(setupGnbLayout, setupGnbLayout);
  }

  const storedLayout = parseStoredRuntimeGnbLayoutConfig(
    window.localStorage.getItem(storageKey),
    setupGnbLayout,
  );

  return storedLayout ?? normalizeRuntimeGnbLayoutConfig(setupGnbLayout, setupGnbLayout);
}

export function AppShell({
  children,
  navItems,
  locale,
  user,
  initialTheme,
  csrfToken,
  gnbLayout,
  initialServerTime,
}: AppShellProps) {
  const pathname = usePathname();
  const setupGnbLayout = useMemo(() => normalizeGnbLayoutConfig(gnbLayout), [gnbLayout]);
  const storageKey = getGnbLayoutStorageKey(user.username);
  const [normalizedGnbLayout, setNormalizedGnbLayout] = useState(() =>
    normalizeRuntimeGnbLayoutConfig(setupGnbLayout, setupGnbLayout),
  );

  useEffect(() => {
    function syncRuntimeGnbLayout() {
      setNormalizedGnbLayout(readRuntimeGnbLayout(storageKey, setupGnbLayout));
    }

    const animationFrameId = window.requestAnimationFrame(syncRuntimeGnbLayout);
    window.addEventListener("storage", syncRuntimeGnbLayout);
    window.addEventListener(GNB_LAYOUT_STORAGE_EVENT, syncRuntimeGnbLayout);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("storage", syncRuntimeGnbLayout);
      window.removeEventListener(GNB_LAYOUT_STORAGE_EVENT, syncRuntimeGnbLayout);
    };
  }, [setupGnbLayout, storageKey]);

  const showTop = hasGnbRegion(normalizedGnbLayout, "top");
  const showLeft = hasGnbRegion(normalizedGnbLayout, "left");
  const showRight = hasGnbRegion(normalizedGnbLayout, "right");
  const showFooter = hasGnbRegion(normalizedGnbLayout, "footer");
  const showTopProfile = !showLeft;
  const showRightProfile = !showLeft && !showTop;
  const showFooterProfile = !showLeft && !showTop && !showRight;

  function renderNavLink(item: NavItem, className: string, iconClassName = "h-6 w-6") {
    const active = isNavItemActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        aria-current={active ? "page" : undefined}
        href={item.href}
        prefetch={true}
        className={cn(className, active && "bg-panel-hover text-accent")}
      >
        <div className={cn("flex items-center justify-center", iconClassName)}>{item.icon}</div>
        <span className="font-medium leading-none">{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-background text-foreground">
      <SessionMonitor />
      {showLeft ? (
        <SidebarDrawer csrfToken={csrfToken} items={navItems} locale={locale} user={user} />
      ) : null}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border bg-surface px-4 md:px-6",
            !showTop && "md:hidden",
          )}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-5">
              <Link
                aria-label="KMSF"
                className="inline-flex items-center rounded-md text-2xl font-bold tracking-tight text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                href="/dashboard"
              >
                KMSF
              </Link>
            </div>
            <div className="flex items-center gap-2 [&>button]:cursor-pointer [&>div>button]:cursor-pointer">
              <LanguageToggle locale={locale as "ko" | "en"} />
              <ThemeToggle initialTheme={initialTheme} />
              <NotificationPopover />
              {showTopProfile ? (
                <ProfileMenu csrfToken={csrfToken} locale={locale} user={user} />
              ) : (
                <div className="md:hidden">
                  <ProfileMenu csrfToken={csrfToken} locale={locale} user={user} />
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden bg-background px-4 py-4 pb-20 md:px-6 md:py-5 md:pb-5"
          >
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">{children}</div>
          </main>

          {showRight ? (
            <aside className="hidden w-56 shrink-0 border-l border-border bg-surface p-3 md:flex md:flex-col">
              <div
                className={cn(
                  "mb-3 flex items-center gap-2 border-b border-border pb-3",
                  showRightProfile && "justify-between",
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                  GNB
                </span>
                {showRightProfile ? (
                  <ProfileMenu
                    csrfToken={csrfToken}
                    locale={locale}
                    popoverAlign="end"
                    popoverSide="left"
                    user={user}
                  />
                ) : null}
              </div>
              <nav aria-label="우측 GNB" className="flex flex-col gap-1">
                {navItems.map((item) =>
                  renderNavLink(
                    item,
                    "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-panel-hover hover:text-foreground",
                    "h-4 w-4",
                  ),
                )}
              </nav>
            </aside>
          ) : null}
        </div>

        <footer
          className={cn(
            "flex h-16 shrink-0 items-center border-t border-border bg-surface",
            !showFooter && "md:hidden",
          )}
        >
          <div className="flex w-full items-center justify-between gap-3 px-4 md:px-6">
            <ServerTimeFooter initialServerTime={initialServerTime} />
            {showFooterProfile ? (
              <ProfileMenu csrfToken={csrfToken} locale={locale} user={user} />
            ) : null}
          </div>
        </footer>

        <nav className="absolute bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-border bg-surface px-2 shadow-sm md:hidden">
          {navItems.map((item) =>
            renderNavLink(
              item,
              "flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] text-foreground/70 transition-colors hover:bg-panel-hover",
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
