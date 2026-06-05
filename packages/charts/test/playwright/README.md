# Playwright Reports

Playwright 결과와 HTML report 산출물을 저장한다.

후속 구현 시 렌더링, resize, tooltip, zoom, chart mode 전환 검증을 배치한다.

## Canvas Layer Checks

브라우저 테스트에서 canvas 중첩 여부를 판단할 때는 모든 구현 차트 타입을 같은 기준으로 검사한다. `line` 또는 `lines`만 별도 기준으로 보지 않는다.
공통 구현은 `test/playwright/specs/canvas-layers.ts`를 사용한다.

기본 기준:

- 1개의 차트 카드에는 기본적으로 1개의 visible, non-zero, painted canvas가 있어야 한다.
- 화면에 3개의 차트 카드가 렌더링되고 multi-layer allow-list가 없으면 page-level main canvas 총합은 3개여야 한다.
- page-level 총합만으로 판정하지 말고, 각 카드의 canvas 개수와 layer id를 먼저 기록한다.
- `canvas.toDataURL()` 비교 또는 동등한 pixel sampling으로 blank canvas가 아닌지 확인한다.

정상 multi-layer로 볼 수 있는 경우:

- ECharts option에 numeric `zlevel`을 명시했고, DOM의 `data-zr-dom-id`가 해당 layer와 대응한다.
- ECharts/zrender가 progressive, incremental, hover, effect rendering을 위해 별도 canvas layer를 생성한다는 근거가 있다.
- `chart.getZr().painter.getLayers()`의 layer key와 DOM canvas의 `data-zr-dom-id`가 대응한다.
- 데이터 갱신, resize, chart type 전환 이후 canvas 개수가 증가하지 않고 안정적으로 유지된다.
- 해당 예외가 테스트 helper 또는 fixture에 chart type, trigger option, expected layer ids, source reference와 함께 명시되어 있다.

비정상으로 볼 수 있는 경우:

- `data-zr-dom-id="zr_undefined"`가 발견된다.
- 같은 차트 카드 안에서 canvas 수가 갱신 주기마다 증가한다.
- chart type 전환 또는 unmount 후 이전 canvas가 남는다.
- 동일 크기의 canvas가 중첩되어 있으나 numeric `zlevel` 또는 zrender layer metadata와 대응하지 않는다.
- zero-size, hidden, blank canvas가 stable render 이후 남는다.
- browser console warning/error 또는 pageerror가 같이 발생한다.

테스트 artifact에는 최소한 아래 값을 남긴다.

- chart type
- card test id
- per-card `canvasCount`
- page-level `canvasCount`
- `paintedCanvasCount`
- `zeroSizeCanvasCount`
- DOM `data-zr-dom-id` values
- zrender layer keys when available
- update/resize/switch 이후 count 변화
