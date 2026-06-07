import "server-only";

/**
 * Self-custodial wallet via Tether WDK (docs/leclerc/06). Lightning (Spark) is
 * the private/off-chain payment path; EVM USDT is the on-chain path. Keys stay
 * local — the seed is supplied per-call (decrypted on the client / from secure
 * storage), never persisted server-side here.
 *
 * Verified against the installed @tetherto/wdk-* .d.ts:
 * - EVM transfer uses { token, recipient, amount } in base units.
 * - Spark is locked to TESTNET by default and pays invoices through
 *   payLightningInvoice({ invoice, maxFeeSats }).
 */
import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import WalletManagerSpark from "@tetherto/wdk-wallet-spark";
import type { NetworkType } from "@tetherto/wdk-wallet-spark";
import {
  getLeclercAsset,
  getLeclercChain,
  isWritableChain,
  listLeclercAssets,
  rpcUrlForChain,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
  type WalletAssetBalance,
} from "@leclerc/core";

const DEFAULT_EVM_CHAIN_ID: LeclercChainId = 5042002;
const DEFAULT_SEND_ASSET: LeclercAssetId = "usdc";

function requiredTokenAddress(assetId: LeclercAssetId, chainId: LeclercChainId): string {
  const chain = getLeclercChain(chainId === 5042002 ? "arc-testnet" : "arbitrum-one");
  if (!isWritableChain(chain)) {
    throw new Error(`${chain.name} is read-only in LeClerc; writes are testnet-only`);
  }
  const token = tokenAddress(assetId, chainId);
  if (!token) throw new Error(`${getLeclercAsset(assetId).displaySymbol} is not configured on ${chain.name}`);
  return token;
}

function evmChainId(): LeclercChainId {
  const chainId = Number(process.env.EVM_CHAIN_ID ?? DEFAULT_EVM_CHAIN_ID);
  if (chainId !== 5042002) {
    throw new Error("EVM_CHAIN_ID must be Arc Testnet (5042002) for writable wallet flows");
  }
  return chainId;
}

/** Generate a fresh 24-word seed (caller must store it encrypted / secure). */
export function generateSeed(): string {
  return WDK.getRandomSeedPhrase(24);
}

async function evm(seed: string) {
  const chain = getLeclercChain("arc-testnet");
  return new WalletManagerEvm(seed, {
    provider: process.env.EVM_RPC_URL || rpcUrlForChain(chain, process.env),
    chainId: evmChainId(),
  }).getAccount();
}

type DemoSparkNetwork = Extract<NetworkType, "TESTNET">;

function sparkNetwork(): DemoSparkNetwork {
  const network = (process.env.SPARK_NETWORK ?? "TESTNET").trim().toUpperCase();
  if (network !== "TESTNET") {
    throw new Error("SPARK_NETWORK must be TESTNET for the LeClerc demo");
  }
  return network;
}

async function spark(seed: string) {
  return new WalletManagerSpark(seed, {
    network: sparkNetwork(),
    syncAndRetry: true,
  }).getAccount();
}

export interface Balances {
  address: string;
  usdt: string;
  sats: string;
  assets: WalletAssetBalance[];
}

export async function balances(seed: string): Promise<Balances> {
  const e = await evm(seed);
  const chainId = evmChainId();
  const assets = listLeclercAssets();
  const [address, sats] = await Promise.all([
    e.getAddress(),
    spark(seed)
      .then((s) => s.getBalance())
      .catch(() => "unavailable"),
  ]);
  const evmBalances = await Promise.all(
    assets.map(async (asset): Promise<WalletAssetBalance> => {
      if (asset.id === "btc") {
        return { assetId: asset.id, value: String(sats), status: sats === "unavailable" ? "unavailable" : "ok" };
      }
      const token = tokenAddress(asset.id, chainId);
      if (!token) {
        return {
          assetId: asset.id,
          value: "unconfigured",
          status: asset.kind === "spark-token" ? "unconfigured" : "unconfigured",
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
  const usdt = evmBalances.find((asset) => asset.assetId === "usdt")?.value ?? "unconfigured";
  return { address, usdt, sats: String(sats), assets: evmBalances };
}

const MAX_LN_FEE_SATS = Number(process.env.LN_MAX_FEE_SATS ?? 50);

/** Pay a Lightning (BOLT11) invoice — private, off-chain. */
export async function payLightning(seed: string, invoice: string): Promise<{ ok: true }> {
  const s = await spark(seed);
  await s.payLightningInvoice({ invoice, maxFeeSats: MAX_LN_FEE_SATS });
  return { ok: true };
}

/** On-chain USDT transfer (EVM). amount is the smallest unit (USDT = 6 decimals). */
export async function paySableEvm(
  seed: string,
  to: string,
  amount: string,
  assetId: LeclercAssetId = DEFAULT_SEND_ASSET,
  chainId: LeclercChainId = DEFAULT_EVM_CHAIN_ID,
): Promise<{ hash: string }> {
  const token = requiredTokenAddress(assetId, chainId);
  const e = await evm(seed);
  const res = await e.transfer({
    token,
    recipient: to,
    amount: BigInt(amount),
  });
  return { hash: res.hash };
}
