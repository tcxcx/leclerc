import "server-only";

import crypto from "node:crypto";
import {
  assertHexAddress,
  chainById,
  getLeclercAsset,
  isWritableChain,
  parseAtomicAmount,
  type LeclercAssetId,
  type LeclercChainId,
  type TransferProposal,
  type TransferPurpose,
} from "@leclerc/core";
import { payCatalogTokenEvm } from "./evm";

const TRANSFER_CONFIRM_TTL_MS = 5 * 60_000;

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

type TransferExecutor = typeof payCatalogTokenEvm;

interface TransferRegistry {
  bootKey: Buffer;
  transfers: Map<string, StoredTransfer>;
}

const registry = transferRegistry();

export function proposeTransfer(input: ProposedTransferInput): TransferProposal {
  const seed = input.seed.trim();
  if (!seed) throw new Error("wallet seed required");

  const to = assertHexAddress(input.to, "recipient");
  const asset = getLeclercAsset(input.assetId);
  const chain = chainByTransferId(input.chainId);
  const amount = parseAtomicAmount(input.amount, input.assetId);
  const id = crypto.randomBytes(18).toString("base64url");
  const expiresAtMs = Date.now() + TRANSFER_CONFIRM_TTL_MS;
  const mac = transferMac({
    id,
    expiresAtMs,
    purpose: input.purpose,
    assetId: input.assetId,
    chainId: input.chainId,
    to,
    amountAtomic: amount.atomic,
  });
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
  registry.transfers.set(confirmId, proposal);
  sweepExpiredTransfers();
  return publicProposal(proposal);
}

export async function confirmTransfer(
  confirmId: string,
  executeTransfer: TransferExecutor = payCatalogTokenEvm,
): Promise<{ hash: string; proposal: TransferProposal }> {
  const id = confirmId.trim();
  const transfer = registry.transfers.get(id);
  if (!transfer) throw new Error("transfer confirmation not found or already used");
  if (Date.now() > transfer.expiresAtMs) {
    registry.transfers.delete(id);
    throw new Error("transfer confirmation expired");
  }
  if (!verifyTransferConfirmId(id, transfer)) {
    registry.transfers.delete(id);
    throw new Error("transfer confirmation failed integrity check");
  }

  registry.transfers.delete(id);
  const hash = await executeTransfer(
    transfer.seed,
    transfer.to,
    transfer.amountAtomic,
    transfer.assetId,
    transfer.chainId,
  ).then((result) => result.hash);
  return { hash, proposal: publicProposal(transfer) };
}

export function getPendingTransfer(confirmId: string): TransferProposal | null {
  const id = confirmId.trim();
  const transfer = registry.transfers.get(id);
  if (!transfer) return null;
  if (Date.now() > transfer.expiresAtMs) {
    registry.transfers.delete(id);
    return null;
  }
  if (!verifyTransferConfirmId(id, transfer)) {
    registry.transfers.delete(id);
    return null;
  }
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
  const chain = chainById(chainId);
  if (!chain) throw new Error(`unsupported chainId ${chainId}`);
  if (!isWritableChain(chain)) {
    throw new Error(`${chain.name} is read-only for LeClerc transfers; choose an allowed testnet`);
  }
  return chain;
}

function sweepExpiredTransfers() {
  const now = Date.now();
  for (const [id, transfer] of registry.transfers.entries()) {
    if (transfer.expiresAtMs <= now) registry.transfers.delete(id);
  }
}

function transferMac(input: {
  id: string;
  expiresAtMs: number;
  purpose: TransferPurpose;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  to: string;
  amountAtomic: string;
}): string {
  return crypto
    .createHmac("sha256", registry.bootKey)
    .update(
      `${input.id}.${input.expiresAtMs}.${input.purpose}.${input.assetId}.${input.chainId}.${input.to}.${input.amountAtomic}`,
    )
    .digest("base64url")
    .slice(0, 22);
}

function verifyTransferConfirmId(confirmId: string, transfer: StoredTransfer): boolean {
  const [id, expires36, mac, ...extra] = confirmId.split(".");
  if (!id || !expires36 || !mac || extra.length > 0) return false;
  const expiresAtMs = Number.parseInt(expires36, 36);
  if (!Number.isSafeInteger(expiresAtMs) || expiresAtMs !== transfer.expiresAtMs) return false;
  const expected = transferMac({
    id,
    expiresAtMs,
    purpose: transfer.purpose,
    assetId: transfer.assetId,
    chainId: transfer.chainId,
    to: transfer.to,
    amountAtomic: transfer.amountAtomic,
  });
  if (mac.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}

function transferRegistry(): TransferRegistry {
  const globalWithTransfers = globalThis as typeof globalThis & {
    __leclercTransferConfirmations?: TransferRegistry;
  };
  globalWithTransfers.__leclercTransferConfirmations ??= {
    bootKey: crypto.randomBytes(32),
    transfers: new Map<string, StoredTransfer>(),
  };
  return globalWithTransfers.__leclercTransferConfirmations;
}
