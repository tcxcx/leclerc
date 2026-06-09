import { NextResponse } from "next/server";
import { runAnalystDesk, type BriefRequest } from "@/lib/agents/orchestrator";
import { apiError, apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";

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
      return apiErrorResponse(apiError("brief_records_required"));
    }
    const brief = await runAnalystDesk(body);
    return NextResponse.json(brief);
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "brief_failed"));
  }
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}
