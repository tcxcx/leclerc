import { NextResponse } from "next/server";
import { generateFieldReport } from "@/lib/reports/generate";
import { createReport, listReports } from "@/lib/reports/store";
import { clampWavToMs, wavDurationMs, MAX_AUDIO_MS } from "@/lib/reports/audio";
import type { ReportMetadata, TipoRegistro } from "@/lib/reports/schema";

// QVAC's worker uses native addons — Node.js runtime only, never Edge. First
// call downloads/loads the models, so allow a long execution window.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/**
 * POST multipart/form-data:
 *   audio       (file, required)  — dictated activity
 *   sector      (string, optional)
 *   unidad      (string, optional)
 *   capturedAt  (epoch ms, optional)
 *   durationMs  (number, optional; else derived from WAV header)
 *
 * Runs the on-device pipeline (Whisper → LLM) and persists a structured report.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing required file field 'audio'." },
      { status: 400 },
    );
  }

  // Cap to the first minute of audio for fast, predictable transcription.
  const buffer = clampWavToMs(Buffer.from(await audio.arrayBuffer()), MAX_AUDIO_MS);
  const capturedAtRaw = str(form.get("capturedAt"));
  const durationRaw = str(form.get("durationMs"));

  const clientDuration =
    durationRaw && Number.isFinite(Number(durationRaw)) ? Number(durationRaw) : null;
  // Reflect the audio we actually process: derived length (already clamped),
  // else the client value, both capped at the 1-minute limit.
  const durationMs = Math.min(
    wavDurationMs(buffer) ?? clientDuration ?? MAX_AUDIO_MS,
    MAX_AUDIO_MS,
  );

  const tipoRaw = str(form.get("tipo"));
  const tipo: TipoRegistro | null =
    tipoRaw === "individual" || tipoRaw === "grupal" ? tipoRaw : null;

  const nombre = str(form.get("beneficiarioNombre"));
  const dni = str(form.get("beneficiarioDni"));
  const beneficiario = nombre || dni ? { nombre: nombre ?? "", dni: dni ?? "" } : null;

  const metadata: ReportMetadata = {
    tipo,
    beneficiario,
    sector: str(form.get("sector")),
    unidad: str(form.get("unidad")),
    capturedAt: capturedAtRaw && Number.isFinite(Number(capturedAtRaw))
      ? Number(capturedAtRaw)
      : Date.now(),
    durationMs,
  };

  try {
    const report = await generateFieldReport({ audio: buffer, metadata });
    if (!report) {
      return NextResponse.json(
        { error: "No se detectó voz en el audio." },
        { status: 422 },
      );
    }
    await createReport(report);
    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("Report generation failed", err);
    return NextResponse.json(
      { error: "Fallo al generar el informe." },
      { status: 500 },
    );
  }
}

/** GET — chronological history (newest first). */
export async function GET() {
  const reports = await listReports();
  return NextResponse.json({ reports });
}
