# Verification Strategy

## Baseline Commands

Run from repo root:

```bash
npm --workspace=@kmsf/gridstack run verify
```

## Browser Checks

Run when rendered example, drag and drop, resize, maximize, minimize, or responsive behavior changes:

```bash
npm --workspace=@kmsf/gridstack run verify:full
```

## Vitest Scope

Use Vitest for:

- column count clamping
- layout serialization helpers
- maximize and minimize reducer behavior
- auto-arrange state transformation
- resize scheduler behavior with fake timers or mocked animation frames
- GridStack option mapping without a real browser

## Playwright Scope

Use Playwright for:

- example page rendering
- drag and drop behavior
- resize handle behavior
- maximize and restore interaction
- minimize and restore interaction
- runtime column changes
- movement and resize disabled states
- visible layout overflow checks

## Completion Gate

Do not mark implementation work complete if:

- package `verify` fails
- required browser verification is skipped without a blocker
- browser verification finds visible UI breakage

## Artifact Policy

- Vitest artifacts: `test/vitest`
- Playwright artifacts: `test/playwright`
- Work reports: `packages/gridstack/reports/YYYY-MM-DD.md`
