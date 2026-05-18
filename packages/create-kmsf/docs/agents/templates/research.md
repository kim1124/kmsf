# create-kmsf Templates Research

## Reviewed Facts

- 이 파일은 `templates` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`templates/next-app-base`는 사용자가 생성받는 Next.js App Router starter의 원본이다.

## Stable Rules

- template runtime은 생성 후 독립 프로젝트로 동작해야 한다.
- template auth/routing/i18n 변경은 generated app 관점으로 검증한다.
- secret 값은 문서나 template에 직접 넣지 않는다.
