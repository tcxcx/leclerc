"use client";

import { useEffect, useState } from "react";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { listRecords } from "@/lib/intel/store-client";
import { runBrief } from "@/lib/api-client";
import type { IntelRecord } from "@/lib/intel/schema";
import type { IntelBrief } from "@/lib/agents/orchestrator";
import { ThreatChip } from "@/components/threat-chip";

export default function AnalysisPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [records, setRecords] = useState<IntelRecord[]>([]);
  const [focus, setFocus] = useState("");
  const [medic, setMedic] = useState(false);
  const [running, setRunning] = useState(false);
  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    listRecords().then(setRecords).catch(() => setRecords([]));
  }, []);

  async function run() {
    setRunning(true);
    setErr("");
    setBrief(null);
    try {
      const b = await runBrief({
        records,
        focus: focus.trim() || undefined,
        locale: locale as "es" | "en",
        includeMedic: medic,
      });
      setBrief(b);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "brief failed");
    } finally {
      setRunning(false);
    }
  }

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
            disabled={running || records.length === 0}
            className="w-full rounded-xl bg-primary py-3 text-on-primary font-label-md disabled:opacity-50"
          >
            {running ? t("brief.running") : t("brief.run")}
          </button>
          <p className="text-caption text-on-surface-variant">{records.length} registros</p>
        </div>
      )}

      {err && (
        <p className="rounded-xl bg-error-container px-4 py-3 text-on-error-container text-label-md">{err}</p>
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

          <div className="flex gap-2">
            <button className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md">
              {t("record.exportPdf")}
            </button>
            <button className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md">
              {t("record.deadDrop")}
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
