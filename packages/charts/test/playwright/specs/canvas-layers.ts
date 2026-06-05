import { expect, type Locator, type Page } from "@playwright/test";

export interface ChartCanvasLayerInspection {
  blankCanvasCount: number;
  canvasCount: number;
  cardTestId: string;
  hiddenCanvasCount: number;
  layerIds: string[];
  paintedCanvasCount: number;
  zeroSizeCanvasCount: number;
  zrenderLayerKeys: string[];
}

export interface CanvasLayerSummary {
  blankCanvasCount: number;
  canvasCount: number;
  hiddenCanvasCount: number;
  paintedCanvasCount: number;
  zeroSizeCanvasCount: number;
}

export interface CanvasLayerCheckResult {
  failures: string[];
  inspections: ChartCanvasLayerInspection[];
  summary: CanvasLayerSummary;
}

interface MultiLayerAllowance {
  expectedLayerIds: string[];
  reason: string;
  sourceReference: string;
  triggerOption: string;
}

const multiLayerAllowances: Partial<Record<string, MultiLayerAllowance>> = {};
const numericZrLayerPattern = /^zr_-?\d+(?:\.\d+)?$/;

function summarizeCanvasLayers(inspections: ChartCanvasLayerInspection[]): CanvasLayerSummary {
  return inspections.reduce<CanvasLayerSummary>(
    (summary, inspection) => ({
      blankCanvasCount: summary.blankCanvasCount + inspection.blankCanvasCount,
      canvasCount: summary.canvasCount + inspection.canvasCount,
      hiddenCanvasCount: summary.hiddenCanvasCount + inspection.hiddenCanvasCount,
      paintedCanvasCount: summary.paintedCanvasCount + inspection.paintedCanvasCount,
      zeroSizeCanvasCount: summary.zeroSizeCanvasCount + inspection.zeroSizeCanvasCount,
    }),
    {
      blankCanvasCount: 0,
      canvasCount: 0,
      hiddenCanvasCount: 0,
      paintedCanvasCount: 0,
      zeroSizeCanvasCount: 0,
    },
  );
}

export async function inspectChartCanvasLayers(cards: Locator): Promise<ChartCanvasLayerInspection[]> {
  return cards.evaluateAll((cardElements) =>
    cardElements.map((cardElement) => {
      const card = cardElement as HTMLElement;
      const canvases = Array.from(card.querySelectorAll("canvas")) as HTMLCanvasElement[];
      const zrenderLayers = Array.from(card.querySelectorAll<HTMLElement>("[data-zr-dom-id]"))
        .map((element) => element.dataset.zrDomId)
        .filter((value): value is string => Boolean(value));
      let blankCanvasCount = 0;
      let hiddenCanvasCount = 0;
      let paintedCanvasCount = 0;
      let zeroSizeCanvasCount = 0;

      for (const canvas of canvases) {
        const box = canvas.getBoundingClientRect();
        const style = window.getComputedStyle(canvas);
        const isHidden =
          box.width === 0 ||
          box.height === 0 ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0";

        if (isHidden) {
          hiddenCanvasCount += 1;
        }

        if (canvas.width === 0 || canvas.height === 0) {
          zeroSizeCanvasCount += 1;
          continue;
        }

        const blank = document.createElement("canvas");
        blank.width = canvas.width;
        blank.height = canvas.height;

        if (canvas.toDataURL("image/png") === blank.toDataURL("image/png")) {
          blankCanvasCount += 1;
          continue;
        }

        paintedCanvasCount += 1;
      }

      return {
        blankCanvasCount,
        canvasCount: canvases.length,
        cardTestId: card.dataset.testid ?? "unknown-card",
        hiddenCanvasCount,
        layerIds: canvases.map((canvas) => canvas.dataset.zrDomId ?? "missing"),
        paintedCanvasCount,
        zeroSizeCanvasCount,
        zrenderLayerKeys: zrenderLayers,
      };
    }),
  );
}

export function checkCanvasLayers(type: string, inspections: ChartCanvasLayerInspection[]): CanvasLayerCheckResult {
  const allowance = multiLayerAllowances[type];
  const failures: string[] = [];

  for (const inspection of inspections) {
    if (inspection.canvasCount === 0) {
      failures.push(`${inspection.cardTestId}: expected a chart canvas`);
    }

    if (inspection.hiddenCanvasCount > 0) {
      failures.push(`${inspection.cardTestId}: hidden canvases=${inspection.hiddenCanvasCount}`);
    }

    if (inspection.zeroSizeCanvasCount > 0) {
      failures.push(`${inspection.cardTestId}: zero-size canvases=${inspection.zeroSizeCanvasCount}`);
    }

    if (inspection.blankCanvasCount > 0) {
      failures.push(`${inspection.cardTestId}: blank canvases=${inspection.blankCanvasCount}`);
    }

    if (inspection.layerIds.includes("zr_undefined")) {
      failures.push(`${inspection.cardTestId}: undefined zrender layer id found (${inspection.layerIds.join(",")})`);
    }

    if (inspection.layerIds.includes("missing")) {
      failures.push(`${inspection.cardTestId}: canvas without data-zr-dom-id found (${inspection.layerIds.join(",")})`);
    }

    const duplicateLayerIds = inspection.layerIds.filter(
      (layerId, index) => inspection.layerIds.indexOf(layerId) !== index,
    );

    if (duplicateLayerIds.length > 0) {
      failures.push(`${inspection.cardTestId}: duplicate layer ids=${duplicateLayerIds.join(",")}`);
    }

    if (!allowance && inspection.canvasCount !== 1) {
      failures.push(`${inspection.cardTestId}: expected 1 canvas without allow-list, found ${inspection.canvasCount}`);
    }

    if (allowance) {
      const unexpectedLayerIds = inspection.layerIds.filter((layerId) => !allowance.expectedLayerIds.includes(layerId));

      if (unexpectedLayerIds.length > 0) {
        failures.push(
          `${inspection.cardTestId}: unexpected layer ids=${unexpectedLayerIds.join(",")} for ${allowance.reason}`,
        );
      }

      if (!inspection.layerIds.every((layerId) => numericZrLayerPattern.test(layerId))) {
        failures.push(
          `${inspection.cardTestId}: non-numeric layer id for allowed multi-layer case (${inspection.layerIds.join(",")})`,
        );
      }
    }
  }

  return {
    failures,
    inspections,
    summary: summarizeCanvasLayers(inspections),
  };
}

export async function getCanvasLayerCheck(cards: Locator, type: string): Promise<CanvasLayerCheckResult> {
  const inspections = await inspectChartCanvasLayers(cards);

  return checkCanvasLayers(type, inspections);
}

export async function expectChartCanvasLayers(cards: Locator, type: string) {
  let latest: CanvasLayerCheckResult | null = null;

  await expect
    .poll(async () => {
      latest = await getCanvasLayerCheck(cards, type);

      return latest.failures.join("\n");
    })
    .toBe("");

  return latest ?? getCanvasLayerCheck(cards, type);
}

export function selectedChartCards(page: Page, type: string) {
  return page.getByTestId(new RegExp(`chart-example-card-${type}-`));
}
