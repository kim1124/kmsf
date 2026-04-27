# KMSF Charts Consumer Usability Design

## 목적

`@kmsf/charts`를 KMSF 내부 작성자뿐 아니라 외부 React 개발자도 쉽게 사용할 수 있도록 public API, helper, 예제, 문서를 보강한다.

## 범위

- 요청 표기 `GuageChart`, `SunbustChart`는 호환 유지한다.
- 일반적인 영문 표기 `GaugeChart`, `SunburstChart` alias를 추가한다.
- tuple 데이터를 직접 만들기 어려운 소비자를 위해 `createTrendRows`, `createTopRows` helper를 제공한다.
- 예제 앱에서 6개 차트가 모두 렌더링되는 최소 샘플을 제공한다.
- README에 설치, import, 기본 사용 예시를 추가한다.

## 비범위

- 차트별 고급 옵션 전체 래핑
- package publish 설정
- 대용량 스트리밍 최적화 추가 구현
- breaking API 변경

## 설계

### Public API

기존 export는 유지하고 alias만 추가한다.

- `GuageChart` 유지
- `GaugeChart` 추가
- `SunbustChart` 유지
- `SunburstChart` 추가
- `GuageChartProps` 유지
- `GaugeChartProps` 추가
- `SunbustChartProps` 유지
- `SunburstChartProps` 추가

### Data Helpers

소비자가 tuple 포맷을 직접 외우지 않아도 되도록 객체 입력 helper를 제공한다.

- `createTrendRows([{ x, values }])`
- `createTopRows([{ name, values }])`

`values`는 배열을 기본으로 하되, 단일 값 입력을 쉽게 하기 위해 `value`도 허용한다.

### Example

Vite 예제 앱은 `TrendChart`, `TopChart`, `SankeyChart`, `WordCloud`, `GaugeChart`, `SunburstChart`를 모두 렌더링한다.

### Verification

- public API와 helper는 Vitest로 검증한다.
- 예제 렌더링은 Playwright에서 canvas 수와 브라우저 오류 여부를 검증한다.
- 기존 package verification을 유지한다.
