import {
  DEFAULT_GNB_REGIONS,
  GNB_REGIONS,
  isGnbRegion,
  normalizeGnbLayoutConfig,
  type GnbLayoutConfig,
  type GnbRegion,
} from "@/lib/layout/gnb-layout-config";

export const GNB_LAYOUT_STORAGE_EVENT = "kmsf:gnb-layout-change";
export const GNB_LAYOUT_STORAGE_VERSION = 1;

export type RuntimeGnbLayoutConfig = {
  enabledRegions: GnbRegion[];
  version: typeof GNB_LAYOUT_STORAGE_VERSION;
};

export function getGnbLayoutStorageKey(username: string) {
  return `kmsf:gnb-layout:${encodeURIComponent(username)}`;
}

export function normalizeRuntimeGnbRegions(
  value: unknown,
  fallbackRegions: readonly GnbRegion[] = DEFAULT_GNB_REGIONS,
): GnbRegion[] {
  const candidate = Array.isArray(value) ? value : fallbackRegions;
  const regions = candidate.filter(isGnbRegion);
  const withRequiredLeft = regions.includes("left") ? regions : ["left", ...regions];
  const uniqueRegions = GNB_REGIONS.filter((region) => withRequiredLeft.includes(region));

  return uniqueRegions.length > 0 ? uniqueRegions : ["left"];
}

export function normalizeRuntimeGnbLayoutConfig(
  value: unknown,
  fallbackConfig?: GnbLayoutConfig,
): RuntimeGnbLayoutConfig {
  const fallbackRegions = normalizeGnbLayoutConfig(fallbackConfig).enabledRegions;

  if (!value || typeof value !== "object") {
    return {
      enabledRegions: normalizeRuntimeGnbRegions(fallbackRegions),
      version: GNB_LAYOUT_STORAGE_VERSION,
    };
  }

  const candidate = value as Partial<RuntimeGnbLayoutConfig>;

  return {
    enabledRegions: normalizeRuntimeGnbRegions(candidate.enabledRegions, fallbackRegions),
    version: GNB_LAYOUT_STORAGE_VERSION,
  };
}

export function parseStoredRuntimeGnbLayoutConfig(
  value: string | null,
  fallbackConfig?: GnbLayoutConfig,
) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<RuntimeGnbLayoutConfig>;

    if (parsed.version !== GNB_LAYOUT_STORAGE_VERSION) {
      return null;
    }

    return normalizeRuntimeGnbLayoutConfig(parsed, fallbackConfig);
  } catch {
    return null;
  }
}

export function serializeRuntimeGnbLayoutConfig(config: unknown, fallbackConfig?: GnbLayoutConfig) {
  return JSON.stringify(normalizeRuntimeGnbLayoutConfig(config, fallbackConfig));
}
