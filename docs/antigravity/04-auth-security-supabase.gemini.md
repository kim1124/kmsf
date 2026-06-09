# Auth, Security, and Supabase

기준일:
- 2026-04-21

## 인증 방식

요구사항:
- ID/비밀번호 로그인 기반 (관리자 / 유저)
- 확장성: OTP 및 Google OAuth 연동 고려

구현 원칙 (시니어 FE 관점):
- UI 레이어에서는 별도의 `ID/비밀번호` 폼을 유지하지만, 내부의 인증 및 세션 검증은 전적으로 `Supabase Auth`에 위임합니다.
- 자체적인 JWT 발급이나 세션 스토리지 관리를 폐기하고 프론트엔드-백엔드 간 신뢰할 수 있는 단일 출처(Single Source of Truth)로 Supabase SSR 기반 쿠키를 활용하여 보안 위협(XSS 등)을 최소화합니다.

공식 문서:
- [Supabase Next.js SSR Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)

## 보안 원칙

프론트엔드 아키텍처 레벨의 보안 가드레일:
1. 세션 검증의 선 처리: `middleware.ts` 또는 Root Server Layout에서 진입 점퍼 검증을 먼저 수행하여 인가되지 않은 컴포넌트 트리가 렌더링되는 것 자체를 차단합니다.
2. 클라이언트 노출 주의: 브라우저에 주입되어도 안전한 토큰만 `NEXT_PUBLIC_` 접두사를 붙이며, `SUPABASE_SECRET_KEY` 같은 어드민 권한은 서버(Server Actions, Route Handlers) 환경 외에 절대 혼용하지 않습니다.
3. 데이터 패치 안정성: Supabase DB RLS(Row Level Security) 정책을 전제하고 개발하여, 악의적인 클라이언트 데이터 변조 시도가 있더라도 DB단에서 즉각 차단되는 구조가 되어야 합니다.

## Supabase 권장 폴더 구조

```text
src/lib/supabase/
  client.ts    // 클라이언트 컴포넌트 전용 팩토리
  server.ts    // 서버 컴포넌트 / 라우트 핸들러 전용 (쿠키 겟/셋)
  middleware.ts // 엣지 런타임에서 쿠키 새로고침 처리
  admin.ts     // 어드민 전용 서비스 롤 키 사용 환경
```

## 환경변수 통합 가이드

권장 파일 관리:
- 공유 샘플 템플릿: `.env.example` (Git 커밋 포함)
- 로컬 개발 환경: `.env.development.local`
- 프로덕션 빌드: 플랫폼(Vercel, Cloudflare 등) 콘솔에서 직접 주입

템플릿 기본 환경변수 세팅:
```env
NEXT_PUBLIC_APP_NAME="Template App"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SECRET_KEY="your-secret-key"
```

## 인증 로직 아키텍처 초안

사용자 인증 흐름 상태 관리:
클라이언트 전역 상태(Zustand 등)에 User를 보관하는 레거시 패턴 대신, 서버 컴포넌트에서 매번 `await supabase.auth.getUser()`를 호출해 내려주는 방식이 Next.js App Router 아키텍처에 맞습니다. 클라이언트 폴백이 필요한 UI 요소에 한해서만 SSR 초기화 값을 Zustand에 하이드레이션(hydrate)합니다.
