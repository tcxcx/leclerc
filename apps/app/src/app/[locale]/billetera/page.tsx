"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const [bal, setBal] = useState<{ address: string; usdt: string; sats: string } | null>(null);
  const [invoice, setInvoice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const nextInvoice = searchParams.get("invoice");
    if (nextInvoice) setInvoice(nextInvoice);
  }, [searchParams]);

  async function gen() {
    const { seed: s } = await wallet.generate();
    setSeed(s);
    setStatus("Semilla generada — guárdela de forma segura.");
  }
  async function refresh() {
    if (!seed) return;
    setBal(await wallet.balances(seed).catch(() => null));
  }
  async function pay() {
    if (!seed || !invoice.trim()) return;
    setStatus("…");
    try {
      await wallet.payLightning(seed, invoice.trim());
      setStatus("✓ Pago Lightning liquidado (fuera de cadena).");
      setInvoice("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "pago fallido");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="anim-enter space-y-4">
      <h1 className="font-headline-md">{t("wallet.title")}</h1>

      {!seed ? (
        <button onClick={gen} className="w-full rounded-xl bg-primary py-3 text-on-primary font-label-md">
          {t("settings.generateWallet")}
        </button>
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
              <Stat label={t("wallet.usdt")} value={bal?.usdt ?? "—"} />
              <Stat label={t("wallet.lightning")} value={bal?.sats ?? "—"} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container p-3">
      <div className="text-caption text-on-surface-variant">{label}</div>
      <div className="font-mono text-body-lg">{value}</div>
    </div>
  );
}
