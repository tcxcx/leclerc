import {
  assertWritableTestnetChain,
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
    throw new Error(`${asset.displaySymbol} is not enabled for EVM testnet transfers`);
  }
  if (!tokenAddress(assetId, chainId)) {
    throw new Error(`${asset.displaySymbol} is not configured on ${chain.name}`);
  }
  return { asset, chain };
}

export function validateTransferAmount(amount: string, assetId: LeclercAssetId) {
  return toAtomic(amount, assetId);
}
