import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { createDashboardResizeScheduler } from "../core/resize-scheduler";
import type {
  DashboardColumnCount,
  DashboardInteractionOptions,
  DashboardLayoutSnapshot,
  DashboardWidget as DashboardWidgetModel,
  DashboardWidgetResizeFrameEvent,
} from "../core/types";
import { createDashboardGridAdapter } from "../gridstack/adapter";
import type { DashboardGridAdapter } from "../gridstack/adapter";
import { DashboardWidgetShell } from "./DashboardWidget";
import type { DashboardWidgetActionLabels } from "./DashboardWidget";

export type DashboardGridProps<TData = unknown> = DashboardInteractionOptions & {
  widgets: DashboardWidgetModel<TData>[];
  columns?: DashboardColumnCount;
  className?: string;
  refreshKey?: number;
  showControls?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetModel<TData>["layout"]) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  onMaximizeWidget?: (id: string) => void;
  onMinimizeWidget?: (id: string) => void;
  onRestoreWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  onWidgetHeaderDoubleClick?: (id: string) => void;
};

export function DashboardGrid<TData = unknown>({
  widgets,
  columns = 12,
  editable = true,
  movable = true,
  resizable = true,
  className,
  refreshKey,
  showControls = true,
  actionLabels,
  renderWidget,
  onLayoutCommit,
  onWidgetLayoutChange,
  onWidgetResizeFrame,
  onMaximizeWidget,
  onMinimizeWidget,
  onRestoreWidget,
  onRemoveWidget,
  onWidgetHeaderDoubleClick,
}: DashboardGridProps<TData>) {
  const gridElementRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<DashboardGridAdapter<TData> | undefined>(undefined);
  const resizeScheduler = useMemo(
    () =>
      createDashboardResizeScheduler((event) => {
        onWidgetResizeFrame?.(event);
      }),
    [onWidgetResizeFrame],
  );

  const adapterOptions = useMemo(
    () => ({
      columns,
      editable,
      movable,
      resizable,
      widgets,
      onLayoutCommit,
      onWidgetLayoutChange,
      onWidgetResize: (id: string, size: { width: number; height: number }) => {
        resizeScheduler.schedule({ id, width: size.width, height: size.height });
      },
    }),
    [columns, editable, movable, onLayoutCommit, onWidgetLayoutChange, resizable, resizeScheduler, widgets],
  );

  useEffect(() => {
    if (!gridElementRef.current) {
      return;
    }

    const adapter = createDashboardGridAdapter(gridElementRef.current, adapterOptions);
    adapterRef.current = adapter;

    return () => {
      resizeScheduler.cancel();
      adapter.destroy();
      adapterRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    adapterRef.current?.sync(adapterOptions);
  }, [adapterOptions]);

  useEffect(() => {
    if (refreshKey !== undefined) {
      adapterRef.current?.refresh();
    }
  }, [refreshKey]);

  return (
    <section
      ref={gridElementRef}
      className={["grid-stack", "kmsf-dashboard-grid", className].filter(Boolean).join(" ")}
      data-columns={columns}
      data-testid="dashboard-grid"
    >
      {widgets.map((widget) => (
        <article
          className="grid-stack-item"
          data-layout-h={widget.layout.h}
          data-layout-w={widget.layout.w}
          data-layout-x={widget.layout.x}
          data-layout-y={widget.layout.y}
          data-maximized={String(widget.maximized ?? false)}
          data-minimized={String(widget.minimized ?? false)}
          data-testid={`dashboard-widget-${widget.id}`}
          data-widget-id={widget.id}
          gs-h={String(widget.layout.h)}
          gs-id={widget.id}
          gs-w={String(widget.layout.w)}
          gs-x={String(widget.layout.x)}
          gs-y={String(widget.layout.y)}
          key={widget.id}
        >
          <div className="grid-stack-item-content">
            <DashboardWidgetShell
              widget={widget}
              labels={{
                maximize: actionLabels?.maximize ?? "최대화",
                minimize: actionLabels?.minimize ?? "최소화",
                restore: actionLabels?.restore ?? "복원",
                remove: actionLabels?.remove ?? "삭제",
              }}
              showControls={showControls}
              onMaximize={onMaximizeWidget}
              onMinimize={onMinimizeWidget}
              onRestore={onRestoreWidget}
              onRemove={onRemoveWidget}
              onHeaderDoubleClick={onWidgetHeaderDoubleClick}
            >
              {renderWidget(widget)}
            </DashboardWidgetShell>
          </div>
        </article>
      ))}
    </section>
  );
}
