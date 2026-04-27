# KMSF Charts Example Usability Design

## 목적

`@kmsf/charts` 예제 페이지를 단순 렌더링 확인 화면이 아니라, 외부 개발자가 차트별 데이터 구조와 props 사용법을 바로 이해할 수 있는 혼합형 예제로 개선한다.

## 사용자 요구사항

- 예제는 상단 제목, 좌측 차트 메뉴와 샘플 데이터, 중앙 차트 출력 영역으로 구성한다.
- 중앙 차트 영역은 약 500px 높이로 유지한다.
- 브라우저 또는 상위 요소 resize가 발생하면 ECharts canvas도 컨테이너 크기에 맞게 변경되어야 한다.
- 라벨을 모두 표시할 수 없으면 ellipsis를 적용한다.
- 실시간 갱신은 메모리와 성능을 고려해 전체 `data` prop 교체 방식으로 처리한다.
- `TrendChart`는 오래된 데이터가 앞에서 빠지고 최신 데이터가 뒤에 들어오는 window 방식이어야 한다.
- `TrendChart` 실시간 갱신에서 이전 point가 끌려오는 듯한 ECharts 보간 애니메이션을 기본으로 사용하지 않는다.
- 모든 차트 예제는 실제 canvas 출력, 콘솔 오류 없음, 데이터 갱신 여부를 자동화 검증한다.

## 차트별 예제 정책

### TrendChart

- 60개 포인트 window를 유지한다.
- 1초마다 전체 data 배열을 새로 생성한다.
- 오래된 첫 데이터가 빠지고 새 데이터가 마지막에 들어오는 형태로 샘플 데이터를 만든다.
- 실시간 기본 예제에서는 ECharts update animation을 비활성화해 point 보간으로 인한 끌림 현상을 방지한다.

### TopChart

- 실무 TOP N 형태의 category/value 데이터를 사용한다.
- column 라벨 회전은 overflow가 예상될 때만 적용한다.
- 짧은 라벨은 회전하지 않는다.

### SankeyChart

- legend는 기본 비활성화한다.
- 10초마다 nodes/links 값을 전체 교체한다.

### WordCloud

- legend는 기본 비활성화한다.
- 단어별 컬러를 랜덤 팔레트로 다양하게 표시한다.

### GaugeChart

- legend는 기본 비활성화한다.
- NaN이 표시되지 않도록 data를 gauge 포맷으로 정규화한다.
- 5초마다 전체 data를 교체한다.

### SunburstChart

- legend는 기본 비활성화한다.
- hover 시 label과 label line을 표시한다.
- 5초마다 전체 data를 교체한다.

## 검증

- Vitest로 option helper, data helper, Trend 실시간 option 기본값을 검증한다.
- Playwright로 메뉴 전환, chart stage 500px, canvas non-blank 수준의 렌더링, resize, 데이터 갱신, 콘솔 오류 없음을 검증한다.
- 완료 전 `lint`, `test:run`, `build`, `test:e2e`, `verify`를 모두 실행한다.
