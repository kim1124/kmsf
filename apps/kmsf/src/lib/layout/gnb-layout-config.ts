export const GNB_REGIONS = ["top", "left", "right", "footer"] as const;
export const DEFAULT_GNB_REGIONS = ["top", "left"] as const satisfies readonly GnbRegion[];

export type GnbRegion = (typeof GNB_REGIONS)[number];

export type GnbLayoutConfig = {
  enabledRegions: GnbRegion[];
};

export function isGnbRegion(value: unknown): value is GnbRegion {
  return typeof value === "string" && GNB_REGIONS.includes(value as GnbRegion);
}

export function normalizeGnbRegions(value: unknown): GnbRegion[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_GNB_REGIONS];
  }

  const regions = value.filter(isGnbRegion);
  return GNB_REGIONS.filter((region) => regions.includes(region));
}

export function normalizeGnbLayoutConfig(value: unknown): GnbLayoutConfig {
  if (!value || typeof value !== "object") {
    return { enabledRegions: [...DEFAULT_GNB_REGIONS] };
  }

  const candidate = value as Partial<GnbLayoutConfig>;

  return {
    enabledRegions: normalizeGnbRegions(candidate.enabledRegions),
  };
}

export function hasGnbRegion(config: GnbLayoutConfig, region: GnbRegion) {
  return config.enabledRegions.includes(region);
}
