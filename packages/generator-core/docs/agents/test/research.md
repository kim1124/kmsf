# @kmsf/generator-core Test Research

## Reviewed Facts

- 이 파일은 `test` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`test`는 generator core의 unit test와 regression guard를 담당한다.

## Stable Rules

- copy와 transform은 임시 디렉터리 또는 in-memory input으로 검증한다.
- post-install은 실제 external command에 의존하지 않는다.
- daily report는 test/reports에 남긴다.
