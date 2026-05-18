# @kmsf/generator-core Transforms Research

## Reviewed Facts

- 이 파일은 `transforms` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/transforms`는 template input을 generated project output으로 바꾸는 deterministic transform을 담당한다.

## Stable Rules

- transform은 같은 input에 같은 output을 반환한다.
- secret 값을 생성하거나 하드코딩하지 않는다.
- JSON 변경은 structured API를 우선한다.
