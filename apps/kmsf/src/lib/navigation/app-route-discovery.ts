import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

export type DiscoveredAppPageRoute = {
  href: string;
  label: string;
  routeId: string;
};

const PAGE_FILE_PATTERN = /^page\.(t|j)sx?$/;
const EXCLUDED_TOP_LEVEL_SEGMENTS = new Set(["api", "auth", "setup", "sign-in", "sign-up"]);

function isRouteGroup(segment: string) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamicSegment(segment: string) {
  return segment.startsWith("[") && segment.endsWith("]");
}

function toTitle(value: string) {
  if (value === "home") {
    return "Home";
  }

  return value
    .split("-")
    .filter(Boolean)
    .map((token) => `${token[0]?.toUpperCase() ?? ""}${token.slice(1)}`)
    .join(" ");
}

function toRoute(relativeDir: string): DiscoveredAppPageRoute | null {
  const rawSegments = relativeDir === "" ? [] : relativeDir.split(sep);

  if (rawSegments[0] === "[locale]") {
    return null;
  }

  const segments = rawSegments.filter((segment) => !isRouteGroup(segment));

  if (segments.some(isDynamicSegment)) {
    return null;
  }

  if (segments[0] && EXCLUDED_TOP_LEVEL_SEGMENTS.has(segments[0])) {
    return null;
  }

  const href = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  const routeId = segments.length === 0 ? "home" : segments.join(".");
  const label = segments.length === 0 ? "Home" : toTitle(segments.at(-1) ?? "home");

  return { href, label, routeId };
}

async function walkPageFiles(rootDir: string, currentDir = rootDir): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    const path = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      found.push(...(await walkPageFiles(rootDir, path)));
      continue;
    }

    if (entry.isFile() && PAGE_FILE_PATTERN.test(entry.name)) {
      found.push(relative(rootDir, currentDir));
    }
  }

  return found;
}

export async function discoverAppPageRoutesFromDir(appDir: string) {
  const pageDirs = await walkPageFiles(appDir);
  const routeByHref = new Map<string, DiscoveredAppPageRoute>();

  for (const pageDir of pageDirs) {
    const route = toRoute(pageDir);

    if (route) {
      routeByHref.set(route.href, route);
    }
  }

  return Array.from(routeByHref.values()).sort((left, right) => {
    if (left.href === "/") {
      return -1;
    }

    if (right.href === "/") {
      return 1;
    }

    return left.href.localeCompare(right.href);
  });
}

export async function discoverAppPageRoutes() {
  return discoverAppPageRoutesFromDir(join(/*turbopackIgnore: true*/ process.cwd(), "src", "app"));
}
