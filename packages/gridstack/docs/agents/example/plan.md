# @kmsf/gridstack Example Plan

## Active Plan

- 2026-05-03: `charts` 기준 하네스 구조를 이 도메인에 맞춰 적용한다.
- 이번 단계는 instruction-only 변경이며 production code 변경은 포함하지 않는다.

## Planning Rules

- 구현 전 Superpowers brainstorming으로 범위와 성공 기준을 확인한다.
- behavior, bugfix, refactor에는 Superpowers TDD를 적용한다.
- 잘못된 RED, 예상과 다른 실패, 검증 blocker는 코딩 전에 사용자에게 보고한다.
- 계획이 500줄 이상이면 `plans/00_<name>.md`처럼 분할한다.

## Verification Notes

- 문서만 변경하는 작업은 TDD 예외다.
- 코드나 설정이 바뀌면 패키지별 `AGENTS.md`의 verification command를 따른다.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.


## 2026-06-30 Playground Docs Renewal Plan

1. 기존 단일 dashboard example을 문서 shell 안의 reusable `DashboardExample`로 이동한다.
2. left nav와 content route를 `BrowserRouter`/`Routes`/`NavLink` 기반으로 구성한다.
3. 각 기능 페이지에 설명, highlighted code, 관련 라이브 예제를 제공한다.
4. 기존 create/remove, column, maximize/minimize, serialize/restore controls와 Playwright 접근성 label을 유지한다.
5. 문서 route 전환 unmount, highlighted code, live dashboard 렌더링을 Playwright로 검증한다.
6. 기존 dashboard E2E는 문서 셸 안의 라이브 예제 위치에 맞춰 대상 위젯을 스크롤한 뒤 drag/resize를 검증하도록 보정한다.
7. `npm --workspace=@kmsf/gridstack run verify:full`을 completion gate로 실행한다.

## 2026-07-01 Docs Example Composition Plan

ask gate clear: Supervisor approved the recommended API, UI component, composite example, API docs, and runtime-change scope decisions.

1. RED: add focused tests for widget-level `movable` and `resizable` behavior while preserving `locked` compatibility.
2. Implement `DashboardWidget.movable?: boolean` and `DashboardWidget.resizable?: boolean` in public types and adapter mapping.
3. Refactor the example surface into purpose-specific examples:
   - Basic: 12-column layout with 12 differently sized widgets for move and resize inspection.
   - CRUD: three default widgets, add/update/delete flow, new widget width/height options, and Dialog-based widget creation.
   - Layout: save/restore, dynamic column select from 1 to 12, and global layout lock/unlock.
   - Widget: CRUD-based example with per-widget resize, move, resize-lock, and move-lock behavior.
   - Complete: one smoke surface covering CRUD, layout, lock, column, and save/restore flows.
   - API: public `@kmsf/gridstack` categories with options, descriptions, and code examples.
4. Add package-local example UI components for Dialog and Select. Do not add Radix/shadcn runtime dependencies unless a later implementation blocker is found.
5. Keep API documentation limited to public package contracts. Do not document raw GridStack internals as supported KMSF API.
6. Update Playwright specs to verify navigation, visible example-specific controls, CRUD dialog flow, layout save/restore, column selection, global lock, and per-widget move/resize locks.
7. Run focused Vitest first, then focused Playwright, then `npm --workspace=@kmsf/gridstack run verify`, and use `verify:full` as the completion gate for browser-visible behavior.
8. Update `reports/2026-07-01.md` with commands, results, skipped checks, and residual risks.

## 2026-07-01 Docs Example Polish Plan

ask gate clear: Supervisor specified the required polish items and no unresolved UX decision remains.

1. Show active toggle state with KMSF mint styling.
2. Remove chip/badge state output when the toggle button can represent the state.
3. Split CRUD action buttons from the edit form.
4. Remove the live example subtitle from live example sections.
5. Special-case the Complete example so it renders only the live example without code or supplementary explanation.
6. Update focused Playwright coverage, then run package `verify` and `verify:full`.

## 2026-07-02 Docs Search And API Detail Plan

ask gate clear: Supervisor answered all search, API, and responsive UI decisions before implementation.

Accepted decisions:

1. Search scope covers all docs pages, examples, API entries, and code samples.
2. Search result interaction follows the `@kmsf/charts` style: right-side input with popup results and direct navigation.
3. API page scope covers the full public KMSF gridstack API surface, grouped by component, hook, type, option, feature, and utility categories.
4. API code samples are placed per API section after the related option/feature descriptions.
5. Search results may navigate directly to API anchors when an API entry or API sample matches.
6. Meaningless top navigation chips are removed across viewport sizes instead of being adapted for mobile.

Implementation plan:

