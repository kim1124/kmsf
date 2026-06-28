# @kmsf/charts Example Rules

## Scope

This file applies to `packages/charts/example`.

## Role

The example is the Vite/React consumer surface used for manual inspection and Playwright browser verification.

## Knowledge Map

- Research: `docs/agents/example/research.md`
- Plan: `docs/agents/example/plan.md`
- Memory: `docs/agents/example/memory.md`

## Rules

- MUST: the example as consumer code, not package internals.
- Import package APIs through public exports where practical.
- MUST: example-only styles and demo data out of runtime exports.
- Maintain accessible labels and test ids used by Playwright.
- MUST: chart sample data and usage code useful for external consumers.
- DO NOT: introduce Next.js-only APIs; the example must remain Vite/React compatible.
- Check browser console errors after rendered UI changes.

## Verification

- RUN: Playwright when example layout, controls, chart visibility, or accessibility labels change.
- RUN: package build after public API usage changes.
