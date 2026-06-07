"use client";

import { useTransition } from "react";
import { useChangeLocale, useCurrentLocale } from "@/locales/client";
import { SUPPORTED_LOCALES, LOCALE_FLAGS } from "@/lib/i18n/supported-locales";

export function LocaleSwitcher() {
  const current = useCurrentLocale();
  const changeLocale = useChangeLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {SUPPORTED_LOCALES.map((code) => {
        const active = code === current;
        const { emoji, nativeName } = LOCALE_FLAGS[code];
        return (
          <button
            key={code}
            disabled={isPending || active}
            onClick={() => startTransition(() => changeLocale(code))}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-label-md transition-colors ${
              active
                ? "border-primary bg-primary-container text-on-primary-container"
                : "border-outline-variant bg-surface-container text-on-surface-variant"
            }`}
          >
            <span aria-hidden>{emoji}</span>
            {nativeName}
          </button>
        );
      })}
    </div>
  );
}
