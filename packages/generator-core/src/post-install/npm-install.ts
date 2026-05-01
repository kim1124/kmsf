import { spawnSync } from "node:child_process";
import type { PackageManager } from "../types.js";

export interface InstallResult {
  success: boolean;
  reason?: string;
  durationMs?: number;
}

export function detectPackageManager(userAgent: string | undefined): PackageManager {
  if (!userAgent) return "npm";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  return "npm";
}

export async function runInstall(
  projectRoot: string,
  pm: PackageManager,
): Promise<InstallResult> {
  const start = Date.now();
  const result = spawnSync(pm, ["install"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if ((result as { error?: { code?: string } }).error?.code === "ENOENT") {
    return { success: false, reason: `${pm} not found in PATH` };
  }
  if (result.status !== 0) {
    const tail = (result.stderr ?? "").trim().split("\n").slice(-3).join("\n");
    return { success: false, reason: `${pm} install failed: ${tail}` };
  }

  return { success: true, durationMs: Date.now() - start };
}
