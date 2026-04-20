# Next.js Template Docs for Gemini (Antigravity)

이 폴더는 Next.js 기반 사내/팀 공용 프로젝트 템플릿을 설계하고, 이후 제미나이(Gemini, Antigravity)가 실제 템플릿 프로젝트를 생성 및 고도화할 때 아키텍처 기준으로 사용할 문서 모음입니다. 중고급 프론트엔드 개발자의 관점에서 시스템의 견고함과 유지보수성을 중심에 두고 작성되었습니다.

문서 기준일:
- 2026-04-18 (초기 초안)
- 2026-04-21 (Gemini 이관)

문서 구성:
- [01-product-goals.gemini.md](./01-product-goals.gemini.md): 템플릿 목표, 범위, 성공 기준
- [02-tech-stack-decisions.gemini.md](./02-tech-stack-decisions.gemini.md): 기술 스택과 공식 문서 기반 의사결정
- [03-architecture-layout.gemini.md](./03-architecture-layout.gemini.md): App Router 구조, SSR/CSR 렌더링 전략, 레이아웃 기준
- [04-auth-security-supabase.gemini.md](./04-auth-security-supabase.gemini.md): 인증, 보안, 환경변수, Supabase 운영 기준
- [05-roadmap-open-questions.gemini.md](./05-roadmap-open-questions.gemini.md): 플러그인 로드맵과 남은 아키텍처 결정 사항

작업 원칙:
- 모든 의사결정은 Next.js 및 도입 라이브러리의 최신 공식 문서를 최우선 기준으로 합니다.
- 공식 문서에 없는 항목은 실무 프론트엔드 생태계 트렌드와 `추론` 경험을 기반으로 명시합니다.
- 템플릿은 복제 또는 Fork 후 즉시 신규 비즈니스 로직을 붙여 개발할 수 있는 상태를 제공해야 합니다.
- 기본 아키텍처는 보수적으로 설정하여 안정성을 확보하고, 확장해야 할 포인트는 철저히 모듈로 분리(Decoupling)합니다.

UI / UX 표준 규격 (Antigravity & 개발자 공통):
- **입력 폼(Form) 여백**: 모든 Input과 Label 사이, Form 요소 간 간격은 `mb-[10px]` 및 `mt-6 space-y-4` 규격을 통일하여 사용합니다.
- **실시간 검증(Validation)**: Zod 릴레이 체크의 비동기성 또는 early-abort 문제를 피하기 위해, 클라이언트 상태(`useState`) 및 `onChange` 기반의 "순수 React 실시간 수동 검증"을 적용합니다. 필드 입력 중 100% 즉각적인 에러 피드백을 제공해야 합니다.
- **팝업 및 전체화면 스크롤**: `DialogContent` 등 화면의 높이를 덮는 컨텐츠는 세로 해상도 오버플로우 방지를 위해 무조건 `max-h-[85vh] overflow-y-auto` 클래스를 포함합니다.
- **트랜지션 & 로딩**: 팝업 등장 애니메이션은 화면 중앙에서 나타나도록 `zoom-in / fade-in`을 기본으로 하며, 페이지 이동이나 폼 제출 등 작업 중에는 전역 모달 차단스피너(`<FullPageLoader />`)를 사용합니다.
