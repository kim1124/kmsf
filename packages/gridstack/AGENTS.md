# @kmsf/gridstack Agent Map

## Scope

- SCOPE: `@kmsf/gridstack` package, `src`, `src/core`, `src/gridstack`, `src/components`, `example`, `test`, `GUIDE.md`.
- CONTEXT: Root `AGENTS.md`의 공통 process, skill, completion, reporting rule을 상속한다.
- MUST: 세부 지식, 계획, 히스토리는 `docs/agents/README.md`를 따른다.
- MUST: 하위 규칙은 `src/core/AGENTS.md`, `src/gridstack/AGENTS.md`, `src/components/AGENTS.md`, `test/AGENTS.md`, `example/AGENTS.md`를 따른다.

## Product Goals

- MUST: Support create, read, update, move, resize, maximize, minimize, arrange, reset, and serialize widget flows.
- MUST: Support runtime column count `1..12`, movement/resize toggles, and scheduled resize signals for widget content.

## Implementation Rules

- DO NOT: introduce Next.js-only APIs.
- MUST: Keep React and React DOM as peer dependencies.
- MUST: Keep GridStack interaction behind a package-owned adapter boundary.
- MUST: Store layout state in serializable objects.
- MUST: Preserve widget IDs across all operations.
- MUST: Clamp runtime column count to `1..12`.
- MUST: Treat 100+ widgets and repeated column changes as baseline requirements.

## Verification Commands

- RUN: `npm --workspace=@kmsf/gridstack run verify` for package baseline: lint, Vitest, build.
- RUN: `npm --workspace=@kmsf/gridstack run verify:full` for package full gate: baseline plus Playwright.
- RUN: `npm run verify:packages` from repo root only when aggregate package verification is explicitly requested.

## Reporting

REPORT: Before closing substantial work, update `packages/gridstack/reports/YYYY-MM-DD.md` with timestamp, summary, changed files, commands actually run, pass/fail result, and residual risks.
