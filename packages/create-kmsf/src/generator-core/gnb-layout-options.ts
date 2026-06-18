import type { GnbRegion } from "./types.js";

export const GNB_REGION_IDS = ["top", "left", "right", "footer"] as const satisfies readonly GnbRegion[];
export const DEFAULT_GNB_REGION_IDS: readonly GnbRegion[] = ["top", "left", "footer"];

export function parseGnbRegionList(value: string): GnbRegion[] {
  const regions = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (regions.length === 0) {
    throw new Error(`invalid --layout value: ${value}. Use ${GNB_REGION_IDS.join(",")}`);
  }

  for (const region of regions) {
    if (!GNB_REGION_IDS.includes(region as GnbRegion)) {
      throw new Error(`invalid --layout value: ${region}. Use ${GNB_REGION_IDS.join(",")}`);
    }
  }

  return GNB_REGION_IDS.filter((region) => regions.includes(region));
}
