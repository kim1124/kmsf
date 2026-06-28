# create-kmsf Test Rules

## Scope

This file applies to `packages/create-kmsf/test`.

## Role

The test workspace owns CLI unit tests, integration tests, packaging checks, and behavior guardrails.

## Rules

- MUST: fast CLI and helper tests in Vitest.
- Prefer temporary directories for scaffold and packaging behavior.
- DO NOT: depend on global user config, home directory state, or network access.
- MUST: Packaging tests verify npm-visible files and generated CLI behavior.
- MUST: new package work reports under `packages/create-kmsf/reports/YYYY-MM-DD.md`.
- MUST: For behavior changes, write or update the smallest failing test before production code unless the change is documentation-only or instruction-only.

## Verification Routing

- RUN: `npm --workspace=create-kmsf run test:run` for focused package tests.
- RUN: `npm --workspace=create-kmsf run verify` for package baseline.
- RUN: `npm --workspace=create-kmsf pack --dry-run` for npm package surface changes.
