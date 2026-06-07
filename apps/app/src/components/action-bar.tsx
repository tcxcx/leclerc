"use client";

import type { JSX } from "react";
import { VoiceButton, type VoiceState } from "./voice-button";

export type BarAction = "spend" | "stash" | "request";

const ICON: Record<BarAction, string> = {
  spend: "payments",
  stash: "savings",
  request: "request_quote",
};

/**
 * Cleo-style fixed bottom bar. Two side actions flank a raised central voice
 * button. Mirrors the safe-area + max-w-md positioning of BottomNav.
 */
export function ActionBar(props: {
  voiceState: VoiceState;
  onAsk: () => void;
  onAction: (a: BarAction) => void;
  labels: { spend: string; ask: string; stash: string; request: string };
}): JSX.Element {
  const { voiceState, onAsk, onAction, labels } = props;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-outline-variant bg-surface-container/95 backdrop-blur">
      <div className="flex items-end gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Left cluster */}
        <SideAction
          icon={ICON.spend}
          label={labels.spend}
          onClick={() => onAction("spend")}
        />
        <SideAction
          icon={ICON.stash}
          label={labels.stash}
          onClick={() => onAction("stash")}
        />

        {/* Raised central voice control */}
        <div className="flex shrink-0 flex-col items-center gap-1 px-1">
          <div className="-mt-6">
            <VoiceButton state={voiceState} onClick={onAsk} size={64} />
          </div>
          <span className="font-label-md text-on-surface">{labels.ask}</span>
        </div>

        {/* Right cluster — keep symmetry with two slots (one used) */}
        <SideAction
          icon={ICON.request}
          label={labels.request}
          onClick={() => onAction("request")}
        />
        <span className="flex-1" aria-hidden />
      </div>
    </nav>
  );
}

function SideAction(props: {
  icon: string;
  label: string;
  onClick: () => void;
}): JSX.Element {
  const { icon, label, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-on-surface-variant transition-colors active:active-tap hover:text-on-surface"
    >
      <span className="material-symbols-outlined text-[24px]" aria-hidden>
        {icon}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
