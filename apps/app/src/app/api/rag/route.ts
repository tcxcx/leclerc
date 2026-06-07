import { NextResponse } from "next/server";
import { ingest, answer, search } from "@/lib/rag/server";

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
      | { action: "query"; query: string; k?: number }
      | { action: "search"; query: string; k?: number };

    if (body.action === "ingest") {
      await ingest(body.docs);
      return NextResponse.json({ ok: true, count: body.docs.length });
    }
    if (body.action === "query") {
      const result = await answer(body.query, body.k);
      return NextResponse.json(result);
    }
    if (body.action === "search") {
      const hits = await search(body.query, body.k);
      return NextResponse.json({ hits });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "rag failed" },
      { status: 500 },
    );
  }
}
