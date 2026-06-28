# @kmsf/generator-core Test Rules

## Scope

This file applies to `packages/generator-core/test`.

## Role

The test workspace owns unit and regression tests for generator core behavior.

## Rules

- MUST: tests deterministic and independent from user machine state.
- MUST: temporary directories for file copy behavior.
- Mock or inject executors for post-install command behavior.
- MUST: transform expectations explicit and readable.
- MUST: new package work reports under `packages/generator-core/reports/YYYY-MM-DD.md`.
- MUST: For behavior changes, write or update the smallest failing test before production code unless the change is documentation-only or instruction-only.

## Verification Routing

- RUN: focused Vitest files first.
- RUN: `npm --workspace=@kmsf/generator-core run test:run` for focused package tests.
- RUN: `npm --workspace=@kmsf/generator-core run verify` for package baseline.
