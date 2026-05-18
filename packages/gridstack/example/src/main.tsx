import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { DASHBOARD_COLUMN_COUNTS, DashboardGrid, useDashboardGrid } from "../../src";
import type { DashboardStateSnapshot, DashboardWidget } from "../../src";
import "gridstack/dist/gridstack.min.css";
import "../../src/styles.css";
import "./styles.css";

type ExampleWidgetData = {
  description: string;
  value: string;
};

const initialWidgets: DashboardWidget<ExampleWidgetData>[] = [
  {
    id: "sales",
    title: "매출",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { description: "월간 반복 매출", value: "1.28억" },
  },
  {
    id: "traffic",
    title: "트래픽",
    layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
    data: { description: "활성 세션", value: "4.28만" },
  },
  {
    id: "orders",
    title: "주문",
    layout: { id: "orders", x: 0, y: 2, w: 2, h: 2 },
    data: { description: "완료 주문", value: "1,284" },
  },
  {
    id: "alerts",
    title: "알림",
    layout: { id: "alerts", x: 2, y: 2, w: 4, h: 2 },
    data: { description: "미해결 이슈", value: "3" },
  },
];

function ExampleApp() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets,
  });
  const [movable, setMovable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState("저장된 레이아웃이 없습니다.");
  const [newWidgetHeight, setNewWidgetHeight] = useState(2);
  const [newWidgetWidth, setNewWidgetWidth] = useState(2);
  const nextWidgetNumber = useMemo(() => dashboard.widgets.length + 1, [dashboard.widgets.length]);

  const addWidget = () => {
    const id = `widget-${nextWidgetNumber}`;
    dashboard.commands.addWidget({
      id,
      title: `위젯 ${nextWidgetNumber}`,
      layout: { id, x: 0, y: 0, w: newWidgetWidth, h: newWidgetHeight },
      data: { description: "새 대시보드 위젯", value: String(nextWidgetNumber) },
    });
  };

  const saveLayout = () => {
    const json = JSON.stringify(dashboard.commands.serializeState(), null, 2);
    setLayoutJson(json);
    setLayoutStatus("저장 완료");
  };

  const restoreLayout = () => {
    try {
      const parsed = JSON.parse(layoutJson) as DashboardStateSnapshot<ExampleWidgetData>;
      if (!Array.isArray(parsed.widgets)) {
        throw new Error("widgets must be an array");
      }

      dashboard.commands.restoreLayout(parsed);
      setLayoutStatus("복원 완료");
    } catch {
      setLayoutStatus("JSON 형식을 확인해 주세요.");
    }
  };

  return (
    <main className="example-shell">
      <section className="example-toolbar" aria-labelledby="page-title">
        <div>
          <p className="example-kicker">개발 예제</p>
          <h1 id="page-title">@kmsf/gridstack</h1>
        </div>
        <div className="example-metrics" aria-label="layout settings">
          <span>컬럼 {dashboard.columns}</span>
          <span>{movable ? "이동 가능" : "이동 불가"}</span>
          <span>{resizable ? "크기 조절 가능" : "크기 조절 불가"}</span>
        </div>
      </section>

      <section className="example-actions" aria-label="dashboard actions">
        <button type="button" className="example-action-button example-action-button--add" onClick={addWidget}>
          위젯 추가
        </button>
        <button type="button" onClick={() => dashboard.commands.autoArrangeWidgets()}>
          자동 정렬
        </button>
        <label className="example-column-select" htmlFor="new-widget-width">
          <span>새 위젯 너비</span>
          <select
            id="new-widget-width"
            value={newWidgetWidth}
            onChange={(event) => setNewWidgetWidth(Number(event.target.value))}
          >
            {DASHBOARD_COLUMN_COUNTS.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <label className="example-column-select" htmlFor="new-widget-height">
          <span>새 위젯 높이</span>
          <select
            id="new-widget-height"
            value={newWidgetHeight}
            onChange={(event) => setNewWidgetHeight(Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((height) => (
              <option key={height} value={height}>
                {height}
              </option>
            ))}
          </select>
        </label>
        <label className="example-column-select" htmlFor="dashboard-columns">
          <span>컬럼 선택</span>
          <select
            id="dashboard-columns"
            value={dashboard.columns}
            onChange={(event) => dashboard.commands.setColumns(Number(event.target.value))}
          >
            {DASHBOARD_COLUMN_COUNTS.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => dashboard.commands.fitWidgetsToColumns()}>
          빈 공간 채우기
        </button>
        <button type="button" onClick={() => setMovable((value) => !value)}>
          이동 토글
        </button>
        <button type="button" onClick={() => setResizable((value) => !value)}>
          크기 조절 토글
        </button>
        <button type="button" onClick={() => dashboard.commands.resetLayout()}>
          레이아웃 초기화
        </button>
        <button type="button" onClick={() => dashboard.commands.refreshLayout()}>
          레이아웃 갱신
        </button>
        <button type="button" onClick={saveLayout}>
          레이아웃 저장
        </button>
        <button type="button" onClick={restoreLayout}>
          레이아웃 복원
        </button>
        <button
          type="button"
          className="example-action-button example-action-button--danger"
          onClick={() => dashboard.commands.clearWidgets()}
        >
          전체 삭제
        </button>
      </section>

      <p className="example-widget-count">위젯 {dashboard.widgets.length}개</p>

      <section className="example-layout-json" aria-label="layout json controls">
        <label htmlFor="layout-json">저장된 레이아웃 JSON</label>
        <textarea
          id="layout-json"
          spellCheck={false}
          value={layoutJson}
          onChange={(event) => setLayoutJson(event.target.value)}
        />
        <p role="status">{layoutStatus}</p>
      </section>

      <DashboardGrid
        columns={dashboard.columns}
        movable={movable}
        refreshKey={dashboard.refreshVersion}
        resizable={resizable}
        widgets={dashboard.widgets}
        onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
        renderWidget={(widget) => (
          <div className="dashboard-widget-body">
            <span>{widget.data?.description}</span>
            <strong>{widget.data?.value}</strong>
          </div>
        )}
      />
    </main>
  );
}

declare global {
  interface Window {
    __kmsfGridstackExampleRoot?: Root;
  }
}

const container = document.getElementById("root") as HTMLElement;
const root = window.__kmsfGridstackExampleRoot ?? createRoot(container);
window.__kmsfGridstackExampleRoot = root;

root.render(
  <React.StrictMode>
    <ExampleApp />
  </React.StrictMode>,
);
