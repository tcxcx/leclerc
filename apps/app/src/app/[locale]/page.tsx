"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { ChatBubble } from "@/components/chat-bubble";
import { Chips } from "@/components/chips";
import { ActionBar, type BarAction } from "@/components/action-bar";
import { useVoice } from "@/lib/voice/use-voice";
import { chat, ragSearch } from "@/lib/api-client";
import { greeting, starterChips } from "@/lib/agents/persona";
import { seedDemo, listTransactions } from "@/lib/finance/store-client";
import { summarize, sassySummary, financeContext } from "@/lib/finance/insights";

type Msg = { role: "user" | "assistant"; content: string; pending?: boolean };

const LABELS = {
  es: { spend: "Gasto", ask: "Preguntar", stash: "Guardar", request: "Cobrar" },
  en: { spend: "Spend", ask: "Ask", stash: "Stash", request: "Request" },
} as const;

export default function ConsolePage() {
  const t = useI18n();
  const locale = useCurrentLocale() as "es" | "en";
  const router = useRouter();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ragChips, setRagChips] = useState<{ label: string; onClick: () => void }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live RAG chips: after a turn, surface related dossier hits as tappable chips.
  function refreshChips(query: string) {
    ragSearch(query, 4)
      .then(({ hits }) =>
        setRagChips(
          hits.map((h) => ({
            label: h.text.replace(/\s+/g, " ").trim().slice(0, 36) || h.id.slice(0, 8),
            onClick: () => router.push(`/${locale}/expediente/${h.id}`),
          })),
        ),
      )
      .catch(() => setRagChips([]));
  }

  // Voice: each completed turn becomes a pair of bubbles + refreshed chips.
  const voice = useVoice({
    locale,
    onTurn: ({ user, assistant }) => {
      setMessages((m) => [...m, { role: "user", content: user }, { role: "assistant", content: assistant }]);
      refreshChips(user);
    },
  });

  // Seed believable finance demo data once so Spend/insights have something to chew on.
  useEffect(() => {
    seedDemo(locale).catch(() => {});
  }, [locale]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, voice.tokens]);

  async function sendText(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages([...next, { role: "assistant", content: "", pending: true }]);
    setBusy(true);
    try {
      const txs = await listTransactions().catch(() => []);
      const ctx = txs.length ? financeContext(txs) : undefined;
      const { text: answer } = await chat(
        next.map((m) => ({ role: m.role, content: m.content })),
        { locale, financeContext: ctx },
      );
      setMessages([...next, { role: "assistant", content: answer }]);
      refreshChips(clean);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: e instanceof Error ? e.message : "error" }]);
    } finally {
      setBusy(false);
    }
  }

  async function onAction(a: BarAction) {
    if (a === "spend") {
      const txs = await listTransactions().catch(() => []);
      const line = sassySummary(summarize(txs), locale);
      setMessages((m) => [...m, { role: "assistant", content: line }]);
      return;
    }
    if (a === "stash") {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            locale === "es"
              ? "A la bóveda. ¿Cuánto escondemos, operativo?"
              : "Into the vault. How much are we hiding, operative?",
        },
      ]);
      return;
    }
    if (a === "request") router.push(`/${locale}/billetera`);
  }

  function onAsk() {
    if (voice.state === "idle") voice.start();
    else voice.stop();
  }

  const empty = messages.length === 0 && !voice.tokens;
  const chips = starterChips(locale).map((c) => ({ label: c.label, onClick: () => sendText(c.label) }));

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-2">
        <h1 className="anim-enter pt-4 font-display-lg text-[30px] leading-tight">{greeting(locale)}</h1>

        {empty && <p className="anim-fade text-on-surface-variant text-body-lg">{t("app.tagline")}</p>}

        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} pending={m.pending}>
            {m.content}
          </ChatBubble>
        ))}

        {voice.transcript && voice.state !== "idle" && (
          <ChatBubble role="user">{voice.transcript}</ChatBubble>
        )}
        {voice.tokens && (
          <ChatBubble role="assistant" pending={voice.state === "thinking"}>
            {voice.tokens}
          </ChatBubble>
        )}

        {empty && (
          <div className="pt-2">
            <Chips items={chips} />
          </div>
        )}
      </div>

      {/* Live RAG chips: related dossier hits, tappable to the source record. */}
      {ragChips.length > 0 && (
        <div className="pb-2">
          <Chips items={ragChips} />
        </div>
      )}

      <div className="anim-fade flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container/80 px-4 py-2 backdrop-blur">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText(input)}
          placeholder={t("capture.title")}
          className="flex-1 bg-transparent text-body-md outline-none placeholder:text-on-surface-variant"
        />
        <button
          onClick={() => voice.toggleSpeak()}
          aria-label="toggle audio"
          className={`material-symbols-outlined text-[22px] ${voice.speak ? "text-primary" : "text-on-surface-variant"}`}
        >
          {voice.speak ? "graphic_eq" : "volume_off"}
        </button>
      </div>

      <ActionBar voiceState={voice.state} onAsk={onAsk} onAction={onAction} labels={LABELS[locale]} />
    </div>
  );
}
