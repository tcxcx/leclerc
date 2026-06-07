"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { GlassIcon } from "./glass-icon";

const ITEMS = [
  { href: "", icon: "credit_card", key: "console" },
  { href: "capturar", icon: "mic", key: "capture" },
  { href: "expediente", icon: "folder_shared", key: "dossier" },
  { href: "analisis", icon: "analytics", key: "analysis" },
  { href: "billetera", icon: "account_balance_wallet", key: "wallet" },
] as const;

export function BottomNav() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const pathname = usePathname();

  const base = `/${locale}`;
  const isActive = (href: string) => {
    const full = href ? `${base}/${href}` : base;
    return href ? pathname.startsWith(full) : pathname === base || pathname === `${base}/`;
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-outline-variant bg-surface-container/95 backdrop-blur">
      <ul className="flex items-stretch justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {ITEMS.map((it) => {
          const active = isActive(it.href);
          return (
            <li key={it.key} className="flex-1">
              <Link
                href={it.href ? `${base}/${it.href}` : base}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-caption transition-colors ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                <GlassIcon icon={it.icon} active={active} size="sm" />
                <span className="text-[11px] font-medium">{t(`nav.${it.key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
