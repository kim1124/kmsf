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

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
