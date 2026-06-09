import { NextResponse } from "next/server";
import {
  briefFilename,
  briefMime,
  renderBriefExport,
  type BriefExportFormat,
} from "@/lib/reports/export";
import type { IntelBrief } from "@/lib/agents/orchestrator";
import type { IntelRecord } from "@/lib/intel/schema";
import { apiError, apiErrorBody, apiErrorFromUnknown, type LeclercApiError } from "@/lib/api-errors";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ExportBody {
  format: BriefExportFormat;
  brief: IntelBrief;
  records: IntelRecord[];
  locale?: "es" | "en";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExportBody;
    if (body.format !== "pdf" && body.format !== "docx") {
      return apiErrorResponse(apiError("brief_export_unsupported_format"));
    }
    if (!body.brief || !Array.isArray(body.records)) {
      return apiErrorResponse(apiError("brief_export_payload_required"));
    }

    const buffer = await renderBriefExport(
      {
        brief: body.brief,
        records: body.records,
        locale: body.locale ?? "es",
      },
      body.format,
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": briefMime(body.format),
        "Content-Disposition": `attachment; filename="${briefFilename(body.brief, body.format)}"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(apiErrorFromUnknown(err, "brief_export_failed"));
  }
}

function apiErrorResponse(error: LeclercApiError) {
  return NextResponse.json(apiErrorBody(error), { status: error.status });
}
