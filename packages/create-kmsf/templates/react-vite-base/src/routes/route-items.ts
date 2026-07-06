import type { LucideIcon } from "lucide-react";
import { Home, Settings } from "lucide-react";

export interface RouteItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

export const routeItems: RouteItem[] = [
  {
    id: "home",
    path: "/",
    label: "Home",
    icon: Home,
  },
  {
    id: "settings",
    path: "/settings",
    label: "Settings",
    icon: Settings,
  },
];
