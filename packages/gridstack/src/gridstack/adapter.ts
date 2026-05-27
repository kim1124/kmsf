import { GridStack } from "gridstack";
import type { GridItemHTMLElement, GridStackNode, GridStackWidget } from "gridstack";
import { mapDashboardGridOptions } from "./option-mapper";
import type { DashboardGridEngineOptions } from "./option-mapper";
import type { DashboardLayoutSnapshot, DashboardWidget, DashboardWidgetLayout } from "../core/types";

export type DashboardGridAdapterOptions<TData = unknown> = DashboardGridEngineOptions & {
  widgets: DashboardWidget<TData>[];
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetLayout) => void;
  onWidgetResize?: (id: string, size: { width: number; height: number }) => void;
};

export type DashboardGridAdapter<TData = unknown> = {
  grid: GridStack;
  sync: (options: DashboardGridAdapterOptions<TData>) => void;
  refresh: () => void;
  compact: () => void;
  destroy: () => void;
};

export function createDashboardGridAdapter<TData>(
  element: HTMLElement,
  options: DashboardGridAdapterOptions<TData>,
): DashboardGridAdapter<TData> {
  const grid = GridStack.init(mapDashboardGridOptions(options), element);
  let currentOptions = options;
  let isInteracting = false;
  let pendingCommit = false;
  let pendingSync = false;
  let finishInteractionFrame: number | undefined;
  let deferredSyncFrame: number | undefined;

  const commitLayout = () => {
    const snapshot = readDashboardLayoutSnapshot(grid, currentOptions.columns ?? 12);
    snapshot.widgets.forEach((layout) => currentOptions.onWidgetLayoutChange?.(layout.id, layout));
    currentOptions.onLayoutCommit?.(snapshot);
  };

  const resizeHandler = (_event: Event, item: GridItemHTMLElement) => {
    const id = item.getAttribute("gs-id") ?? item.getAttribute("data-widget-id");
    if (!id) {
      return;
    }
    const rect = item.getBoundingClientRect();
    currentOptions.onWidgetResize?.(id, { width: rect.width, height: rect.height });
  };

  const runSync = (nextOptions: DashboardGridAdapterOptions<TData>) => {
    grid.updateOptions(mapDashboardGridOptions(nextOptions));
    grid.column(nextOptions.columns ?? 12, "move");
    syncGridWidgets(grid, element, nextOptions.widgets, nextOptions);
  };

  const cancelFrame = (frame: number | undefined) => {
    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
    }
  };

  const scheduleDeferredSync = () => {
    cancelFrame(deferredSyncFrame);
    deferredSyncFrame = window.requestAnimationFrame(() => {
      deferredSyncFrame = undefined;
      if (isInteracting) {
        pendingSync = true;
        return;
      }
      runSync(currentOptions);
    });
  };

  const flushInteraction = () => {
    finishInteractionFrame = undefined;
    isInteracting = false;

    const shouldCommit = pendingCommit;
    const shouldSync = pendingSync;
    pendingCommit = false;
    pendingSync = false;

    if (shouldCommit) {
      commitLayout();
    }
    if (shouldSync) {
      scheduleDeferredSync();
    }
  };

  const startInteraction = () => {
    isInteracting = true;
    cancelFrame(finishInteractionFrame);
    finishInteractionFrame = undefined;
  };

  const stopInteraction = () => {
    pendingCommit = true;
    cancelFrame(finishInteractionFrame);
    finishInteractionFrame = window.requestAnimationFrame(flushInteraction);
  };

  const changeHandler = () => {
    if (isInteracting) {
      pendingCommit = true;
      return;
    }
    commitLayout();
  };

  grid.on("change", changeHandler);
  grid.on("dragstart", startInteraction);
  grid.on("resizestart", startInteraction);
  grid.on("dragstop", stopInteraction);
  grid.on("resizestop", stopInteraction);
  grid.on("resize", resizeHandler);

  const adapter: DashboardGridAdapter<TData> = {
    grid,
    sync(nextOptions) {
      currentOptions = nextOptions;
      if (isInteracting) {
        pendingSync = true;
        return;
      }
      runSync(nextOptions);
    },
    refresh() {
      grid.compact("compact", true);
    },
    compact() {
      grid.compact("compact", true);
      commitLayout();
    },
    destroy() {
      cancelFrame(finishInteractionFrame);
      cancelFrame(deferredSyncFrame);
      grid.offAll();
      grid.destroy(false);
    },
  };

  adapter.sync(options);

  return adapter;
}

export function toGridStackWidget<TData>(
  widget: DashboardWidget<TData>,
  options: DashboardGridEngineOptions,
): GridStackWidget {
  const editable = options.editable ?? true;
  const movable = editable && (options.movable ?? true) && !widget.locked;
  const resizable = editable && (options.resizable ?? true) && !widget.locked;

  return {
    ...widget.layout,
    id: widget.id,
    locked: widget.locked,
    noMove: !movable,
    noResize: !resizable,
  };
}

export function readDashboardLayoutSnapshot(grid: GridStack, columns: number): DashboardLayoutSnapshot {
  const saved = grid.save(false, false, undefined, columns) as GridStackWidget[];

  return {
    columns: mapDashboardGridOptions({ columns }).column as DashboardLayoutSnapshot["columns"],
    widgets: saved
      .filter((item): item is GridStackWidget & { id: string } => typeof item.id === "string")
      .map((item) => ({
        id: item.id,
        x: item.x ?? 0,
        y: item.y ?? 0,
        w: item.w ?? 1,
        h: item.h ?? 1,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      })),
  };
}

function syncGridWidgets<TData>(
  grid: GridStack,
  element: HTMLElement,
  widgets: DashboardWidget<TData>[],
  options: DashboardGridEngineOptions,
) {
  const nextIds = new Set(widgets.map((widget) => widget.id));
  const nodes = [...grid.engine.nodes] as GridStackNode[];

  nodes.forEach((node) => {
    if (typeof node.id === "string" && !nextIds.has(node.id) && node.el) {
      grid.removeWidget(node.el, false, false);
    }
  });

  widgets.forEach((widget) => {
    const item = element.querySelector<HTMLElement>(`[data-widget-id="${widget.id}"]`);
    if (!item) {
      return;
    }

    const gridItem = item as GridItemHTMLElement;
    const gridWidget = toGridStackWidget(widget, options);
    if (gridItem.gridstackNode) {
      grid.update(gridItem, gridWidget);
    } else {
      grid.makeWidget(gridItem, gridWidget);
    }
    grid.movable(gridItem, !(gridWidget.noMove ?? false));
    grid.resizable(gridItem, !(gridWidget.noResize ?? false));
  });
}
