import { NextResponse } from "next/server";
import { startStation, stopStation, stationKey, peerAlive } from "@/lib/p2p/delegate";

export const runtime = "nodejs";

/**
 * P2P station/provider control (station, Node).
 * POST { action: "start" }                 → { publicKey }
 * POST { action: "stop" }
 * GET                                       → { publicKey }
 * POST { action: "ping", peer }            → { alive }
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
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "station failed" },
      { status: 500 },
    );
  }
}
