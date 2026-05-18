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
npx --yes --package ./create-kmsf-0.1.0.tgz -- create-kmsf my-app --auth=local-json --no-i18n --no-install --no-git --no-playwright --silent
```

`--silent` never opens prompts. Provide every interactive option when using it.

## Flags

| Flag | Effect |
|---|---|
| `--auth=<mode>` | `local-json` (default) / `supabase` / `none` |
| `--i18n`, `--no-i18n` | include or skip ko/en i18n setup |
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
- Optional auth: Supabase or file-backed JSON store
- Vitest + Playwright config
- A `Welcome to {project_name}` dashboard

## Auth modes

- **local-json** — file-backed at `./.local/auth.db.json`. No external service. Edit `KMSF_LOCAL_AUTH_*` in `.env.local`.
- **supabase** — Supabase Auth. Set `NEXT_PUBLIC_SUPABASE_URL`, anon key, and service role key in `.env.local`.
- **none** — auth removed entirely. `/dashboard` is publicly accessible.

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
npm_config_cache=/private/tmp/kmsf-npm-cache npm pack --dry-run
```

## Requirements

- Node >= 20.0.0
