---
name: code-review
description: Use for KMSF local diff, pull request, or generated-code review. Focus on actionable bugs, regressions, security, accessibility, public API drift, and missing tests. Do not run full test suites or refactor code unless explicitly asked.
---

# Code Review

## Review Order

1. CHECK: Runtime correctness and regressions.
2. CHECK: Security, auth, secret, and data exposure risks.
3. CHECK: Next.js App Router or package compatibility violations.
4. CHECK: Accessibility and browser-visible breakage.
5. CHECK: Test coverage and verification gaps.
6. CHECK: Unnecessary complexity.

## Output

- MUST: Lead with findings ordered by severity.
- MUST: exact file and line references when available.
- REPORT: only actionable issues.
- EXPECT: If there are no findings, state that and list remaining verification gaps.
