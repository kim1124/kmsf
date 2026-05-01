#!/usr/bin/env bash
# scripts/sync-template.sh
# Sync apps/kmsf → templates/next-app-base by applying spec §6.1 EXCLUDE
# and spec §6.2 transforms.
#
# Usage:
#   bash scripts/sync-template.sh           # write templates/next-app-base
#   bash scripts/sync-template.sh --check   # diff-only mode for CI; exits non-zero on drift

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/apps/kmsf"
DST="$REPO_ROOT/templates/next-app-base"

CHECK_ONLY=0
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=1
  DST="$(mktemp -d)/next-app-base"
fi

if [[ ! -d "$SRC" ]]; then
  echo "error: source $SRC not found" >&2
  exit 1
fi

# Build rsync exclude list — see spec §6.1
EXCLUDES=(
  --exclude=node_modules
  --exclude=.next
  --exclude=.local
  --exclude=.DS_Store
  --exclude=.env
  --exclude=.env.development
  --exclude=.env.production
  --exclude=AGENTS.md
  --exclude=CLAUDE.md
  --exclude=proxy.ts
  --exclude=public/fonts
  --exclude="src/app/(protected)"
  --exclude="src/app/sign-in"
  --exclude="src/app/sign-up"
  --exclude='src/app/\[locale\]/(protected)/analytics'
  --exclude='src/app/\[locale\]/(protected)/chart-sample'
  --exclude='src/app/\[locale\]/(protected)/data-table-sample'
  --exclude='src/app/\[locale\]/(protected)/settings'
  --exclude="tests/AGENTS.md"
  --exclude="tests/e2e/auth-validation-i18n.spec.ts"
  --exclude="tests/e2e/language-toggle.spec.ts"
  --exclude="tests/e2e/local-json-auth.spec.ts"
  --exclude="tests/e2e/supabase-auth.spec.ts"
  --exclude="*.tsbuildinfo"
)

rm -rf "$DST"
mkdir -p "$DST"

rsync -a "${EXCLUDES[@]}" "$SRC/" "$DST/"

# Transform 1: package.json — name → {{project_name}}, drop type:module if present
node --input-type=module -e "
  import fs from 'node:fs';
  const p = '$DST/package.json';
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  pkg.name = '{{project_name}}';
  pkg.private = true;
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"

# Transform 2: playwright.config.ts — outputDir relative path
sed -i.bak \
  's|outputDir: "../../test-reports/playwright/apps-kmsf"|outputDir: "./test-reports/playwright"|' \
  "$DST/playwright.config.ts" || true
rm -f "$DST/playwright.config.ts.bak"

# Transform 3: dashboard Hello World replacement (write fresh file)
mkdir -p "$DST/src/app/[locale]/(protected)/dashboard"
cat > "$DST/src/app/[locale]/(protected)/dashboard/page.tsx" <<'TSX'
import { getTranslations } from "next-intl/server";

import { getAppLocale } from "@/i18n/current-locale";

export default async function DashboardPage() {
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-2 text-base text-foreground/65">{t("subtitle")}</p>
      <div className="mt-8 rounded-2xl border border-border p-6">
        <p className="text-sm text-foreground/60">Hello, world!</p>
        <p className="mt-2 text-foreground">
          Edit{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            src/app/[locale]/(protected)/dashboard/page.tsx
          </code>{" "}
          to start building.
        </p>
      </div>
    </section>
  );
}
TSX

# Transform 4: simplify dashboard messages namespace
node --input-type=module -e "
  import fs from 'node:fs';
  for (const lang of ['ko', 'en']) {
    const p = '$DST/messages/' + lang + '.json';
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    m.dashboard = lang === 'ko'
      ? { title: '환영합니다', subtitle: 'create-kmsf로 생성된 시작 페이지입니다.' }
      : { title: 'Welcome', subtitle: 'Starter page from create-kmsf.' };
    fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
  }
"

# Transform 5: boost .env.example per spec §3.3
cat > "$DST/.env.example" <<'EOF'
# Application
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000

# Auth provider mode: "supabase" | "local-json" | "none"
# (set automatically by create-kmsf based on --auth flag)
KMSF_AUTH_PROVIDER=local-json

# Supabase (only required if KMSF_AUTH_PROVIDER=supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Local JSON auth (only required if KMSF_AUTH_PROVIDER=local-json)
KMSF_LOCAL_AUTH_DB_PATH=./.local/auth.db.json
KMSF_LOCAL_AUTH_SESSION_SECRET=replace-me-with-a-long-random-string
EOF

# Transform 6: write a project-level .gitignore (root template gitignore was for monorepo)
cat > "$DST/.gitignore" <<'EOF'
# dependencies
node_modules/

# next.js
.next/
out/
build/

# testing / artifacts
coverage/
playwright-report/
test-results/
test-reports/

# env files (do NOT commit secrets)
.env
.env*.local

# misc
.DS_Store
*.tsbuildinfo
next-env.d.ts

# local auth store (local-json mode)
.local/
EOF

# Transform 7: README for the scaffolded project
cat > "$DST/README.md" <<'EOF'
# {{project_name}}

Generated by [create-kmsf](https://github.com/example/kmsf/tree/main/packages/create-kmsf).

## Getting started

```bash
npm run dev
```

Then open <http://localhost:3000>.

## Auth modes

This project was scaffolded with one of three auth modes (see `KMSF_AUTH_PROVIDER` in `.env.local`):

- `local-json` — file-backed auth store at `./.local/auth.db.json` (no external service)
- `supabase` — Supabase Auth (set `NEXT_PUBLIC_SUPABASE_URL` and friends in `.env.local`)
- `none` — auth removed entirely

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:run` | Vitest |
| `npm run test:e2e` | Playwright |

## What's next

- Edit `src/app/[locale]/(protected)/dashboard/page.tsx` for the home view
- Add new routes under `src/app/[locale]/(protected)/`
- Translations: `messages/{ko,en}.json`
EOF

if [[ $CHECK_ONLY -eq 1 ]]; then
  if ! diff -qr "$REPO_ROOT/templates/next-app-base" "$DST" > /dev/null 2>&1; then
    echo "drift detected between apps/kmsf source and templates/next-app-base" >&2
    diff -ruN "$REPO_ROOT/templates/next-app-base" "$DST" | head -200 >&2
    rm -rf "$DST"
    exit 1
  fi
  rm -rf "$DST"
  echo "templates/next-app-base is in sync."
else
  echo "Synced apps/kmsf → templates/next-app-base"
fi
