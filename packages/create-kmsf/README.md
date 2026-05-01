# create-kmsf

CLI to scaffold a standalone Next.js admin dashboard from KMSF templates.

## Usage

```bash
# interactive (recommended for first time)
npx create-kmsf

# with positional name
npx create-kmsf my-app

# fully scripted (CI-friendly)
npx create-kmsf my-app --auth=local-json --no-i18n --no-install --no-git --no-playwright --silent
```

## Flags

| Flag | Effect |
|---|---|
| `--auth=<mode>` | `local-json` (default) / `supabase` / `none` |
| `--no-i18n` | skip ko/en i18n setup |
| `--no-install` | skip dependency install |
| `--no-git` | skip git init + initial commit |
| `--no-playwright` | skip `npx playwright install` |
| `--silent` | no banner, no prompts (for CI) |
| `--verbose` | debug logs |
| `--help`, `-h` | usage |
| `--version`, `-v` | print version |

## What you get

- Next.js 16 + React 19 + TypeScript 5
- Tailwind 4 + Radix UI + lucide-react
- next-intl (ko/en, URLs do not include locale prefix)
- Optional auth: Supabase or file-backed JSON store
- Vitest + Playwright config (one smoke spec)
- A `Welcome to {project_name}` Hello World dashboard

## Auth modes

- **local-json** — file-backed at `./.local/auth.db.json`. No external service. Edit `KMSF_LOCAL_AUTH_*` in `.env.local`.
- **supabase** — Supabase Auth. Set `NEXT_PUBLIC_SUPABASE_URL`, anon key, and service role key in `.env.local`.
- **none** — auth removed entirely. `/dashboard` is publicly accessible.

## After scaffolding

```bash
cd my-app
npm run dev
```

Open <http://localhost:3000>.

## Requirements

- Node >= 20.0.0
