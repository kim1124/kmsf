import { Outlet } from "react-router";
import { AppShell } from "./layout/AppShell";

export function App() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
