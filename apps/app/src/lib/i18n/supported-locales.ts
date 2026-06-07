export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "es";

export function getSupportedLocale(raw?: string | null): SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(raw ?? "")
    ? (raw as SupportedLocale)
    : DEFAULT_LOCALE;
}

export const LOCALE_FLAGS: Record<SupportedLocale, { emoji: string; nativeName: string }> = {
  es: { emoji: "🇪🇸", nativeName: "Español" },
  en: { emoji: "🇬🇧", nativeName: "English" },
};
