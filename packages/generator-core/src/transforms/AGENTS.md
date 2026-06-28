# @kmsf/generator-core Transform Rules

## Scope

This file applies to `packages/generator-core/src/transforms`.

## Role

Transforms convert template files and configuration data into generated project output.

## Rules

- MUST: transforms deterministic for the same input.
- Prefer structured JSON parsing and serialization over string replacement for JSON files.
- MUST: token replacement explicit and covered by tests.
- DO NOT: hardcode secrets, tokens, or provider credentials.
- MUST: unrelated package.json fields when changing package metadata.
- Report ambiguous template behavior before expanding transform scope.

## Verification

- RUN: focused tests under `test/transforms` first.
- RUN: `npm --workspace=@kmsf/generator-core run test:run` before completion.
