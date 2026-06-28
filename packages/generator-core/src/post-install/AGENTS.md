# @kmsf/generator-core Post-Install Rules

## Scope

This file applies to `packages/generator-core/src/post-install`.

## Role

Post-install helpers run optional scaffold follow-up actions such as git init, npm install, and Playwright install.

## Rules

- MUST: external command execution behind a narrow executor boundary.
- Make helpers testable without running real installs or mutating user machines.
- Return actionable failures that callers can show to users.
- DO NOT: run network or install commands unless the caller explicitly requests them.
- MUST: command arguments explicit and avoid shell interpolation where possible.

## Verification

- RUN: focused tests under `test/post-install` first.
- RUN: `npm --workspace=@kmsf/generator-core run test:run` before completion.
