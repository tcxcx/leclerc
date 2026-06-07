"use client";

import type { JSX, ReactNode } from "react";

export type ChatRole = "user" | "assistant";

/**
 * A single conversational turn. The assistant "speaks" as the app's own voice
 * in the editorial serif (Cleo feel), users get a contained pill on the right.
 * Data tokens (amounts, sats, ids, coordinates) render in mono — the "intel" tell.
 */
export function ChatBubble(props: {
  role: ChatRole;
  children: React.ReactNode;
  pending?: boolean;
}): JSX.Element {
  const { role, children, pending } = props;
  const isUser = role === "user";

  return (
    <div className={`anim-enter flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-container-high px-4 py-2.5 font-body-md text-on-surface">
          {monoize(children)}
        </div>
      ) : (
        <div className="max-w-[88%] font-serif text-[22px] leading-snug tracking-[-0.01em] text-on-surface">
          {pending ? <TypingShimmer /> : monoize(children)}
        </div>
      )}
    </div>
  );
}

/**
 * Wrap money / sats / ids / coordinates in a mono span. Only transforms plain
 * strings (and arrays of them); any non-string node passes through untouched.
 */
const DATA_RE =
  /([$€£]\s?\d[\d.,]*(?:\s?(?:USDT|USDC|USD|EUR|sats?))?|\b\d[\d.,]*\s?(?:USDT|USDC|USD|EUR|sats|BTC)\b|\b[0-9a-f]{8}(?:-[0-9a-f]{4}){0,4}\b|-?\d{1,3}\.\d{3,}°?\s*[NSEW]?)/gi;

function monoize(node: ReactNode): ReactNode {
  if (typeof node === "string") return splitMono(node);
  if (Array.isArray(node)) return node.map((n, i) => <span key={i}>{monoize(n)}</span>);
  return node;
}

function splitMono(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(DATA_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span key={start} className="font-mono text-[0.92em] text-tertiary">
        {m[0]}
      </span>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

/** Three breathing dots used while the assistant composes a reply. */
function TypingShimmer(): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 py-1" role="status" aria-label="…">
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
