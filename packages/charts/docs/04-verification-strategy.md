# Verification Strategy

## 검증 목표

`@kmsf/charts`는 시각 렌더링과 대용량 데이터 갱신이 핵심이므로 단위 테스트와 브라우저 검증을 분리한다.

## Vitest

대상:

- 데이터 정규화
- series/data 인덱스 매핑
- legend, tooltip, axis option 병합
- label formatter
- theme option 생성
- `TrendChart` 부분 데이터 갱신 helper

결과 저장:

- `test/vitest`

권장 명령:

```bash
npm --workspace=@kmsf/charts run test:run
```

## Playwright

대상:

- 차트가 실제 브라우저에서 렌더링되는지
- desktop/mobile viewport에서 resize가 동작하는지
- tooltip 위치가 화면 밖으로 과도하게 밀리지 않는지
- zoom 이벤트 핸들러가 호출되는지
- chart mode 전환 후 깨진 canvas 또는 빈 화면이 남지 않는지
- 모든 구현 차트 타입에서 card-level canvas 중첩이 정상 layer인지 lifecycle 문제인지 분류되는지

Canvas layer 판정:

- 기본 기대값은 chart card 1개당 visible, non-zero, painted canvas 1개다.
- `zlevel`, progressive/incremental, hover, effect rendering처럼 ECharts/zrender 근거가 있는 경우에만 multi-layer canvas를 allow-list로 허용한다.
- allow-list에는 chart type, trigger option, expected layer id, source reference를 함께 기록한다.
- `data-zr-dom-id="zr_undefined"`, update/resize/switch 후 증가하는 canvas count, unmount 후 남는 canvas, blank/zero-size canvas는 실패로 분류한다.
- page-level canvas 총합은 card-level 판정 결과의 합으로 계산한다. 3개 카드가 렌더링되고 multi-layer allow-list가 없다면 총합은 3개다.

결과 저장:

- `test/playwright`

권장 명령:

```bash
npm --workspace=@kmsf/charts run test:e2e
```

`verify:full`은 Playwright까지 포함하는 완료 gate로 사용한다.

```bash
npm --workspace=@kmsf/charts run verify:full
```

## Soak and Large Data

장시간 갱신과 대용량 데이터는 기본 `verify`에 포함하지 않는다. 요청이 있을 때 별도 gate로 실행하고 결과를 `reports/YYYY-MM-DD.md`와 `reports/artifacts/playwright/`에 남긴다.

메모리 검증은 두 단계로 구분한다.

- 자동화 DevTools Protocol 검증: Playwright의 Chromium CDP 세션으로 `HeapProfiler.collectGarbage`, `Memory.getDOMCounters`, `Performance.getMetrics`, `performance.memory`를 수집한다. 현재 soak 테스트는 이 방식이다.
- 수동 Chrome DevTools 검증: Chrome DevTools Memory 패널에서 Heap Snapshot 또는 Allocation instrumentation on timeline을 직접 실행한다. 이 검증은 자동 soak와 별도이며, 실행한 경우 snapshot 횟수, 비교 기준, 증가 객체, retained size를 report에 기록해야 한다.

추이 차트 장시간 성능/메모리 검증:

```bash
npm --workspace=@kmsf/charts run test:soak -- --duration 3600 --interval 10 --grep "line live chart performance"
```

대용량 예제 브라우저 검증:

```bash
npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/example.spec.ts --project=chromium -g "large data examples"
```

대용량 예제는 예제 페이지의 `Large Data` 탭에서만 생성한다. 기본 예제 shell 진입 시 10,000개 이상 row가 즉시 생성되지 않아야 한다.

## Build

대상:

- Vite library build
- ESM export
- React, React DOM external 처리
- ECharts dependency import 경계

권장 명령:

```bash
npm --workspace=@kmsf/charts run build
```

## Completion Gate

후속 구현 작업에서는 아래 중 하나라도 실패하면 완료로 처리하지 않는다.

- package `verify`
- 관련 Playwright 또는 `verify:full`
- 브라우저 렌더링 확인

패키지 배포 전 또는 browser-visible behavior 변경 후에는 `npm --workspace=@kmsf/charts run verify:full`을 우선 실행한다.

문서 또는 지침만 변경한 경우에는 자동화 테스트 대신 파일 존재와 문서 링크 검증으로 대체할 수 있으며, 그 사유를 `packages/charts/reports/YYYY-MM-DD.md`에 남긴다.
