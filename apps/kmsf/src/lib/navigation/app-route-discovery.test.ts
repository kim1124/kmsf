import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { discoverAppPageRoutesFromDir } from "./app-route-discovery";

async function touch(path: string) {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "", "utf8");
}

describe("app route discovery", () => {
  it("discovers actual app page routes while excluding api, setup, auth, and locale duplicates", async ({
    task,
  }) => {
    const appDir = join(task.file.filepath, "..", "fixture-app");

    await touch(join(appDir, "page.tsx"));
    await touch(join(appDir, "(protected)", "dashboard", "page.tsx"));
    await touch(join(appDir, "(protected)", "settings", "page.tsx"));
    await touch(join(appDir, "[locale]", "(protected)", "dashboard", "page.tsx"));
    await touch(join(appDir, "api", "session", "touch", "route.ts"));
    await touch(join(appDir, "auth", "callback", "route.ts"));
    await touch(join(appDir, "setup", "initial-admin", "page.tsx"));
    await touch(join(appDir, "sign-in", "page.tsx"));
    await touch(join(appDir, "layout.tsx"));

    await expect(discoverAppPageRoutesFromDir(appDir)).resolves.toEqual([
      { href: "/", label: "Home", routeId: "home" },
      { href: "/dashboard", label: "Dashboard", routeId: "dashboard" },
      { href: "/settings", label: "Settings", routeId: "settings" },
    ]);
  });
});
