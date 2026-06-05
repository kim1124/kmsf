# Playwright Specs

브라우저 기반 E2E spec을 둘 위치다.

초기 대상은 `TrendChart` 렌더링, 반응형 resize, zoom 이벤트 검증이다.

Canvas 중첩 검증은 모든 구현 차트 타입을 대상으로 작성한다. Spec은 page-level canvas 총합만 보지 말고 각 chart card 단위로 `canvasCount`, `paintedCanvasCount`, `zeroSizeCanvasCount`, `data-zr-dom-id`, zrender layer key를 기록해야 한다. 공식 근거와 allow-list가 없는 card-level 중복 canvas는 실패로 분류한다.

Canvas layer 검증은 `canvas-layers.ts`의 shared classifier를 사용한다. 새 spec에서 canvas count를 직접 느슨하게 비교하지 않는다.

## Intentional Validation Errors

필수 설정 누락 방어를 검증하는 spec은 의도적으로 `[KMSF Charts]` console error를 발생시킬 수 있다. 예시는 `type playground preserves data and remounts chart type`의 `sankey` 전환과 `invalid required chart config shows fallback without breaking the app`의 `options.radar.indicator` 누락이다. 두 경우 모두 chart-local fallback과 console error를 함께 기대한다.

이런 테스트는 expectation에 정확한 error text를 명시해야 한다. 그 외 일반 렌더링, 메뉴 전환, 대용량, soak 테스트에서는 console warning/error와 pageerror를 허용하지 않는다.
