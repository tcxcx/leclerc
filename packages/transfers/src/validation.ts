import {
  assertWritableTestnetChain,
  assetNotConfiguredOnChainMessage,
  assetNotEnabledForEvmTestnetMessage,
  getLeclercAsset,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
} from "@leclerc/transfer-core";
import { assertHexAddress, toAtomic } from "@leclerc/transfer-utils";

export function validateTransferDestination(to: string): `0x${string}` {
  return assertHexAddress(to, "recipient");
}

export function validateTransferAsset(assetId: LeclercAssetId, chainId: LeclercChainId) {
  const chain = assertWritableTestnetChain(chainId);
  const asset = getLeclercAsset(assetId);
  if (asset.transferPolicy !== "testnet-only") {
    throw new Error(assetNotEnabledForEvmTestnetMessage(asset.displaySymbol));
  }
  if (!tokenAddress(assetId, chainId)) {
    throw new Error(assetNotConfiguredOnChainMessage(asset.displaySymbol, chain.name));
  }
  return { asset, chain };
}

export function validateTransferAmount(amount: string, assetId: LeclercAssetId) {
  return toAtomic(amount, assetId);
}
