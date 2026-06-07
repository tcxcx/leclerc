import type { LeclercAssetId, LeclercChainId } from "@leclerc/transfer-core";

export type WalletOnboardingStep = "create" | "handle" | "biometric" | "recovery" | "ready";

export interface WalletAssetBalance {
  assetId: LeclercAssetId;
  chainId?: LeclercChainId;
  value: string;
  status: "ok" | "unconfigured" | "unavailable" | "read-only";
}

export interface WalletReceiveDetails {
  address: string;
  sparkAddress?: string;
  depositAddress?: string;
}

export interface WalletTransaction {
  id: string;
  kind: "send" | "receive" | "transfer";
  assetId: LeclercAssetId;
  amount: string;
  counterparty?: string;
  status: "submitted" | "settled" | "pending" | "unavailable";
  createdAt: string;
  chainId?: LeclercChainId;
  hash?: string;
}

export interface WalletBalances {
  address: string;
  handle?: string;
  usdt: string;
  sats: string;
  assets?: WalletAssetBalance[];
}

export interface Balances {
  address: string;
  usdt: string;
  sats: string;
  assets: WalletAssetBalance[];
}

export type WalletRequest =
  | { action: "generate" }
  | { action: "claimHandle"; handle: string }
  | { action: "balances"; seed: string }
  | { action: "receive"; seed: string }
  | { action: "transactions"; seed: string }
  | { action: "payLightning"; seed: string; invoice: string }
  | {
      action: "payEvm";
      seed: string;
      to: string;
      amount: string;
      assetId?: LeclercAssetId;
      chainId?: LeclercChainId;
    };

export type WalletResponse =
  | { seed: string }
  | { handle: string; ok: true }
  | WalletBalances
  | WalletReceiveDetails
  | { transactions: WalletTransaction[] }
  | { ok: true }
  | { hash: string }
  | { error: string };

export interface WalletRuntimeConfig {
  evmRpcUrl?: string;
  evmChainId: number;
  usdtAddress?: string;
  sparkNetwork: "TESTNET";
  maxLightningFeeSats: number;
}
