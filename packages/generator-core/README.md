# @kmsf/generator-core

`@kmsf/generator-core`는 template copy와 transform을 담당하는 scaffold engine package다. 일반 사용자는 `create-kmsf` CLI를 사용하고, 이 package는 고급 소비자나 CLI 내부 구현에서 사용한다.

## 패키지 상태

- 현재 `package.json` 기준 `private: true`인 repository-local package다.
- Runtime은 Node.js/ESM 기반이며 prompt UI를 포함하지 않는다.
- Public export는 `@kmsf/generator-core` root export 하나다.
- npm 배포 전에는 `private`, license, repository, files, API compatibility, generated app smoke를 별도 검토해야 한다.

## API

```ts
import { scaffold, type ScaffoldOptions } from "@kmsf/generator-core";

await scaffold({
  authMode: "local-json",
  includeI18n: true,
  logger,
  packageManager: "npm",
  projectName: "my-app",
  runGitInit: true,
  runInstall: true,
  runPlaywrightInstall: true,
  targetDir: "/abs/path/my-app",
  templateDir: "/abs/path/templates/next-app-base",
});
```

## 지원 auth mode

현재 standalone `@kmsf/generator-core` package의 `AuthMode`는 다음을 지원한다.

- `local-json`
- `supabase`
- `none`

`create-kmsf` package 내부 generator-core는 CLI 요구사항에 맞춰 `later`, package selection, GNB layout, i18n transform을 추가로 포함한다.

## Public API

| Export | 설명 |
| --- | --- |
| `scaffold(options)` | template copy, auth transform, package metadata transform, token/env generation, optional post-install hook orchestration |
| `TEMPLATE_CATALOG`, `getTemplate` | 지원 template catalog 조회 |
| `detectPackageManager` | `npm_config_user_agent` 기반 package manager 감지 |
| `validateProjectName` | generated package name 검증 |
| `ScaffoldError` 계열 | `InvalidProjectName`, `TargetExists`, `TemplateMissing`, `CopyFailed` |
| Public types | `AuthMode`, `PackageManager`, `ScaffoldOptions`, `ScaffoldResult`, `ScaffoldLogger` |

## 주요 모듈

| 모듈 | 역할 |
| --- | --- |
| `copy.ts` | template directory copy |
| `transforms/auth-mode.ts` | auth mode별 파일 제거와 sign-in page 변환 |
| `transforms/package-json.ts` | package name 검증과 provider dependency pruning |
| `transforms/env.ts` | `.env.example`을 `.env.local`로 생성 |
| `transforms/tokens.ts` | `{{project_name}}` 같은 token 치환 |
| `post-install/npm-install.ts` | package manager install 실행 |
| `post-install/playwright-install.ts` | Playwright browser install 실행 |
| `post-install/git-init.ts` | git init과 initial commit 실행 |
| `errors.ts` | scaffold error type |

## 오류 처리

`scaffold()`는 주요 사전 조건 실패에서 `ScaffoldError` 계열을 throw한다.

- `InvalidProjectName`
- `TargetExists`
- `TemplateMissing`
- `CopyFailed`

install, git, Playwright 같은 post-install 실패는 throw하지 않고 `ScaffoldResult.warnings`에 누적한다.

## 검증

```bash
npm --workspace=@kmsf/generator-core run lint
npm --workspace=@kmsf/generator-core run test:run
npm --workspace=@kmsf/generator-core run build
npm --workspace=@kmsf/generator-core run verify
```
