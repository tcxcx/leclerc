export const TRANSFER_CATEGORIES = ["wallet", "agent-wallet", "mission-funding", "rain-card"] as const;
export type TransferCategory = (typeof TRANSFER_CATEGORIES)[number];
