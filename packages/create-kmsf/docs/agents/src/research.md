# create-kmsf CLI Source Research

## Reviewed Facts

- 이 파일은 `src` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src`는 CLI argument parsing, prompt orchestration, logger, command flow를 담당한다.

## Stable Rules

- prompt UI와 generator side effect를 분리한다.
- args parser와 logger는 독립적으로 테스트 가능하게 유지한다.
- 실패 메시지는 CLI 사용자가 조치할 수 있게 작성한다.
