---
name: update-readme
description: Use for KMSF README.md updates across the root app, apps, packages, examples, templates, and CLI docs. Trigger when README content must be aligned with implemented features, package.json scripts, public exports, setup modes, scaffold behavior, workspace commands, or public-safe documentation links.
---

# Update README

## Scope

- Root `README.md`.
- App README files such as `apps/kmsf/README.md`.
- Package README files under `packages/*`.
- Template README files under `templates/*` and scaffold templates.
- Example README files.

## Workflow

1. MUST: Read the nearest `AGENTS.md` and affected package/app `package.json`.
2. MUST: Verify implemented features from source, tests, exports, scripts, or config before documenting them.
3. MUST: Separate implemented behavior from roadmap, placeholders, and open questions.
4. CHECK: Package README scripts match `package.json`.
5. CHECK: Package public API notes match `src/index.*` exports.
6. CHECK: App README setup/auth/storage/menu details match source config types.
7. DO NOT: Link local-only reports, private instruction docs, ignored artifacts, or machine-specific absolute paths from public README files.
8. DO NOT: Mention secrets beyond environment variable names and safe handling rules.
9. REPORT: Changed README files, verification commands, and residual risks in the nearest `reports/YYYY-MM-DD.md`.

## Verification

- RUN: stale link/reference search for absolute paths and ignored local-only docs.
- RUN: `git diff --check`.
- RUN: `npm run lint` unless the change is explicitly limited to ignored local-only documentation and the supervisor approves skipping.
