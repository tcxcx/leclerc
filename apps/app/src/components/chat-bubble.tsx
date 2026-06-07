"use client";

import type { JSX } from "react";

export type ChatRole = "user" | "assistant";

/**
 * A single conversational turn. The assistant "speaks" as the app's own voice
 * (no avatar / no bubble chrome), users get a contained pill on the right.
 */
export function ChatBubble(props: {
  role: ChatRole;
  children: React.ReactNode;
  pending?: boolean;
}): JSX.Element {
  const { role, children, pending } = props;
  const isUser = role === "user";

  return (
    <div
      className={`anim-enter flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isUser ? (
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-container-high px-4 py-2.5 font-body-md text-on-surface">
          {children}
        </div>
      ) : (
        <div className="max-w-[85%] font-body-lg leading-relaxed text-on-surface">
          {pending ? <TypingShimmer /> : children}
        </div>
      )}
    </div>
  );
}

/** Three breathing dots used while the assistant composes a reply. */
function TypingShimmer(): JSX.Element {
  return (
    <span
      className="inline-flex items-center gap-1.5 py-1"
      role="status"
      aria-label="…"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-on-surface-variant recording-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </span>
  );
}
