# Basic Dashboard Example

`examples/basic-dashboard`는 KMSF 재사용 패키지를 실제 소비 앱에서 import하고 렌더링할 수 있는지 확인하는 최소 Next.js 예제다.

메인 제품 앱은 `apps/kmsf`에 있으며, 이 예제는 제품 기능을 다시 구현하지 않는다.

## 포함 패키지

- `@kmsf/charts`
- `@kmsf/data-table`
- `@kmsf/gridstack`

## 실행

루트에서 실행:

```bash
npm --workspace=examples/basic-dashboard run dev
```

## 검증

```bash
npm --workspace=examples/basic-dashboard run lint
npm --workspace=examples/basic-dashboard run build
npm --workspace=examples/basic-dashboard run verify
```

UI 자체가 크게 바뀌는 경우에만 별도 브라우저 검증을 추가한다.
