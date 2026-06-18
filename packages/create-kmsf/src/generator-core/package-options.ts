import type { KmsfPackageId } from "./types.js";

export interface KmsfPackageOption {
  id: KmsfPackageId;
  packageName: string;
  version: string;
  title: string;
}

export const KMSF_PACKAGE_OPTIONS: readonly KmsfPackageOption[] = [
  {
    id: "gridstack",
    packageName: "@kmsf/gridstack",
    version: "^1.0.0",
    title: "GridStack dashboard layout",
  },
  {
    id: "data-table",
    packageName: "@kmsf/data-table",
    version: "^0.1.0",
    title: "Data table",
  },
  {
    id: "charts",
    packageName: "@kmsf/charts",
    version: "^0.1.0",
    title: "Charts",
  },
  {
    id: "chat",
    packageName: "@kmsf/chat",
    version: "^0.1.0",
    title: "Chat",
  },
] as const;

export const KMSF_PACKAGE_IDS = KMSF_PACKAGE_OPTIONS.map((option) => option.id);

const PACKAGE_ID_SET = new Set<KmsfPackageId>(KMSF_PACKAGE_IDS);

export function parseKmsfPackageList(value: string): KmsfPackageId[] {
  const result: KmsfPackageId[] = [];
  const seen = new Set<KmsfPackageId>();

  for (const raw of value.split(",")) {
    const id = raw.trim();
    if (!id) continue;

    if (!PACKAGE_ID_SET.has(id as KmsfPackageId)) {
      throw new Error(`invalid --packages value: ${id}. Use ${KMSF_PACKAGE_IDS.join(", ")}`);
    }

    const typed = id as KmsfPackageId;
    if (!seen.has(typed)) {
      result.push(typed);
      seen.add(typed);
    }
  }

  return result;
}
