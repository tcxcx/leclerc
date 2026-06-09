import { NextResponse } from "next/server";
import { QWEN3_1_7B_INST_Q4 } from "@repo/qvacs";
import {
  delegateCompletion,
  startStation,
  stopStation,
  stationKey,
  peerAlive,
} from "@/lib/p2p/delegate";
import { apiError, apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";

export const runtime = "nodejs";

/**
 * P2P station/provider control (station, Node).
 * POST { action: "start" }                 → { publicKey }
 * POST { action: "stop" }
 * GET                                       → { publicKey }
 * POST { action: "ping", peer }            → { alive }
 * POST { action: "delegateTest", peer? }   → delegated completion smoke
 */
export async function GET() {
  return NextResponse.json({ publicKey: stationKey() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { action: string; peer?: string };
    switch (body.action) {
      case "start":
        return NextResponse.json(await startStation());
      case "stop":
        await stopStation();
        return NextResponse.json({ ok: true });
      case "ping":
        return NextResponse.json({ alive: await peerAlive(body.peer ?? "") });
      case "delegateTest": {
        const provider = body.peer?.trim() || (await startStation()).publicKey;
        const text = await delegateCompletion(provider, QWEN3_1_7B_INST_Q4, [
          { role: "user", content: "Responde exactamente: enlace operativo listo" },
        ]);
        return NextResponse.json({ providerPublicKey: provider, text });
      }
      default:
        return apiErrorResponse(apiError("unknown_action"));
    }
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "station_failed"));
  }
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}
