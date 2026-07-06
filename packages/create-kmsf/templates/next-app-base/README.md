# {{project_name}}

이 프로젝트는 `create-kmsf`로 생성된 Next.js starter 앱이다.

## 시작

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 연다.

## 생성 시점 옵션

생성 시점에 CLI가 아래 항목을 반영할 수 있다.

- auth mode: `local-json`, `supabase`, `later`, `none`
- GNB layout: `top`, `left`, `right`, `footer`
- optional KMSF packages: `gridstack`, `data-table`, `charts`, `chat`
- i18n 포함 여부

`later` mode는 auth 코드를 남겨 둔 뒤 `.env.local`의 `KMSF_AUTH_PROVIDER`로 provider를 선택하는 방식이다.

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
- optional KMSF package를 선택했다면 필요한 component와 stylesheet를 직접 import한다.
- 인증을 사용하는 경우 `.env.local`의 provider 설정과 Supabase 값을 확인한다.
