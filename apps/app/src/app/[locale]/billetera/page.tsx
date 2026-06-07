"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getLeclercAsset,
  listLeclercAssets,
  listLeclercChains,
  type WalletAssetBalance,
} from "@leclerc/core";
import { useI18n } from "@/locales/client";
import { wallet } from "@/lib/api-client";

/**
 * Wallet UI. v1 keeps the seed in memory after generation for the demo; the
 * production path stores it encrypted (see lib/intel/crypto + Settings).
 * TODO(codex): wire seed to the unlocked vault instead of component state.
 */
export default function WalletPage() {
  const t = useI18n();
  const searchParams = useSearchParams();
  const [seed, setSeed] = useState<string | null>(null);
  const [bal, setBal] = useState<{
    address: string;
    usdt: string;
    sats: string;
    assets: WalletAssetBalance[];
  } | null>(null);
  const [invoice, setInvoice] = useState(() => searchParams.get("invoice") ?? "");
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");

  async function gen() {
    setStatus(t("common.loading"));
    try {
      const { seed: s } = await wallet.generate();
      setSeed(s);
      setStatus(t("wallet.seedGenerated"));
    } catch (e) {
      // The WDK wallet backend may be unavailable in dev (native deps). Surface
      // it instead of crashing; the full WDK onboarding is a midnight goal.
      setStatus(
        `${e instanceof Error ? e.message : t("wallet.unavailable")} ${t("wallet.stationHint")}`,
      );
    }
  }
  async function refresh() {
    if (!seed) return;
    setBal(await wallet.balances(seed).catch(() => null));
  }
  async function pay() {
    if (!seed || !invoice.trim()) return;
    setStatus(t("wallet.paying"));
    try {
      await wallet.payLightning(seed, invoice.trim());
      setStatus(t("wallet.paid"));
      setInvoice("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t("wallet.payFailed"));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="anim-enter space-y-4">
      <h1 className="font-headline-md">{t("wallet.title")}</h1>

      {!seed ? (
        <div className="space-y-3">
          <button onClick={gen} className="w-full rounded-xl bg-primary py-3 text-on-primary font-label-md">
            {t("settings.generateWallet")}
          </button>
          {invoice && (
            <div className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <div className="text-caption uppercase tracking-wide text-on-surface-variant">
                {t("wallet.pendingInvoice")}
              </div>
              <input
                value={invoice}
                readOnly
                aria-label={t("wallet.invoice")}
                className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-label-md"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-headline-sm">{t("wallet.balances")}</h2>
              <button onClick={refresh} className="text-label-md text-primary">
                ↻
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {listLeclercAssets().map((asset) => {
                const found = bal?.assets?.find((entry) => entry.assetId === asset.id);
                return (
                  <AssetStat
                    key={asset.id}
                    assetId={asset.id}
                    value={found?.value ?? t("common.noData")}
                    status={found?.status}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <h2 className="mb-2 font-headline-sm">{t("wallet.networks")}</h2>
            <div className="space-y-2">
              {listLeclercChains().map((chain) => (
                <div
                  key={chain.key}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={chain.iconPath} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                    <div className="min-w-0">
                      <div className="truncate text-label-md">{chain.name}</div>
                      <div className="truncate font-mono text-caption text-on-surface-variant">
                        {chain.chainId}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-outline-variant px-2 py-0.5 text-caption text-on-surface-variant">
                    {chain.writePolicy === "allowed-testnet" ? t("wallet.testnetWrite") : t("wallet.readOnly")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <h2 className="flex items-center gap-1 font-headline-sm">
              <span className="material-symbols-outlined text-[20px] text-secondary" aria-hidden>
                bolt
              </span>
              {t("wallet.payLightning")}
            </h2>
            <input
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder={t("wallet.invoice")}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-label-md"
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-caption text-on-secondary-container">
              <span className="material-symbols-outlined text-[14px]" aria-hidden>
                visibility_off
              </span>
              {t("wallet.private")}
            </span>
            <button
              onClick={() => setConfirming(true)}
              disabled={!invoice.trim()}
              className="w-full rounded-xl bg-primary py-3 text-on-primary font-label-md disabled:opacity-50"
            >
              {t("wallet.pay")}
            </button>
          </div>
        </>
      )}

      {status && <p className="text-label-md text-on-surface-variant">{status}</p>}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container p-5 anim-enter">
            <h3 className="font-headline-sm">{t("wallet.confirmTitle")}</h3>
            <p className="my-2 text-body-md text-on-surface-variant">{t("wallet.confirmBody")}</p>
            <p className="break-all rounded-lg bg-surface p-2 font-mono text-caption">{invoice}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md"
              >
                {t("common.cancel")}
              </button>
              <button onClick={pay} className="flex-1 rounded-xl bg-primary py-3 text-on-primary font-label-md">
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetStat({
  assetId,
  value,
  status,
}: {
  assetId: ReturnType<typeof listLeclercAssets>[number]["id"];
  value: string;
  status?: WalletAssetBalance["status"];
}) {
  const asset = getLeclercAsset(assetId);
  return (
    <div className="min-w-0 rounded-xl bg-surface-container p-3">
      <div className="mb-2 flex min-w-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.iconPath} alt="" className="h-7 w-7 shrink-0 rounded-full" />
        <div className="min-w-0">
          <div className="truncate text-caption text-on-surface-variant">{asset.displaySymbol}</div>
          <div className="truncate text-[11px] text-on-surface-variant">{asset.name}</div>
        </div>
      </div>
      <div className="truncate font-mono text-body-lg">{value}</div>
      {status && status !== "ok" && (
        <div className="mt-1 truncate text-[11px] text-on-surface-variant">{status}</div>
      )}
    </div>
  );
}
