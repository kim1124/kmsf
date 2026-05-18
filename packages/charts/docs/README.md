# @kmsf/charts Docs

이 디렉터리는 `@kmsf/charts` 1차 구현 기준의 패키지 설계, API 초안, 검증 기준을 관리한다.

## 문서 목록

- `01-requirements.md`: 사용자 요구사항을 패키지 관점으로 정리한 문서
- `02-architecture.md`: 런타임 독립성, 공통 엔진, 데이터 정규화 구조
- `03-component-api-draft.md`: 컴포넌트별 Props와 데이터 매핑 초안
- `04-verification-strategy.md`: Vitest, Playwright, 빌드 검증 기준
- `05-open-questions.md`: 후속 합의가 필요한 항목
- `06-quick-start.md`: 외부 개발자용 빠른 시작 예시
- `07-acceptance-matrix.md`: 차트별 완료 기준과 verification gate
- `agents/README.md`: AI 에이전트용 research, plan, memory 지식 map
- `superpowers/2026-04-25-kmsf-charts-guidelines.md`: Superpowers 기반 작업 지침

루트 `GUIDE.md`는 다른 패키지와 프로젝트에 재사용할 수 있는 하네스 지침 템플릿이다.

## 현재 상태

현재 단계는 1차 구현 완료 상태다. 후속 기능 확장 시에도 TDD 절차에 따라 실패 테스트를 먼저 추가한다.
