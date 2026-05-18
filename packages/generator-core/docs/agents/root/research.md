# @kmsf/generator-core Root Research

## Reviewed Facts

- 이 파일은 `root` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

패키지 루트는 private generator core package contract, exports, build, dependency policy를 관리한다.

## Stable Rules

- Node 20 이상과 ESM package shape를 유지한다.
- private package로 유지한다.
- CLI prompt UI를 이 package에 섞지 않는다.
