import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { GnbRegion } from "../types.js";

const CONFIG_PATH = "src/lib/layout/gnb-layout-config.ts";
const DEFAULT_REGION_LINE =
  /export const DEFAULT_GNB_REGIONS = \[[^\]]*\] as const satisfies readonly GnbRegion\[\];/;

export async function applyGnbLayoutMode(
  projectRoot: string,
  options: { gnbRegions: GnbRegion[] },
) {
  const filePath = join(projectRoot, CONFIG_PATH);
  const source = await readFile(filePath, "utf8");
  const replacement = options.gnbRegions.map((region) => `"${region}"`).join(", ");
  const nextSource = source.replace(
    DEFAULT_REGION_LINE,
    `export const DEFAULT_GNB_REGIONS = [${replacement}] as const satisfies readonly GnbRegion[];`,
  );

  await writeFile(filePath, nextSource, "utf8");
}
