# Gridstack Docs Example Polish Plan

## Metadata

- Date: 2026-07-01
- Scope: `packages/gridstack/example` docs playground UI polish and related Playwright coverage
- Status: Implemented and verified
- ask gate: clear

## Confirmed Current Facts

- Toggle buttons currently use plain button styling and do not expose active state through background color.
- `CrudControls` currently renders add, selection, edit inputs, update, and delete controls in one `example-actions` section.
- `LiveExampleSection` currently renders a `라이브 예제` subtitle before every live example.
- Widget lock state is currently duplicated through status chips such as `example-status` and in-widget badges through `WidgetBadges`.
- Complete example currently goes through the generic docs article flow, so it can show example title, description, code block, and live example subtitle.

## Supervisor Requests

1. Toggle buttons must clearly show pressed/active state with the KMSF mint background.
2. CRUD controls and edit form must be visually separated: CRUD action buttons above, edit form below.
3. Remove live example subtitles.
4. If the current state can be represented by toggle buttons, remove chip-like state elements.
5. Complete example must remove code and supplementary explanation and render only the live example.

## Implementation Plan

1. Add toggle button state styling.
   - Introduce a reusable active-state class or `data-active="true"` styling.
   - Apply KMSF mint background to active toggle buttons.
   - Cover global move, global resize, layout lock, widget move lock, widget resize lock, and widget full lock buttons.
2. Remove duplicated chip/badge state displays.
   - Remove `example-status` state chips where active button label or active style already communicates the state.
   - Remove `WidgetBadges` from dashboard widget bodies.
   - Keep accessible button labels and visible button text sufficient to show current state.
3. Split CRUD controls from edit form.
   - Keep top row for primary CRUD buttons: add, update, delete.
   - Move target selection and edit fields into a separate form panel below the CRUD action row.
   - Keep add Dialog flow for new widget width and height selection.
4. Remove live example subtitles.
   - Change `LiveExampleSection` to render the live example container without the `라이브 예제` heading.
   - Keep `aria-label="라이브 예제"` for accessibility if needed.
5. Special-case Complete example rendering.
   - Add a page-level option such as `liveOnly`.
   - For `/examples/complete`, bypass code samples, example case heading, and description.
   - Render only `CompleteExample`.
6. Update tests.
   - Update docs playground tests to assert active toggle styling through `data-active` or CSS class.
   - Update CRUD tests to assert action row and edit form separation.
   - Update Complete route test to assert code blocks are absent and the live example is present.
   - Update existing dashboard tests if selector text changes after chip/badge removal.

## Verification Plan

1. Focused Playwright:
   - `npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts --project=chromium`
   - `npm run test:e2e -- test/playwright/specs/example.spec.ts test/playwright/specs/dashboard-grid.spec.ts --project=chromium`
2. Package baseline:
   - `npm run verify`
3. Full browser gate:
   - `npm run verify:full`

## Acceptance Criteria

- Active toggle buttons are visually distinguishable with KMSF mint background.
- No separate chip/badge is required to understand toggle state.
- CRUD primary actions and edit form are visually separated.
- No `라이브 예제` subtitle is shown above live examples.
- `/examples/complete` renders only the complete live example surface, with no code block or extra explanatory text.
- Full package verification passes or any blocker is reported with residual risk.

## Implementation Result

- Added active toggle state through `aria-pressed` and `data-active`.
- Applied the KMSF mint background to active toggle buttons.
- Split CRUD actions from the edit form in `CrudControls`.
- Removed the `라이브 예제` subtitle from live example sections.
- Removed duplicated chip/badge state output for widget lock states.
- Added `liveOnly` page rendering for the Complete example.
- Updated Playwright coverage for the new UI contract.
- Verified with focused Playwright, package `verify`, and `verify:full`.
