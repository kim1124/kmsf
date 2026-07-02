# create-kmsf

`create-kmsf`는 KMSF Next.js starter 앱을 생성하는 scaffold CLI다. 현재 CLI는 bundled `next-app-base` template을 복사한 뒤 auth, GNB layout, optional package, i18n, install, git, Playwright 설정을 선택적으로 적용한다.

## 패키지 상태

- npm package name은 `create-kmsf`이며 `bin/create-kmsf.js`를 CLI entry로 노출한다.
- Package contents는 `bin`, `dist`, `scripts`, `templates`, `README.md`로 제한한다.
- Programmatic API를 public contract로 제공하지 않는다. 생성 로직 재사용은 `@kmsf/generator-core`를 우선 검토한다.
- npm 배포 전에는 license, repository, files, tarball smoke, generated app smoke를 별도 검토해야 한다.

## 사용법

```bash
npx create-kmsf my-app
```

로컬 tarball 검증:

```bash
npm --workspace=create-kmsf pack --dry-run
npm --workspace=create-kmsf pack
npx --yes --package ./packages/create-kmsf/create-kmsf-0.1.0.tgz -- create-kmsf my-app
```

완전 scripted 실행:

```bash
npx --yes --package ./create-kmsf-0.1.0.tgz -- create-kmsf my-app --auth=local-json --layout=top,left,footer --packages=gridstack,data-table,charts,chat --no-i18n --no-install --no-git --no-playwright --silent
```

`--silent`는 prompt를 열지 않는다. CI에서 사용할 때는 필요한 option을 모두 전달해야 한다.

## CLI 옵션

| 옵션 | 설명 |
| --- | --- |
| `--auth=<mode>` | `local-json` 기본값, `supabase`, `later`, `none` |
| `--layout=<list>` | GNB 영역 목록. 예: `top,left,right,footer` |
| `--packages=<list>` | optional KMSF package. 예: `gridstack,data-table,charts,chat` |
| `--no-packages` | optional KMSF package를 추가하지 않음 |
| `--i18n`, `--no-i18n` | ko/en i18n 포함 또는 ko-only starter 생성 |
| `--install`, `--no-install` | dependency install 실행/생략 |
| `--git`, `--no-git` | git init과 initial commit 실행/생략 |
| `--playwright`, `--no-playwright` | `npx playwright install` 실행/생략 |
| `--silent` | banner, color, prompt 없이 실행 |
| `--verbose` | debug log 출력 |
| `--help`, `-h` | 도움말 출력 |
| `--version`, `-v` | 버전 출력 |

## Auth mode

CLI scaffold auth mode는 생성 시점의 코드 포함/제거 기준이다.

- `local-json`: file-backed local auth store를 사용하고 Supabase runtime tree를 제거한다.
- `supabase`: Supabase Auth를 사용하고 local-json auth store를 제거한다.
- `later`: local-json과 Supabase 코드를 모두 남기고 생성 후 `KMSF_AUTH_PROVIDER`로 선택한다.
- `none`: 인증 코드를 제거하고 protected route를 공개 starter로 바꾼다.

주의: `apps/kmsf` 앱 본체의 최신 초기 설정 wizard는 DB/Auth/설정 저장/Menu 선택을 더 세분화한다. CLI 옵션은 현재 scaffold 생성 시점의 변환 기능이며, 앱 runtime setup 전체와 1:1로 동기화된 상태는 아니다.

## Optional KMSF packages

```bash
npx create-kmsf my-app --packages=gridstack,data-table,charts,chat
```

| ID | Dependency |
| --- | --- |
| `gridstack` | `@kmsf/gridstack` |
| `data-table` | `@kmsf/data-table` |
| `charts` | `@kmsf/charts` |
| `chat` | `@kmsf/chat` |

현재 generator는 dependency 추가까지만 수행한다. 실제 component import와 style import는 생성된 앱에서 개발자가 적용한다.

## 생성되는 starter 범위

- Next.js `next-app-base` template 복사
- 선택한 auth mode별 runtime tree pruning
- 선택한 GNB 영역 `top`, `left`, `right`, `footer` 반영
- optional KMSF package dependency 추가
- ko/en i18n 포함 또는 ko-only starter 생성
- `.env.example` 기반 `.env.local` 생성
- 선택 시 dependency install, git init, Playwright browser install 실행

## 생성 후 실행

```bash
cd my-app
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 연다.

## 개발 검증

```bash
npm --workspace=create-kmsf run lint
npm --workspace=create-kmsf run test:run
npm --workspace=create-kmsf run build
npm --workspace=create-kmsf run verify
npm --workspace=create-kmsf pack --dry-run
```

생성 앱 smoke:

```bash
npm_config_cache=/private/tmp/kmsf-npm-cache npm --workspace=create-kmsf run smoke:kmsf
```

## 요구사항

- Node.js >= 20
