"use client";

import type { JSX } from "react";
import { GlassIcon } from "./glass-icon";
import { VoiceButton, type VoiceState } from "./voice-button";

export type BarAction = "card" | "send" | "stash" | "receive";

const ICON: Record<BarAction, string> = {
  card: "credit_card",
  send: "north_east",
  stash: "savings",
  receive: "south_west",
};

/**
 * Cleo-style fixed bottom bar. Two side actions flank a raised central voice
 * button. Mirrors the safe-area + max-w-md positioning of BottomNav.
 */
export function ActionBar(props: {
  voiceState: VoiceState;
  onAsk: () => void;
  onAction: (a: BarAction) => void;
  labels: { card: string; ask: string; send: string; stash: string; receive: string };
}): JSX.Element {
  const { voiceState, onAsk, onAction, labels } = props;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md bg-transparent">
      <div className="grid grid-cols-[1fr_6.5rem_1fr] items-end gap-2 px-3 pt-5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <SideAction
          icon={ICON.card}
          label={labels.card}
          active
          onClick={() => onAction("card")}
        />

        <div className="relative flex shrink-0 flex-col items-center gap-1 px-1">
          <button
            type="button"
            onClick={() => onAction("send")}
            aria-label={labels.send}
            className="absolute -left-3 top-7 z-10 rounded-full active:active-tap"
          >
            <GlassIcon icon={ICON.send} label={labels.send} size="sm" />
          </button>
          <div className="-mt-5">
            <VoiceButton state={voiceState} onClick={onAsk} size={70} />
          </div>
          <button
            type="button"
            onClick={() => onAction("receive")}
            aria-label={labels.receive}
            className="absolute -right-3 top-7 z-10 rounded-full active:active-tap"
          >
            <GlassIcon icon={ICON.receive} label={labels.receive} size="sm" />
          </button>
          <span className="font-label-md text-on-surface">{labels.ask}</span>
        </div>

        <SideAction
          icon={ICON.stash}
          label={labels.stash}
          onClick={() => onAction("stash")}
        />
      </div>
    </nav>
  );
}

function SideAction(props: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}): JSX.Element {
  const { icon, label, active = false, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col items-center gap-1 rounded-lg py-1 text-on-surface-variant transition-colors active:active-tap hover:text-on-surface"
    >
      <GlassIcon icon={icon} label={label} active={active} size="md" />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
