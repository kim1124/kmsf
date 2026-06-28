# @kmsf/generator-core Source Rules

## Scope

This file applies to `packages/generator-core/src` except nested domain rules.

## Role

The source root owns catalog lookup, file copy, errors, shared types, and public exports.

## Rules

- MUST: public exports explicit in `src/index.ts`.
- MUST: file copy behavior deterministic and covered by tests.
- MUST: errors actionable for CLI callers.
- DO NOT: include prompt UI or user interaction logic here.
- DO NOT: import generated app runtime files.
- MUST: Node 20 and ESM compatibility.

## Verification

- RUN: focused Vitest files for changed helpers.
- RUN: `npm --workspace=@kmsf/generator-core run test:run` before completion.
