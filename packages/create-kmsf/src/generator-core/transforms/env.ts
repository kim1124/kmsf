import { readFile, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import type { AuthMode, TemplateId } from "../types.js";

export interface GenerateEnvOptions {
  authMode: AuthMode;
  templateId: TemplateId;
}

export interface GenerateEnvResult {
  created: boolean;
  skippedReason?: string;
}

function setOrAddVar(content: string, key: string, value: string): string {
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    return content.replace(re, `${key}=${value}`);
  }
  return `${content}\n${key}=${value}`;
}

export async function generateEnvLocal(
  projectRoot: string,
  options: GenerateEnvOptions,
): Promise<GenerateEnvResult> {
  if (options.templateId === "react-vite-base") {
    return { created: false, skippedReason: "env not required for react-vite-base" };
  }

  const examplePath = path.join(projectRoot, ".env.example");
  const localPath = path.join(projectRoot, ".env.local");

  try {
    await access(examplePath);
  } catch {
    throw new Error(`.env.example not found at ${examplePath}`);
  }

  try {
    await access(localPath);
    return { created: false, skippedReason: "already exists" };
  } catch {
    // doesn't exist, proceed
  }

  let content = await readFile(examplePath, "utf8");

  // override provider mode
  content = setOrAddVar(content, "KMSF_AUTH_PROVIDER", options.authMode);

  // generate session secret if local-json can be selected without regenerating env.
  if (options.authMode === "local-json" || options.authMode === "later") {
    const secret = randomBytes(32).toString("hex");
    content = setOrAddVar(content, "KMSF_LOCAL_AUTH_SESSION_SECRET", secret);
  }

  await writeFile(localPath, content + "\n", "utf8");
  return { created: true };
}
