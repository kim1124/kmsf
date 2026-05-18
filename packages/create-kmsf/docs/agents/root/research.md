# create-kmsf Root Research

## Reviewed Facts

- 이 파일은 `root` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

패키지 루트는 CLI package metadata, npm files, README, release verification contract를 관리한다.

## Stable Rules

- CLI entry는 `bin/create-kmsf.js`로 유지한다.
- Node 20 이상 실행 환경을 기준으로 한다.
- 패키징 변경은 build, test, pack dry-run으로 검증한다.
