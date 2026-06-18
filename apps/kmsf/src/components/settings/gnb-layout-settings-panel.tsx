"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_GNB_REGIONS,
  GNB_REGIONS,
  hasGnbRegion,
  type GnbLayoutConfig,
  type GnbRegion,
} from "@/lib/layout/gnb-layout-config";
import {
  GNB_LAYOUT_STORAGE_EVENT,
  getGnbLayoutStorageKey,
  normalizeRuntimeGnbLayoutConfig,
  parseStoredRuntimeGnbLayoutConfig,
  serializeRuntimeGnbLayoutConfig,
} from "@/lib/layout/gnb-layout-runtime";
import { cn } from "@/lib/utils";

type GnbLayoutSettingsLabels = {
  description: string;
  fixed: string;
  reset: string;
  regions: Record<GnbRegion, { description: string; title: string }>;
  title: string;
};

type GnbLayoutSettingsPanelProps = {
  labels: GnbLayoutSettingsLabels;
  setupLayout?: GnbLayoutConfig;
  username: string;
};

function readRuntimeGnbLayout(storageKey: string, fallbackLayout: GnbLayoutConfig) {
  if (typeof window === "undefined") {
    return normalizeRuntimeGnbLayoutConfig(fallbackLayout, fallbackLayout);
  }

  const storedLayout = parseStoredRuntimeGnbLayoutConfig(
    window.localStorage.getItem(storageKey),
    fallbackLayout,
  );

  return storedLayout ?? normalizeRuntimeGnbLayoutConfig(fallbackLayout, fallbackLayout);
}

export function GnbLayoutSettingsPanel({
  labels,
  setupLayout,
  username,
}: GnbLayoutSettingsPanelProps) {
  const fallbackLayout = useMemo(
    () => normalizeRuntimeGnbLayoutConfig(setupLayout ?? { enabledRegions: DEFAULT_GNB_REGIONS }),
    [setupLayout],
  );
  const storageKey = getGnbLayoutStorageKey(username);
  const [layout, setLayout] = useState(fallbackLayout);

  useEffect(() => {
    function syncRuntimeGnbLayout() {
      setLayout(readRuntimeGnbLayout(storageKey, fallbackLayout));
    }

    const animationFrameId = window.requestAnimationFrame(syncRuntimeGnbLayout);
    window.addEventListener("storage", syncRuntimeGnbLayout);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("storage", syncRuntimeGnbLayout);
    };
  }, [fallbackLayout, storageKey]);

  function publishLayout(nextLayout: GnbLayoutConfig) {
    const normalizedLayout = normalizeRuntimeGnbLayoutConfig(nextLayout, fallbackLayout);

    setLayout(normalizedLayout);
    window.localStorage.setItem(
      storageKey,
      serializeRuntimeGnbLayoutConfig(normalizedLayout, fallbackLayout),
    );
    window.dispatchEvent(new Event(GNB_LAYOUT_STORAGE_EVENT));
  }

  function toggleRegion(region: GnbRegion) {
    if (region === "left") {
      return;
    }

    const enabledRegions = hasGnbRegion(layout, region)
      ? layout.enabledRegions.filter((value) => value !== region)
      : GNB_REGIONS.filter((value) => value === region || layout.enabledRegions.includes(value));

    publishLayout({ enabledRegions });
  }

  function resetLayout() {
    window.localStorage.removeItem(storageKey);
    setLayout(fallbackLayout);
    window.dispatchEvent(new Event(GNB_LAYOUT_STORAGE_EVENT));
  }

  return (
    <article className="content-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{labels.title}</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/65">{labels.description}</p>
        </div>
        <Button onClick={resetLayout} type="button" variant="secondary">
          <RotateCcw className="h-4 w-4" />
          {labels.reset}
        </Button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {GNB_REGIONS.map((region) => {
          const checked = hasGnbRegion(layout, region);
          const disabled = region === "left";
          const regionLabels = labels.regions[region];

          return (
            <label
              key={region}
              className={cn(
                "flex min-h-[7rem] gap-4 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4 transition-colors",
                checked && "border-accent bg-panel-hover",
                disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer",
              )}
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 accent-[var(--kmsf-color-accent)]"
                disabled={disabled}
                onChange={() => toggleRegion(region)}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {regionLabels.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-foreground/65">
                  {regionLabels.description}
                </span>
                {disabled ? (
                  <span className="mt-2 block text-xs font-medium text-accent">{labels.fixed}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </article>
  );
}
