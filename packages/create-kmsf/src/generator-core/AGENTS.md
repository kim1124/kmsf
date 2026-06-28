# create-kmsf Generator Core Rules

## Scope

This file applies to `packages/create-kmsf/src/generator-core`.

## Role

The generator core owns template catalog lookup, file copy, transforms, generated package metadata, and post-install hooks.

## Rules

- MUST: file copy and transforms deterministic and testable.
- MUST: against path traversal and accidental writes outside the target project.
- MUST: template tokens explicit and documented by tests.
- DO NOT: mutate source templates during generation.
- MUST: post-install hooks behind narrow helpers that can be tested without running external commands.
- MUST: generated project auth, i18n, and verification defaults unless a plan approves the change.

## Verification

- RUN: focused Vitest files under `test/*` for catalog, copy, transform, and post-install changes.
- RUN: `npm --workspace=create-kmsf run test:run` before completion.
