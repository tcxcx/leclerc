import { getLeclercAsset, type LeclercAssetId } from "./asset-catalog";

export interface AtomicAmountParseResult {
  decimal: string;
  atomic: string;
  decimals: number;
}

const DECIMAL_AMOUNT_RE = /^\d+(\.\d+)?$/;

export function parseAtomicAmount(
  input: string,
  assetIdOrDecimals: LeclercAssetId | number,
): AtomicAmountParseResult {
  const decimals =
    typeof assetIdOrDecimals === "number"
      ? assetIdOrDecimals
      : getLeclercAsset(assetIdOrDecimals).decimals;
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("asset decimals must be a non-negative integer");

  const clean = input.trim();
  if (!DECIMAL_AMOUNT_RE.test(clean)) {
    throw new Error("amount must be a positive decimal using digits and at most one dot");
  }

  const [wholeRaw = "0", fractionRaw = ""] = clean.split(".");
  const whole = stripLeadingZeroes(wholeRaw);
  const fraction = fractionRaw.slice(0, decimals).padEnd(decimals, "0");
  const atomic = stripLeadingZeroes(`${whole}${fraction}`);

  if (atomic === "0") throw new Error("amount must be greater than zero");

  return {
    decimal: fractionRaw ? `${whole}.${fractionRaw.slice(0, decimals)}` : whole,
    atomic,
    decimals,
  };
}

export function parseAssetAmountToAtomic(input: string, assetId: LeclercAssetId): string {
  return parseAtomicAmount(input, assetId).atomic;
}

export function isHexAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function assertHexAddress(value: string, label = "address"): `0x${string}` {
  const clean = value.trim();
  if (!isHexAddress(clean)) throw new Error(`${label} must be a 0x address`);
  return clean;
}

function stripLeadingZeroes(value: string): string {
  return value.replace(/^0+(?=\d)/, "") || "0";
}
