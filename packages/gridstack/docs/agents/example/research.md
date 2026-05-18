# @kmsf/gridstack Example Research

## Reviewed Facts

- 이 파일은 `example` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`example`은 package consumer surface와 browser verification fixture 역할을 한다.

## Stable Rules

- public exports를 통해 package를 사용한다.
- example style과 demo data를 runtime exports에 섞지 않는다.
- UI 변경 시 console error와 visible breakage를 확인한다.
