import type { AuthMode, TemplateId } from "./types.js";

export interface TemplateEntry {
  id: TemplateId;
  /** Path relative to repo root. */
  relativePath: string;
  /** Display name. */
  name: string;
  supportedAuthModes: AuthMode[];
  defaultAuthMode: AuthMode;
}

export const TEMPLATE_CATALOG: Record<TemplateId, TemplateEntry> = {
  "next-app-base": {
    id: "next-app-base",
    relativePath: "templates/next-app-base",
    name: "Next.js admin dashboard (single app)",
    supportedAuthModes: ["local-json", "supabase", "later", "none"],
    defaultAuthMode: "local-json",
  },
  "react-vite-base": {
    id: "react-vite-base",
    relativePath: "templates/react-vite-base",
    name: "React + Vite application starter",
    supportedAuthModes: ["none", "later"],
    defaultAuthMode: "none",
  },
};

export function getTemplate(id: TemplateId): TemplateEntry {
  const entry = TEMPLATE_CATALOG[id];
  if (!entry) {
    throw new Error(`unknown template: ${id}`);
  }
  return entry;
}
