"use client";

import { useI18n } from "@/locales/client";
import type { ThreatLevel } from "@/lib/intel/schema";

const STYLE: Record<ThreatLevel, string> = {
  CRITICO: "bg-error-container text-on-error-container",
  ELEVADO: "bg-tertiary-container text-on-tertiary-container",
  RUTINARIO: "bg-secondary-container text-on-secondary-container",
};

export function ThreatChip({ level }: { level: ThreatLevel }) {
  const t = useI18n();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-bold tracking-wide ${STYLE[level]}`}
    >      {t(`threat.${level}`)}
    </span>
  );
}
