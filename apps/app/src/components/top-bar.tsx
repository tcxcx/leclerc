"use client";

import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { ModeBadge } from "./mode-badge";

export function TopBar() {
  const t = useI18n();
  const locale = useCurrentLocale();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-surface/90 px-4 py-3 backdrop-blur">
      <Link href={`/${locale}`} className="flex items-center gap-2">
        <span className="material-symbols-outlined fill text-primary text-[26px]" aria-hidden>
          shield_person
        </span>
        <span className="font-display-lg text-[19px] font-extrabold tracking-tight">
          {t("app.name")}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ModeBadge />
        <Link
          href={`/${locale}/ajustes`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
          aria-label={t("nav.settings")}
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden>
            settings
          </span>
        </Link>
      </div>
    </header>
  );
}
