import { NextResponse } from "next/server";
import { ingest, answer, search } from "@/lib/rag/server";
import { apiError, apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";

export const runtime = "nodejs";

/**
 * QVAC-native RAG endpoint (station, Node).
 *  POST { action: "ingest", docs: [{id,text,meta}] }
 *  POST { action: "query",  query: string, k?: number }   → grounded answer
 *  POST { action: "search", query: string, k?: number }   → raw hits (for chips)
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as
      | { action: "ingest"; docs: { id: string; text: string; meta?: Record<string, unknown> }[] }
      | { action: "query"; query: string; k?: number; missionId?: string; locale?: "es" | "en" }
      | { action: "search"; query: string; k?: number; missionId?: string };

    if (body.action === "ingest") {
      await ingest(body.docs);
      return NextResponse.json({ ok: true, count: body.docs.length });
    }
    if (body.action === "query") {
      const result = await answer(body.query, body.k, body.missionId, body.locale);
      return NextResponse.json(result);
    }
    if (body.action === "search") {
      const hits = await search(body.query, body.k, body.missionId);
      return NextResponse.json({ hits });
    }
    return apiErrorResponse(apiError("unknown_action"));
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "rag_failed"));
  }
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}
