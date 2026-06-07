import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import {
  ARC_TESTNET_CHAIN_ID,
  assertWritableTestnetChain,
  chainById,
  getLeclercAsset,
  isWritableChain,
  rpcUrlForChain,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
} from "@leclerc/transfer-core";

const DEFAULT_EVM_CHAIN_ID: LeclercChainId = ARC_TESTNET_CHAIN_ID;

export function requiredTokenAddress(assetId: LeclercAssetId, chainId: LeclercChainId): string {
  const chain = chainById(chainId);
  if (!chain) throw new Error(`unsupported chainId ${chainId}`);
  if (!isWritableChain(chain)) {
    throw new Error(`${chain.name} is read-only in LeClerc; writes are testnet-only`);
  }
  const token = tokenAddress(assetId, chainId);
  if (!token) throw new Error(`${getLeclercAsset(assetId).displaySymbol} is not configured on ${chain.name}`);
  return token;
}

export function evmChainId(env: Partial<Record<string, string | undefined>> = process.env): LeclercChainId {
  const chainId = Number(env.EVM_CHAIN_ID ?? DEFAULT_EVM_CHAIN_ID);
  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    throw new Error("EVM_CHAIN_ID must be Arc Testnet (5042002) for writable wallet flows");
  }
  return chainId;
}

export async function evmAccount(
  seed: string,
  chainId: LeclercChainId = evmChainId(),
  env: Partial<Record<string, string | undefined>> = process.env,
) {
  const chain = assertWritableTestnetChain(chainId);
  return new WalletManagerEvm(seed, {
    provider: chain.chainId === DEFAULT_EVM_CHAIN_ID
      ? env.EVM_RPC_URL || rpcUrlForChain(chain, env)
      : rpcUrlForChain(chain, env),
    chainId: chain.chainId,
  }).getAccount();
}

/** On-chain catalog-token transfer. amount is the smallest unit for the selected asset. */
export async function payCatalogTokenEvm(
  seed: string,
  to: string,
  amount: string,
  assetId: LeclercAssetId,
  chainId: LeclercChainId,
): Promise<{ hash: string }> {
  const token = requiredTokenAddress(assetId, chainId);
  const e = await evmAccount(seed, chainId);
  try {
    const res = await e.transfer({
      token,
      recipient: to,
      amount: BigInt(amount),
    });
    return { hash: res.hash };
  } finally {
    e.dispose?.();
  }
}

export async function catalogTokenBalanceEvm(
  seed: string,
  assetId: LeclercAssetId,
  chainId: LeclercChainId,
): Promise<{ address: string; token: string; balance: bigint }> {
  const token = requiredTokenAddress(assetId, chainId);
  const e = await evmAccount(seed, chainId);
  try {
    const [address, balance] = await Promise.all([e.getAddress(), e.getTokenBalance(token)]);
    return { address, token, balance };
  } finally {
    e.dispose?.();
  }
}
