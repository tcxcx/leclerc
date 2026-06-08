"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ARC_TESTNET_CHAIN_ID, getLeclercAsset, getLeclercChain } from "@leclerc/transfer-core";
import type { RainAgentCardConfig } from "@leclerc/cards";
import type { TransferProposal } from "@leclerc/transfers";
import { rainCards } from "@/lib/api-client";
import { useI18n } from "@/locales/client";
import { GlassIcon } from "./glass-icon";

type FundingState = {
  cardId: string;
  assetId: string;
  chainId: number;
  configured: boolean;
  env: string;
};

export function AgentCardsPanel() {
  const t = useI18n();
  const [cards, setCards] = useState<RainAgentCardConfig[]>([]);
  const [funding, setFunding] = useState<FundingState[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [seed, setSeed] = useState("");
  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState<TransferProposal | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    rainCards
      .list()
      .then((res) => {
        setCards(res.cards);
        setFunding(res.funding);
        setSelectedId((current) => current || res.cards[0]?.id || "");
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : t("cards.loadFailed")));
  }, [t]);

  const selected = useMemo(
    () => cards.find((card) => card.id === selectedId) ?? cards[0] ?? null,
    [cards, selectedId],
  );
  const target = selected ? funding.find((entry) => entry.cardId === selected.id) : null;

  async function submitFunding() {
    if (!selected || busy) return;
    setBusy(true);
    setStatus(t("cards.reviewing"));
    try {
      const res = await rainCards.fund(seed, selected.id, amount);
      setProposal(res.proposal);
      setStatus(t("cards.reviewReady"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("cards.fundFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmFunding() {
    if (!proposal || busy) return;
    setBusy(true);
    setStatus(t("cards.funding"));
    try {
      const res = await rainCards.confirm(proposal.confirmId);
      setStatus(`${t("cards.funded")} ${res.hash}`);
      setProposal(null);
      setAmount("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("cards.fundFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!selected) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface p-3 text-on-surface-variant">
        {t("common.loading")}
      </div>
    );
  }

  const asset = getLeclercAsset(selected.assetId);
  const chain = getLeclercChain(selected.chainId === ARC_TESTNET_CHAIN_ID ? "arc-testnet" : "arbitrum-one");
  const disabled = busy || !target?.configured || !seed.trim() || !amount.trim();

  return (
    <div className="space-y-3">
      <div
        className="relative min-h-48 overflow-hidden rounded-lg border border-outline-variant bg-surface p-4 text-white"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(0,0,0,.78), rgba(0,0,0,.18)), url(${selected.backgroundImagePath})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 flex h-full min-h-40 flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-caption text-white/70">{t("cards.agentCard")}</div>
              <div className="font-headline-sm text-white">{selected.codename}</div>
            </div>
            <Image src={selected.brandIconPath} alt="" width={38} height={24} className="h-6 w-auto" />
          </div>
          <div className="space-y-3">
            <div className="font-mono text-[22px] text-ignyte">
              {asset.displaySymbol} {selected.balance}
            </div>
            <div className="grid grid-cols-3 gap-2 text-caption text-white/75">
              <CardDatum label={t("cards.last4")} value={selected.last4} />
              <CardDatum label={t("cards.expiry")} value={selected.expiry} />
              <CardDatum label={t("cards.limit")} value={`${selected.limit.amount} ${asset.displaySymbol}`} />
            </div>
          </div>
        </div>
      </div>

      {cards.length > 1 && (
        <select
          value={selected.id}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md outline-none"
        >
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.codename}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-outline-variant bg-surface p-3">
          <div className="flex items-center gap-2 text-label-md">
            <GlassIcon icon="hub" size="sm" active />
            <span>{chain.shortName}</span>
          </div>
          <div className="mt-1 text-caption text-on-surface-variant">{t("wallet.testnetWrite")}</div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3">
          <div className="flex items-center gap-2 text-label-md">
            <GlassIcon icon="payments" size="sm" active />
            <span>{asset.displaySymbol}</span>
          </div>
          <div className="mt-1 text-caption text-on-surface-variant">{t("cards.fundedByWallet")}</div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-outline-variant bg-surface p-3">
        <div className="text-label-md text-on-surface">{t("cards.fund")}</div>
        <input
          value={seed}
          onChange={(event) => {
            setSeed(event.target.value);
            setProposal(null);
          }}
          type="password"
          autoComplete="off"
          placeholder={t("cards.seedPlaceholder")}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md outline-none"
        />
        <input
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setProposal(null);
          }}
          inputMode="decimal"
          placeholder={t("cards.amountPlaceholder")}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-mono text-body-md outline-none"
        />
        {!target?.configured && (
          <div className="rounded-lg bg-surface-container-high px-3 py-2 text-caption text-on-surface-variant">
            {t("cards.depositMissing")} <span className="font-mono">{target?.env ?? selected.fundingDepositEnv}</span>
          </div>
        )}
        <button
          type="button"
          onClick={submitFunding}
          disabled={disabled}
          className="w-full rounded-lg bg-ignyte px-3 py-2 text-on-ignyte font-label-md disabled:opacity-45"
        >
          {busy ? t("common.loading") : t("cards.submitFunding")}
        </button>
        {proposal && (
          <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <div className="font-mono text-caption text-on-surface-variant">{proposal.summary}</div>
            <button
              type="button"
              onClick={confirmFunding}
              disabled={busy}
              className="w-full rounded-lg bg-primary px-3 py-2 text-on-primary font-label-md disabled:opacity-50"
            >
              {busy ? t("common.loading") : t("cards.confirmFunding")}
            </button>
          </div>
        )}
      </div>

      {status && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 font-mono text-caption text-on-surface-variant">
          {status}
        </div>
      )}
    </div>
  );
}

function CardDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-white/55">{label}</div>
      <div className="truncate font-mono text-white">{value}</div>
    </div>
  );
}
