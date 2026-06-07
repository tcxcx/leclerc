"use client";

import type { JSX } from "react";

export interface Chip {
  label: string;
  icon?: string;
  onClick?: () => void;
}

/** Horizontal row of tappable suggestion pills. Renders nothing if empty. */
export function Chips(props: { items: Chip[] }): JSX.Element | null {
  const { items } = props;
  if (items.length === 0) return null;

  return (
    <div className="-mx-1 flex flex-wrap gap-2 px-1">
      {items.map((chip, i) => (
        <button
          key={`${chip.label}-${i}`}
          type="button"
          onClick={chip.onClick}
          className="anim-pop inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3.5 py-1.5 font-label-md text-on-surface-variant transition-colors active:active-tap hover:bg-surface-container-high hover:text-on-surface"
        >
          {chip.icon ? (
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              {chip.icon}
            </span>
          ) : null}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
