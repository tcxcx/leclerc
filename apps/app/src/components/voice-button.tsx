"use client";

import type { JSX } from "react";
import { GlassIcon } from "./glass-icon";

export type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";

const ARIA: Record<VoiceState, string> = {
  idle: "Hablar",
  connecting: "Conectando",
  listening: "Escuchando",
  thinking: "Pensando",
  speaking: "Hablando",
};

/** Color ring/fill per state — accent shifts to signal who's "talking". */
const SHELL: Record<VoiceState, string> = {
  idle: "text-on-surface",
  connecting: "text-on-surface",
  listening: "text-on-surface",
  thinking: "bg-surface-container-high text-on-surface-variant",
  speaking: "bg-secondary text-on-secondary",
};

/**
 * Central mic / voice control. Self-contained: all motion reuses globals
 * helpers (recording-pulse, wave-bar, anim-fade). No external CSS.
 */
export function VoiceButton(props: {
  state: VoiceState;
  onClick: () => void;
  size?: number;
}): JSX.Element {
  const { state, onClick, size = 72 } = props;
  const ring = state === "listening" || state === "connecting";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ARIA[state]}
      aria-busy={state === "connecting" || state === "thinking"}
      className="relative inline-flex items-center justify-center rounded-full active:active-tap"
      style={{ width: size, height: size }}
    >
      {/* Pulsing halo (listening / connecting) */}
      {ring ? (
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full recording-pulse ${
            state === "listening" ? "bg-ignyte/30" : "bg-primary/40"
          } ${state === "connecting" ? "[animation-duration:1.4s]" : ""}`}
        />
      ) : null}

      {/* The button face */}
      <span
        className={`anim-fade relative flex h-full w-full items-center justify-center rounded-full ${SHELL[state]}`}
      >
        {state === "listening" ? (
          <span className="glass-icon glass-active flex h-full w-full items-center justify-center rounded-full">
            <Bars className="text-ignyte" />
          </span>
        ) : state === "speaking" ? (
          <Bars className="text-on-secondary" />
        ) : state === "thinking" ? (
          <Dots />
        ) : (
          <GlassIcon icon="mic" label={ARIA[state]} active={state === "connecting"} size="xl" />
        )}
      </span>
    </button>
  );
}

/** Animated equalizer / waveform bars (listening + speaking). */
function Bars({ className }: { className: string }): JSX.Element {
  const delays = ["0ms", "180ms", "360ms", "120ms", "300ms"];
  return (
    <span
      aria-hidden
      className={`flex h-7 items-center gap-[3px] ${className}`}
    >
      {delays.map((d, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-current [animation-duration:0.9s]"
          style={{ animationDelay: d, height: 12 }}
        />
      ))}
    </span>
  );
}

/** Breathing dots used while thinking. */
function Dots(): JSX.Element {
  return (
    <span aria-hidden className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-current recording-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </span>
  );
}
