import { NextResponse } from "next/server";
import {
  balances,
  payLightning,
  generateSeed,
  receiveDetails,
  walletTransactions,
} from "@/lib/wallet";
import type { LeclercAssetId, LeclercChainId } from "@leclerc/core";
import { confirmTransfer, proposeTransfer } from "@/lib/wallet/transfer-confirmation";

export const runtime = "nodejs";

/**
 * Wallet endpoint (station, Node). The seed is supplied per request from the
 * client's unlocked vault — it is never persisted here.
 *
 * POST { action: "generate" }
 * POST { action: "balances", seed }
 * POST { action: "payLightning", seed, invoice }     ← gated by UI confirm
 * POST { action: "payEvm", seed, to, amount }         ← proposes; confirmTransfer executes
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
      case "receive":
        return NextResponse.json(await receiveDetails(body.seed));
      case "transactions":
        return NextResponse.json(await walletTransactions(body.seed));
      case "payLightning":
        return NextResponse.json(await payLightning(body.seed, body.invoice));
      case "payEvm": {
        const proposal = proposeTransfer({
          seed: body.seed,
          to: body.to,
          amount: body.amount,
          assetId: (body.assetId as LeclercAssetId | undefined) ?? "usdc",
          chainId: body.chainId ? (Number(body.chainId) as LeclercChainId) : 5042002,
          purpose: "wallet",
        });
        return NextResponse.json({ status: "requires_confirmation", ...proposal });
      }
      case "confirmTransfer":
        return NextResponse.json(await confirmTransfer(body.confirmId));
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
