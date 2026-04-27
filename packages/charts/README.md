# @kmsf/charts

`@kmsf/charts`는 KMSF 보일러플레이트 사용자가 React 애플리케이션에서 바로 사용할 수 있는 ECharts 기반 차트 컴포넌트 패키지다.

이 패키지는 Next.js 전용 API에 의존하지 않으며, Vite 기반 라이브러리 빌드를 기본 개발 환경으로 사용한다.

## Target Components

- `TrendChart`: Line, Area 추이 차트
- `TopChart`: Pie, Bar, Column, Treemap 기반 TOP N 차트
- `SankeyChart`: ECharts Sankey 옵션 기반 흐름 차트
- `WordCloud`: `echarts-wordcloud` 확장 기반 워드 클라우드
- `GuageChart`: 간결화된 Gauge 차트
- `SunbustChart`: 계층형 Pie 차트

## Package Rules

- `react`, `react-dom`은 peer dependency로 유지한다.
- `echarts`, `dayjs`, `echarts-wordcloud`는 런타임 dependency로 둔다.
- 차트 옵션 커스터마이징은 ECharts 공식 옵션 범위 안에서만 노출한다.
- 대용량 데이터와 실시간 갱신을 고려해 불필요한 deep clone과 전체 재생성을 피한다.

## Local Commands

```bash
npm --workspace=@kmsf/charts run lint
npm --workspace=@kmsf/charts run test:run
npm --workspace=@kmsf/charts run build
npm --workspace=@kmsf/charts run test:e2e
```

현재 1차 구현 기준으로 공통 데이터 정규화, 옵션 병합, 예제 렌더링 검증까지 포함되어 있다.

## Quick Start

```tsx
import { TrendChart, TopChart, createTopRows, createTrendRows } from "@kmsf/charts";

const trendSeries = [{ id: "sales", name: "Sales" }];
const trendData = createTrendRows([
  { x: "2026-04-26 10:00:00", value: 1000 },
  { x: "2026-04-26 11:00:00", value: 1400 },
]);

const topData = createTopRows([
  { name: "A", value: 100 },
  { name: "B", value: 200 },
]);

export function Dashboard() {
  return (
    <>
      <TrendChart data={trendData} mode="area" series={trendSeries} />
      <TopChart data={topData} mode="column" />
    </>
  );
}
```

## Public API Notes

- `GaugeChart`와 `SunburstChart`를 기본 사용 이름으로 권장한다.
- 요청서 호환을 위해 `GuageChart`, `SunbustChart`도 유지한다.
- tuple 포맷을 직접 만들 수 있지만, 처음 사용하는 개발자는 `createTrendRows`, `createTopRows`를 우선 사용한다.
- `WordCloud`는 browser-only extension인 `echarts-wordcloud`를 내부에서 lazy load하므로, 패키지 import 자체는 SSR 환경에서도 깨지지 않아야 한다.

## Documentation

- 요구사항: `docs/01-requirements.md`
- 아키텍처: `docs/02-architecture.md`
- 컴포넌트 API 초안: `docs/03-component-api-draft.md`
- 빠른 시작: `docs/06-quick-start.md`
- 검증 전략: `docs/04-verification-strategy.md`
- 미확정 사항: `docs/05-open-questions.md`
- Superpowers 작업 지침: `docs/superpowers/2026-04-25-kmsf-charts-guidelines.md`
