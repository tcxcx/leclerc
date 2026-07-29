"use client";

import {
  defaultModelLevel,
  isModelLevel,
  modelLevelStorageKey,
} from "@leclerc/core/model-level-stories";
import type { LlmLevel } from "@leclerc/core/model-level-stories";
import { useEffect, useState } from "react";

/**
 * Dev-only "nivel de razonamiento" — picks which local LLM generates the report.
 * Concrete model ids and route defaults live in the shared model-level story.
 * The choice is sent to /api/reports; in production the server forces the
 * lighter model regardless.
 */
export type { LlmLevel } from "@leclerc/core/model-level-stories";

const KEY = modelLevelStorageKey();
const DEFAULT = defaultModelLevel();

export function getStoredLevel(): LlmLevel {
  if (typeof window === "undefined") return DEFAULT;
  const v = window.localStorage.getItem(KEY);
  return isModelLevel(v) ? v : DEFAULT;
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
