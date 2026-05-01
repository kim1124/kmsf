import { spawnSync } from "node:child_process";

export interface PlaywrightInstallResult {
  success: boolean;
  reason?: string;
}

export async function runPlaywrightInstall(
  projectRoot: string,
): Promise<PlaywrightInstallResult> {
  const result = spawnSync("npx", ["playwright", "install"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if ((result as { error?: { code?: string } }).error?.code === "ENOENT") {
    return { success: false, reason: "npx not found in PATH" };
  }
  if (result.status !== 0) {
    const tail = (result.stderr ?? "").trim().split("\n").slice(-3).join("\n");
    return { success: false, reason: `playwright install failed: ${tail}` };
  }

  return { success: true };
}
