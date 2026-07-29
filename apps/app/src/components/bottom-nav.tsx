"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { bottomNavigationItems, localizedNavigationHref } from "@leclerc/core";
import { GlassIcon } from "./glass-icon";

const ITEMS = bottomNavigationItems();

export function BottomNav() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const pathname = usePathname();

  const base = `/${locale}`;
  const isActive = (segment: string) => {
    const full = segment ? `${base}/${segment}` : base;
    return segment ? pathname.startsWith(full) : pathname === base || pathname === `${base}/`;
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-outline-variant bg-surface-container/95 backdrop-blur">
      <ul className="flex items-stretch justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {ITEMS.map((it) => {
          const active = isActive(it.segment);
          return (
            <li key={it.id} className="flex-1">
              <Link
                href={localizedNavigationHref(it, locale)}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-caption transition-colors ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                <GlassIcon icon={it.icon} active={active} size="sm" />
                <span className="text-[11px] font-medium">{translateKey(t, it.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function translateKey(t: ReturnType<typeof useI18n>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}
