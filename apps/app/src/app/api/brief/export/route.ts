import { NextResponse } from "next/server";
import {
  briefFilename,
  briefMime,
  renderBriefExport,
  type BriefExportFormat,
} from "@/lib/reports/export";
import type { IntelBrief } from "@/lib/agents/orchestrator";
import type { IntelRecord } from "@/lib/intel/schema";

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
      return NextResponse.json({ error: "unsupported format" }, { status: 400 });
    }
    if (!body.brief || !Array.isArray(body.records)) {
      return NextResponse.json({ error: "missing brief or records" }, { status: 400 });
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "export failed" },
      { status: 500 },
    );
  }
}
