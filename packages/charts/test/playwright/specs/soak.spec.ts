import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test, type CDPSession, type ConsoleMessage, type Locator, type Page } from "@playwright/test";

import { getCanvasLayerCheck, type ChartCanvasLayerInspection } from "./canvas-layers";

const implementedChartTypes = [
  "line",
  "bar",
  "pie",
  "scatter",
  "effectScatter",
  "candlestick",
  "radar",
  "heatmap",
  "tree",
  "treemap",
  "sunburst",
  "lines",
  "graph",
  "boxplot",
  "parallel",
  "gauge",
  "funnel",
  "sankey",
  "themeRiver",
  "pictorialBar",
  "wordCloud",
] as const;

const preparedChartTypes = ["map", "custom"] as const;
type ImplementedChartType = (typeof implementedChartTypes)[number];

interface SoakAnomaly {
  elapsedSeconds: number;
  message: string;
  type: string;
}

interface SoakSnapshot {
  blankCanvasCount: number;
  canvasCount: number;
  canvasLayers: ChartCanvasLayerInspection[];
  diagnosticsCount: number;
  documents?: number;
  domNodes?: number;
  elapsedSeconds: number;
  eventListeners?: number;
  forcedGcHeapUsed?: number;
  heapLimit?: number;
  heapTotal?: number;
  heapUsed?: number;
  hiddenCanvasCount: number;
  layoutCount?: number;
  layoutDuration?: number;
  paintedCanvasCount: number;
  recalcStyleCount?: number;
  recalcStyleDuration?: number;
  scriptDuration?: number;
  sampleDataChanged: boolean;
  taskDuration?: number;
  type: string;
  updateLatencyMs?: number;
  viewport: { height: number; width: number };
  zeroSizeCanvasCount: number;
}

function collectBrowserDiagnostics(page: Page) {
  const diagnostics: Array<{ text: string; type: ReturnType<ConsoleMessage["type"]> | "pageerror" }> = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.push({ text: message.text(), type: message.type() });
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.push({ text: error.message, type: "pageerror" });
  });

  return diagnostics;
}

function getSoakDurationMs() {
  const durationSeconds = Number(process.env.KMSF_CHARTS_SOAK_DURATION ?? "60");
  const safeDurationSeconds = Number.isFinite(durationSeconds) ? durationSeconds : 60;

  return Math.max(1, Math.round(safeDurationSeconds)) * 1000;
}

function getSoakIntervalMs() {
  const intervalSeconds = Number(process.env.KMSF_CHARTS_SOAK_INTERVAL ?? "10");
  const safeIntervalSeconds = Number.isFinite(intervalSeconds) ? intervalSeconds : 10;

  return Math.max(1, Math.round(safeIntervalSeconds)) * 1000;
}

function isRecordOnlySoak() {
  return process.env.KMSF_CHARTS_SOAK_RECORD_ONLY === "1";
}

function getSoakChartTypes(): ImplementedChartType[] {
  const configuredTypes = (process.env.KMSF_CHARTS_SOAK_TYPES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredTypes.length === 0) {
    return [...implementedChartTypes];
  }

  const allowedTypes = new Set<string>(implementedChartTypes);
  const selectedTypes = configuredTypes.filter((type): type is ImplementedChartType => allowedTypes.has(type));

  return selectedTypes.length > 0 ? selectedTypes : [...implementedChartTypes];
}

async function gotoChartExample(page: Page, type: string) {
  await page.goto(`/examples/${type}`);
}

async function openPropsTab(card: Locator) {
  await card.getByRole("tab", { name: "Props" }).click();
}

function elapsedSeconds(startedAt: number) {
  return Math.round((Date.now() - startedAt) / 1000);
}

function recordAnomaly(anomalies: SoakAnomaly[], startedAt: number, type: string, message: string) {
  anomalies.push({
    elapsedSeconds: elapsedSeconds(startedAt),
    message,
    type,
  });
}

async function readBrowserMemory(page: Page) {
  return page.evaluate(() => {
    const memory = (performance as Performance & {
      memory?: {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
      };
    }).memory;

    if (!memory) {
      return null;
    }

    return {
      heapLimit: memory.jsHeapSizeLimit,
      heapTotal: memory.totalJSHeapSize,
      heapUsed: memory.usedJSHeapSize,
    };
  });
}

