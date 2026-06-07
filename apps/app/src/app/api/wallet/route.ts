import { NextResponse } from "next/server";
import { balances, payLightning, paySableEvm, generateSeed } from "@/lib/wallet";
import type { LeclercAssetId, LeclercChainId } from "@leclerc/core";

export const runtime = "nodejs";

/**
 * Wallet endpoint (station, Node). The seed is supplied per request from the
 * client's unlocked vault — it is never persisted here.
 *
 * POST { action: "generate" }
 * POST { action: "balances", seed }
 * POST { action: "payLightning", seed, invoice }     ← gated by UI confirm
 * POST { action: "payEvm", seed, to, amount }         ← gated by UI confirm
 *
 * TODO(codex): for the no-egress demo, prefer running this in a Bare worklet on
 * the device rather than a Route Handler; here it stays on the trusted station.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    switch (body.action) {
      case "generate":
        return NextResponse.json({ seed: generateSeed() });
      case "balances":
        return NextResponse.json(await balances(body.seed));
      case "payLightning":
        return NextResponse.json(await payLightning(body.seed, body.invoice));
      case "payEvm":
        return NextResponse.json(
          await paySableEvm(
            body.seed,
            body.to,
            body.amount,
            body.assetId as LeclercAssetId | undefined,
            body.chainId ? (Number(body.chainId) as LeclercChainId) : undefined,
          ),
        );
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "wallet failed" },
      { status: 500 },
    );
  }
}
