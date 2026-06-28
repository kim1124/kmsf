# @kmsf/generator-core Agent Map

## Role

이 파일은 `@kmsf/generator-core` 패키지에서 AI 에이전트가 가장 먼저 읽는 지침 map이다.
세부 지식, 계획, 히스토리는 `docs/agents/README.md`를 따라 확인한다.
KMSF repo root `AGENTS.md`의 공통 Process Routing, Superpowers/TDD, repo skill, completion gate, reporting rule은 `packages/*` 하위 프로젝트에도 공통 적용된다. 이 파일은 generator-core 전용 범위, 예외, 검증 명령만 정의한다.

## Package Scope

- Package: `@kmsf/generator-core`
- Runtime source: `src`
- Transform helpers: `src/transforms`
- Post-install helpers: `src/post-install`
- Verification workspace: `test`
- Work reports: `packages/generator-core/reports`
- Reusable harness guide: `GUIDE.md`

## Directory Maps

- `src/AGENTS.md`: catalog, copy, errors, exports, shared type rules
- `src/transforms/AGENTS.md`: deterministic transform and structured data rules
- `src/post-install/AGENTS.md`: external command boundary and recovery rules
- `test/AGENTS.md`: Vitest and report routing rules
- `docs/agents/README.md`: research, plan, memory map for all domains

## Implementation Rules

- MUST: this package framework-agnostic and Node-oriented.
- DO NOT: add CLI prompt UI to generator core.
- MUST: file-system writes behind testable helper boundaries.
- MUST: structured parsing for JSON and config transforms where practical.
- DO NOT: commit generated secrets or environment values.
- MUST: exports stable for consumers such as `create-kmsf`.

## Verification Commands

- RUN: `npm --workspace=@kmsf/generator-core run verify` for package baseline: lint/typecheck, Vitest, build.
- RUN: `npm run verify:packages` from repo root only when aggregate package verification is explicitly requested.

## Reporting

REPORT: Before closing substantial work, update `packages/generator-core/reports/YYYY-MM-DD.md` with timestamp, summary, changed files, commands actually run, pass/fail result, and residual risks.
