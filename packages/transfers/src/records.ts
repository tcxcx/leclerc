import type { LeclercAssetId, LeclercChainId } from "@leclerc/transfer-core";
import type { TransactionState, TransactionType, TransferCategory } from "@leclerc/transfer-utils";

export type TransferPurpose = "wallet" | "agent-wallet" | "mission-funding" | "rain-card";

export interface TransferProposal {
  confirmId: string;
  expiresAt: string;
  purpose: TransferPurpose;
  summary: string;
  to: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  amount: string;
  amountAtomic: string;
  metadata?: Record<string, unknown>;
}

export interface ProposedTransferInput {
  seed: string;
  to: string;
  amount: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  purpose: TransferPurpose;
  metadata?: Record<string, unknown>;
}

export interface TransactionRecord {
  id: string;
  kind: TransactionType;
  category: TransferCategory;
  state: TransactionState;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  amountAtomic: string;
  amount: string;
  to: string;
  hash?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}
