# create-kmsf Generator Core Research

## Reviewed Facts

- 이 파일은 `generator-core` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/generator-core`는 scaffold catalog, file copy, transforms, post-install hook을 담당한다.

## Stable Rules

- template copy는 path traversal과 overwrite risk를 고려한다.
- transform은 deterministic pure helper로 분리한다.
- post-install hook은 dry-run/testable boundary를 둔다.
