"use client";

import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { ModeBadge } from "./mode-badge";
import { GlassIcon } from "./glass-icon";

export function TopBar() {
  const t = useI18n();
  const locale = useCurrentLocale();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-surface/90 px-4 py-3 backdrop-blur">
      <Link href={`/${locale}`} className="flex items-center gap-2">
        <GlassIcon icon="shield_person" active size="sm" />
        <span className="font-display-lg text-[19px] font-extrabold tracking-tight">
          {t("app.name")}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ModeBadge />
        <Link
          href={`/${locale}/operaciones`}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label={t("nav.operations")}
        >
          <GlassIcon icon="assignment_ind" label={t("nav.operations")} size="sm" />
        </Link>
        <Link
          href={`/${locale}/ajustes`}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label={t("nav.settings")}
        >
          <GlassIcon icon="settings" label={t("nav.settings")} size="sm" />
        </Link>
      </div>
    </header>
  );
}
