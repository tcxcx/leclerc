import { ARC_TESTNET_CHAIN_ID } from "@leclerc/transfer-core";
import type { LeclercAssetId, LeclercChainId } from "@leclerc/transfer-core";
import { parseAssetAmountToAtomic } from "@leclerc/transfer-utils";
import { confirmTransfer, proposeTransfer } from "@leclerc/transfers";

export type RainCardStatus = "notActivated" | "active" | "locked" | "canceled" | "frozen";
export type RainCardType = "virtual" | "physical";
export type RainLimitFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RainCardLimit {
  amount: string;
  assetId: LeclercAssetId;
  frequency: RainLimitFrequency;
}

export interface RainAgentCardConfig {
  id: string;
  missionId: string;
  codename: string;
  agentLabelKey: string;
  type: RainCardType;
  status: RainCardStatus;
  networkLabel: string;
  last4: string;
  expiry: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  balance: string;
  limit: RainCardLimit;
  defaultFundingAmount: string;
  fundingDepositEnv: string;
  backgroundImagePath: string;
  networkIconPath: string;
  brandIconPath: string;
  source: string;
}

export interface RainFundingTarget {
  cardId: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  depositAddress: string | null;
  configured: boolean;
  env: string;
}

const RAIN_USDC_DEPOSIT_ENV = "LECLERC_RAIN_USDC_DEPOSIT_ADDRESS";

export const LECLERC_RAIN_AGENT_CARDS = [
  {
    id: "raven-07-usdc-virtual",
    missionId: "raven",
    codename: "RAVEN-07",
    agentLabelKey: "missions.raven.title",
    type: "virtual",
    status: "active",
    networkLabel: "Rain issuing",
    last4: "0707",
    expiry: "10/28",
    assetId: "usdc",
    chainId: ARC_TESTNET_CHAIN_ID,
    balance: "240.00",
    limit: {
      amount: "500.00",
      assetId: "usdc",
      frequency: "monthly",
    },
    defaultFundingAmount: "25.00",
    fundingDepositEnv: RAIN_USDC_DEPOSIT_ENV,
    backgroundImagePath: "/assets/cards/bufi-card-bg-new.png",
    networkIconPath: "/networks/arc.svg",
    brandIconPath: "/icons/mastercard.svg",
    source:
      "../desk-v1 Rain card flows: getUserContracts().depositAddress + USDC funding; adapted to LeClerc WDK Arc Testnet.",
  },
] as const satisfies readonly RainAgentCardConfig[];

export function listRainAgentCards(): RainAgentCardConfig[] {
  return [...LECLERC_RAIN_AGENT_CARDS];
}

export function rainFundingAmountToAtomic(card: RainAgentCardConfig, input = card.defaultFundingAmount): string {
  return parseAssetAmountToAtomic(input, card.assetId);
}

export function getRainAgentCard(cardId: string): RainAgentCardConfig | null {
  return LECLERC_RAIN_AGENT_CARDS.find((card) => card.id === cardId) ?? null;
}

export function rainFundingTarget(
  cardId: string,
  env: Partial<Record<string, string | undefined>>,
): RainFundingTarget | null {
  const card = getRainAgentCard(cardId);
  if (!card) return null;
  const value = env[card.fundingDepositEnv]?.trim() || null;
  const configured = Boolean(value && value !== "0x0000000000000000000000000000000000000000");
  return {
    cardId: card.id,
    assetId: card.assetId,
    chainId: card.chainId,
    depositAddress: configured ? value : null,
    configured,
    env: card.fundingDepositEnv,
  };
}

export function listRainCardsResponse(env: Partial<Record<string, string | undefined>>) {
  return {
    cards: listRainAgentCards(),
    funding: listRainAgentCards().map((card) => {
      const target = rainFundingTarget(card.id, env);
      return {
        cardId: card.id,
        assetId: card.assetId,
        chainId: card.chainId,
        configured: target?.configured ?? false,
        env: target?.env ?? card.fundingDepositEnv,
      };
    }),
  };
}

export function proposeRainCardFunding(input: {
  seed: string;
  cardId: string;
  amount?: string;
  env: Partial<Record<string, string | undefined>>;
}) {
  const seed = input.seed.trim();
  if (!seed) throw new Error("wallet seed required");
  const card = getRainAgentCard(input.cardId.trim());
  if (!card) throw new Error("unknown card");
  const target = rainFundingTarget(card.id, input.env);
  if (!target?.configured || !target.depositAddress) {
    throw new Error(`${card.fundingDepositEnv} must be configured for live Rain card funding`);
  }
  const proposal = proposeTransfer({
    seed,
    to: target.depositAddress,
    amount: input.amount?.trim() || card.defaultFundingAmount,
    assetId: card.assetId,
    chainId: card.chainId,
    purpose: "rain-card",
    metadata: { cardId: card.id },
  });
  return { status: "requires_confirmation" as const, proposal };
}

export async function confirmRainCardFunding(confirmId: string) {
  const id = confirmId.trim();
  if (!id) throw new Error("confirmId required");
  const result = await confirmTransfer(id);
  if (result.proposal.purpose !== "rain-card") throw new Error("confirmation is not for Rain card funding");
  const cardId = String(result.proposal.metadata?.cardId ?? "");
  return {
    ok: true,
    hash: result.hash,
    cardId,
    assetId: result.proposal.assetId,
    chainId: result.proposal.chainId,
    amount: result.proposal.amountAtomic,
    record: result.record,
  };
}
