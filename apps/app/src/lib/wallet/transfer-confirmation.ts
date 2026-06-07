import "server-only";

import crypto from "node:crypto";
import {
  assertHexAddress,
  getLeclercAsset,
  getLeclercChain,
  parseAtomicAmount,
  type LeclercAssetId,
  type LeclercChainId,
  type TransferProposal,
  type TransferPurpose,
} from "@leclerc/core";
import { payCatalogTokenEvm } from "./evm";

const TRANSFER_CONFIRM_TTL_MS = 5 * 60_000;
const transferBootKey = crypto.randomBytes(32);

export interface ProposedTransferInput {
  seed: string;
  to: string;
  amount: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  purpose: TransferPurpose;
  metadata?: Record<string, unknown>;
}

interface StoredTransfer extends TransferProposal {
  seed: string;
  createdAt: number;
  expiresAtMs: number;
}

const transfers = new Map<string, StoredTransfer>();

export function proposeTransfer(input: ProposedTransferInput): TransferProposal {
  const seed = input.seed.trim();
  if (!seed) throw new Error("wallet seed required");

  const to = assertHexAddress(input.to, "recipient");
  const asset = getLeclercAsset(input.assetId);
  const chain = chainByTransferId(input.chainId);
  const amount = parseAtomicAmount(input.amount, input.assetId);
  const id = crypto.randomBytes(18).toString("base64url");
  const expiresAtMs = Date.now() + TRANSFER_CONFIRM_TTL_MS;
  const mac = crypto
    .createHmac("sha256", transferBootKey)
    .update(`${id}.${expiresAtMs}.${input.purpose}.${input.assetId}.${input.chainId}.${to}.${amount.atomic}`)
    .digest("base64url")
    .slice(0, 22);
  const confirmId = `${id}.${expiresAtMs.toString(36)}.${mac}`;
  const proposal: StoredTransfer = {
    confirmId,
    createdAt: Date.now(),
    expiresAtMs,
    expiresAt: new Date(expiresAtMs).toISOString(),
    purpose: input.purpose,
    summary: `${amount.decimal} ${asset.displaySymbol} to ${to} on ${chain.name}`,
    to,
    assetId: input.assetId,
    chainId: input.chainId,
    amount: amount.decimal,
    amountAtomic: amount.atomic,
    metadata: input.metadata,
    seed,
  };
  transfers.set(confirmId, proposal);
  sweepExpiredTransfers();
  return publicProposal(proposal);
}

export async function confirmTransfer(
  confirmId: string,
): Promise<{ hash: string; proposal: TransferProposal }> {
  const id = confirmId.trim();
  const transfer = transfers.get(id);
  if (!transfer) throw new Error("transfer confirmation not found or already used");
  if (Date.now() > transfer.expiresAtMs) {
    transfers.delete(id);
    throw new Error("transfer confirmation expired");
  }

  transfers.delete(id);
  const hash = await payCatalogTokenEvm(
    transfer.seed,
    transfer.to,
    transfer.amountAtomic,
    transfer.assetId,
    transfer.chainId,
  ).then((result) => result.hash);
  return { hash, proposal: publicProposal(transfer) };
}

export function getPendingTransfer(confirmId: string): TransferProposal | null {
  const transfer = transfers.get(confirmId.trim());
  if (!transfer || Date.now() > transfer.expiresAtMs) return null;
  return publicProposal(transfer);
}

function publicProposal(transfer: StoredTransfer): TransferProposal {
  return {
    confirmId: transfer.confirmId,
    expiresAt: transfer.expiresAt,
    purpose: transfer.purpose,
    summary: transfer.summary,
    to: transfer.to,
    assetId: transfer.assetId,
    chainId: transfer.chainId,
    amount: transfer.amount,
    amountAtomic: transfer.amountAtomic,
    metadata: transfer.metadata,
  };
}

function chainByTransferId(chainId: LeclercChainId) {
  switch (chainId) {
    case 5042002:
      return getLeclercChain("arc-testnet");
    case 42161:
      return getLeclercChain("arbitrum-one");
    default:
      throw new Error(`unsupported chainId ${chainId}`);
  }
}

function sweepExpiredTransfers() {
  const now = Date.now();
  for (const [id, transfer] of transfers.entries()) {
    if (transfer.expiresAtMs <= now) transfers.delete(id);
  }
}
