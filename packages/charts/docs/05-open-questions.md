# Open Questions

## Naming

- 요청서에는 `GuageChart`, `SunbustChart`로 표기되어 있다.
- 일반적인 영문 표기는 `GaugeChart`, `SunburstChart`다.
- 초기 public API는 요청 표기를 유지했다. 정정 alias 제공 여부는 후속 결정이 필요하다.

## React Peer Range

- 현재 초안은 React 18 이상, 20 미만 peer range를 사용한다.
- KMSF 메인 앱은 React 19 계열이므로, React 18 지원 테스트 범위는 별도로 결정해야 한다.

## ECharts Version

- 요청사항은 `echarts:latest`다.
- 현재 설치 기준은 ECharts 5.6.0이다.
- ECharts major version이 바뀌면 타입 export 이름과 `echarts-wordcloud` 호환성을 재확인해야 한다.

## WordCloud

- `echarts-wordcloud` 패키지를 사용한다.
- 현재 설치 기준은 `echarts-wordcloud` 2.1.0이다.

## Test Directory Spelling

- 요청서에는 `playwrite`로 표기되어 있으나 도구명은 Playwright다.
- 실제 디렉터리는 `test/playwright`로 정규화했다.
