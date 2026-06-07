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

const MAINNET_USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const DEFAULT_EVM_CHAIN_ID = 11155111; // Sepolia

function requiredTestnetTokenAddress(): string {
  const token = process.env.USDT_ADDRESS?.trim();
  if (!token) throw new Error("USDT_ADDRESS not set; configure a testnet USDT token address");
  if (token.toLowerCase() === MAINNET_USDT_ADDRESS.toLowerCase()) {
    throw new Error("USDT_ADDRESS points at Ethereum mainnet USDT; use a testnet token address");
  }
  return token;
}

function configuredTestnetTokenAddress(): string | null {
  const token = process.env.USDT_ADDRESS?.trim();
  if (!token) return null;
  return requiredTestnetTokenAddress();
}

function evmChainId(): number {
  const chainId = Number(process.env.EVM_CHAIN_ID ?? DEFAULT_EVM_CHAIN_ID);
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error("EVM_CHAIN_ID must be a positive integer testnet chain id");
  }
  if (chainId === 1) throw new Error("EVM_CHAIN_ID=1 is mainnet; use a testnet chain id");
  return chainId;
}

/** Generate a fresh 24-word seed (caller must store it encrypted / secure). */
export function generateSeed(): string {
  return WDK.getRandomSeedPhrase(24);
}

async function evm(seed: string) {
  return new WalletManagerEvm(seed, {
    provider: process.env.EVM_RPC_URL || undefined,
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
}

export async function balances(seed: string): Promise<Balances> {
  const e = await evm(seed);
  const token = configuredTestnetTokenAddress();
  const [address, usdt, sats] = await Promise.all([
    e.getAddress(),
    token ? e.getTokenBalance(token).catch(() => "unavailable") : Promise.resolve("unconfigured"),
    spark(seed)
      .then((s) => s.getBalance())
      .catch(() => "unavailable"),
  ]);
  return { address, usdt: String(usdt), sats: String(sats) };
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
): Promise<{ hash: string }> {
  const token = requiredTestnetTokenAddress();
  const e = await evm(seed);
  const res = await e.transfer({
    token,
    recipient: to,
    amount: BigInt(amount),
  });
  return { hash: res.hash };
}
