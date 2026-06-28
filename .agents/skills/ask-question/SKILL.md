---
name: ask-question
description: Use when KMSF work creates, modifies, or deletes files that may encode product, architecture, data, auth, migration, operations, UX, verification, or instruction decisions.
---

# Ask Question

## Scope

Use before writing, rewriting, or deleting files when the action can freeze unresolved supervisor decisions.

MUST: Cover these scopes:

- `research.md`, `spec.md`, design docs, `plan.md`, `tasks.md`, implementation plans, and instruction files.
- Implementation files that introduce, change, or remove product behavior, public API, data flow, auth/security, UX flow, operations, migration, release policy, or verification policy.
- Template and scaffold files when generated project behavior or package selection changes.

EXCEPT: Skip when the change is purely mechanical, already approved follow-through, generated output, or a repo-verifiable fact update.

## Rules

1. Inspect code and active `AGENTS.md` files before asking.
2. Separate repo-verifiable facts from supervisor-owned decisions.
3. Ask before writing if unresolved product, architecture, data, auth, migration, operations, UX, verification, or instruction policy choices remain.
4. Include a recommendation and impact, but do not record the recommendation as decided until the supervisor answers.
5. EXPECT: If the answer creates a new unresolved decision, ask a follow-up before writing.
6. EXPECT: If no unresolved decision remains, record `ask gate clear` in the nearest plan or work report.
7. REPORT: accepted answers in the nearest scope `docs/agents/*/{research,plan,memory}.md` or `docs/superpowers/plans/YYYY-MM-DD-<topic>/spec.md`.
8. CHECK: For 보통 이상 기능, ensure the task can be represented as separate `research.md`, `spec.md`, `plan.md`, `tasks.md`, and `report.md` artifacts before implementation.