async function createPerformanceSession(page: Page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Performance.enable");

  return session;
}

function metricValue(metrics: Array<{ name: string; value: number }>, name: string) {
  return metrics.find((metric) => metric.name === name)?.value;
}

async function readPerformanceCheckpoint(session: CDPSession) {
  await session.send("HeapProfiler.collectGarbage");

  const [domCounters, performanceMetrics] = await Promise.all([
    session.send("Memory.getDOMCounters"),
    session.send("Performance.getMetrics"),
  ]);
  const metrics = performanceMetrics.metrics as Array<{ name: string; value: number }>;

  return {
    documents: domCounters.documents as number,
    domNodes: domCounters.nodes as number,
    eventListeners: domCounters.jsEventListeners as number,
    forcedGcHeapUsed: metricValue(metrics, "JSHeapUsedSize"),
    layoutCount: metricValue(metrics, "LayoutCount"),
    layoutDuration: metricValue(metrics, "LayoutDuration"),
    recalcStyleCount: metricValue(metrics, "RecalcStyleCount"),
    recalcStyleDuration: metricValue(metrics, "RecalcStyleDuration"),
    scriptDuration: metricValue(metrics, "ScriptDuration"),
    taskDuration: metricValue(metrics, "TaskDuration"),
  };
}

async function readText(locator: Locator) {
  return (await locator.textContent()) ?? "";
}

function summarizeMemory(samples: SoakSnapshot[]) {
  const memorySamples = samples.filter((sample): sample is SoakSnapshot & { heapUsed: number } =>
    typeof sample.heapUsed === "number",
  );

  if (memorySamples.length < 2) {
    return {
      available: false,
      peakGrowthBytes: 0,
      peakGrowthRatio: 0,
      sampleCount: memorySamples.length,
    };
  }

  const warmupSamples = memorySamples.slice(Math.min(3, memorySamples.length - 1));
  const baseline = warmupSamples[0]!.heapUsed;
  const final = memorySamples[memorySamples.length - 1]!.heapUsed;
  const peak = Math.max(...warmupSamples.map((sample) => sample.heapUsed));

  return {
    available: true,
    baseline,
    final,
    peak,
    peakGrowthBytes: peak - baseline,
    peakGrowthRatio: baseline > 0 ? peak / baseline : 0,
    sampleCount: memorySamples.length,
  };
}

test("line live chart updates during soak without browser diagnostics", async ({ page }) => {
  const durationMs = getSoakDurationMs();
  test.setTimeout(durationMs + 30_000);
  const diagnostics = collectBrowserDiagnostics(page);

  await gotoChartExample(page, "line");

  const liveCard = page.getByTestId("chart-example-card-line-live-update");
  await openPropsTab(liveCard);
  const liveData = liveCard.getByTestId("sample-data");
  await expect.poll(async () => (await getCanvasLayerCheck(liveCard, "line")).failures.join("\n")).toBe("");
  const before = await liveData.textContent();

  await page.waitForTimeout(durationMs);

  await expect(liveData).not.toHaveText(before ?? "");
  expect(diagnostics).toEqual([]);
});

