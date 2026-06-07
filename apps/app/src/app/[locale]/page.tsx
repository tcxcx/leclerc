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
import {
  seedDemo,
  listTransactions,
  addSavingsGoal,
  listSavingsGoals,
  type SavingsGoal,
  type Transaction,
} from "@/lib/finance/store-client";
import {
  summarize,
  sassySummary,
  financeContext,
  formatAmount,
  type SpendSummary,
} from "@/lib/finance/insights";

type Msg = { role: "user" | "assistant"; content: string; pending?: boolean };
type FinancePanel =
  | { kind: "spend"; summary: SpendSummary; txs: Transaction[] }
  | { kind: "stash"; goals: SavingsGoal[] }
  | { kind: "request" };

const LABELS = {
  es: { spend: "Gasto", ask: "Preguntar", stash: "Guardar", request: "Cobrar" },
  en: { spend: "Spend", ask: "Ask", stash: "Stash", request: "Request" },
} as const;

const VOICE_ICON = {
  connecting: "sync",
  listening: "hearing",
  thinking: "neurology",
  speaking: "graphic_eq",
} as const;

export default function ConsolePage() {
  const t = useI18n();
  const locale = useCurrentLocale() as "es" | "en";
  const router = useRouter();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ragChips, setRagChips] = useState<{ label: string; onClick: () => void }[]>([]);
  const [financePanel, setFinancePanel] = useState<FinancePanel | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [requestInvoice, setRequestInvoice] = useState("");
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
      const summary = summarize(txs);
      const line = sassySummary(summary, locale);
      setFinancePanel({ kind: "spend", summary, txs: txs.slice(0, 6) });
      setMessages((m) => [...m, { role: "assistant", content: line }]);
      chat([{ role: "user", content: t("finance.askSpend") }], {
        locale,
        financeContext: financeContext(txs),
      })
        .then(({ text }) => setMessages((m) => [...m, { role: "assistant", content: text }]))
        .catch(() => {});
      return;
    }
    if (a === "stash") {
      const goals = await listSavingsGoals().catch(() => []);
      setFinancePanel({ kind: "stash", goals });
      return;
    }
    if (a === "request") setFinancePanel({ kind: "request" });
  }

  async function createGoal() {
    const target = Number(goalTarget);
    if (!Number.isFinite(target) || target <= 0) return;
    const goal = await addSavingsGoal({
      title: goalName.trim() || t("finance.stashTitle"),
      target,
      currency: "USDT",
    });
    setGoalName("");
    setGoalTarget("");
    setFinancePanel((panel) =>
      panel?.kind === "stash" ? { kind: "stash", goals: [goal, ...panel.goals] } : panel,
    );
    setMessages((m) => [...m, { role: "assistant", content: t("finance.goalCreated") }]);
  }

  function openWalletRequest() {
    const invoice = requestInvoice.trim();
    const suffix = invoice ? `?invoice=${encodeURIComponent(invoice)}` : "";
    router.push(`/${locale}/billetera${suffix}`);
  }

  function onAsk() {
    if (voice.state === "idle") voice.start();
    else voice.stop();
  }

  const empty = messages.length === 0 && !voice.tokens;
  const chips = starterChips(locale).map((c) => ({ label: c.label, onClick: () => sendText(c.label) }));
  const voiceStatus =
    voice.error != null
      ? `${t("voice.error")}: ${voice.error}`
      : voice.state === "idle"
        ? null
        : t(`voice.${voice.state}`);
  const voiceIcon = voice.error != null ? "error" : voice.state === "idle" ? null : VOICE_ICON[voice.state];

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

      {financePanel && (
        <div className="mb-2 rounded-lg border border-outline-variant bg-surface-container-low/90 p-3 text-body-md">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-label-lg text-on-surface">
              {financePanel.kind === "spend"
                ? t("finance.spendTitle")
                : financePanel.kind === "stash"
                  ? t("finance.stashTitle")
                  : t("finance.requestTitle")}
            </h2>
            <button
              type="button"
              onClick={() => setFinancePanel(null)}
              aria-label={t("common.cancel")}
              className="material-symbols-outlined rounded-full p-1 text-[18px] text-on-surface-variant"
            >
              close
            </button>
          </div>

          {financePanel.kind === "spend" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">{t("finance.weekTotal")}</span>
                <span className="font-mono text-primary">
                  {formatAmount(financePanel.summary.weekSpend, financePanel.summary.currency)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-label-md text-on-surface-variant">{t("finance.topCategory")}</div>
                {financePanel.summary.weekByCategory.slice(0, 4).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{cat.category}</span>
                    <span className="font-mono text-secondary">
                      {formatAmount(cat.amount, financePanel.summary.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-outline-variant pt-2">
                <div className="text-label-md text-on-surface-variant">{t("finance.transactions")}</div>
                {financePanel.txs.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{tx.merchant}</span>
                    <span className="font-mono text-on-surface-variant">
                      {tx.kind === "income" ? "+" : tx.kind === "spend" ? "-" : ""}
                      {formatAmount(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {financePanel.kind === "stash" && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_7rem] gap-2">
                <input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder={t("finance.goalName")}
                  className="min-w-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md outline-none"
                />
                <input
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  inputMode="decimal"
                  placeholder={t("finance.goalTarget")}
                  className="min-w-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 font-mono text-body-md outline-none"
                />
              </div>
              <button
                type="button"
                onClick={createGoal}
                className="w-full rounded-lg bg-primary px-3 py-2 text-on-primary font-label-md"
              >
                {t("finance.createGoal")}
              </button>
              <div className="space-y-1 border-t border-outline-variant pt-2">
                <div className="text-label-md text-on-surface-variant">{t("finance.currentGoals")}</div>
                {financePanel.goals.length === 0 ? (
                  <div className="text-on-surface-variant">{t("finance.noGoals")}</div>
                ) : (
                  financePanel.goals.slice(0, 3).map((goal) => {
                    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                    return (
                      <div key={goal.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate">{goal.title}</span>
                          <span className="font-mono text-secondary">
                            {formatAmount(goal.current, goal.currency)} / {formatAmount(goal.target, goal.currency)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-container-high">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {financePanel.kind === "request" && (
            <div className="space-y-2">
              <p className="text-on-surface-variant">{t("finance.requestBody")}</p>
              <input
                value={requestInvoice}
                onChange={(e) => setRequestInvoice(e.target.value)}
                placeholder={t("wallet.invoice")}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-mono text-label-md outline-none"
              />
              <button
                type="button"
                onClick={openWalletRequest}
                className="w-full rounded-lg bg-primary px-3 py-2 text-on-primary font-label-md"
              >
                {t("finance.payInWallet")}
              </button>
            </div>
          )}
        </div>
      )}

      {voiceStatus && (
        <div
          role="status"
          aria-live="polite"
          className="mb-2 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high/90 px-3 py-1.5 text-label-md text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
            {voiceIcon}
          </span>
          <span className="truncate">{voiceStatus}</span>
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
