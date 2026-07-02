# @kmsf/gridstack Example Research

## Reviewed Facts

- 이 파일은 `example` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`example`은 package consumer surface와 browser verification fixture 역할을 한다.

## Stable Rules

- public exports를 통해 package를 사용한다.
- example style과 demo data를 runtime exports에 섞지 않는다.
- UI 변경 시 console error와 visible breakage를 확인한다.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.


## 2026-06-30 Playground Docs Renewal Research

- `@kmsf/gridstack` example은 기존 dashboard workflow를 유지하면서, 문서형 playground 첫 화면에서 설명, 코드, 라이브 dashboard를 같이 보여주는 구성이 적합하다고 확인했다.
- route는 `/docs/getting-started`, `/examples/basic-dashboard`, `/examples/create-remove`, `/examples/move-resize`, `/examples/columns-arrange`, `/examples/maximize-minimize`, `/examples/serialize-restore`, `/api/props`로 분리한다.
- 문법 하이라이트는 `prism-react-renderer`를 example dev dependency로 추가한다.
- path routing에는 `react-router`를 사용하고, route 전환 시 이전 live dashboard가 unmount되는지 `window.__kmsfGridstackLastUnmount`로 검증한다.
- ask gate clear: 사용자가 차트와 그리드스택만 진행하고, 한국어 문서와 추천 구조에 동의했다.

## 2026-07-01 Docs Example Composition Research

- 현재 playground는 설명, 코드, 라이브 예제를 route별로 제공하지만 하나의 `DashboardExample`을 여러 route에서 재사용해 예제 페이지 구성이 반복된다.
- `@kmsf/data-table` 기준 코드 예제 표시 모듈은 `prism-react-renderer`이며, `@kmsf/gridstack`도 이미 같은 모듈을 사용한다.
- `DashboardGrid`, `useDashboardGrid`, layout serialization, restore, runtime column change, add/update/remove, maximize/minimize/restore, global movable/resizable toggles는 현재 public surface로 제공된다.
- `DashboardWidget.locked`는 adapter에서 GridStack `locked`, `noMove`, `noResize`로 매핑된다.
- 별도 위젯 단위 `movable` / `resizable` public API는 아직 없다.
- `@kmsf/gridstack` example에는 data-table example처럼 package-local Dialog/Select UI 컴포넌트가 아직 없다.
- Supervisor accepted decisions:
  - 위젯 단위 `movable?: boolean`, `resizable?: boolean`을 추가하고 기존 `locked`는 둘 다 막는 호환 속성으로 유지한다.
  - shadcn Dialog/Select는 runtime dependency를 추가하지 않고 `example/src/components/ui/*`에 package-local 컴포넌트로 둔다.
  - 종합 예제는 1~4 페이지를 중첩하지 않고 CRUD, 레이아웃, 잠금, 컬럼, 저장/복원을 한 화면에서 smoke 확인하는 구성으로 둔다.
  - API 문서는 `@kmsf/gridstack` public API만 대상으로 하고 raw GridStack 내부 옵션은 제외한다.
  - 이번 작업은 runtime API 변경과 example/docs/test 변경을 모두 포함한다.
- ask gate clear: 위 결정 5개가 모두 supervisor 승인으로 닫혔다.
