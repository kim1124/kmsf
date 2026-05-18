# @kmsf/gridstack Root Research

## Reviewed Facts

- 이 파일은 `root` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

패키지 루트는 public API, package scripts, dependency policy, reporting contract를 관리한다.

## Stable Rules

- React와 React DOM은 peer dependency로 유지한다.
- Next.js 전용 API를 runtime source에 넣지 않는다.
- GridStack runtime은 adapter boundary 뒤에 둔다.
