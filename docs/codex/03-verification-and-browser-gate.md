# 검증 및 브라우저 Gate

## 목적

사이드 이펙트를 줄이기 위해, 완료 처리 전에 통과해야 하는 검증 절차를 고정한다.

## 공통 원칙

- 테스트 실패 시 완료 금지
- build 실패 시 완료 금지
- 브라우저 검증에서 visible error 또는 console error가 남으면 완료 금지
- 미실행 검증은 숨기지 않고 blocker 또는 residual risk로 보고

## 기본 검증

- `npm run lint`
- `npm run test:run`
- `npm run build`

## 추가 검증 기준

### UI 변경

- 브라우저 검증 필수
- 필요 시 `npm run test:e2e`

### 인증/폼 변경

- 브라우저 검증 필수
- auth 흐름 또는 submit 흐름이 변경되면 e2e 우선 고려

### 문서/지침만 변경

- 최소 `npm run lint`, `npm run test:run`, `npm run build`
- 브라우저 검증은 필요 시점과 변경 영향에 따라 판단하되, 환경이 허용하면 수행 권장

## 브라우저 검증 우선순위

1. Codex in-app browser
2. Codex computer use
3. `npm run test:e2e:headed`
4. `agent-browser` 사용 가능 세션

## 브라우저 검증 체크리스트

- 대상 페이지가 로드되는가
- 콘솔 오류가 없는가
- hydration 오류가 없는가
- touched UI가 정상 렌더링되는가
- 제출/네비게이션/상호작용 경로가 정상인가

## 현재 저장소 기준 실행 명령

- `npm run dev`
- `npm run test:e2e:headed`

`agent-browser`가 있는 세션에서는 아래를 대체 경로로 사용한다.

- `agent-browser open http://127.0.0.1:3000`
- `agent-browser wait --load networkidle`
- `agent-browser snapshot -i`

실행이 불가하면 원인을 그대로 보고한다.
