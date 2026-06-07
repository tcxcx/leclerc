export const TRANSACTION_STATES = ["proposed", "submitted", "settled", "pending", "failed", "blocked"] as const;
export type TransactionState = (typeof TRANSACTION_STATES)[number];

export function isFinalTransactionState(state: TransactionState): boolean {
  return state === "settled" || state === "failed" || state === "blocked";
}
