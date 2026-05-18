# Example Plan

## Active Plan

1. Treat example changes as consumer-surface changes.
2. Keep imports on public package exports where practical.
3. Preserve Playwright labels and test ids unless tests are updated first.
4. Run Playwright for layout, chart visibility, interaction, or accessibility changes.
5. Run build when public API usage changes.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_example-plan.md`.
