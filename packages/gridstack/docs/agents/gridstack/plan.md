# @kmsf/gridstack GridStack Adapter Plan

## Active Plan

- 2026-05-03: `charts` 기준 하네스 구조를 이 도메인에 맞춰 적용한다.
- 2026-05-27: active drag/resize 중 React prop sync가 GridStack engine에 즉시 반영되지 않도록 adapter sync를 지연한다.

## 2026-05-27 Resize Interaction Plan

1. Add a failing Playwright regression for resize in progress while React props change.
2. Track `dragstart`/`resizestart` and `dragstop`/`resizestop` inside `src/gridstack/adapter.ts`.
3. During active interaction, keep latest adapter options but defer `grid.updateOptions`, `grid.column`, and `syncGridWidgets`.
4. After interaction, commit the layout once, then apply the latest pending sync on the next animation frame.
5. Verify with focused Playwright, `npm --workspace=@kmsf/gridstack run verify:full`, and `npm --workspace=@kmsf/charts run verify:full`.

## Planning Rules

- 구현 전 Superpowers brainstorming으로 범위와 성공 기준을 확인한다.
- behavior, bugfix, refactor에는 Superpowers TDD를 적용한다.
- 잘못된 RED, 예상과 다른 실패, 검증 blocker는 코딩 전에 사용자에게 보고한다.
- 계획이 500줄 이상이면 `plans/00_<name>.md`처럼 분할한다.

## Verification Notes

- 문서만 변경하는 작업은 TDD 예외다.
- 코드나 설정이 바뀌면 패키지별 `AGENTS.md`의 verification command를 따른다.
