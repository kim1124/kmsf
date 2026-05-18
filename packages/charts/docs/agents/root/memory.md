# Root Memory

## 2026-05-02

- Decision: root `AGENTS.md` is an instruction map, not the full knowledge store.
- Decision: `research.md`, `plan.md`, and `memory.md` are centralized under `docs/agents/<domain>`.
- Decision: source, test, and example paths keep only local `AGENTS.md` for runtime rules.
- Verification target: `npm --workspace=@kmsf/charts run verify:full`.
