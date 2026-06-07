import type { LeclercAssetId, LeclercChainId } from "./asset-catalog";

export type WalletOnboardingStep = "create" | "handle" | "biometric" | "recovery" | "ready";

export interface WalletAssetBalance {
  assetId: LeclercAssetId;
  chainId?: LeclercChainId;
  value: string;
  status: "ok" | "unconfigured" | "unavailable" | "read-only";
}

export interface WalletBalances {
  address: string;
  handle?: string;
  usdt: string;
  sats: string;
  assets?: WalletAssetBalance[];
}

export type WalletRequest =
  | { action: "generate" }
  | { action: "claimHandle"; handle: string }
  | { action: "balances"; seed: string }
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
