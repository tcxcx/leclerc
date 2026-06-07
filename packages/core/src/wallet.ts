export interface WalletBalances {
  address: string;
  usdt: string;
  sats: string;
}

export type WalletRequest =
  | { action: "generate" }
  | { action: "balances"; seed: string }
  | { action: "payLightning"; seed: string; invoice: string }
  | { action: "payEvm"; seed: string; to: string; amount: string };

export type WalletResponse =
  | { seed: string }
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
