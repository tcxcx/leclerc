import { NextResponse } from "next/server";
import { closeDrop, joinDrop, readDrop, sendDrop } from "@/lib/p2p/deaddrop";

export const runtime = "nodejs";

type DropAction =
  | { action: "join"; passphrase: string; label?: string }
  | { action: "send"; dropId: string; secret: string; kind: "brief" | "record" | "notification"; value: unknown }
  | { action: "read"; dropId: string; secret: string }
  | { action: "close"; dropId: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DropAction;
    switch (body.action) {
      case "join":
        return NextResponse.json(await joinDrop(body.passphrase, body.label));
      case "send":
        return NextResponse.json(await sendDrop(body.dropId, body.kind, body.value, body.secret));
      case "read":
        return NextResponse.json(await readDrop(body.dropId, body.secret));
      case "close":
        await closeDrop(body.dropId);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "drop failed" },
      { status: 500 },
    );
  }
}
