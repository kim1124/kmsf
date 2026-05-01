import { spawnSync } from "node:child_process";

export interface GitInitResult {
  success: boolean;
  reason?: string;
}

export async function runGitInit(projectRoot: string): Promise<GitInitResult> {
  const opts = { cwd: projectRoot, encoding: "utf8" as const };

  const init = spawnSync("git", ["init"], opts);
  if ((init as { error?: { code?: string } }).error?.code === "ENOENT") {
    return { success: false, reason: "git not found in PATH" };
  }
  if (init.status !== 0) {
    return { success: false, reason: `git init failed: ${init.stderr ?? ""}`.trim() };
  }

  const add = spawnSync("git", ["add", "."], opts);
  if (add.status !== 0) {
    return { success: false, reason: `git add failed: ${add.stderr ?? ""}`.trim() };
  }

  const commit = spawnSync(
    "git",
    ["commit", "-m", "chore: initial commit from create-kmsf", "--no-verify"],
    opts,
  );
  if (commit.status !== 0) {
    return { success: false, reason: `git commit failed: ${commit.stderr ?? ""}`.trim() };
  }

  return { success: true };
}
