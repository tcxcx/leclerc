"use client";

import { createContext, createElement, useContext, useEffect, useState } from "react";

/**
 * Inference mode for LeClerc. All three paths use QVAC — there is NO non-QVAC
 * fallback (see docs/leclerc/02 §5). The transformers.js browser path was
 * removed for hackathon compliance.
 *
 *  - "station"  → talk to a local `qvac serve openai` (the laptop "safehouse"
 *                 station) over HTTP, or to a paired peer's server. Default for
 *                 the browser/PWA when a station is reachable.
 *  - "delegate" → delegate heavy QVAC jobs to the station peer over the
 *                 Holepunch DHT (mobile → laptop). Handled server-side / Bare.
 *  - "ondevice" → run @qvac/sdk locally (Node on the station, Bare on a native
 *                 mobile client). The browser cannot do this directly.
 *
 * The PWA primarily uses "station". "delegate"/"ondevice" are surfaced for the
 * P2P / mobile story and routed through Route Handlers (Node).
 */
export type InferenceMode = "station" | "delegate" | "ondevice";

const KEY = "leclerc-inference-mode";
const DEFAULT: InferenceMode = "station";

export function getStoredMode(): InferenceMode {
  if (typeof window === "undefined") return DEFAULT;
  const v = window.localStorage.getItem(KEY);
  return v === "station" || v === "delegate" || v === "ondevice" ? v : DEFAULT;
}

interface ModeContextValue {
  mode: InferenceMode;
  setMode: (m: InferenceMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function InferenceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<InferenceMode>(DEFAULT);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(getStoredMode());
  }, []);

  const setMode = (m: InferenceMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
  };

  return createElement(ModeContext.Provider, { value: { mode, setMode } }, children);
}

export function useInferenceMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useInferenceMode must be used within InferenceModeProvider");
  return ctx;
}
