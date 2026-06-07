"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  explorerTxUrl,
  getLeclercAsset,
  getLeclercChain,
  listLeclercAssets,
  tokenAddress,
  type LeclercAssetId,
  type WalletAssetBalance,
  type WalletReceiveDetails,
  type WalletTransaction,
} from "@leclerc/core";
import { GlassIcon } from "@/components/glass-icon";
import { useI18n } from "@/locales/client";
import { wallet } from "@/lib/api-client";

type OnboardingStep = "create" | "handle" | "biometric" | "recovery" | "ready";
type WalletView = "balances" | "send" | "receive" | "transactions";
type SendStage = "form" | "review" | "submitted";

const TESTNET_CHAIN_ID = 5042002;

export default function WalletPage() {
  const t = useI18n();
  const searchParams = useSearchParams();
  const [seed, setSeed] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStep>("create");
  const [handle, setHandle] = useState("");
  const [view, setView] = useState<WalletView>(searchParams.get("invoice") ? "send" : "balances");
  const [bal, setBal] = useState<{
    address: string;
    usdt: string;
    sats: string;
    assets: WalletAssetBalance[];
  } | null>(null);
  const [receive, setReceive] = useState<WalletReceiveDetails | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [submitted, setSubmitted] = useState<WalletTransaction[]>([]);
  const [sendStage, setSendStage] = useState<SendStage>("form");
  const [assetId, setAssetId] = useState<LeclercAssetId>("usdc");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const sendableAssets = useMemo(
    () =>
      listLeclercAssets().filter(
        (asset) => asset.transferPolicy === "testnet-only" && tokenAddress(asset.id, TESTNET_CHAIN_ID),
      ),
    [],
  );

  async function createWallet() {
    setStatus(t("common.loading"));
    try {
      const { seed: nextSeed } = await wallet.generate();
      setSeed(nextSeed);
      setStep("handle");
      setStatus(t("wallet.seedGenerated"));
    } catch (e) {
      setStatus(`${e instanceof Error ? e.message : t("wallet.unavailable")} ${t("wallet.stationHint")}`);
    }
  }

  function claimHandle() {
    if (!handle.trim()) return;
    setStep("biometric");
    setStatus(t("wallet.handleClaimed"));
  }

  function approveBiometric() {
    setStep("recovery");
    setStatus(t("wallet.faceIdReady"));
  }

  async function finishOnboarding() {
    setStep("ready");
    await refresh();
    await loadReceive();
    await loadTransactions();
  }

  async function refresh() {
    if (!seed) return;
    setStatus(t("common.loading"));
    try {
      setBal(await wallet.balances(seed));
      setStatus(t("wallet.balancesReady"));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t("wallet.unavailable"));
    }
  }

  async function loadReceive() {
    if (!seed) return;
    setReceive(await wallet.receive(seed).catch(() => null));
  }

  async function loadTransactions() {
    if (!seed) return;
    const res = await wallet.transactions(seed).catch(() => ({ transactions: [] }));
    setTransactions(res.transactions);
  }

  function reviewSend() {
    if (!recipient.trim() || !amount.trim()) return;
    setSendStage("review");
  }

  async function submitSend() {
    if (!seed) return;
    setStatus(t("wallet.submitting"));
    try {
      const proposal = await wallet.payEvm(seed, recipient.trim(), amount.trim(), assetId, TESTNET_CHAIN_ID);
      const res = await wallet.confirmTransfer(proposal.confirmId);
      const tx: WalletTransaction = {
        id: res.hash,
        kind: "send",
        assetId,
        amount: res.proposal.amountAtomic,
        counterparty: recipient.trim(),
        status: "submitted",
        createdAt: new Date().toISOString(),
        chainId: TESTNET_CHAIN_ID,
        hash: res.hash,
      };
      setSubmitted((rows) => [tx, ...rows]);
      setSendStage("submitted");
      setStatus(t("wallet.submitted"));
      await refresh();
      await loadTransactions();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t("wallet.payFailed"));
      setSendStage("form");
    }
  }

  const allTransactions = [...submitted, ...transactions];

  return (
    <div className="anim-enter space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-headline-md">{t("wallet.title")}</h1>
          <p className="text-body-md text-on-surface-variant">{t("wallet.testnetOnly")}</p>
        </div>
        <GlassIcon icon="account_balance_wallet" active size="lg" />
      </div>

      {step !== "ready" || !seed ? (
        <Onboarding
          step={step}
          seed={seed}
          handle={handle}
          setHandle={setHandle}
          onCreate={createWallet}
          onClaim={claimHandle}
          onBiometric={approveBiometric}
          onFinish={finishOnboarding}
        />
      ) : (
        <>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-caption text-on-surface-variant">{t("wallet.handle")}</div>
                <div className="truncate font-mono text-label-md">{handle.trim()}</div>
              </div>
              <button onClick={refresh} className="rounded-full border border-outline-variant px-3 py-1 text-label-md">
                {t("wallet.refresh")}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface p-1">
              {(["balances", "send", "receive", "transactions"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setView(item);
                    if (item === "receive") void loadReceive();
                    if (item === "transactions") void loadTransactions();
                  }}
                  className={`min-h-10 rounded-lg px-1 text-[11px] font-medium ${
                    view === item ? "bg-ignyte text-on-ignyte" : "text-on-surface-variant"
                  }`}
                >
                  {t(`wallet.views.${item}`)}
                </button>
              ))}
            </div>
          </div>

          {view === "balances" && <BalancesPanel balances={bal?.assets ?? []} />}

          {view === "send" && (
            <SendPanel
              stage={sendStage}
              assetId={assetId}
              amount={amount}
              recipient={recipient}
              sendableAssets={sendableAssets}
              setAssetId={setAssetId}
              setAmount={setAmount}
              setRecipient={setRecipient}
              onReview={reviewSend}
              onBack={() => setSendStage("form")}
              onSubmit={submitSend}
            />
          )}

          {view === "receive" && (
            <ReceivePanel handle={handle.trim()} receive={receive} onRefresh={loadReceive} />
          )}

          {view === "transactions" && (
            <TransactionsPanel transactions={allTransactions} />
          )}
        </>
      )}

      {status && <p className="text-label-md text-on-surface-variant">{status}</p>}
    </div>
  );
}

