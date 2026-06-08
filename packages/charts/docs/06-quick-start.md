# Quick Start

## 설치

모노레포 내부에서는 workspace dependency로 사용한다.

```bash
npm install
```

외부 패키지로 배포한 뒤에는 일반 React 프로젝트에서 아래 형태로 사용한다.

```bash
npm install @kmsf/charts echarts
```

## TrendChart

```tsx
import { TrendChart, createTrendRows } from "@kmsf/charts";

const data = createTrendRows([
  { x: "2026-04-26 10:00:00", value: 1000 },
  { x: "2026-04-26 10:01:00", value: 1120 },
]);

const series = [{ id: "sales", name: "Sales" }];

export function SalesTrend() {
  return <TrendChart data={data} mode="area" series={series} />;
}
```

`TrendChart`는 `data`와 `series`가 모두 필요하다.

## TopChart

```tsx
import { TopChart, createTopRows } from "@kmsf/charts";

const data = createTopRows([
  { name: "A", value: 100 },
  { name: "B", value: 80 },
  { name: "C", value: 64 },
]);

export function TopMetrics() {
  return <TopChart data={data} mode="pie" />;
}
```

`TopChart`는 `series`가 없으면 기본 series를 생성한다.

## GenericChart

```tsx
import { GenericChart } from "@kmsf/charts";

export function GenericBar() {
  return (
    <GenericChart
      data={[
        ["Alpha", 120],
        ["Beta", 96],
      ]}
      dataFormat="top"
      type="bar"
    />
  );
}
```

`GenericChart`의 advanced chart는 ECharts 공식 option이 추가로 필요할 수 있다. 차트별 필수 설정은 예제 페이지 우측 문서 또는 `docs/03-component-api-draft.md`를 확인한다.

## Loading Fallback

`@kmsf/charts`는 shadcn을 직접 import하지 않는다. 사용하는 앱에서 Skeleton을 전달한다.

```tsx
import { GenericChart } from "@kmsf/charts";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingExample() {
  return (
    <GenericChart
      data={[["Alpha", 120]]}
      dataFormat="top"
      loadingFallback={<Skeleton className="h-full w-full rounded-md" />}
      type="bar"
    />
  );
}
```

## Colors

```tsx
<GenericChart
  colors={["#064e3b", "#047857", "#059669"]}
  data={[
    ["Alpha", 120],
    ["Beta", 96],
  ]}
  dataFormat="top"
  type="pie"
/>
```

`colors`는 유효한 16진수 배열만 사용하며, 없거나 유효 색상이 없으면 KMSF mint 계열 TOP palette로 fallback한다.

## Public Names

권장 및 지원 public component 이름은 `GaugeChart`, `SunburstChart`다. `GuageChart`, `SunbustChart`는 export하지 않는다.
