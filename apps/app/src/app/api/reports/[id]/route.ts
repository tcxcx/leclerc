import { NextResponse } from "next/server";
import { deleteReport, getReport, updateEstado } from "@/lib/reports/store";
import type { Estado } from "@/lib/reports/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET a single report, including the full transcript (on-demand verification). */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) {
    return NextResponse.json({ error: "Informe no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ report });
}

const VALID: Estado[] = ["PENDIENTE", "CONFIRMADO"];

/** PATCH { estado } — confirm a report / its follow-up, or send it back to pending. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const estado = (body as { estado?: unknown })?.estado;
  if (typeof estado !== "string" || !VALID.includes(estado as Estado)) {
    return NextResponse.json(
      { error: `estado debe ser uno de: ${VALID.join(", ")}.` },
      { status: 400 },
    );
  }

  const updated = await updateEstado(id, estado as Estado);
  if (!updated) {
    return NextResponse.json({ error: "Informe no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ report: updated });
}

/** DELETE a report (used to discard a rejected draft on "Reintentar"). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const removed = await deleteReport(id);
  if (!removed) {
    return NextResponse.json({ error: "Informe no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
