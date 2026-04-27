# GridStack Dashboard Superpowers Guidelines

## Purpose

이 문서는 `@kmsf/gridstack` 구현 시 Codex와 Superpowers를 어떻게 적용할지 정리한 패키지 전용 지침 초안이다.

## Required Guardrails

- 기능 구현, 버그 수정, 리팩터링, 동작 변경에는 `superpowers:test-driven-development`를 사용한다.
- 버그나 검증 실패를 다룰 때는 `superpowers:systematic-debugging`으로 원인을 먼저 확인한다.
- 여러 단계 구현 계획이 필요한 경우 `superpowers:writing-plans`로 계획 문서를 먼저 작성한다.
- 완료 선언 전에는 `superpowers:verification-before-completion` 성격의 검증 게이트를 통과한다.

## TDD Rules

- production code 변경 전에 실패하는 테스트를 먼저 작성한다.
- 실패 이유가 의도한 요구사항 미구현인지 확인한다.
- 테스트를 통과시키는 최소 구현만 반영한다.
- 통과 후 필요한 범위에서만 정리한다.
- 드래그, 리사이즈, 브라우저 레이아웃 동작은 Playwright 테스트를 우선 고려한다.
- 순수 상태 전환, 컬럼 제한, 직렬화, 옵션 매핑은 Vitest 테스트를 우선 고려한다.

## Scope Rules

- 한 작업에서 하나의 동작만 변경한다.
- GridStack 엔진 직접 사용은 adapter 범위로 제한한다.
- React 컴포넌트 public API와 엔진 내부 API를 분리한다.
- Next.js App Router 패턴을 이 패키지에 가져오지 않는다.
- 신규 의존성은 기존 의존성으로 해결 가능한지 먼저 검토한다.

## Review Checklist

- 위젯 ID가 보존되는가.
- 컬럼 수가 `1..12` 범위로 제한되는가.
- 드래그와 리사이즈 중 불필요한 React 렌더가 발생하지 않는가.
- GridStack instance와 이벤트 리스너가 unmount 시 정리되는가.
- resize scheduler가 animation frame을 중복 예약하지 않는가.
- disabled 옵션이 UI와 엔진 옵션 모두에 반영되는가.
- layout snapshot이 직렬화 가능한 형태인가.

## Reporting

각 구현 작업 완료 전 `test/reports/YYYY-MM-DD.md`에 다음을 남긴다.

- 작업 일시
- 작업 요약
- 변경 파일
- 수행한 명령
- 통과/실패 결과
- 남은 리스크
