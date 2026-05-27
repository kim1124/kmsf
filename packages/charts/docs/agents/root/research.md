# Root Research

## Reviewed Findings

- `AGENTS.md` should be a short map, not a complete manual.
- Root instructions should point agents to `GUIDE.md` and `docs/agents/README.md`.
- Runtime-specific rules belong in the nearest code path `AGENTS.md`.
- Long-lived knowledge, plans, and history belong under `docs/agents/<domain>`.
- Instruction drift should be caught by Vitest structural tests.

## High-Confidence Scope

- The package must remain generic React compatible and avoid Next.js runtime APIs.
- `verify:full` is the strongest package completion gate.
- New package work reports go to `packages/charts/reports/YYYY-MM-DD.md`.
