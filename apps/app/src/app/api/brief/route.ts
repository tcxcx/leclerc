import { NextResponse } from "next/server";
import { runAnalystDesk, type BriefRequest } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Run the multi-agent analyst desk (station, Node). The client posts the
 * relevant (decrypted) records; the station is trusted compute.
 * POST BriefRequest → IntelBrief
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BriefRequest;
    if (!body.records?.length) {
      return NextResponse.json({ error: "no records" }, { status: 400 });
    }
    const brief = await runAnalystDesk(body);
    return NextResponse.json(brief);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "brief failed" },
      { status: 500 },
    );
  }
}
