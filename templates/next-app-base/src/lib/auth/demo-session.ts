type Theme = "light" | "dark";

export function getThemeByCurrentTime(): Theme {
  // 항상 라이트 테마를 우선 하도록 변경
  return "light";
}

export async function getThemeCookie() {
  return getThemeByCurrentTime();
}
