import { NextResponse } from "next/server";
import {
  getLeclercAsset,
  listRainAgentCards,
  rainFundingTarget,
  type RainAgentCardConfig,
} from "@leclerc/core";
import { paySableEvm } from "@/lib/wallet";

export const runtime = "nodejs";

type RainCardsRequest =
  | { action: "list" }
  | { action: "fund"; seed?: string; cardId?: string; amount?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RainCardsRequest;
    switch (body.action) {
      case "list":
        return NextResponse.json(listRainCardsResponse());
      case "fund":
        return NextResponse.json(await fundRainCard(body));
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
  const amount = amountToAtomic(body.amount ?? "", card);
  const result = await paySableEvm(seed, target.depositAddress, amount, card.assetId, card.chainId);
  return {
    ok: true,
    hash: result.hash,
    cardId: card.id,
    assetId: card.assetId,
    chainId: card.chainId,
    amount,
  };
}

function amountToAtomic(input: string, card: RainAgentCardConfig): string {
  const asset = getLeclercAsset(card.assetId);
  const clean = input.trim();
  if (!/^\d+(\.\d+)?$/.test(clean)) throw new Error("amount must be a positive decimal");
  const [wholeRaw = "0", fractionRaw = ""] = clean.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.slice(0, asset.decimals).padEnd(asset.decimals, "0");
  const atomic = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  if (atomic === "0") throw new Error("amount must be greater than zero");
  return atomic;
}
