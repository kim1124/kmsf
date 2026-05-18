# @kmsf/gridstack Test Research

## Reviewed Facts

- 이 파일은 `test` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`test`는 Vitest, Playwright, browser artifact, daily report routing을 담당한다.

## Stable Rules

- pure helper는 Vitest로 검증한다.
- drag, resize, responsive interaction은 Playwright로 검증한다.
- skipped browser check는 reason과 residual risk를 남긴다.
