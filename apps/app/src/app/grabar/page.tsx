"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFlow } from "../flow-context";
import { useRecorder } from "@/lib/use-recorder";

const WAVE_DELAYS = ["0.1s", "0.3s", "0.2s", "0.5s", "0.4s", "0.6s", "0.2s"];

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordingPage() {
  const router = useRouter();
  const { tipo, beneficiario } = useFlow();
  const { recording, elapsedMs, error, start, stop } = useRecorder(60_000);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const showBeneficiary = tipo !== "grupal" && beneficiario?.nombre;

  const onMicClick = async () => {
    if (uploading) return;
    if (!recording) {
      await start();
      return;
    }
    const result = await stop();
    if (!result) return;
    await upload(result.blob, result.durationMs, result.mimeType);
  };

  const upload = async (blob: Blob, durationMs: number, mimeType: string) => {
    setUploading(true);
    setUploadError(null);
    try {
      const ext = mimeType.includes("wav") ? "wav" : "webm";
      const form = new FormData();
      form.append("audio", blob, `registro.${ext}`);
      form.append("durationMs", String(durationMs));
      form.append("capturedAt", String(Date.now()));
      if (tipo) form.append("tipo", tipo);
      if (beneficiario?.nombre) form.append("beneficiarioNombre", beneficiario.nombre);
      if (beneficiario?.dni) form.append("beneficiarioDni", beneficiario.dni);

      const res = await fetch("/api/reports", { method: "POST", body: form });
      if (res.status === 422) {
        setUploadError("No se detectó voz. Inténtalo de nuevo.");
        setUploading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { report } = (await res.json()) as { report: { id: string } };
      router.push(`/informe/${report.id}`);
    } catch {
      setUploadError("Fallo al procesar el informe. Inténtalo de nuevo.");
      setUploading(false);
    }
  };

  const guidance = uploading
    ? "Procesando el informe en el dispositivo…"
    : "Habla con claridad sobre la atención brindada";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-container-margin h-touch-target-min bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-container-margin pt-20 pb-24">
        {showBeneficiary && (
          <div className="w-full max-w-md rounded-xl p-4 mb-stack-lg flex items-center gap-3 bg-surface-container-low">
            <div className="bg-primary/10 text-primary p-2 rounded-full">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Beneficiario
              </p>
              <p className="font-body-md text-body-md text-on-surface font-semibold">
                {beneficiario!.nombre}
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl p-8 flex flex-col items-center gap-8 relative overflow-hidden">
          <p className="font-body-lg text-body-lg text-on-surface-variant text-center px-4">
            {guidance}
          </p>

          <div className="relative flex items-center justify-center h-64 w-64">
            {recording && (
              <>
                <div className="absolute w-40 h-40 rounded-full bg-primary/20 recording-pulse" />
                <div
                  className="absolute w-40 h-40 rounded-full bg-primary/10 recording-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}
            <button
              onClick={onMicClick}
              disabled={uploading}
              aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
              className="relative z-10 w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-150 disabled:opacity-60"
            >
              {uploading ? (
                <span className="material-symbols-outlined text-white text-[48px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span
                  className="material-symbols-outlined text-white text-[48px] fill"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {recording ? "stop" : "mic"}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 h-12">
            {WAVE_DELAYS.map((delay, i) => (
              <div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                style={{
                  height: recording ? undefined : "12px",
                  animation: recording ? `wave 1.2s infinite ease-in-out` : undefined,
                  animationDelay: delay,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full bg-error ${recording ? "animate-pulse" : "opacity-30"}`}
            />
            <span className="font-display-lg text-display-lg text-on-surface tracking-wider">
              {fmt(elapsedMs)}
            </span>
          </div>

          {(error || uploadError) && (
            <p className="text-error text-body-md text-center">{error ?? uploadError}</p>
          )}
        </div>
      </main>
    </div>
  );
}
