# @kmsf/gridstack Docs

이 디렉터리는 `@kmsf/gridstack` 패키지 설계, public API, 검증 기준을 관리한다.

## 문서 목록

- `01-requirements.md`: 사용자 요구사항을 패키지 관점으로 정리한 문서
- `02-architecture.md`: React 어댑터, GridStack 엔진 경계, 상태 모델 구조
- `03-component-api-draft.md`: 컴포넌트와 훅 API 기준
- `04-verification-strategy.md`: Vitest, Playwright, 빌드 검증 기준
- `05-open-questions.md`: 후속 합의가 필요한 항목

## 현재 상태

현재 단계는 `DashboardGrid`, `useDashboardGrid`, GridStack adapter boundary, Vitest, Playwright 검증이 존재하는 구현 진행 상태다. 후속 기능 확장 시에도 TDD 절차에 따라 실패 테스트를 먼저 추가한다.
