import { NextResponse } from "next/server";
import {
  listRainAgentCards,
  rainFundingTarget,
} from "@leclerc/core";
import { confirmTransfer, proposeTransfer } from "@/lib/wallet/transfer-confirmation";

export const runtime = "nodejs";

type RainCardsRequest =
  | { action: "list" }
  | { action: "fund"; seed?: string; cardId?: string; amount?: string }
  | { action: "confirm"; confirmId?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RainCardsRequest;
    switch (body.action) {
      case "list":
        return NextResponse.json(listRainCardsResponse());
      case "fund":
        return NextResponse.json(await fundRainCard(body));
      case "confirm":
        return NextResponse.json(await confirmRainCard(body));
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "rain card failed" },
      { status: 500 },
    );
  }
}

function listRainCardsResponse() {
  return {
    cards: listRainAgentCards(),
    funding: listRainAgentCards().map((card) => {
      const target = rainFundingTarget(card.id, process.env);
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

async function fundRainCard(body: Extract<RainCardsRequest, { action: "fund" }>) {
  const seed = body.seed?.trim();
  if (!seed) throw new Error("wallet seed required");
  const cardId = body.cardId?.trim();
  if (!cardId) throw new Error("card id required");
  const card = listRainAgentCards().find((entry) => entry.id === cardId);
  if (!card) throw new Error("unknown card");
  const target = rainFundingTarget(card.id, process.env);
  if (!target?.configured || !target.depositAddress) {
    throw new Error(`${card.fundingDepositEnv} must be configured for live Rain card funding`);
  }
  const proposal = proposeTransfer({
    seed,
    to: target.depositAddress,
    amount: body.amount?.trim() || card.defaultFundingAmount,
    assetId: card.assetId,
    chainId: card.chainId,
    purpose: "rain-card",
    metadata: { cardId: card.id },
  });
  return {
    status: "requires_confirmation",
    proposal,
  };
}

async function confirmRainCard(body: Extract<RainCardsRequest, { action: "confirm" }>) {
  const confirmId = body.confirmId?.trim();
  if (!confirmId) throw new Error("confirmId required");
  const result = await confirmTransfer(confirmId);
  if (result.proposal.purpose !== "rain-card") throw new Error("confirmation is not for Rain card funding");
  const cardId = String(result.proposal.metadata?.cardId ?? "");
  return {
    ok: true,
    hash: result.hash,
    cardId,
    assetId: result.proposal.assetId,
    chainId: result.proposal.chainId,
    amount: result.proposal.amountAtomic,
  };
}
