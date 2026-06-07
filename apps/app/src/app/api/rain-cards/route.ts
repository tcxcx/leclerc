import { NextResponse } from "next/server";
import {
  confirmRainCardFunding,
  listRainCardsResponse,
  proposeRainCardFunding,
} from "@leclerc/cards";

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
        return NextResponse.json(listRainCardsResponse(process.env));
      case "fund":
        return NextResponse.json(
          proposeRainCardFunding({
            seed: body.seed ?? "",
            cardId: body.cardId ?? "",
            amount: body.amount,
            env: process.env,
          }),
        );
      case "confirm":
        return NextResponse.json(await confirmRainCardFunding(body.confirmId ?? ""));
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
