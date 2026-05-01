# @kmsf/generator-core

Template engine used by `create-kmsf`. Not intended for direct use, but exported for advanced consumers.

## API

```ts
import { scaffold, type ScaffoldOptions } from "@kmsf/generator-core";

await scaffold({
  projectName: "my-app",
  targetDir: "/abs/path/my-app",
  templateDir: "/abs/path/templates/next-app-base",
  authMode: "local-json",
  includeI18n: true,
  runInstall: true,
  runGitInit: true,
  runPlaywrightInstall: true,
  packageManager: "npm",
  logger: myLogger,
});
```

## Modules

| Module | Responsibility |
|---|---|
| `copy.ts` | recursive directory copy with glob-style EXCLUDE |
| `transforms/tokens.ts` | `{{name}}` → value substitution |
| `transforms/package-json.ts` | name validation + auth-mode dep pruning |
| `transforms/env.ts` | `.env.example` → `.env.local` with provider injection |
| `transforms/auth-mode.ts` | remove files based on chosen auth mode |
| `post-install/git-init.ts` | `git init` + initial commit |
| `post-install/npm-install.ts` | spawn `<pm> install` |
| `post-install/playwright-install.ts` | `npx playwright install` |
| `errors.ts` | `ScaffoldError` discriminated by `code` |

## Errors

`scaffold()` throws `ScaffoldError` with one of: `InvalidProjectName`, `TargetExists`, `TemplateMissing`, `CopyFailed`. Post-install failures (install, git, playwright) are returned as warnings in `ScaffoldResult.warnings` instead of throwing.
