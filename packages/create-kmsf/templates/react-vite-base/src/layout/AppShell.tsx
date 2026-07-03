import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { appConfig } from "../global/app-config";
import { hasGnbRegion } from "./gnb-layout-config";
import { navigationItems } from "./navigation";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const showTop = hasGnbRegion("top");
  const showLeft = hasGnbRegion("left");
  const showRight = hasGnbRegion("right");
  const showFooter = hasGnbRegion("footer");

  return (
    <div className="app-shell">
      {showTop ? (
        <header className="app-topbar">
          <strong>{appConfig.name}</strong>
          <nav aria-label="Top navigation">
            {navigationItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>
        </header>
      ) : null}

      <div className="app-frame">
        {showLeft ? (
          <aside className="app-sidebar" aria-label="Left navigation">
            {navigationItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </aside>
        ) : null}

        <main className="app-main">{children}</main>

        {showRight ? <aside className="app-right" aria-label="Right panel" /> : null}
      </div>

      {showFooter ? (
        <footer className="app-footer">
          <span>{appConfig.description}</span>
        </footer>
      ) : null}
    </div>
  );
}

function NavItem({ item }: { item: (typeof navigationItems)[number] }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => `nav-item${isActive ? " nav-item-active" : ""}`}
      end={item.path === "/"}
    >
      <Icon aria-hidden="true" size={16} />
      <span>{item.label}</span>
    </NavLink>
  );
}
