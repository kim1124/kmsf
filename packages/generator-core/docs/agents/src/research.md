# @kmsf/generator-core Source Research

## Reviewed Facts

- 이 파일은 `src` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src`는 generator core public exports, catalog, copy, errors, shared types를 담당한다.

## Stable Rules

- file-system side effect는 테스트 가능한 helper로 제한한다.
- public export shape는 `src/index.ts`에서 명확히 관리한다.
- errors는 호출자가 처리할 수 있는 타입과 메시지를 제공한다.
