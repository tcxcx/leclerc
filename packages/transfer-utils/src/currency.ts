import { getLeclercAsset, type LeclercAssetId } from "@leclerc/transfer-core";
import { fromAtomic } from "./smallest-unit";

export function formatCurrencyAmount(
  value: string | bigint | number,
  assetId: LeclercAssetId,
  options: { atomic?: boolean; symbol?: boolean } = {},
): string {
  const asset = getLeclercAsset(assetId);
  const decimal = options.atomic === false ? String(value) : fromAtomic(value, asset.decimals).decimal;
  return options.symbol === false ? decimal : `${decimal} ${asset.displaySymbol}`;
}

export function assetDisplaySymbol(assetId: LeclercAssetId): string {
  return getLeclercAsset(assetId).displaySymbol;
}
