# KMSF 앱 워크스페이스 규칙

## 범위

이 규칙은 `apps/kmsf`의 Next.js main application workspace에 적용한다.

## 워크스페이스 역할

- 이 workspace는 실행 가능한 main application package다.
- Next.js config, env file, test, public asset, app source는 모두 이 workspace 아래에 둔다.
- Root `package.json`의 script는 이 workspace로 위임된다.

## 작업 규칙

- 요청이 shared package를 명시하지 않으면 main app 전용 변경은 이 workspace 안에 유지한다.
- 향후 변경이 reusable UI나 chart logic에 속하면 app 내부 중복보다 `packages/*`를 우선 검토한다.
- docs 또는 instruction을 수정할 때는 `apps/kmsf` 기준 workspace-relative path를 사용한다.

## 검증

- Root script와 workspace script를 일관되게 사용한다.
- App 변경의 기본 검증 경로는 `lint`, `test:run`, `build`이며, rendered output이 바뀌면 browser verification을 추가한다.

## 하위 지침 파일

- `apps/kmsf/src/AGENTS.md`
- `apps/kmsf/src/components/auth/AGENTS.override.md`
- `apps/kmsf/tests/AGENTS.md`
