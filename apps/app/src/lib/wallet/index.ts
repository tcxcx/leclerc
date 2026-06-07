import "server-only";

/**
 * Self-custodial wallet via Tether WDK (docs/leclerc/06). Lightning (Spark) is
 * the private/off-chain payment path; EVM USDT is the on-chain path. Keys stay
 * local — the seed is supplied per-call (decrypted on the client / from secure
 * storage), never persisted server-side here.
 *
 * TODO(codex): verify exact WDK method names/return shapes against the installed
 * @tetherto/wdk-* .d.ts (transfer args, Spark invoice/pay, balance units).
 */
import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import WalletManagerSpark from "@tetherto/wdk-wallet-spark";

const USDT_ADDRESS =
  process.env.USDT_ADDRESS ?? "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // ETH mainnet USDT

/** Generate a fresh 24-word seed (caller must store it encrypted / secure). */
export function generateSeed(): string {
  return WDK.getRandomSeedPhrase(24);
}

async function evm(seed: string) {
  return new WalletManagerEvm(seed, { provider: process.env.EVM_RPC_URL }).getAccount();
}

type SparkNetwork = "MAINNET" | "TESTNET" | "SIGNET" | "REGTEST" | "LOCAL";

async function spark(seed: string) {
  return new WalletManagerSpark(seed, {
    network: ((process.env.SPARK_NETWORK as SparkNetwork) ?? "TESTNET"),
  }).getAccount();
}

export interface Balances {
  address: string;
  usdt: string;
  sats: string;
}

export async function balances(seed: string): Promise<Balances> {
  const e = await evm(seed);
  const s = await spark(seed);
  const [address, usdt, sats] = await Promise.all([
    e.getAddress(),
    e.getTokenBalance(USDT_ADDRESS).catch(() => "0"),
    s.getBalance().catch(() => 0),
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
  const e = await evm(seed);
  // TODO(codex): confirm EvmTransferOptions field names (recipient vs to) + amount
  // units against the installed @tetherto/wdk-wallet-evm .d.ts.
  const res = await e.transfer({
    token: USDT_ADDRESS,
    to,
    amount: BigInt(amount),
  } as unknown as Parameters<typeof e.transfer>[0]);
  return { hash: (res as { hash: string }).hash };
}
