export const TRANSACTION_TYPES = ["evm-token", "lightning", "spark", "card-funding", "mission-funding"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
