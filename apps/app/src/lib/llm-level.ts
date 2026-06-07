"use client";

import { useEffect, useState } from "react";

/**
 * Dev-only "nivel de razonamiento" — picks which local LLM generates the report.
 * ALTA = Qwen3-4B (más preciso, más pesado), MEDIA = Qwen3-1.7B (más rápido).
 * The choice is sent to /api/reports; in production the server forces the
 * lighter model regardless.
 */
export type LlmLevel = "alta" | "media" | "medico";

export const LEVEL_MODEL: Record<LlmLevel, string> = {
  alta: "qwen3-4b",
  media: "qwen3-1.7b",
  // MedPsy powers the field-medic intel mode (Our Psy models track).
  // TODO(codex): set to the exact MedPsy model id registered in qvac.config.json.
  medico: "medpsy-4b",
};

export const LEVEL_LABEL: Record<LlmLevel, string> = {
  alta: "Razonamiento Alto",
  media: "Razonamiento Medio",
  medico: "Médico (MedPsy)",
};

const KEY = "leclerc-llm-level";
const DEFAULT: LlmLevel = "media";

export function getStoredLevel(): LlmLevel {
  if (typeof window === "undefined") return DEFAULT;
  const v = window.localStorage.getItem(KEY);
  return v === "alta" || v === "media" || v === "medico" ? v : DEFAULT;
}

export function useLlmLevel(): [LlmLevel, (l: LlmLevel) => void] {
  const [level, setLevel] = useState<LlmLevel>(DEFAULT);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevel(getStoredLevel());
  }, []);

  const update = (l: LlmLevel) => {
    setLevel(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  };

  return [level, update];
}
