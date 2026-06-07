import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import {
  chainById,
  getLeclercAsset,
  isWritableChain,
  rpcUrlForChain,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
} from "@leclerc/core";

const DEFAULT_EVM_CHAIN_ID: LeclercChainId = 5042002;

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

export function evmChainId(): LeclercChainId {
  const chainId = Number(process.env.EVM_CHAIN_ID ?? DEFAULT_EVM_CHAIN_ID);
  if (chainId !== 5042002) {
    throw new Error("EVM_CHAIN_ID must be Arc Testnet (5042002) for writable wallet flows");
  }
  return chainId;
}

export async function evmAccount(seed: string, chainId: LeclercChainId = evmChainId()) {
  const chain = chainById(chainId);
  if (!chain) throw new Error(`unsupported chainId ${chainId}`);
  if (!isWritableChain(chain)) {
    throw new Error(`${chain.name} is read-only in LeClerc; writes are testnet-only`);
  }
  return new WalletManagerEvm(seed, {
    provider: chain.chainId === DEFAULT_EVM_CHAIN_ID
      ? process.env.EVM_RPC_URL || rpcUrlForChain(chain, process.env)
      : rpcUrlForChain(chain, process.env),
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
  const res = await e.transfer({
    token,
    recipient: to,
    amount: BigInt(amount),
  });
  e.dispose?.();
  return { hash: res.hash };
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
