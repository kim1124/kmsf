# KMSF — Knowledge Management System Framework

Next.js 16 App Router 기반의 관리자 대시보드 템플릿 프로젝트입니다.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase)

---

## 주요 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| 인증 | Supabase Auth (이메일/비밀번호 + Google OAuth) |
| 다국어 | next-intl (ko/en, URL prefix 숨김) |
| 상태 관리 | Zustand |
| 폼 검증 | Zod |
| 테스트 | Vitest, Playwright |
| 아이콘 | Lucide React |

---

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root Layout (html/body, Google Fonts)
│   ├── page.tsx                # / → 인증 상태에 따른 리다이렉트
│   ├── globals.css             # 전역 CSS (테마 변수, 유틸리티)
│   │
│   ├── sign-in/                # 로그인 페이지 (locale fallback)
│   ├── sign-up/                # 회원가입 페이지 (locale fallback)
│   ├── (protected)/            # 인증 필요 페이지 (locale fallback)
│   │   ├── layout.tsx          #   AppShell (사이드바 + 헤더)
│   │   ├── dashboard/          #   대시보드
│   │   ├── chart-sample/       #   차트 샘플
│   │   ├── data-table-sample/  #   데이터 테이블 샘플
│   │   └── settings/           #   설정
│   │
│   ├── [locale]/               # 다국어 Dynamic Segment
│   │   ├── (public)/           #   공개 페이지 (sign-in, sign-up)
│   │   └── (protected)/        #   인증 페이지 (dashboard, settings 등)
│   │
│   ├── auth/callback/          # OAuth 콜백 핸들러
│   └── setup/initial-admin/    # 초기 관리자 설정
│
├── components/
│   ├── auth/                   # 인증 관련 폼 컴포넌트
│   ├── layout/                 # AppShell, Sidebar, Header
│   ├── theme/                  # 테마 토글
│   └── ui/                     # shadcn 기반 공용 컴포넌트
│
├── lib/
│   ├── auth/                   # 세션 관리, 폼 검증 스키마
│   ├── security/               # CSRF 토큰
│   └── supabase/               # Supabase 클라이언트 (Server/Admin)
│
├── i18n/                       # next-intl 설정
│   ├── routing.ts              # localePrefix: "never"
│   └── request.ts              # 요청별 locale 감지
│
└── test/                       # 테스트 파일
```

---

## 주요 기능

### 🔐 인증 시스템
- Supabase Auth 연동 (이메일/비밀번호 회원가입 + 로그인)
- Google OAuth 소셜 로그인
- 초기 관리자 설정 페이지 (`/setup/initial-admin`)
- CSRF 토큰 기반 보안

### 🎨 UI/UX
- **라이트/다크 테마** 토글 (쿠키 기반 유지)
- **민트 컬러 시스템** (`#10b981` 포인트 컬러)
- 좌측 사이드바 (접기/펼치기, 아이콘 모드)
- 프로필 팝업 (계정 정보 변경, 프로필 사진 업로드)
- 알림 팝업
- 전역 로딩 오버레이 (API 요청 중 중복 제출 방지)
- 모든 폼의 실시간 Validation

### 🌐 다국어
- `next-intl` 기반 한국어/영어 지원
- URL에 locale prefix 노출 없음 (`localePrefix: "never"`)
- 쿠키 기반 locale 감지

### 📊 샘플 페이지
- 대시보드 (요약, 활동, 상태 카드)
- 차트 샘플 (SVG 차트)
- 데이터 테이블 샘플

---

## 시작하기

### 사전 요구 사항

- Node.js 20+
- npm

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 환경 변수

`.env.local` 파일에 아래 값들을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 확인합니다.

### 빌드

```bash
npm run build
npm start
```

### 테스트

```bash
npm test           # Vitest (단위 테스트)
npm run test:run   # Vitest (CI 모드)
```

---

## 디자인 시스템

| 토큰 | 라이트 모드 | 다크 모드 |
|------|------------|----------|
| Background | `#ffffff` | `#0f1715` |
| Foreground | `#111827` | `#effcf7` |
| Accent | `#10b981` | `#34d399` |
| Surface | `#ffffff` | `#16211f` |
| Border | `rgba(57,99,88,0.18)` | `rgba(127,203,180,0.22)` |

---

## 라이선스

Private
