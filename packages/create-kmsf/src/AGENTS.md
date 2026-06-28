# create-kmsf CLI Source Rules

## Scope

This file applies to `packages/create-kmsf/src` except the nested `src/generator-core` rules.

## Role

The CLI source owns argument parsing, prompts, logging, command orchestration, and user-facing error output.

## Rules

- MUST: prompt orchestration separate from scaffold file-system side effects.
- MUST: argument parsing deterministic and covered by focused tests.
- MUST: logger output stable enough for CLI tests and user documentation.
- DO NOT: import generated template runtime files into CLI runtime.
- MUST: Node.js APIs explicitly and keep Node 20 compatibility.
- MUST: User-facing errors should explain the failed action and the next possible step.
- DO NOT: add hidden install, git, or network side effects without an explicit CLI option or prompt.

## Verification

- RUN: `npm --workspace=create-kmsf run test:run` for CLI behavior changes.
- RUN: `npm --workspace=create-kmsf run lint` after TypeScript changes.
