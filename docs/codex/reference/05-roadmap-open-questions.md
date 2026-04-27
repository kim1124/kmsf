# Roadmap and Open Questions

## 플러그인 로드맵

### 1. 차트 플러그인

목표:
- `echarts` 기반 차트 기능을 메인 템플릿과 느슨하게 결합된 플러그인 형태로 제공

권장 방향:
- 메인 템플릿에는 차트 의존성을 기본 포함하지 않는다.
- 필요 프로젝트에서만 추가 설치 가능하도록 설계한다.
- 데이터 fetching은 서버, 렌더링은 클라이언트로 분리한다.

후속 산출물 후보:
- `plugin-chart-echarts` 별도 저장소 또는 패키지
- 템플릿 연동 가이드 문서

### 2. 데이터 테이블 플러그인

목표:
- React 기반 데이터 테이블 기능을 플러그인 형태로 제공

권장 방향:
- 정렬, 필터, 페이지네이션, 컬럼 가시성, 서버 페이징 대응 가능 구조
- 템플릿 기본 포함 대신 선택형 모듈로 유지

후속 검토 항목:
- TanStack Table 채택 여부
- 서버 페칭 패턴 표준화

## 이번 템플릿에서 우선 확정할 항목

아래는 구현 전에 합의가 필요한 중요 항목이다.

### 1. i18n 기본 locale

옵션:
- `ko` 기본
- `en` 기본
- 프로젝트 생성 시 선택

권장:
- 템플릿 수준에서는 `ko`, `en` 두 개를 기본 제공하고, 실제 기본 locale은 프로젝트 생성 시 변경 가능하게 설계

### 2. 보호 영역의 첫 진입 페이지

옵션:
- `/dashboard`
- `/overview`
- 프로젝트 생성 시 선택 가능

권장:
- 템플릿 기본값은 `/dashboard`

### 3. 사용자 프로필 정책

논의 필요:
- 사용자명 편집 허용 여부
- 프로필 이미지 업로드 포함 여부
- 조직/팀 개념 포함 여부

### 4. 권한 체계

옵션:
- 단순 사용자만
- `admin`, `member`
- `admin`, `manager`, `member`

권장:
- 초기 템플릿은 `admin`, `member` 2단계로 시작

### 5. 데이터 접근 계층

옵션:
- Supabase 클라이언트 직접 호출
- 서버 액션 래퍼 계층 도입
- repository/service 패턴 도입

권장:
- 템플릿 초기 버전은 `server action + lib service 함수` 조합

## Codex 구현 시 체크리스트

- Next.js App Router로 시작
- TypeScript strict 설정
- Tailwind CSS와 shadcn/ui 설정
- next-intl 기본 구조 세팅
- Zustand provider 패턴 세팅
- Supabase SSR 클라이언트 분리
- Auth 기본 흐름 세팅
- 보호 레이아웃과 공개 레이아웃 분리
- Vitest, Playwright 기본 설정
- `.env.example` 제공

## 다음 단계 제안

다음 작업은 두 가지 경로 중 하나로 진행할 수 있다.

### 경로 A

이 문서를 기준으로 실제 Next.js 템플릿 프로젝트를 바로 생성한다.

포함 작업:
- `create-next-app` 실행
- 기본 구조 생성
- Tailwind/shadcn/ui 구성
- Supabase/next-intl/zustand 기본 세팅

### 경로 B

먼저 문서의 논의 필요 항목을 함께 확정하고, 그 다음 템플릿 생성에 들어간다.

권장:
- 이번에는 문서 리뷰 후, 바로 경로 A로 넘어가는 흐름이 가장 효율적이다.

## 참고 링크

- [Next.js](https://nextjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/ko/docs/handbook/2/basic-types.html)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
