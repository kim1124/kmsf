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
