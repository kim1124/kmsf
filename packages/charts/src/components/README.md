# Chart Components

`src/components`는 public React chart component 계층이다.

Public components:

- `GenericChart`
- `TrendChart`
- `TopChart`
- `SankeyChart`
- `WordCloud`
- `GaugeChart`
- `SunburstChart`
- `RadarChart`
- `HeatmapChart`
- `GraphChart`

각 컴포넌트는 공통 ECharts lifecycle을 직접 구현하지 않고 `src/common` 모듈을 사용한다. `GuageChart`, `SunbustChart` 오타 export는 제공하지 않는다.
