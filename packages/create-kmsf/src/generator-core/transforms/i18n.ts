import { access, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ApplyI18nModeOptions {
  includeI18n: boolean;
}

async function removeIfExists(projectRoot: string, relPath: string): Promise<void> {
  await rm(path.join(projectRoot, relPath), { recursive: true, force: true });
}

async function replaceInFileIfExists(
  projectRoot: string,
  relPath: string,
  replacements: Array<[RegExp | string, string]>,
): Promise<void> {
  const filePath = path.join(projectRoot, relPath);
  try {
    await access(filePath);
  } catch {
    return;
  }

  let content = await readFile(filePath, "utf8");
  for (const [from, to] of replacements) {
    content = content.replace(from, to);
  }
  await writeFile(filePath, content, "utf8");
}

async function moveIfExists(projectRoot: string, fromRel: string, toRel: string): Promise<void> {
  const from = path.join(projectRoot, fromRel);
  const to = path.join(projectRoot, toRel);

  try {
    await access(from);
  } catch {
    return;
  }

  await rm(to, { recursive: true, force: true });
  await rename(from, to);
}

async function replaceInTreeIfExists(
  projectRoot: string,
  relRoot: string,
  replacements: Array<[RegExp | string, string]>,
): Promise<void> {
  const root = path.join(projectRoot, relRoot);

  try {
    await access(root);
  } catch {
    return;
  }

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.join(relRoot, entry.name);
    if (entry.isDirectory()) {
      await replaceInTreeIfExists(projectRoot, rel, replacements);
      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    await replaceInFileIfExists(projectRoot, rel, replacements);
  }
}

function removeVerifySpec(script: string, spec: string): string {
  return script.replace(new RegExp(`\\s+${spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "");
}

async function removeI18nVerifySpecs(projectRoot: string): Promise<void> {
  const packagePath = path.join(projectRoot, "package.json");
  try {
    await access(packagePath);
  } catch {
    return;
  }

  const pkg = JSON.parse(await readFile(packagePath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const verify = pkg.scripts?.verify;
  if (!verify) return;

  pkg.scripts!.verify = removeVerifySpec(
    removeVerifySpec(verify, "tests/e2e/language-toggle.spec.ts"),
    "tests/e2e/auth-validation-i18n.spec.ts",
  );

  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

async function flattenLocaleRoutes(projectRoot: string): Promise<void> {
  await moveIfExists(projectRoot, "src/app/[locale]/(protected)", "src/app/(protected)");
  await moveIfExists(projectRoot, "src/app/[locale]/(public)", "src/app/(public)");
  await rm(path.join(projectRoot, "src/app/[locale]"), { recursive: true, force: true });

  await replaceInTreeIfExists(projectRoot, "src", [
    [/"@\/app\/\[locale\]\//g, '"@/app/'],
    [/src\/app\/\[locale\]\//g, "src/app/"],
  ]);

  await replaceInFileIfExists(projectRoot, "src/app/(protected)/layout.tsx", [
    [/  params: Promise<\{ locale: string \}>;\n/, ""],
    [/  params,\n/, ""],
    [/  const \{ locale \} = await params;\n/, '  const locale = "ko";\n'],
  ]);

  for (const rel of [
    "src/app/(public)/sign-in/page.tsx",
    "src/app/(public)/sign-up/page.tsx",
  ]) {
    await replaceInFileIfExists(projectRoot, rel, [
      [/  params: Promise<\{ locale: string \}>;\n/, ""],
      [/\{\n  params,\n  searchParams,\n\}: (SignInPageProps|SignUpPageProps)\)/, "{\n  searchParams,\n}: $1)"],
      [/\{ params, searchParams \}: (SignInPageProps|SignUpPageProps)\)/, "{ searchParams }: $1)"],
      [/  const \{ locale \} = await params;\n/, '  const locale = "ko";\n'],
    ]);
  }
}

export async function applyI18nMode(
  projectRoot: string,
  options: ApplyI18nModeOptions,
): Promise<void> {
  if (options.includeI18n) return;

  await removeIfExists(projectRoot, "messages/en.json");
  await removeIfExists(projectRoot, "src/components/layout/_components/language-toggle.tsx");
  await removeIfExists(projectRoot, "src/components/layout/_components/language-toggle.test.tsx");
  await removeIfExists(projectRoot, "tests/e2e/language-toggle.spec.ts");
  await removeIfExists(projectRoot, "tests/e2e/auth-validation-i18n.spec.ts");
  await flattenLocaleRoutes(projectRoot);

  await replaceInFileIfExists(projectRoot, "src/i18n/routing.ts", [
    [/locales:\s*\["ko",\s*"en"\]/, 'locales: ["ko"]'],
  ]);

  await replaceInFileIfExists(projectRoot, "src/components/layout/app-shell.tsx", [
    [/import \{ LanguageToggle \} from "@\/components\/layout\/_components\/language-toggle";\n/, ""],
    [/\s*<LanguageToggle locale=\{locale as "ko" \| "en"\} \/>\n/, "\n"],
  ]);

  await removeI18nVerifySpecs(projectRoot);
}
