# Open Questions

## React Peer Range

- 현재 peer range는 React 18 이상, 20 미만이다.
- React 18 소비자 fixture를 별도로 둘지는 아직 결정하지 않았다.

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
