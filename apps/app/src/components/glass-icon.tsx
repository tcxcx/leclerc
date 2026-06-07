"use client";

import type { JSX } from "react";

type GlassIconSize = "sm" | "md" | "lg" | "xl";

const SIZE: Record<GlassIconSize, string> = {
  sm: "h-9 w-9 text-[18px]",
  md: "h-11 w-11 text-[22px]",
  lg: "h-14 w-14 text-[26px]",
  xl: "h-16 w-16 text-[30px]",
};

export function GlassIcon({
  icon,
  label,
  active = false,
  size = "md",
  className = "",
}: {
  icon: string;
  label?: string;
  active?: boolean;
  size?: GlassIconSize;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={`glass-icon inline-flex shrink-0 items-center justify-center rounded-full text-on-surface ${
        active ? "glass-active text-ignyte" : ""
      } ${SIZE[size]} ${className}`}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      <span className={`material-symbols-outlined ${active ? "fill" : ""}`} aria-hidden>
        {icon}
      </span>
    </span>
  );
}
