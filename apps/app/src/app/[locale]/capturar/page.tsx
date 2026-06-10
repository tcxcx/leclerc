"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { useRecorder, type RecordingResult } from "@/lib/use-recorder";
import { useInferenceMode } from "@/lib/inference/mode";
import { inferTranscribe } from "@/lib/inference";
import {
  ASR_LANGUAGE,
  isMeaningful,
} from "@/lib/intel/assemble";
import { putRecord } from "@/lib/intel/store-client";
import { captureExtract, ragIngest } from "@/lib/api-client";
import { ragText } from "@/lib/intel/assemble";
import type { IntelRecord } from "@/lib/intel/schema";
import { DEFAULT_ANALYST_STORY, inferMissionIdsForText } from "@leclerc/core";

type Phase = "idle" | "transcribing" | "extracting" | "review" | "error";

export default function CapturePage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();
  const { mode } = useInferenceMode();

  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState<IntelRecord | null>(null);
  const [err, setErr] = useState("");

  const onMax = (res: RecordingResult | null) => res && void process(res.blob, res.durationMs);
  const { recording, elapsedMs, error, start, stop } = useRecorder(60_000, onMax, {
    microphoneError: t("voice.microphoneError"),
  });

  async function process(source: Blob | string, durationMs: number | null) {
    try {
      setErr("");
      let transcript: string;
      if (typeof source === "string") {
        transcript = source;
      } else {
        setPhase("transcribing");
        transcript = await inferTranscribe(mode, source, { language: ASR_LANGUAGE });
      }
      if (!isMeaningful(transcript)) {
        setErr(translateKey(t, DEFAULT_ANALYST_STORY.errors.emptySourceKey));
        setPhase("error");
        return;
      }
      setPhase("extracting");
      const { record } = await captureExtract({
        transcript,
        durationMs,
        locale: locale as "es" | "en",
      });
      setDraft(record);
      setPhase("review");
    } catch (e) {
      setErr(e instanceof Error ? e.message : translateKey(t, DEFAULT_ANALYST_STORY.errors.inferenceFailedKey));
      setPhase("error");
    }
  }

  async function confirm() {
    if (!draft) return;
    try {
      setErr("");
      const confirmed: IntelRecord = { ...draft, estado: "CONFIRMADO" };
      await putRecord(confirmed);
      const missionIds = inferMissionIdsForText(ragText(confirmed));
      // Ingest into the QVAC RAG dossier (best-effort; station may be offline).
      await ragIngest([
        {
          id: confirmed.id,
          text: ragText(confirmed),
          meta: {
            missionIds,
            amenaza: confirmed.amenaza,
            kind: confirmed.metadatos.kind,
            createdAt: confirmed.createdAt,
          },
        },
      ]).catch(() => {});
      router.push(`/${locale}/expediente/${confirmed.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : translateKey(t, DEFAULT_ANALYST_STORY.errors.vaultWriteFailedKey));
      setPhase("review");
    }
  }

  const busy = phase === "transcribing" || phase === "extracting";

  return (
    <div className="anim-enter space-y-5">
      <h1 className="font-headline-md">{t("capture.title")}</h1>

      {phase !== "review" && (
        <>
          <div className="flex flex-col items-center gap-4 py-6">
            <button
              onClick={() => (recording ? stop().then((r) => r && process(r.blob, r.durationMs)) : start())}
              disabled={busy}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full text-on-primary transition-transform active:scale-95 ${
                recording ? "bg-error" : "bg-primary"
              } disabled:opacity-50`}
            >
              {recording && <span className="recording-pulse absolute inset-0 rounded-full bg-error" />}
              <span className="material-symbols-outlined fill text-[44px]" aria-hidden>
                {recording ? "stop" : "mic"}
              </span>
            </button>
            <p className="text-label-md text-on-surface-variant">
              {busy
                ? phase === "transcribing"
                  ? t("capture.transcribing")
                  : t("capture.extracting")
                : recording
                  ? `${t("capture.dictating")} ${Math.floor(elapsedMs / 1000)}s`
                  : t("capture.record")}
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t("capture.typeInstead")}
              rows={4}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 text-body-md"
            />
            <button
              onClick={() => typed.trim() && process(typed.trim(), null)}
              disabled={busy || !typed.trim()}
              className="w-full rounded-xl bg-primary-container py-3 text-on-primary-container font-label-md disabled:opacity-50"
            >
              {t("capture.review")}
            </button>
          </div>

          {(err || error) && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-on-error-container text-label-md">
              {err || error}
            </p>
          )}
        </>
      )}

      {phase === "review" && draft && (
        <div className="space-y-4 anim-enter">
          <ReviewCard record={draft} onChange={setDraft} />
          {err && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-on-error-container text-label-md">
              {err}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setPhase("idle")}
              className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={confirm}
              className="flex-1 rounded-xl bg-primary py-3 text-on-primary font-label-md"
            >
              {t("record.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function translateKey(t: ReturnType<typeof useI18n>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}

function ReviewCard({
  record,
  onChange,
}: {
  record: IntelRecord;
  onChange: (r: IntelRecord) => void;
}) {
  const t = useI18n();
  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <label className="block">
        <span className="text-caption text-on-surface-variant">{t("record.summary")}</span>
        <textarea
          value={record.resumen}
          onChange={(e) => onChange({ ...record, resumen: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-outline-variant bg-surface p-2 text-body-md"
        />
      </label>
      <label className="block">
        <span className="text-caption text-on-surface-variant">{t("record.threat")}</span>
        <select
          value={record.amenaza}
          onChange={(e) => onChange({ ...record, amenaza: e.target.value as IntelRecord["amenaza"] })}
          className="mt-1 w-full rounded-lg border border-outline-variant bg-surface p-2 text-body-md"
        >
          <option value="CRITICO">{t("threat.CRITICO")}</option>
          <option value="ELEVADO">{t("threat.ELEVADO")}</option>
          <option value="RUTINARIO">{t("threat.RUTINARIO")}</option>
        </select>
      </label>
      <details>
        <summary className="cursor-pointer text-label-md text-primary">{t("record.source")}</summary>
        <p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-container p-2 text-body-md text-on-surface-variant">
          {record.transcripcion}
        </p>
      </details>
    </div>
  );
}
