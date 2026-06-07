import { createI18nMiddleware } from "next-international/middleware";
import type { NextRequest } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/supported-locales";

/**
 * Next.js 16 proxy (formerly middleware). next-international locale routing with
 * the "rewrite" strategy so the /es prefix stays hidden from the URL
 * (docs/leclerc/07). API routes are excluded — they aren't localized.
 */
const I18nMiddleware = createI18nMiddleware({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: "rewrite",
});

export default function proxy(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
