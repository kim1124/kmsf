# @kmsf/gridstack Components Research

## Reviewed Facts

- 이 파일은 `components` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/components`는 React consumer가 사용하는 public component surface를 담당한다.

## Stable Rules

- public props는 serializable layout state와 adapter boundary를 보존한다.
- controls에는 접근 가능한 label을 유지한다.
- example-only demo logic을 runtime exports로 올리지 않는다.
