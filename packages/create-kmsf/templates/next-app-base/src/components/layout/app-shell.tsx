"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isNavItemActive } from "@/components/layout/app-shell.utils";
import { LanguageToggle } from "@/components/layout/_components/language-toggle";
import { NotificationPopover } from "@/components/layout/_components/notification-popover";
import { ProfileMenu } from "@/components/layout/_components/profile-menu";
import { ServerTimeFooter } from "@/components/layout/_components/server-time-footer";
import { SessionMonitor } from "@/components/layout/_components/session-monitor";
import { SidebarDrawer } from "@/components/layout/_components/sidebar-drawer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AppSessionUser } from "@/lib/auth/session";
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
  initialServerTime: number;
};

export function AppShell({
  children,
  navItems,
  locale,
  user,
  initialTheme,
  csrfToken,
  initialServerTime,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-background text-foreground">
      <SessionMonitor />
      <SidebarDrawer items={navItems} />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-border bg-surface px-4 md:px-6">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="min-w-0">
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
              <ProfileMenu csrfToken={csrfToken} locale={locale} user={user} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background px-4 py-4 pb-20 md:px-6 md:py-5 md:pb-5">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">{children}</div>
        </main>
        <footer className="flex h-16 shrink-0 items-center border-t border-border bg-surface">
          <ServerTimeFooter initialServerTime={initialServerTime} />
        </footer>

        <nav className="absolute bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-border bg-surface px-2 shadow-sm md:hidden">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-foreground/70 transition-colors hover:bg-panel-hover",
                  active && "bg-panel-hover text-accent",
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center">{item.icon}</div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
