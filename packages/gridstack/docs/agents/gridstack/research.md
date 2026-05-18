# @kmsf/gridstack GridStack Adapter Research

## Reviewed Facts

- 이 파일은 `gridstack` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/gridstack`은 GridStack engine lifecycle과 option mapping을 package-owned adapter로 격리한다.

## Stable Rules

- raw GridStack instance를 primary public API로 노출하지 않는다.
- imperative DOM lifecycle은 adapter 안에서만 처리한다.
- engine replacement 가능성을 깨는 public contract를 만들지 않는다.
