export type GnbRegion = "top" | "left" | "right" | "footer";

export const DEFAULT_GNB_REGIONS = ["top", "left", "footer"] as const satisfies readonly GnbRegion[];

export function hasGnbRegion(region: GnbRegion): boolean {
  return (DEFAULT_GNB_REGIONS as readonly GnbRegion[]).includes(region);
}
