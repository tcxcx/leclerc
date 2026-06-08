import WDK from "@tetherto/wdk";
import WalletManagerSpark from "@tetherto/wdk-wallet-spark";
import type { NetworkType } from "@tetherto/wdk-wallet-spark";
import {
  ARC_TESTNET_CHAIN_ID,
  listLeclercAssets,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
} from "@leclerc/transfer-core";
import { evmAccount, evmChainId, payCatalogTokenEvm } from "./evm";
import type { Balances, WalletAssetBalance, WalletReceiveDetails, WalletTransaction } from "./types";

const DEFAULT_EVM_CHAIN_ID: LeclercChainId = ARC_TESTNET_CHAIN_ID;
const DEFAULT_SEND_ASSET: LeclercAssetId = "usdc";

/** Generate a fresh 24-word seed. Callers must store it encrypted or in secure storage. */
export function generateSeed(): string {
  return WDK.getRandomSeedPhrase(24);
}

async function evm(seed: string) {
  return evmAccount(seed);
}

type DemoSparkNetwork = Extract<NetworkType, "TESTNET">;

export function sparkNetwork(env: Partial<Record<string, string | undefined>> = process.env): DemoSparkNetwork {
  const network = (env.SPARK_NETWORK ?? "TESTNET").trim().toUpperCase();
  if (network !== "TESTNET") {
    throw new Error("SPARK_NETWORK must be TESTNET for the LeClerc demo");
  }
  return network;
}

async function spark(seed: string) {
  return new WalletManagerSpark(seed, {
    network: sparkNetwork(),
    sparkscan: {
      baseUrl: process.env.SPARKSCAN_BASE_URL,
      apiKey: process.env.SPARKSCAN_API_KEY,
    },
    syncAndRetry: true,
  }).getAccount();
}

export function liveSparkReadsEnabled(env: Partial<Record<string, string | undefined>> = process.env): boolean {
  return env.LECLERC_ENABLE_LIVE_SPARK_READS === "1" || env.LECLERC_ENABLE_LIVE_SPARK_SMOKE === "1";
}

async function passiveSpark(seed: string) {
  if (!liveSparkReadsEnabled()) return null;
  return spark(seed).catch(() => null);
}

export async function balances(seed: string): Promise<Balances> {
  const e = await evm(seed);
  const chainId = evmChainId();
  const assets = listLeclercAssets();
  const sparkAccountPromise = passiveSpark(seed);
  const [address, sparkAccount] = await Promise.all([
    e.getAddress(),
    sparkAccountPromise,
  ]);
  try {
    const sats = sparkAccount ? await sparkAccount.getBalance().catch(() => "unavailable") : "unavailable";
    const sparkUsdt = sparkAccount ? await sparkTokenBalance(sparkAccount, "usdt") : "unavailable";
    const evmBalances = await Promise.all(
      assets.map(async (asset): Promise<WalletAssetBalance> => {
        if (asset.id === "btc") {
          return { assetId: asset.id, value: String(sats), status: sats === "unavailable" ? "unavailable" : "ok" };
        }
        if (asset.id === "usdt") {
          return {
            assetId: asset.id,
            value: sparkUsdt,
            status: sparkUsdt === "unavailable" ? "unavailable" : "ok",
          };
        }
        const token = tokenAddress(asset.id, chainId);
        if (!token) {
          return {
            assetId: asset.id,
            value: "unconfigured",
            status: "unconfigured",
          };
        }
        const value = await e.getTokenBalance(token).catch(() => "unavailable");
        return {
          assetId: asset.id,
          chainId,
          value: String(value),
          status: value === "unavailable" ? "unavailable" : "ok",
        };
      }),
    );
    const usdt = evmBalances.find((asset) => asset.assetId === "usdt")?.value ?? "unavailable";
    return { address, usdt, sats: String(sats), assets: evmBalances };
  } finally {
    e.dispose?.();
    sparkAccount?.dispose?.();
    sparkAccount?.cleanupConnections?.();
  }
}

export function maxLightningFeeSats(env: Partial<Record<string, string | undefined>> = process.env): number {
  const parsed = Number(env.LN_MAX_FEE_SATS ?? 50);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}

/** Pay a Lightning (BOLT11) invoice on Spark TESTNET. */
export async function payLightning(seed: string, invoice: string): Promise<{ ok: true }> {
  const s = await spark(seed);
  try {
    await s.payLightningInvoice({ invoice, maxFeeSats: maxLightningFeeSats() });
    return { ok: true };
  } finally {
    s.dispose?.();
    s.cleanupConnections?.();
  }
}

async function sparkTokenBalance(account: unknown, assetId: LeclercAssetId): Promise<string> {
  const sparkTokenAddress = process.env[`LECLERC_SPARK_${assetId.toUpperCase()}_TOKEN_ADDRESS`]?.trim();
  if (!sparkTokenAddress) return "unavailable";
  const maybe = account as { getTokenBalance?: (tokenAddress: string) => Promise<bigint | number | string> };
  if (!maybe.getTokenBalance) return "unavailable";
  return String(await maybe.getTokenBalance(sparkTokenAddress).catch(() => "unavailable"));
}

export async function receiveDetails(seed: string): Promise<WalletReceiveDetails> {
  const [e, s] = await Promise.all([evm(seed), passiveSpark(seed)]);
  try {
    const [address, sparkAddress, depositAddress] = await Promise.all([
      e.getAddress(),
      s?.getAddress().then(String).catch(() => undefined) ?? Promise.resolve(undefined),
      s?.getStaticDepositAddress().catch(() => undefined) ?? Promise.resolve(undefined),
    ]);
    return { address, sparkAddress, depositAddress };
  } finally {
    e.dispose?.();
    s?.dispose?.();
    s?.cleanupConnections?.();
  }
}

export async function walletTransactions(seed: string): Promise<{ transactions: WalletTransaction[] }> {
  const s = await passiveSpark(seed);
  if (!s) return { transactions: [] };
  try {
    const transfers = await s.getTransfers({ limit: 20, direction: "all" }).catch(() => []);
    return {
      transactions: transfers.map((transfer: unknown, index): WalletTransaction => {
        const row = transfer as Record<string, unknown>;
        const id = String(row.id ?? row.transferId ?? row.hash ?? `spark-${index}`);
        const direction = String(row.direction ?? row.type ?? "").toLowerCase();
        const amount = String(row.totalValue ?? row.amountSats ?? row.value ?? row.amount ?? "0");
        const createdAt = String(row.createdTime ?? row.createdAt ?? row.updatedTime ?? new Date().toISOString());
        return {
          id,
          kind: direction.includes("out") || direction.includes("send") ? "send" : "receive",
          assetId: "btc",
          amount,
          counterparty: String(row.counterparty ?? row.receiverIdentityPublicKey ?? row.senderIdentityPublicKey ?? ""),
          status: "settled",
          createdAt,
          hash: id,
        };
      }),
    };
  } finally {
    s.dispose?.();
    s.cleanupConnections?.();
  }
}

/** On-chain catalog-token transfer. amount is the smallest unit for the selected asset. */
export async function paySableEvm(
  seed: string,
  to: string,
  amount: string,
  assetId: LeclercAssetId = DEFAULT_SEND_ASSET,
  chainId: LeclercChainId = DEFAULT_EVM_CHAIN_ID,
): Promise<{ hash: string }> {
  return payCatalogTokenEvm(seed, to, amount, assetId, chainId);
}

export * from "./evm";
export type * from "./types";
