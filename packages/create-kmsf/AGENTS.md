# create-kmsf Agent Map

## Role

이 파일은 `create-kmsf` CLI 패키지에서 AI 에이전트가 가장 먼저 읽는 지침 map이다.
KMSF repo root `AGENTS.md`의 공통 Process Routing, Superpowers/TDD, repo skill, completion gate, reporting rule은 `packages/*` 하위 프로젝트에도 공통 적용된다. 이 파일은 create-kmsf 전용 범위, 예외, 검증 명령만 정의한다.

## Package Scope

- Package: `create-kmsf`
- CLI entry: `bin/create-kmsf.js`
- CLI source: `src`
- Scaffold engine: `src/generator-core`
- Generated app template: `templates/next-app-base`
- Verification workspace: `test`
- Work reports: `packages/create-kmsf/reports`
- Reusable harness guide: `GUIDE.md`

## Directory Maps

- `src/AGENTS.md`: args, prompts, logger, CLI orchestration rules
- `src/generator-core/AGENTS.md`: catalog, copy, transforms, post-install hook rules
- `templates/next-app-base/AGENTS.md`: generated Next app template rules
- `test/AGENTS.md`: Vitest, integration, packaging smoke, report routing
- `README.md`: current CLI usage, options, package surface, and verification commands

## Implementation Rules

- MUST: CLI source and generated template source conceptually separate.
- DO NOT: import template runtime files directly into CLI runtime.
- MUST: Node.js file-system side effects behind testable helper boundaries.
- AVOID: hidden network work unless the user explicitly chooses an install path.
- MUST: generated project defaults documented in README and specs.
- MUST: npm package contents as part of the public contract.

## Verification Commands

- RUN: `npm --workspace=create-kmsf run verify` for package baseline: lint, Vitest, build.
- RUN: `npm --workspace=create-kmsf pack --dry-run` for packaging changes
- RUN: `npm run verify:packages` from repo root only when aggregate package verification is explicitly requested.

## Reporting

REPORT: Before closing substantial work, update `packages/create-kmsf/reports/YYYY-MM-DD.md` with timestamp, summary, changed files, commands actually run, pass/fail result, and residual risks.