function Onboarding({
  step,
  seed,
  handle,
  setHandle,
  onCreate,
  onClaim,
  onBiometric,
  onFinish,
}: {
  step: OnboardingStep;
  seed: string | null;
  handle: string;
  setHandle: (value: string) => void;
  onCreate: () => void;
  onClaim: () => void;
  onBiometric: () => void;
  onFinish: () => void;
}) {
  const t = useI18n();
  const steps = ["create", "handle", "biometric", "recovery"] as const;
  const renderedStep = step === "ready" ? "recovery" : step;
  const stepIndex = Math.max(0, steps.indexOf(renderedStep));
  return (
    <div className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((item, index) => (
          <div key={item} className="space-y-1">
            <div className={`h-1.5 rounded-full ${stepIndex >= index ? "bg-ignyte" : "bg-surface-container-high"}`} />
            <div className="truncate text-[10px] text-on-surface-variant">{onboardingLabel(t, item)}</div>
          </div>
        ))}
      </div>

      {step === "create" && (
        <div className="space-y-3">
          <GlassIcon icon="add_circle" active size="xl" />
          <h2 className="font-headline-sm">{t("wallet.createTitle")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("wallet.createBody")}</p>
          <button onClick={onCreate} className="w-full rounded-xl bg-ignyte py-3 text-on-ignyte font-label-md">
            {t("wallet.createWallet")}
          </button>
        </div>
      )}

      {step === "handle" && (
        <div className="space-y-3">
          <GlassIcon icon="alternate_email" active size="xl" />
          <h2 className="font-headline-sm">{t("wallet.handleTitle")}</h2>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t("wallet.handlePlaceholder")}
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-label-md outline-none"
          />
          <button
            onClick={onClaim}
            disabled={!handle.trim()}
            className="w-full rounded-xl bg-ignyte py-3 text-on-ignyte font-label-md disabled:opacity-50"
          >
            {t("wallet.claimHandle")}
          </button>
        </div>
      )}

      {step === "biometric" && (
        <div className="space-y-3">
          <GlassIcon icon="fingerprint" active size="xl" />
          <h2 className="font-headline-sm">{t("wallet.faceIdTitle")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("wallet.faceIdBody")}</p>
          <button onClick={onBiometric} className="w-full rounded-xl bg-ignyte py-3 text-on-ignyte font-label-md">
            {t("wallet.faceIdConfirm")}
          </button>
        </div>
      )}

      {step === "recovery" && seed && (
        <div className="space-y-3">
          <GlassIcon icon="key" active size="xl" />
          <h2 className="font-headline-sm">{t("wallet.recoveryTitle")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("wallet.recoveryBody")}</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-3">
            {seed.split(/\s+/).map((word, index) => (
              <div key={`${word}-${index}`} className="flex gap-2 rounded-lg bg-surface-container px-2 py-1.5">
                <span className="font-mono text-caption text-on-surface-variant">{index + 1}</span>
                <span className="font-mono text-caption">{word}</span>
              </div>
            ))}
          </div>
          <button onClick={onFinish} className="w-full rounded-xl bg-ignyte py-3 text-on-ignyte font-label-md">
            {t("wallet.recoverySaved")}
          </button>
        </div>
      )}
    </div>
  );
}

