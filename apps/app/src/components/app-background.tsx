"use client";

import AnimatedBackground, { type ColorPreset } from "./animated-background";

/**
 * Full-bleed, fixed background for the Cleo-style shell. The WebGL gradient sits
 * behind everything, blurred and dimmed so it reads "tenue" (soft) like Cleo's
 * drifting gradient — but in the dark spy palette. A veil keeps text readable.
 *
 * `prefers-reduced-motion` users get the static CSS gradient (no animation):
 * AnimatedBackground already paints `cssGradient` as the canvas background, and
 * we simply don't fault if WebGL is blocked.
 */
export function AppBackground({ variant = "spy" }: { variant?: ColorPreset }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface">
      {/* The drifting gradient, softened: scaled up + blurred + dimmed. */}
      <div className="absolute inset-[-12%] opacity-[0.45] blur-[64px] saturate-[0.85] motion-reduce:hidden">
        <AnimatedBackground variant={variant} />
      </div>
      {/* Static fallback for reduced motion (no canvas churn). */}
      <div className="absolute inset-0 hidden bg-gradient-to-b from-surface-container to-surface motion-reduce:block" />
      {/* Veil: darken top + bottom so the top bar and the input/action bar keep contrast. */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/30 to-surface/85" />
    </div>
  );
}

export default AppBackground;
