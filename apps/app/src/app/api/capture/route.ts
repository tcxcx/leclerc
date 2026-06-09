import { NextResponse } from "next/server";
import { completeJSON } from "@repo/qvacs";
import { loadLLM } from "@/lib/qvac/server";
import {
  SYSTEM_PROMPT,
  EXTRACTION_JSON_SCHEMA,
  buildUserMessage,
  buildRecord,
  isMeaningful,
} from "@/lib/intel/assemble";
import { apiError, apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";
import type { IntelExtraction, IntelRecord, RecordKind } from "@/lib/intel/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

interface CaptureBody {
  transcript: string;
  durationMs?: number | null;
  locale?: "es" | "en";
  kind?: RecordKind | null;
  sector?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CaptureBody;
    if (!isMeaningful(body.transcript ?? "")) {
      return apiErrorResponse(apiError("capture_source_required"));
    }

    const capturedAt = Date.now();
    const llm = await loadLLM("media");
    const extraction = await completeJSON<IntelExtraction>(
      llm,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(body.transcript, capturedAt) },
      ],
      EXTRACTION_JSON_SCHEMA,
      "intel",
    );
    const record: IntelRecord = buildRecord(body.transcript, extraction, {
      kind: body.kind ?? "observacion",
      sector: body.sector ?? null,
      capturedAt,
      durationMs: body.durationMs ?? null,
      locale: body.locale ?? "es",
    });

    return NextResponse.json({ record });
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "capture_failed"));
  }
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}
