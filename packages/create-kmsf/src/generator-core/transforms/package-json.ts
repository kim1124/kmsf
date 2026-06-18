import { readFile, writeFile } from "node:fs/promises";
import { KMSF_PACKAGE_OPTIONS } from "../package-options.js";
import type { AuthMode, KmsfPackageId } from "../types.js";

export interface TransformPackageJsonOptions {
  projectName: string;
  authMode: AuthMode;
  selectedPackages?: KmsfPackageId[];
}

const SUPABASE_DEP_KEYS = ["@supabase/ssr", "@supabase/supabase-js"];

/**
 * Validate npm package name (per validate-npm-package-name rules, simplified).
 * Returns the same name if valid; throws otherwise.
 */
export function validateProjectName(name: string): string {
  if (!name || name.length > 214) {
    throw new Error(`invalid project name: must be 1-214 chars`);
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error(
      `invalid project name "${name}": must start with [a-z0-9] and contain only [a-z0-9._-]`,
    );
  }
  return name;
}

export async function transformPackageJson(
  filePath: string,
  options: TransformPackageJsonOptions,
): Promise<void> {
  const validated = validateProjectName(options.projectName);
  const raw = await readFile(filePath, "utf8");
  const pkg = JSON.parse(raw) as {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  pkg.name = validated;

  if (options.authMode !== "supabase" && options.authMode !== "later") {
    if (pkg.dependencies) {
      for (const key of SUPABASE_DEP_KEYS) {
        delete pkg.dependencies[key];
      }
    }
  }

  const selectedPackages = new Set(options.selectedPackages ?? []);
  if (selectedPackages.size > 0) {
    pkg.dependencies ??= {};

    for (const option of KMSF_PACKAGE_OPTIONS) {
      if (selectedPackages.has(option.id)) {
        pkg.dependencies[option.packageName] = option.version;
      }
    }
  }

  await writeFile(filePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}
