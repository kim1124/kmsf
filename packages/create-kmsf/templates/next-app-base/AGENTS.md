# create-kmsf Next App Template Rules

## Scope

This file applies to `packages/create-kmsf/templates/next-app-base`.

## Role

This directory is the generated Next.js App Router starter source shipped by `create-kmsf`.

## Rules

- MUST: files here as future user project files, not CLI internals.
- MUST: generated app behavior self-contained after scaffolding.
- MUST: Korean default locale, auth provider selection, and documented starter defaults unless a plan changes them.
- DO NOT: commit secrets or provider credentials into template files.
- MUST: template-local `AGENTS.override.md` files when domain rules need to be stricter than this root template rule.
- For auth, routing, i18n, or UI changes, verify generated app behavior when practical.

## Verification

- RUN: `npm --workspace=create-kmsf run test:run` for transform and template contract coverage.
- RUN: packaging smoke when template files included in npm output change.
