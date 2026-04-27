import type { GridStackOptions } from "gridstack";
import { clampDashboardColumnCount } from "../core/columns";
import type { DashboardInteractionOptions } from "../core/types";

export type DashboardGridEngineOptions = DashboardInteractionOptions & {
  columns?: number;
  cellHeight?: GridStackOptions["cellHeight"];
  margin?: GridStackOptions["margin"];
};

export function mapDashboardGridOptions(options: DashboardGridEngineOptions = {}): GridStackOptions {
  const editable = options.editable ?? true;
  const movable = editable && (options.movable ?? true);
  const resizable = editable && (options.resizable ?? true);

  return {
    cellHeight: options.cellHeight ?? 96,
    column: clampDashboardColumnCount(options.columns ?? 12),
    disableDrag: !movable,
    disableResize: !resizable,
    float: false,
    margin: options.margin ?? 8,
    resizable: { handles: "se" },
  };
}
