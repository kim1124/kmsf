"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import type { NavItem } from "@/components/layout/app-shell";
import { isNavItemActive } from "@/components/layout/app-shell.utils";
import { cn } from "@/lib/utils";

type SidebarDrawerProps = {
  items: NavItem[];
};

export function SidebarDrawer({ items }: SidebarDrawerProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (expanded && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [expanded]);

  return (
    <aside
      ref={containerRef}
      className={cn(
        "hidden h-full shrink-0 overflow-hidden border-r border-border bg-surface backdrop-blur md:flex transition-[width] duration-300 ease-in-out",
        expanded ? "w-[236px]" : "w-[56px]",
      )}
    >
      <div className="flex h-full w-full flex-col items-center px-2 py-4">
        <button
          aria-label={expanded ? "메뉴 접기" : "메뉴 펼치기"}
          className="mb-4 flex h-10 w-full items-center rounded-md text-foreground/75 transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </span>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity] duration-200",
              expanded ? "max-w-[120px] opacity-100 pl-2" : "max-w-0 opacity-0",
            )}
          >
            Menu
          </span>
        </button>

        <nav className="flex w-full flex-1 flex-col gap-2">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex h-10 w-full items-center rounded-md text-foreground/75 transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground",
                )}
                onClick={() => {
                  if (expanded) {
                    setExpanded(false);
                  }
                }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity] duration-200",
                    expanded ? "max-w-[150px] opacity-100 px-2" : "max-w-0 opacity-0",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
