import { hasLocale } from "next-intl";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";

import { routing, type AppLocale } from "./routing";

export async function getAppLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  if (cookieLocale && hasLocale(routing.locales, cookieLocale)) {
    return cookieLocale;
  }

  const requestLocale = await getLocale();

  if (hasLocale(routing.locales, requestLocale)) {
    return requestLocale;
  }

  return routing.defaultLocale;
}
