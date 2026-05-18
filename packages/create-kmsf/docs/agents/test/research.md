# create-kmsf Test Research

## Reviewed Facts

- 이 파일은 `test` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`test`와 `test-reports`는 CLI unit/integration/package smoke 검증과 작업 보고를 담당한다.

## Stable Rules

- CLI behavior는 Vitest로 검증한다.
- npm package surface는 pack dry-run 또는 local tarball smoke로 확인한다.
- 검증 실패와 sandbox 제한은 test-reports에 남긴다.
