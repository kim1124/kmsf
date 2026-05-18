# Components Research

## Reviewed Findings

- Public names `GuageChart` and `SunbustChart` are compatibility exports.
- Conventional aliases `GaugeChart` and `SunburstChart` are allowed.
- `TrendChart` requires `series`; non-Trend charts may generate default series when safe.

## High-Confidence Scope

- Component changes must preserve generic React compatibility.
- Rendered chart behavior requires Playwright when user-visible output changes.
