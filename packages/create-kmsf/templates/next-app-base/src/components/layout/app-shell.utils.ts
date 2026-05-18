const LOCALE_PREFIX_PATTERN = /^\/(ko|en)(?=\/|$)/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeAppPathname(pathname: string) {
  if (!pathname) {
    return "/";
  }

  const withoutLocale = pathname.replace(LOCALE_PREFIX_PATTERN, "") || "/";
  return withoutLocale === "" ? "/" : withoutLocale;
}

export function isNavItemActive(pathname: string, href: string) {
  const normalizedPath = normalizeAppPathname(pathname);
  const normalizedHref = normalizeAppPathname(href);

  if (normalizedHref === "/") {
    return normalizedPath === "/";
  }

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

export function formatServerTimeLabel(value: Date) {
  return [
    "현재 시간 :",
    [
      value.getFullYear(),
      pad(value.getMonth() + 1),
      pad(value.getDate()),
    ].join("-"),
    [
      pad(value.getHours()),
      pad(value.getMinutes()),
      pad(value.getSeconds()),
    ].join(":"),
  ].join(" ");
}
