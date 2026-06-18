# create-kmsf

CLI to scaffold a standalone Next.js admin dashboard from bundled KMSF templates.

## Usage

Published npm usage:

```bash
npx create-kmsf my-app
```

Tarball usage before npm publish:

```bash
# from this package directory
npm pack
npx --yes --package ./create-kmsf-0.1.0.tgz -- create-kmsf my-app
```

Remote tarball usage:

```bash
npx --yes --package https://github.com/<owner>/<repo>/releases/download/create-kmsf-v0.1.0/create-kmsf-0.1.0.tgz -- create-kmsf my-app
```

Fully scripted CI usage:

```bash
npx --yes --package ./create-kmsf-0.1.0.tgz -- create-kmsf my-app --auth=local-json --layout=top,left,footer --no-i18n --no-packages --no-install --no-git --no-playwright --silent
```

`--silent` never opens prompts. Provide every interactive option when using it.

## Flags

| Flag | Effect |
|---|---|
| `--auth=<mode>` | `local-json` (default) / `supabase` / `later` / `none` |
| `--layout=<list>` | enable GNB regions, e.g. `top,left,footer` |
| `--packages=<list>` | add optional KMSF packages, e.g. `gridstack,data-table,charts,chat` |
| `--no-packages` | add no optional KMSF packages |
| `--i18n`, `--no-i18n` | include ko/en i18n or generate a ko-only starter |
| `--install`, `--no-install` | run or skip dependency install |
| `--git`, `--no-git` | run or skip git init + initial commit |
| `--playwright`, `--no-playwright` | run or skip `npx playwright install` |
| `--silent` | no banner, colors, or prompts; requires all options |
| `--verbose` | debug logs |
| `--help`, `-h` | usage |
| `--version`, `-v` | print version |

## Package Boundary

The package is self-contained for tarball execution:

- generator core code is compiled into `dist/generator-core`
- starter templates are shipped under `templates/next-app-base`
- runtime dependencies are public third-party packages only

## What you get

- Next.js 16 + React 19 + TypeScript 5
- Tailwind 4 + Radix UI + lucide-react
- next-intl (ko/en, URLs do not include locale prefix)
- Optional auth: Supabase, file-backed JSON store, deferred setup, or no auth
- Optional `@kmsf/*` dependencies for grid layouts, data tables, charts, and chat
- Vitest + Playwright config
- A `Welcome to {project_name}` dashboard

## Auth modes

- **local-json** — file-backed at `./.local/auth.db.json`. No external service. Edit `KMSF_LOCAL_AUTH_*` in `.env.local`.
- **supabase** — Supabase Auth. Set `NEXT_PUBLIC_SUPABASE_URL`, anon key, and service role key in `.env.local`.
- **later** — keeps both local-json and Supabase code. Set `KMSF_AUTH_PROVIDER` to `local-json` or `supabase` before running the app.
- **none** — auth removed entirely. `/dashboard` is publicly accessible.

## Optional KMSF packages

Interactive usage shows a checkbox list for optional package dependencies. Scripted usage can pass a comma-separated list:

```bash
npx create-kmsf my-app --packages=gridstack,data-table,charts,chat
```

The current generator adds dependencies only. Import package styles and components in the generated app when you start using them.

Package IDs:

| ID | Dependency |
|---|---|
| `gridstack` | `@kmsf/gridstack` |
| `data-table` | `@kmsf/data-table` |
| `charts` | `@kmsf/charts` |
| `chat` | `@kmsf/chat` |

These packages must be available from npm or the configured registry for external generated projects.

## After scaffolding

```bash
cd my-app
npm install
npm run dev
```

Open <http://localhost:3000>.

## Development Verification

```bash
npm run lint
npm run typecheck
npm run build
npm run test:run
npm --workspace=create-kmsf pack --dry-run
```

Local generated app smoke test before npm publish:

```bash
npm_config_cache=/private/tmp/kmsf-npm-cache npm --workspace=create-kmsf run smoke:kmsf
```

The smoke command builds `create-kmsf`, packs a local tarball, scaffolds a generated
KMSF app in `/private/tmp`, installs its dependencies, and runs lint, unit tests,
build, and the layout-shell Playwright smoke test.

## Requirements

- Node >= 20.0.0
