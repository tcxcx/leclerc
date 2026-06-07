"use client";

import { useInferenceMode } from "@/lib/inference/mode";
import { useI18n } from "@/locales/client";

const ICON: Record<string, string> = {
  station: "dns",
  delegate: "lan",
  ondevice: "smartphone",
};

/** Always-visible badge showing where inference runs (P2P/perf story). */
export function ModeBadge() {
  const { mode } = useInferenceMode();
  const t = useI18n();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 text-caption font-medium text-on-surface-variant">
      <span className="material-symbols-outlined text-[16px]" aria-hidden>
        {ICON[mode] ?? "dns"}
      </span>      {t(`mode.${mode}`)}
    </span>
  );
}
