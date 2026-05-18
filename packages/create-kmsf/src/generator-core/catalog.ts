import type { AuthMode } from "./types.js";

export interface TemplateEntry {
  id: "next-app-base";
  /** Path relative to repo root. */
  relativePath: string;
  /** Display name. */
  name: string;
  supportedAuthModes: AuthMode[];
}

export const TEMPLATE_CATALOG: Record<"next-app-base", TemplateEntry> = {
  "next-app-base": {
    id: "next-app-base",
    relativePath: "templates/next-app-base",
    name: "Next.js admin dashboard (single app)",
    supportedAuthModes: ["local-json", "supabase", "none"],
  },
};

export function getTemplate(id: keyof typeof TEMPLATE_CATALOG): TemplateEntry {
  const entry = TEMPLATE_CATALOG[id];
  if (!entry) {
    throw new Error(`unknown template: ${id}`);
  }
  return entry;
}
