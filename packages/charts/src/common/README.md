# Common Modules

`src/common`은 chart component가 공유하는 runtime helper 계층이다.

주요 책임:

- `KmsfChart.tsx`: ECharts instance lifecycle, resize, `setOption`, loading fallback 연결
- `generic-chart.ts`: `GenericChart` option 생성과 data format resolution
- `options.ts`: legend, tooltip, grid, title/legend spacing, series override 병합
- `data-normalizers.ts`, `data-builders.ts`: trend/top tuple 데이터 정규화와 helper
- `colors.ts`, `theme.ts`: KMSF palette, theme option, color override 처리
- `validation.ts`, `ChartFallback.tsx`: 필수 설정 검증과 chart-local fallback UI

이 계층은 example code를 import하지 않는다.
