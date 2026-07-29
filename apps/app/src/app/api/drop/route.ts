import { NextResponse } from "next/server";
import { apiError, apiErrorBody, apiErrorFromUnknown } from "@/lib/api-errors";
import { closeDrop, joinDrop, readDrop, sendDrop } from "@/lib/p2p/deaddrop";
import type { DropRequest } from "@leclerc/core/p2p";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DropRequest;
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
        return apiErrorResponse(apiError("unknown_action"));
    }
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "drop_failed"));
  }
}

function apiErrorResponse(error: ReturnType<typeof apiError>) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}
