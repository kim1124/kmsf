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

## 기본 사용

```tsx
import { TrendChart, createTrendRows } from "@kmsf/charts";

const data = createTrendRows([
  { x: "2026-04-26 10:00:00", value: 1000 },
  { x: "2026-04-26 11:00:00", value: 1400 },
]);

const series = [{ id: "sales", name: "Sales" }];

export function SalesTrend() {
  return <TrendChart data={data} mode="area" series={series} />;
}
```

## 데이터 helper

### TrendChart

```ts
createTrendRows([
  { x: "2026-04-26 10:00:00", values: [100, 200] },
  { x: new Date(), value: 300 },
]);
```

출력:

```ts
[
  ["2026-04-26 10:00:00", 100, 200],
  [dateObject, 300],
];
```

### TopChart

```ts
createTopRows([
  { name: "A", value: 100 },
  { name: "B", values: [200, 20] },
]);
```

출력:

```ts
[
  ["A", 100],
  ["B", 200, 20],
];
```

## 이름 호환성

권장 이름:

- `GaugeChart`
- `SunburstChart`

호환 이름:

- `GuageChart`
- `SunbustChart`

호환 이름은 기존 요청 표기와 초기 구현을 깨지 않기 위해 유지한다.
