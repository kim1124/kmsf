# {{project_name}}

이 프로젝트는 `create-kmsf`에서 사용하는 Next.js starter template이다.

## 시작

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 연다.

## 생성 시점 옵션

이 template은 generator transform을 통해 다음 항목이 조정될 수 있다.

- auth mode: `local-json`, `supabase`, `later`, `none`
- GNB layout: `top`, `left`, `right`, `footer`
- optional KMSF packages
- i18n 포함 여부

생성된 앱의 `.env.local`에서 `KMSF_AUTH_PROVIDER`와 Supabase 관련 값을 확인한다.

## 주요 스크립트

| Script | 설명 |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run test:run` | Vitest |
| `npm run test:e2e` | Playwright |

## 다음 작업

- `src/app` 아래 route와 page를 프로젝트 목적에 맞게 수정한다.
- GNB layout은 생성 시점 옵션 또는 앱 내부 설정 흐름에 맞게 조정한다.
- 인증을 사용하는 경우 `.env.local`의 provider 설정을 먼저 확인한다.
