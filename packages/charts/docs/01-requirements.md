# @kmsf/charts Requirements

## 목표

KMSF 보일러플레이트를 사용하는 개발자가 Next.js뿐 아니라 일반 React 애플리케이션에서도 사용할 수 있는 차트 컴포넌트 패키지를 만든다.

## 기술 스택

- React
- ECharts
- TypeScript
- Vite
- Vitest
- Playwright
- Day.js
- `echarts-wordcloud`

## 공통 Props

- `data`: 차트에 표현할 실제 데이터. 필수.
- `series`: ECharts series 객체 배열. `TrendChart`는 필수, 그 외 차트는 생략 가능.
- `legend`: 기본값 `true`. `false`면 숨김. 객체 전달 시 ECharts legend 옵션으로 병합.
- `xAxis`: 기본 X축 프로파일 위에 사용자 옵션 병합.
- `yAxis`: 기본 Y축 프로파일 위에 사용자 옵션 병합.
- `options`: 차트 전체 옵션 override.
- `seriesOptions`: series 단위 override.
- `labelContraction`: 숫자 라벨 천 단위 콤마 적용. 기본 활성화.
- `tooltip`: `true`, `false`, ECharts tooltip 객체를 허용.

## 공통 요구사항

- 브라우저 반응형 동작을 지원한다.
- 실시간 또는 주기적 데이터 업데이트를 지원한다.
- `TrendChart`는 특정 위치의 데이터만 갱신할 수 있어야 한다.
- 10,000개 이상의 데이터 표시를 고려한다.
- Light, Dark 기본 테마를 제공한다.
- 공간이 부족한 X축 라벨은 말줄임 처리한다.
- `TopChart`의 Column 모드는 X축 라벨을 45도 회전한다.
- X, Y축 라벨에 이미지 또는 아이콘을 적용할 수 있는 커스터마이징 경로를 제공한다.

## 컴포넌트 요구사항

### TrendChart

- Line, Area 추이 데이터를 표시한다.
- `series`는 필수이며 객체 배열로 받는다.
- 데이터 포맷은 `[x, value1, value2, ...]` 배열을 지원한다.
- `x`는 `YYYY-MM-DD HH:mm:ss` 문자열 또는 `Date` 객체를 허용한다.
- Line과 Area 간 차트 변환을 지원한다.
- Zoom 기능과 zoom 전후 이벤트 핸들러를 제공한다.

### TopChart

- Pie, Bar, Column, Treemap 변환을 지원한다.
- `series`는 선택 사항이다.
- `series` 생략 시 1개 이상의 기본 series를 생성한다.
- 데이터 포맷은 `[category, value1, value2, ...]` 배열을 지원한다.

### SankeyChart

- ECharts Sankey 공식 옵션을 기반으로 한다.
- X, Y축을 사용하지 않는다.
- `series`와 `data`는 필수다.
- 계층 또는 재귀 구조는 소비자가 ECharts 포맷으로 전달한다.

### WordCloud

- ECharts 기본 내장 차트가 아니므로 `echarts-wordcloud` 확장을 사용한다.
- `series`와 `data`는 필수다.

### GuageChart

- Gauge 옵션을 간결화한다.
- 소비자는 기본적으로 `series`와 `data` 중심으로 제어한다.

### SunbustChart

- 계층형 Pie 차트로 ECharts Sunburst 옵션을 간결화한다.
- 소비자는 기본적으로 `series`와 `data` 중심으로 제어한다.