test("line live chart performance and memory stay stable during soak", async ({ page }, testInfo) => {
  const durationMs = getSoakDurationMs();
  const intervalMs = getSoakIntervalMs();
  test.setTimeout(durationMs + 90_000);
  const startedAt = Date.now();
  const diagnostics = collectBrowserDiagnostics(page);
  const anomalies: SoakAnomaly[] = [];
  const snapshots: SoakSnapshot[] = [];
  const type = "line";
  const performanceSession = await createPerformanceSession(page);

  await gotoChartExample(page, type);

  const cards = page.getByTestId(new RegExp(`chart-example-card-${type}-`));
  const liveCard = page.getByTestId("chart-example-card-line-live-update");
  await openPropsTab(liveCard);
  const liveData = liveCard.getByTestId("sample-data");
  let previousData = await readText(liveData);
  let cycle = 0;

  while (Date.now() - startedAt < durationMs) {
    const viewport = cycle % 2 === 0 ? { height: 820, width: 1280 } : { height: 780, width: 900 };
    const updateStartedAt = Date.now();
    let canvasLayerCheck = await getCanvasLayerCheck(cards, type);

    await page.setViewportSize(viewport);

    try {
      await expect(cards).toHaveCount(5, { timeout: 3_000 });
    } catch (error) {
      recordAnomaly(anomalies, startedAt, type, `card visibility failed: ${String(error)}`);
    }

    try {
      await expect
        .poll(async () => {
          canvasLayerCheck = await getCanvasLayerCheck(cards, type);

          return canvasLayerCheck.failures.join("\n");
        }, { timeout: 3_000 })
        .toBe("");
    } catch {
      for (const failure of canvasLayerCheck.failures) {
        recordAnomaly(anomalies, startedAt, type, `canvas layer failed: ${failure}`);
      }
    }

    await page.waitForTimeout(intervalMs);

    const currentData = await readText(liveData);
    const sampleDataChanged = currentData !== previousData;

    if (!sampleDataChanged) {
      recordAnomaly(anomalies, startedAt, type, "sample data did not change after the soak interval");
    }

    previousData = currentData;

    const memory = await readBrowserMemory(page);
    const performanceCheckpoint = await readPerformanceCheckpoint(performanceSession);
    snapshots.push({
      ...canvasLayerCheck.summary,
      canvasLayers: canvasLayerCheck.inspections,
      diagnosticsCount: diagnostics.length,
      elapsedSeconds: elapsedSeconds(startedAt),
      ...(memory ?? {}),
      ...performanceCheckpoint,
      sampleDataChanged,
      type,
      updateLatencyMs: Date.now() - updateStartedAt,
      viewport,
    });

    cycle += 1;
  }

  const memorySummary = summarizeMemory(snapshots);

  if (snapshots.some((sample) => typeof sample.forcedGcHeapUsed !== "number")) {
    recordAnomaly(anomalies, startedAt, "performance", "forced GC heap metric was not collected for every snapshot");
  }

  if (snapshots.some((sample) => typeof sample.domNodes !== "number" || typeof sample.eventListeners !== "number")) {
    recordAnomaly(anomalies, startedAt, "performance", "DOM and event listener metrics were not collected for every snapshot");
  }

  if (snapshots.some((sample) => typeof sample.updateLatencyMs !== "number")) {
    recordAnomaly(anomalies, startedAt, "performance", "update latency metric was not collected for every snapshot");
  }

  if (
    memorySummary.available &&
    memorySummary.peakGrowthRatio > 1.75 &&
    memorySummary.peakGrowthBytes > 50 * 1024 * 1024
  ) {
    recordAnomaly(
      anomalies,
      startedAt,
      "memory",
      `heap growth exceeded threshold: ratio=${memorySummary.peakGrowthRatio.toFixed(2)}, bytes=${memorySummary.peakGrowthBytes}`,
    );
  }

  const artifact = {
    anomalies,
    diagnostics,
    durationMs,
    intervalMs,
    memorySummary,
    snapshotCount: snapshots.length,
    snapshots,
    type,
  };
  const artifactPath = testInfo.outputPath("line-trend-soak.json");
  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  await testInfo.attach("line-trend-soak", { contentType: "application/json", path: artifactPath });

  expect(diagnostics).toEqual([]);
  expect(anomalies).toEqual([]);
});

