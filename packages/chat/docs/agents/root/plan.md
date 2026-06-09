# @kmsf/chat Root Plan

## Active Plan

- Design spec: `docs/superpowers/specs/2026-06-08-kmsf-chat-package-design.md`
- TDD implementation plan: `docs/superpowers/plans/2026-06-08-kmsf-chat-package-implementation.md`

## Decision State

Ask gate is clear for implementation planning.
Production source creation should start only after the supervisor confirms this plan or requests changes.

## Execution Policy

- Start implementation with package harness tests.
- Use RED-GREEN-REFACTOR for every behavior task.
- Keep changes isolated to `packages/chat` unless the supervisor explicitly approves root workspace or consumer app edits.
- Do not commit, push, or create PRs without explicit supervisor approval.
