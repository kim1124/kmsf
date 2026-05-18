# Root Plan

## Active Plan

1. Keep root `AGENTS.md` as the package instruction map.
2. Keep reusable harness guidance in `GUIDE.md`.
3. Keep domain knowledge in `docs/agents/<domain>`.
4. Keep path-specific runtime rules in local `AGENTS.md` files.
5. Enforce instruction structure with `test/vitest/package-contract.test.ts`.
6. Run focused contract tests before full verification.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_root-plan.md`.