test("all implemented chart types update during soak without browser diagnostics", async ({ page }, testInfo) => {
  const durationMs = getSoakDurationMs();
  const intervalMs = getSoakIntervalMs();
  const recordOnly = isRecordOnlySoak();
  const selectedChartTypes = getSoakChartTypes();
  test.setTimeout(durationMs + 120_000);
  const startedAt = Date.now();
  const diagnostics = collectBrowserDiagnostics(page);
  const anomalies: SoakAnomaly[] = [];
  const snapshots: SoakSnapshot[] = [];
  const performanceSession = await createPerformanceSession(page);

  for (const type of preparedChartTypes) {
    await gotoChartExample(page, type);
    const placeholder = page.getByTestId(new RegExp(`chart-example-card-${type}-`));

    try {
      await expect(placeholder).toContainText("준비");
    } catch (error) {
      recordAnomaly(anomalies, startedAt, type, `prepared chart placeholder failed: ${String(error)}`);
    }
  }

  let cycle = 0;
  while (Date.now() - startedAt < durationMs) {
    const type = selectedChartTypes[cycle % selectedChartTypes.length]!;
    const viewport = cycle % 2 === 0 ? { height: 820, width: 1280 } : { height: 780, width: 900 };
    let sampleDataChanged = false;
    const updateStartedAt = Date.now();

    await page.setViewportSize(viewport);
    await gotoChartExample(page, type);

    const cards = page.getByTestId(new RegExp(`chart-example-card-${type}-`));
    const liveCard = page.getByTestId(`chart-example-card-${type}-live-update`);
    await openPropsTab(liveCard);
    const liveData = liveCard.getByTestId("sample-data");
    const before = await readText(liveData);

    try {
      await expect(cards).toHaveCount(5, { timeout: 3_000 });
    } catch (error) {
      recordAnomaly(anomalies, startedAt, type, `card visibility failed: ${String(error)}`);
    }

    let canvasLayerCheck = await getCanvasLayerCheck(cards, type);

    try {
      await expect
        .poll(async () => {
          canvasLayerCheck = await getCanvasLayerCheck(cards, type);

          return canvasLayerCheck.failures.join("\n");
        }, { timeout: 3_000 })
        .toBe("");
    } catch {
      for (const failure of canvasLayerCheck.failures) {
        recordAnomaly(anomalies, startedAt, type, `canvas layer failed: ${failure}`);
      }
    }

    await page.waitForTimeout(intervalMs);

    try {
      await expect.poll(() => readText(liveData), { timeout: 2_000 }).not.toBe(before);
      sampleDataChanged = true;
    } catch {
      recordAnomaly(anomalies, startedAt, type, "sample data did not change after the soak interval");
    }

    const memory = await readBrowserMemory(page);
    const performanceCheckpoint = await readPerformanceCheckpoint(performanceSession);
    snapshots.push({
      ...canvasLayerCheck.summary,
      canvasLayers: canvasLayerCheck.inspections,
      diagnosticsCount: diagnostics.length,
      elapsedSeconds: elapsedSeconds(startedAt),
      ...(memory ?? {}),
      ...performanceCheckpoint,
      sampleDataChanged,
      type,
      updateLatencyMs: Date.now() - updateStartedAt,
      viewport,
    });

    cycle += 1;
  }

  const memorySummary = summarizeMemory(snapshots);

  if (snapshots.some((sample) => typeof sample.forcedGcHeapUsed !== "number")) {
    recordAnomaly(anomalies, startedAt, "performance", "forced GC heap metric was not collected for every snapshot");
  }

  if (snapshots.some((sample) => typeof sample.domNodes !== "number" || typeof sample.eventListeners !== "number")) {
    recordAnomaly(anomalies, startedAt, "performance", "DOM and event listener metrics were not collected for every snapshot");
  }

  if (snapshots.some((sample) => typeof sample.updateLatencyMs !== "number")) {
    recordAnomaly(anomalies, startedAt, "performance", "update latency metric was not collected for every snapshot");
  }

  if (
    memorySummary.available &&
    memorySummary.peakGrowthRatio > 1.75 &&
    memorySummary.peakGrowthBytes > 50 * 1024 * 1024
  ) {
    recordAnomaly(
      anomalies,
      startedAt,
      "memory",
      `heap growth exceeded threshold: ratio=${memorySummary.peakGrowthRatio.toFixed(2)}, bytes=${memorySummary.peakGrowthBytes}`,
    );
  }

  const artifact = {
    anomalies,
    diagnostics,
    durationMs,
    implementedChartTypes,
    intervalMs,
    memorySummary,
    preparedChartTypes,
    recordOnly,
    selectedChartTypes,
    snapshotCount: snapshots.length,
    snapshots,
  };
  const artifactPath = testInfo.outputPath("all-charts-soak.json");
  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  await testInfo.attach("all-charts-soak", { contentType: "application/json", path: artifactPath });

  if (!recordOnly) {
    expect(diagnostics).toEqual([]);
    expect(anomalies).toEqual([]);
  }
});
