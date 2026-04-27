# 지침 구조

## 목적

`kmsf` 저장소의 지침 구조를 공식 Codex 권장 방식에 맞게 재정의한다.

## 최종 구조

실행 계층:

- `/AGENTS.md`
- `/apps/kmsf/AGENTS.md`
- `/apps/kmsf/src/AGENTS.md`
- `/apps/kmsf/src/components/auth/AGENTS.override.md`
- `/apps/kmsf/tests/AGENTS.md`
- `/examples/basic-dashboard/AGENTS.md`
- `/.codex/skills/kmsf-delivery/SKILL.md`

운영 참고 계층:

- `docs/codex/*`

기존 설계 참고:

- `docs/codex/reference/*`

## 왜 이렇게 나누는가

Codex는 작업 전에 현재 작업 디렉터리까지의 `AGENTS.md` 체인을 자동으로 읽는다. 따라서 실제 작업 규칙은 `docs/codex`보다 `AGENTS.md` 계층에 두는 편이 맞다.

반면 `docs/codex`는 다음 목적에 더 적합하다.

- 사람이 읽는 설명
- 왜 이런 규칙이 생겼는지에 대한 근거
- 도구와 워크플로우의 운영 기준
- 합의되지 않은 항목의 분리 관리

## 파일 역할

### 루트 `AGENTS.md`

- 저장소 공통 계약
- 완료 금지 조건
- 보고와 검증의 공통 규칙

### `apps/kmsf/AGENTS.md`

- 메인 앱 workspace 규칙
- 루트 workspace와 메인 앱 내부 규칙 사이의 연결점

### `apps/kmsf/src/AGENTS.md`

- 프론트엔드와 App Router 공통 규칙
- UI/폼/레이아웃 변경 시 확인 범위

### `apps/kmsf/src/components/auth/AGENTS.override.md`

- 인증 폼 전용 규칙
- Supabase-backed auth 진실의 원천
- 실시간 검증, submit, inline error, 브라우저 검증 게이트

### `apps/kmsf/tests/AGENTS.md`

- 어떤 변경에서 어떤 검증을 돌릴지 명시
- lint/unit/e2e/build/browser verification 매트릭스

### `examples/basic-dashboard/AGENTS.md`

- 패키지 소비 검증용 예제 앱 규칙
- 메인 앱과 예제 앱의 책임 분리

### Repo Skill

- 문서보다 짧은 형태로 반복 workflow를 재사용
- 저장소 전용 규칙을 플러그인 없이도 강하게 유지

## 적용 원칙

- `AGENTS` 파일은 최소 개수만 둔다.
- 모든 디렉터리에 두지 않는다.
- 예외 규칙이 실제로 필요한 경로에만 둔다.
- `docs/codex`에는 runtime instruction을 복제하지 않고, 운영 기준과 예시를 둔다.