1. Replace the upper-right `Docs` and `Live examples` chips with a global docs search input.
2. Build the search index from document pages, examples, code samples, API sections, and API entries.
3. Expand the API page into categorized sections for components, hooks, types, options, features, and utilities.
4. Add section-level TS/TSX sample code under each API category.
5. Add focused Playwright coverage for the global search, removed chips, categorized API docs, and API sample blocks.
6. Run focused routing/docs Playwright first, then the package full verification gate.

## 2026-07-02 Example Metrics Chip Removal Follow-up

ask gate clear: Supervisor explicitly requested removing every Chip-like `example-metrics` element from playground examples.

1. Remove the `example-metrics` DOM block from `ExampleToolbar`.
2. Remove now-unused metrics props from `ExampleToolbar` and all call sites.
3. Remove `example-metrics` CSS selectors.
4. Replace tests that depended on `컬럼 6` chip text with grid state assertions.
5. Add Playwright coverage that all live example pages render no `.example-metrics` element.

## 2026-07-02 API Page Simplification Follow-up

ask gate clear: Supervisor explicitly requested simplifying the API page into Props, options, methods, and usage examples.

1. Replace the previous component/hook/type/option/feature/utility API grouping with four visible sections: `Props`, `옵션`, `메서드`, `사용 예제`.
2. Keep public API coverage, but place public types under the closest user-facing section instead of exposing a separate type category.
3. Move all code samples into the `사용 예제` section.
4. Update global search anchors so method matches such as `serializeState` navigate to `#api-methods`.
5. Update Playwright coverage for the simplified API structure and removed old headings.
6. Run focused docs Playwright first, then package `verify:full`.

## 2026-07-02 Feature-Based API Page Follow-up

ask gate clear: Supervisor approved the feature-based API documentation direction and accepted the recommended handling for empty methods, advanced adapter utilities, and live example linkage.

Accepted decisions:

1. Use feature sections as the top-level API structure.
2. Omit `Methods` when a feature has no method entry.
3. Keep adapter utilities in the API page, but place them last as advanced usage.
4. Link each feature to related example code and live-example context where applicable.

Implementation plan:

1. Replace the global `Props / 옵션 / 메서드 / 사용 예제` structure with feature sections.
2. Use these feature sections: Dashboard 렌더링, Widget CRUD, Layout 저장 / 복원, Column / 정렬, 이동 / 리사이즈 / 잠금, Maximize / Minimize / Restore, Resize frame / Adapter utility.
3. Render `Props`, `Methods`, and feature example code inside each feature section.
4. Include method parameter, return value, description, and one concise method sample when methods exist.
5. Update global search so method matches such as `serializeState` navigate to the owning feature section.
6. Update Playwright coverage, then run focused docs Playwright and package `verify:full`.

## 2026-07-02 API Feature Numbering Follow-up

ask gate clear: Supervisor explicitly requested numbering API feature categories and adding a visual separator between feature sections.

1. Prefix each API feature heading with its sequence number.
2. Add an `hr` separator between feature sections, excluding the last section.
3. Keep the existing feature-owned `Props`, `Methods`, method sample, and example-code structure.
4. Update Playwright coverage for numbered headings and separator count.
5. Run focused docs Playwright and package `verify:full`.

## 2026-07-02 Widget Edit Removal Follow-up

ask gate clear: Supervisor explicitly requested removing widget edit functionality from the playground examples.

1. Remove the visible widget edit action and edit form from the CRUD example.
2. Keep widget add and delete flows; retain delete target selection so deletion remains deterministic.
3. Remove `updateWidget` usage from the add/delete example docs and API samples without changing the package public API.
4. Update Playwright coverage to assert edit controls are absent.
5. Run focused docs Playwright and package `verify:full`.

## 2026-07-02 API Reference Visual Polish Follow-up

ask gate clear: Supervisor explicitly requested styling the gridstack API page like the `@kmsf/data-table` API/props page.

1. Use the data-table API/props reference pattern as the visual baseline: white card sections, mint border, 8px radius, and green monospace API names.
2. Keep the existing gridstack feature-based API content and numbered headings.
3. Remove standalone API separators because card spacing now provides the section boundary.
4. Keep type/method chips because gridstack API entries carry richer type metadata than the current data-table props list.
5. Update focused Playwright coverage for the card styling contract, then run docs Playwright and package `verify:full`.

## 2026-07-02 API Reference Indentation And Events Follow-up

ask gate clear: Supervisor explicitly requested indentation for Props, Methods, example code, and additional event documentation.

1. Indent API subsection blocks inside each feature card with a left guide so `Props`, `Methods`, `Events`, and example code are visually nested.
2. Add `Events` sections for callback-driven features: widget remove, layout commit/layout change, header actions, and resize frame events.
3. Include event timing and payload descriptions for each event entry.
4. Add events to the global docs search index.
5. Update focused Playwright coverage for indentation CSS and event documentation, then run docs Playwright and package `verify:full`.