function BalancesPanel({ balances }: { balances: WalletAssetBalance[] }) {
  const t = useI18n();
  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <h2 className="font-headline-sm">{t("wallet.balances")}</h2>
      <div className="grid grid-cols-2 gap-2">
        {listLeclercAssets().map((asset) => {
          const found = balances.find((entry) => entry.assetId === asset.id);
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
      <div className="rounded-xl bg-surface p-3">
        <h3 className="mb-2 text-label-md">{t("wallet.networks")}</h3>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-label-md">{getLeclercChain("arc-testnet").name}</div>
            <div className="font-mono text-caption text-on-surface-variant">{TESTNET_CHAIN_ID}</div>
          </div>
          <span className="rounded-full border border-outline-variant px-2 py-0.5 text-caption text-on-surface-variant">
            {t("wallet.testnetWrite")}
          </span>
        </div>
      </div>
    </div>
  );
}

function SendPanel({
  stage,
  assetId,
  amount,
  recipient,
  sendableAssets,
  setAssetId,
  setAmount,
  setRecipient,
  onReview,
  onBack,
  onSubmit,
}: {
  stage: SendStage;
  assetId: LeclercAssetId;
  amount: string;
  recipient: string;
  sendableAssets: ReturnType<typeof listLeclercAssets>;
  setAssetId: (value: LeclercAssetId) => void;
  setAmount: (value: string) => void;
  setRecipient: (value: string) => void;
  onReview: () => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const t = useI18n();
  const asset = getLeclercAsset(assetId);
  const atomic = amount.trim() ? decimalToAtomic(amount, asset.decimals) : "";
  if (stage === "submitted") {
    return (
      <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <GlassIcon icon="check_circle" active size="xl" />
        <h2 className="font-headline-sm">{t("wallet.submittedTitle")}</h2>
        <p className="text-body-md text-on-surface-variant">{t("wallet.submittedBody")}</p>
        <button onClick={onBack} className="w-full rounded-xl bg-surface-container-high py-3 font-label-md">
          {t("wallet.newSend")}
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <h2 className="font-headline-sm">{stage === "review" ? t("wallet.reviewTitle") : t("wallet.sendTitle")}</h2>
      {stage === "form" ? (
        <>
          <label className="space-y-1">
            <span className="text-caption text-on-surface-variant">{t("wallet.asset")}</span>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value as LeclercAssetId)}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-label-md outline-none"
            >
              {sendableAssets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displaySymbol}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-caption text-on-surface-variant">{t("wallet.recipient")}</span>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t("wallet.recipientPlaceholder")}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-label-md outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-caption text-on-surface-variant">{t("wallet.amount")}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={t("wallet.amountPlaceholder")}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-label-md outline-none"
            />
          </label>
          <button
            onClick={onReview}
            disabled={!recipient.trim() || !amount.trim()}
            className="w-full rounded-xl bg-ignyte py-3 text-on-ignyte font-label-md disabled:opacity-50"
          >
            {t("wallet.review")}
          </button>
        </>
      ) : (
        <>
          <ReviewRow label={t("wallet.asset")} value={asset.displaySymbol} />
          <ReviewRow label={t("wallet.recipient")} value={recipient} />
          <ReviewRow label={t("wallet.amount")} value={`${amount} ${asset.displaySymbol}`} />
          <ReviewRow label={t("wallet.atomicAmount")} value={atomic} />
          <ReviewRow label={t("wallet.network")} value={getLeclercChain("arc-testnet").name} />
          <div className="flex gap-2">
            <button onClick={onBack} className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md">
              {t("common.back")}
            </button>
            <button onClick={onSubmit} className="flex-1 rounded-xl bg-ignyte py-3 text-on-ignyte font-label-md">
              {t("common.confirm")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ReceivePanel({
  handle,
  receive,
  onRefresh,
}: {
  handle: string;
  receive: WalletReceiveDetails | null;
  onRefresh: () => void;
}) {
  const t = useI18n();
  const payload = JSON.stringify({ handle, address: receive?.address ?? "", spark: receive?.sparkAddress ?? "" });
  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-headline-sm">{t("wallet.receive")}</h2>
        <button onClick={onRefresh} className="rounded-full border border-outline-variant px-3 py-1 text-label-md">
          {t("wallet.refresh")}
        </button>
      </div>
      <PseudoQr value={payload} />
      <ReviewRow label={t("wallet.handle")} value={handle} />
      <ReviewRow label={t("wallet.evmAddress")} value={receive?.address ?? t("common.noData")} />
      <ReviewRow label={t("wallet.sparkAddress")} value={receive?.sparkAddress ?? t("common.noData")} />
    </div>
  );
}

function TransactionsPanel({ transactions }: { transactions: WalletTransaction[] }) {
  const t = useI18n();
  const chain = getLeclercChain("arc-testnet");
  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <h2 className="font-headline-sm">{t("wallet.transactions")}</h2>
      {transactions.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t("wallet.noTransactions")}</p>
      ) : (
        transactions.map((tx) => {
          const asset = getLeclercAsset(tx.assetId);
          return (
            <div key={tx.id} className="rounded-xl bg-surface p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-label-md">{t(`wallet.txKind.${tx.kind}`)}</span>
                <span className="font-mono text-caption text-ignyte">{tx.status}</span>
              </div>
              <div className="font-mono text-body-md">
                {formatAtomic(tx.amount, asset.decimals)} {asset.displaySymbol}
              </div>
              {tx.hash && tx.chainId === TESTNET_CHAIN_ID && (
                <a
                  href={explorerTxUrl(chain, tx.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-caption text-primary"
                >
                  {tx.hash}
                </a>
              )}
            </div>
          );
        })
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
    <div className="min-w-0 rounded-xl bg-surface p-3">
      <div className="mb-2 flex min-w-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.iconPath} alt="" className="h-7 w-7 shrink-0 rounded-full" />
        <div className="min-w-0">
          <div className="truncate text-caption text-on-surface-variant">{asset.displaySymbol}</div>
          <div className="truncate text-[11px] text-on-surface-variant">{asset.name}</div>
        </div>
      </div>
      <div className="truncate font-mono text-body-lg">
        {status === "ok" ? formatAtomic(value, asset.decimals) : value}
      </div>
      {status && status !== "ok" && (
        <div className="mt-1 truncate text-[11px] text-on-surface-variant">{status}</div>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-caption text-on-surface-variant">{label}</div>
      <div className="break-all font-mono text-label-md">{value}</div>
    </div>
  );
}

function PseudoQr({ value }: { value: string }) {
  const cells = makeQrCells(value, 17);
  return (
    <div className="mx-auto grid aspect-square w-56 grid-cols-[repeat(17,minmax(0,1fr))] gap-0.5 rounded-xl bg-white p-3">
      {cells.map((on, index) => (
        <span key={index} className={on ? "rounded-[1px] bg-black" : "rounded-[1px] bg-white"} />
      ))}
    </div>
  );
}

function makeQrCells(value: string, size: number): boolean[] {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Array.from({ length: size * size }, (_, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    const finder =
      (x < 5 && y < 5) ||
      (x >= size - 5 && y < 5) ||
      (x < 5 && y >= size - 5);
    if (finder) return x === 0 || y === 0 || x === 4 || y === 4 || (x === 2 && y === 2);
    return ((hash >>> ((x + y) % 24)) + x * 17 + y * 31 + index) % 5 < 2;
  });
}

function decimalToAtomic(value: string, decimals: number): string {
  const clean = value.trim().replace(",", ".");
  const [wholeRaw = "0", fractionRaw = ""] = clean.split(".");
  const whole = stripLeadingZeroes(wholeRaw.replace(/\D/g, "") || "0");
  const fraction = fractionRaw.replace(/\D/g, "").slice(0, decimals).padEnd(decimals, "0");
  return stripLeadingZeroes(`${whole}${fraction}`);
}

function formatAtomic(value: string, decimals: number): string {
  if (!/^\d+$/.test(value)) return value;
  const padded = value.padStart(decimals + 1, "0");
  const whole = stripLeadingZeroes(padded.slice(0, -decimals) || "0");
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function stripLeadingZeroes(value: string): string {
  return value.replace(/^0+(?=\d)/, "") || "0";
}

function onboardingLabel(t: ReturnType<typeof useI18n>, step: Exclude<OnboardingStep, "ready">): string {
  switch (step) {
    case "create":
      return t("wallet.onboarding.create");
    case "handle":
      return t("wallet.onboarding.handle");
    case "biometric":
      return t("wallet.onboarding.biometric");
    case "recovery":
      return t("wallet.onboarding.recovery");
  }
}
