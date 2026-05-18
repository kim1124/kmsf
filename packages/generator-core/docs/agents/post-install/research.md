# @kmsf/generator-core Post Install Research

## Reviewed Facts

- 이 파일은 `post-install` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/post-install`은 scaffold 이후 선택 실행되는 install helper를 담당한다.

## Stable Rules

- external command 실행은 좁은 boundary 안에 둔다.
- dry-run 또는 mocked executor로 테스트 가능해야 한다.
- 실패 시 사용자가 수동 복구할 수 있는 정보를 반환한다.
