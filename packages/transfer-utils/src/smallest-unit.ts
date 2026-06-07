import { getLeclercAsset, type LeclercAssetId } from "@leclerc/transfer-core";

export interface AtomicAmountParseResult {
  decimal: string;
  atomic: string;
  decimals: number;
}

export interface FromAtomicResult {
  decimal: string;
  atomic: string;
  decimals: number;
}

const DECIMAL_AMOUNT_RE = /^\d+(\.\d+)?$/;
const ATOMIC_AMOUNT_RE = /^\d+$/;

export function smallestUnit(
  input: string,
  assetIdOrDecimals: LeclercAssetId | number,
): AtomicAmountParseResult {
  return toAtomic(input, assetIdOrDecimals);
}

export function toAtomic(
  input: string,
  assetIdOrDecimals: LeclercAssetId | number,
): AtomicAmountParseResult {
  const decimals = resolveDecimals(assetIdOrDecimals);
  const clean = input.trim();
  if (!DECIMAL_AMOUNT_RE.test(clean)) {
    throw new Error("amount must be a positive decimal using digits and at most one dot");
  }

  const [wholeRaw = "0", fractionRaw = ""] = clean.split(".");
  const whole = stripLeadingZeroes(wholeRaw);
  if (fractionRaw.length > decimals) {
    throw new Error(`amount supports at most ${decimals} fractional digit${decimals === 1 ? "" : "s"}`);
  }
  const fraction = fractionRaw.padEnd(decimals, "0");
  const atomic = stripLeadingZeroes(`${whole}${fraction}`);

  if (atomic === "0") throw new Error("amount must be greater than zero");

  return {
    decimal: formatAtomicDecimal(atomic, decimals),
    atomic,
    decimals,
  };
}

export function fromAtomic(
  atomicInput: string | bigint | number,
  assetIdOrDecimals: LeclercAssetId | number,
): FromAtomicResult {
  const decimals = resolveDecimals(assetIdOrDecimals);
  const atomic = typeof atomicInput === "bigint" ? atomicInput.toString() : String(atomicInput).trim();
  if (!ATOMIC_AMOUNT_RE.test(atomic)) throw new Error("atomic amount must use digits only");
  return {
    decimal: formatAtomicDecimal(stripLeadingZeroes(atomic), decimals),
    atomic: stripLeadingZeroes(atomic),
    decimals,
  };
}

export function parseAtomicAmount(
  input: string,
  assetIdOrDecimals: LeclercAssetId | number,
): AtomicAmountParseResult {
  return toAtomic(input, assetIdOrDecimals);
}

export function parseAssetAmountToAtomic(input: string, assetId: LeclercAssetId): string {
  return toAtomic(input, assetId).atomic;
}

export function formatAtomicAmount(value: string | bigint | number, assetIdOrDecimals: LeclercAssetId | number): string {
  return fromAtomic(value, assetIdOrDecimals).decimal;
}

export function isHexAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function assertHexAddress(value: string, label = "address"): `0x${string}` {
  const clean = value.trim();
  if (!isHexAddress(clean)) throw new Error(`${label} must be a 0x address`);
  return clean;
}

function resolveDecimals(assetIdOrDecimals: LeclercAssetId | number): number {
  const decimals =
    typeof assetIdOrDecimals === "number"
      ? assetIdOrDecimals
      : getLeclercAsset(assetIdOrDecimals).decimals;
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error("asset decimals must be a non-negative integer");
  }
  return decimals;
}

function stripLeadingZeroes(value: string): string {
  return value.replace(/^0+(?=\d)/, "") || "0";
}

function formatAtomicDecimal(atomic: string, decimals: number): string {
  if (decimals === 0) return atomic;
  const padded = atomic.padStart(decimals + 1, "0");
  const whole = stripLeadingZeroes(padded.slice(0, -decimals));
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
