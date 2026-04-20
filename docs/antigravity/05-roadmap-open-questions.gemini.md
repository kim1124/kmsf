# Roadmap and Open Questions

## 플러그인 로드맵 구상 (프론트엔드 관점)

템플릿은 초경량(Base Shell) 상태를 유지해야 하므로, 과도한 종속성을 피하기 위해 "플러그인 기반 아키텍처"를 지향합니다.

### 1. 시각화 (차트 플러그인)
목표: `echarts` 기반 대시보드 컴포넌트 설계
- 방향성: 번들 사이즈 증가 주범인 차트 라이브러리가 초기 로딩 속도에 영향을 주지 않아야 합니다. 따라서 차트 컴포넌트는 `next/dynamic`을 통해 `ssr: false` 옵션으로 동적 호출되거나, 트리 쉐이킹이 되도록 독립 패키지로 격리하는 아키텍처를 도입해야 합니다.

### 2. 복합 데이터 테이블(Data Table) 플러그인
목표: `TanStack Table` (선택적) 기반의 다기능 렌더러
- 방향성: 페이지네이션, 정렬, 필터링 등 브라우저 단에서 일어나는 무거운 계산을 줄이기 위해 Server Pagination을 Default로 가져가며, 테이블 UI 계층만 플러그인화 합니다.

## Gemini (Antigravity) 구현 시 프론트엔드 아키텍처 체크리스트

다음은 제미나이가 실제 코드베이스를 구성할 때 검토해야 할 리스트입니다:

- [ ] `create-next-app`에 `--typescript`, `--tailwind`, `--app`, `--src-dir`, `--alias="@/*"`를 적용하였는가?
- [ ] TypeScript `compilerOptions`의 `strict` 모드, 경로 alias가 제대로 세팅되어 있는가?
- [ ] Tailwind CSS + `shadcn/ui` 초기화 및 기본 `cn` 유틸리티 함수 구성 완료되었는가?
- [ ] `next-intl` 미들웨어 구조 및 `messages/` 폴더 내 다국어 세팅 완료 완료되었는가?
- [ ] 로컬용 `Zustand` Provider(Context API 방식) 및 SSR Hydration 대응이 되어 있는가?
- [ ] 브라우저 환경, 서버 컴포넌트 환경 각각에 대응하는 `@supabase/ssr` 클라이언트가 분리되어 작성되었는가?
- [ ] public 경로와 protected 경로 진입 시 리다이렉트 미들웨어 처리가 정확한가?
- [ ] Vitest 환경 세팅(setup 파일 주입)이 구성되어 있는가?

## 향후 과제

본 문서를 바탕으로 제미나이는 곧바로 초기 템플릿 환경을 초기화(`pnpm create next-app`) 하고, 뼈대 코드를 작성하는 모드로 진입합니다. 설계된 구조와 어긋남이 발생하는 예기치 못한 이슈 발생 시 중고급 FE 개발자의 관점에서 유연하게 대처방안을 제안해야 합니다.
