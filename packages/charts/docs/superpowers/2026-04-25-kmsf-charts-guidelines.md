# @kmsf/charts Superpowers Guidelines

## 적용 범위

이 문서는 `@kmsf/charts` 패키지의 후속 구현 작업에서 Superpowers를 적용하는 기준이다.

## 현재 작업 분류

- 현재 작업은 스캐폴딩과 문서 초안 작성이다.
- 구현 동작 변경이 아니므로 TDD 예외에 해당한다.
- 후속 차트 컴포넌트 구현부터는 TDD 절차를 적용한다.

## 후속 구현 순서

1. 공통 타입과 option merge helper를 정의한다.
2. 데이터 정규화 helper에 대한 Vitest 실패 테스트를 먼저 작성한다.
3. helper 구현 후 focused Vitest를 통과시킨다.
4. 공통 ECharts engine hook 또는 module을 작성한다.
5. `TrendChart`부터 구현하고 Playwright로 렌더링, resize, zoom을 검증한다.
6. `TopChart`를 구현하고 mode 전환과 label 회전 검증을 추가한다.
7. Sankey, WordCloud, Guage, Sunbust 계열은 ECharts 공식 series 포맷 유지 여부를 테스트한다.

## 검증 기준

각 구현 단위는 아래 검증을 기준으로 완료한다.

- focused Vitest
- 관련 Playwright
- `npm --workspace=@kmsf/charts run build`
- `npm --workspace=@kmsf/charts run verify`

## 리포팅

작업 완료 전 `test/reports/YYYY-MM-DD.md`에 실행 명령과 미실행 검증 사유를 남긴다.
