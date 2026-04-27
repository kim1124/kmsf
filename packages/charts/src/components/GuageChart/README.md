# GuageChart

Gauge 계열 차트 컴포넌트 위치다.

요청 표기인 `GuageChart`를 초기 public API 이름으로 유지한다.

후속 구현 기준:

- 복잡한 Gauge 옵션을 `data`, `series`, `min`, `max`, `unit` 중심으로 간결화
- 상세 ECharts option은 `seriesOptions`와 `options`로 override
