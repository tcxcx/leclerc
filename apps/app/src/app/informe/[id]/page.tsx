"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FieldReport, Prioridad } from "@/lib/reports/schema";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtFecha(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} de ${MESES[d.getMonth()]}, ${d.getFullYear()}`;
}

function fmtDur(ms: number | null): string | null {
  if (!ms) return null;
  const t = Math.round(ms / 1000);
  const m = Math.floor(t / 60).toString().padStart(2, "0");
  const s = (t % 60).toString().padStart(2, "0");
  return `${m}:${s} min`;
}

const PRIORIDAD_STYLE: Record<Prioridad, string> = {
  ALTA: "bg-error-container text-on-error-container",
  MEDIA: "bg-tertiary-container text-on-tertiary-container",
  BAJA: "bg-secondary-container text-on-secondary-container",
};

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ReportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<FieldReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        console.log(`[informe] GET /api/reports/${id}`);
        const res = await fetch(`/api/reports/${id}`);
        console.log(`[informe] response HTTP ${res.status}`);
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        const { report } = (await res.json()) as { report: FieldReport };
        console.log("[informe] report loaded:", report);
        if (active) {
          setReport(report);
          setSaved(report.estado === "CONFIRMADO");
        }
      } catch (e) {
        console.error("[informe] fetch failed:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const confirmar = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      console.log(`[informe] PATCH /api/reports/${id} estado=CONFIRMADO`);
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CONFIRMADO" }),
      });
      console.log(`[informe] PATCH response HTTP ${res.status}`);
      if (res.ok) setSaved(true);
    } catch (e) {
      console.error("[informe] confirm failed:", e);
    } finally {
      setSaving(false);
    }
  };

  // Re-record: the LLM summary may be off, so let the operator capture again.
  // Beneficiary/tipo persist in flow context, so /grabar resumes the same flow.
  // Discard this draft first (unless already confirmed) so it doesn't linger.
  const reintentar = async () => {
    if (!saved) {
      console.log(`[informe] reintentar → discarding draft ${id}`);
      await fetch(`/api/reports/${id}`, { method: "DELETE" }).catch(() => {});
    }
    console.log("[informe] reintentar grabación → /grabar");
    router.push("/grabar");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[36px] animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-container-margin text-center">
        <p className="font-headline-sm text-headline-sm">Informe no encontrado.</p>
        <button
          onClick={() => router.push("/")}
          className="h-12 px-6 bg-primary text-on-primary rounded-lg font-label-md"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const dur = fmtDur(report.metadatos.durationMs);
  const ubicacion = [report.metadatos.sector, report.metadatos.unidad]
    .filter(Boolean)
    .join(", ");
  const titular =
    report.metadatos.beneficiario?.nombre ||
    (report.metadatos.tipo === "grupal" ? "Actividad Grupal" : "Beneficiario");

  return (
    <div className="pb-32">
      {/* Ambient polish */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-secondary-container/20 blur-[80px] rounded-full" />
      </div>

      <header className="anim-fade fixed top-0 w-full z-50 flex justify-between items-center px-container-margin h-touch-target-min bg-surface border-b border-outline-variant">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="p-2 -ml-2 hover:bg-surface-container-low transition-colors rounded-full text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </header>

      <main className="mt-16 px-container-margin pt-6 max-w-3xl mx-auto">
        {/* Summary card */}
        <section className="anim-enter bg-surface-container-low border border-primary/20 p-5 rounded-xl mb-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-label-md text-primary flex items-center gap-2">
              Resumén de registro
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORIDAD_STYLE[report.prioridad]}`}
            >
              {report.prioridad}
            </span>
          </div>
          <ul className="stagger space-y-3">
            {sentences(report.resumen).map((s, i) => (
              <li key={`r${i}`} className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-1">
                  check_circle
                </span>
                <p className="text-body-md">{s}</p>
              </li>
            ))}
            {report.accionesPendientes.map((a, i) => (
              <li key={`a${i}`} className="flex gap-3">
                <p className="text-body-md">
                  <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-[10px] font-bold mr-1">
                    PENDIENTE
                  </span>
                  {a}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Transcript toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center gap-2 text-primary font-label-md text-label-md hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">description</span>
            {showTranscript ? "Ocultar transcripción" : "Ver transcripción completa"}
          </button>
          {showTranscript && (
            <p className="mt-3 px-3 text-body-md text-on-surface-variant whitespace-pre-wrap">
              {report.transcripcion}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="anim-enter bg-surface-container-low/50 border border-outline-variant/30 p-5 rounded-xl space-y-2">
          <div>
            <p className="text-caption text-on-surface-variant leading-tight mb-1">
              {report.metadatos.tipo === "grupal" ? "Registro" : "Beneficiario"}
            </p>
            <p className="font-headline-md text-headline-md font-bold text-on-surface">
              {titular}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-on-surface-variant text-body-md">
            <span>{fmtFecha(report.createdAt)}</span>
            {ubicacion && <span className="opacity-40">—</span>}
            {ubicacion && <span>{ubicacion}</span>}
            {dur && <span className="opacity-40">—</span>}
            {dur && <span>{dur}</span>}
          </div>
        </div>
      </main>

      {/* Confirm */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant p-container-margin z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={reintentar}
            disabled={saving}
            title="Volver a grabar si el resumen no es preciso"
            className="flex-1 h-[56px] bg-surface-container-low text-primary border border-outline-variant rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-150 ease-out disabled:opacity-50"
          >
            <span className="material-symbols-outlined">refresh</span>
            Reintentar
          </button>
          <button
            onClick={confirmar}
            disabled={saving || saved}
            className="flex-1 h-[56px] bg-primary text-white rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-150 ease-out shadow-sm disabled:opacity-90"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Guardando...
              </>
            ) : saved ? (
              <>
                <span className="material-symbols-outlined">check</span>
                ¡Guardado con éxito!
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check</span>
                Confirmar informe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
