# @kmsf/gridstack Core Research

## Reviewed Facts

- 이 파일은 `core` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/core`는 serializable dashboard state와 deterministic helper를 담당한다.

## Stable Rules

- React, GridStack, DOM API를 core reducer/helper에 직접 넣지 않는다.
- widget ID와 serializable layout snapshot을 보존한다.
- column count는 1..12 범위로 clamp한다.
