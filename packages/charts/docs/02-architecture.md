# @kmsf/charts Architecture

## 설계 원칙

- React 전용 패키지로 유지하고 Next.js 런타임에 의존하지 않는다.
- ECharts 인스턴스 생성, dispose, resize, setOption 로직은 `src/common`에 둔다.
- 차트 컴포넌트는 props 정규화와 렌더링 연결만 담당한다.
- 대용량 데이터 처리를 위해 render 중 불필요한 배열 재생성과 deep clone을 피한다.

## 현재 구조

```text
packages/charts/
├── src/
│   ├── common/
│   │   ├── README.md
│   │   ├── KmsfChart.tsx
│   │   ├── data-normalizers.ts
│   │   ├── formatters.ts
│   │   ├── options.ts
│   │   └── theme.ts
│   ├── components/
│   │   ├── README.md
│   │   ├── TrendChart/
│   │   ├── TopChart/
│   │   ├── SankeyChart/
│   │   ├── WordCloud/
│   │   ├── GuageChart/
│   │   └── SunbustChart/
│   └── index.ts
├── example/
└── test/
```

현재 구조는 1차 구현 기준이다. 후속 확장은 동일한 경계 안에서 테스트를 먼저 추가한 뒤 진행한다.

## 공통 엔진 책임

- ECharts 인스턴스 초기화와 dispose
- theme 변경 시 재초기화 또는 안전한 option 갱신
- ResizeObserver와 requestAnimationFrame 기반 resize 스케줄링
- tooltip이 차트 영역 밖으로 나갈 수 있는 DOM append 정책
- `setOption` 호출 시 `replaceMerge`, `notMerge`, `lazyUpdate` 정책 관리

## 데이터 정규화 책임

- Trend 데이터의 X축 시간 값 정규화
- Top 데이터의 category/value 매핑
- `series` 순서와 데이터 인덱스 매핑
- 숫자 라벨 천 단위 콤마 처리
- 축 라벨 formatter 확장 포인트 제공

## 테마 책임

- KMSF 기본 light/dark 색상 프로파일 제공
- 소비자가 ECharts theme 또는 option override로 교체할 수 있는 경로 제공
- 테마 변경 시 차트가 즉시 갱신되도록 처리

## 성능 기준

- 10,000개 이상 데이터에서도 렌더 중 O(n) 이상 불필요 작업을 피한다.
- 실시간 갱신은 전체 option 재생성보다 필요한 series/data 갱신 경로를 우선한다.
- `TrendChart`의 특정 위치 갱신은 data patch API 또는 helper로 분리한다.
