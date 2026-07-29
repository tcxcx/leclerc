"use client";

import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { localizedNavigationHref, navigationHome, topBarNavigationItems } from "@leclerc/core";
import { ModeBadge } from "./mode-badge";
import { GlassIcon } from "./glass-icon";

const HOME_LINK = navigationHome();
const TOP_LINKS = topBarNavigationItems();

export function TopBar() {
  const t = useI18n();
  const locale = useCurrentLocale() as "es" | "en";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-surface/90 px-4 py-3 backdrop-blur">
      <Link href={localizedNavigationHref(HOME_LINK, locale)} className="flex items-center gap-2">
        <GlassIcon icon={HOME_LINK.icon} active size="sm" />
        <span className="font-display-lg text-[19px] font-extrabold tracking-tight">
          {translateKey(t, HOME_LINK.labelKey)}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ModeBadge />
        {TOP_LINKS.map((item) => {
          const label = translateKey(t, item.labelKey);
          return (
            <Link
              key={item.id}
              href={localizedNavigationHref(item, locale)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              aria-label={label}
            >
              <GlassIcon icon={item.icon} label={label} size="sm" />
            </Link>
          );
        })}
      </div>
    </header>
  );
}

function translateKey(t: ReturnType<typeof useI18n>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}
