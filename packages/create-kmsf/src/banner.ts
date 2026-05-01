import pc from "picocolors";

export interface BannerOptions {
  version: string;
  color: boolean;
}

export function renderBanner(options: BannerOptions): string {
  const c = options.color ? pc : null;
  const heading = c ? c.green("▰▰▰  KMSF") : "▰▰▰  KMSF";
  const sub = c
    ? c.gray(`Next.js admin dashboard scaffolder · v${options.version}`)
    : `Next.js admin dashboard scaffolder · v${options.version}`;
  const rule = c ? c.dim("─────────────────────────────────────────") : "-----------------------------------------";
  return ["", `  ${heading}`, `  ${sub}`, `  ${rule}`, ""].join("\n");
}
