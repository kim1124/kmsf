# Playwright Specs

브라우저 기반 E2E spec을 관리한다.

Canvas 중첩 검증은 모든 구현 차트 타입을 대상으로 작성한다. Spec은 page-level canvas 총합만 보지 말고 각 chart card 단위로 `canvasCount`, `paintedCanvasCount`, `zeroSizeCanvasCount`, `data-zr-dom-id`, zrender layer key를 기록해야 한다. 공식 근거와 allow-list가 없는 card-level 중복 canvas는 실패로 분류한다.

Canvas layer 검증은 `canvas-layers.ts`의 shared classifier를 사용한다. 새 spec에서 canvas count를 직접 느슨하게 비교하지 않는다.

## Validation Fallbacks

필수 설정 누락 또는 잘못된 JSON 입력을 검증하는 spec은 chart-local fallback 또는 card-local alert를 기대한다.

모든 Playwright spec은 console warning/error와 pageerror를 허용하지 않는다. 오류 상태를 검증해야 하는 경우에도 브라우저 diagnostics는 0건이어야 하며, 사용자에게 보이는 fallback/alert text를 expectation에 명시한다.
