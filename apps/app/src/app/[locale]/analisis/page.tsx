"use client";

import { useEffect, useState } from "react";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { listRecords, seedDemoRecords } from "@/lib/intel/store-client";
import { exportBrief, runBrief, type BriefExportFormat } from "@/lib/api-client";
import type { IntelRecord } from "@/lib/intel/schema";
import type { IntelBrief } from "@/lib/agents/orchestrator";
import { ThreatChip } from "@/components/threat-chip";
import { DEFAULT_ANALYST_STORY } from "@leclerc/core";

export default function AnalysisPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [records, setRecords] = useState<IntelRecord[]>([]);
  const [focus, setFocus] = useState("");
  const [medic, setMedic] = useState(false);
  const [running, setRunning] = useState(false);
  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");
  const [exporting, setExporting] = useState<BriefExportFormat | null>(null);

  useEffect(() => {
    listRecords().then(setRecords).catch(() => setRecords([]));
  }, []);

  async function seed() {
    setErr("");
    setStatus("");
    try {
      const nextRecords = await seedDemoRecords(locale as "es" | "en");
      setRecords(nextRecords);
      setStatus(t("brief.seeded"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : translateKey(t, DEFAULT_ANALYST_STORY.errors.demoSeedFailedKey));
    }
  }

  async function run() {
    const confirmed = records.filter((r) => r.estado === "CONFIRMADO");
    if (!confirmed.length) {
      setErr(t("brief.noRecords"));
      return;
    }
    setRunning(true);
    setErr("");
    setStatus("");
    setBrief(null);
    try {
      const b = await runBrief({
        records: confirmed,
        focus: focus.trim() || undefined,
        locale: locale as "es" | "en",
        includeMedic: medic,
      });
      setBrief(b);
    } catch (e) {
      setErr(e instanceof Error ? e.message : translateKey(t, DEFAULT_ANALYST_STORY.errors.briefFailedKey));
    } finally {
      setRunning(false);
    }
  }

  async function download(format: BriefExportFormat) {
    if (!brief) return;
    setExporting(format);
    setErr("");
    setStatus("");
    try {
      const { blob, filename } = await exportBrief({
        brief,
        records,
        locale: locale as "es" | "en",
        format,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(t("brief.exportReady"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("brief.exportFailed"));
    } finally {
      setExporting(null);
    }
  }

  const confirmedCount = records.filter((r) => r.estado === "CONFIRMADO").length;

  return (
    <div className="anim-enter space-y-4">
      <h1 className="font-headline-md">{t("brief.title")}</h1>

      {!brief && (
        <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder={t("brief.focus")}
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md"
          />
          <label className="flex items-center gap-2 text-body-md">
            <input type="checkbox" checked={medic} onChange={(e) => setMedic(e.target.checked)} />
            {t("brief.includeMedic")}
          </label>
          <button
            onClick={run}
            disabled={running || confirmedCount === 0}
            className="w-full rounded-xl bg-primary py-3 text-on-primary font-label-md disabled:opacity-50"
          >
            {running ? t("brief.running") : t("brief.run")}
          </button>
          {confirmedCount === 0 && (
            <button
              type="button"
              onClick={seed}
              className="w-full rounded-xl border border-outline-variant py-3 text-label-md"
            >
              {t("brief.seedDemo")}
            </button>
          )}
          <p className="text-caption text-on-surface-variant">
            {t("brief.records").replace("{count}", String(confirmedCount))}
          </p>
          {running && (
            <div className="grid grid-cols-4 gap-1 text-center text-caption text-on-surface-variant">
              {DEFAULT_ANALYST_STORY.progressSteps.map((step) => (
                <span key={step.id} className="rounded-full bg-surface-container px-2 py-1">
                  {translateKey(t, step.labelKey)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {err && (
        <p className="rounded-xl bg-error-container px-4 py-3 text-on-error-container text-label-md">{err}</p>
      )}
      {status && (
        <p className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-label-md text-on-surface-variant">
          {status}
        </p>
      )}

      {brief && (
        <div className="space-y-4 anim-pop">
          <div className="rounded-2xl border border-primary/30 bg-primary-container/40 p-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-headline-sm">{brief.titulo}</h2>
              <ThreatChip level={brief.amenazaGlobal} />
            </div>
            <p className="text-caption uppercase tracking-wide text-on-surface-variant">
              {t("brief.bottomLine")}
            </p>
            <p className="text-body-lg">{brief.bottomLine}</p>
          </div>

          <Block title={t("brief.findings")}>
            <ul className="space-y-2">
              {brief.hallazgos.map((h, i) => (
                <li key={i} className="rounded-lg bg-surface-container p-2 text-body-md">
                  {h.texto}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {h.fuentes.map((f) => (
                      <span key={f} className="rounded-full bg-surface px-1.5 text-caption text-primary">
                        {f.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Block>

          {brief.geo.length > 0 && (
            <Block title={t("brief.geo")}>
              <ul className="space-y-2">
                {brief.geo.map((place) => (
                  <li key={place.lugar} className="rounded-lg bg-surface-container p-2 text-body-md">
                    <div>{place.lugar}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {place.registros.map((id) => (
                        <span key={id} className="rounded-full bg-surface px-1.5 font-mono text-caption text-primary">
                          {id.slice(0, 12)}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {brief.entidadesClave.length > 0 && (
            <Block title={t("brief.keyEntities")}>
              <div className="flex flex-wrap gap-2">
                {brief.entidadesClave.map((entity) => (
                  <span
                    key={`${entity.tipo}-${entity.nombre}`}
                    className="rounded-full bg-surface-container px-2 py-1 text-caption text-on-surface-variant"
                  >
                    {entity.nombre} · {entity.tipo} · {entity.menciones}
                  </span>
                ))}
              </div>
            </Block>
          )}

          {brief.recomendaciones.length > 0 && (
            <Block title={t("brief.recommendations")}>
              <ul className="list-inside list-disc text-body-md">
                {brief.recomendaciones.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Block>
          )}

          <p className="text-caption text-on-surface-variant">
            {t("common.loading").replace("…", "")} · {brief.agentesEjecutados.join(" → ")}
          </p>

          {brief.toolLog.length > 0 && (
            <Block title={t("brief.toolLog")}>
              <ul className="space-y-1 text-caption text-on-surface-variant">
                {brief.toolLog.map((event, i) => (
                  <li key={`${event.agent}-${event.tool}-${i}`}>
                    <span className="font-mono text-primary">{event.agent}</span> / {event.tool} / {event.status} ·{" "}
                    {event.note}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => download("pdf")}
              disabled={exporting != null}
              className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md disabled:opacity-50"
            >
              {exporting === "pdf" ? t("common.loading") : t("record.exportPdf")}
            </button>
            <button
              onClick={() => download("docx")}
              disabled={exporting != null}
              className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md disabled:opacity-50"
            >
              {exporting === "docx" ? t("common.loading") : t("record.exportDocx")}
            </button>
          </div>
          <button onClick={() => setBrief(null)} className="w-full py-2 text-label-md text-primary">
            {t("common.back")}
          </button>
        </div>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
      <h3 className="mb-2 text-caption uppercase tracking-wide text-on-surface-variant">{title}</h3>
      {children}
    </section>
  );
}

function translateKey(t: ReturnType<typeof useI18n>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}
