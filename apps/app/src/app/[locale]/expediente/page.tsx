"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { listRecords } from "@/lib/intel/store-client";
import { ragAsk } from "@/lib/api-client";
import type { IntelRecord, ThreatLevel } from "@/lib/intel/schema";
import { ThreatChip } from "@/components/threat-chip";

const FILTERS: (ThreatLevel | "ALL")[] = ["ALL", "CRITICO", "ELEVADO", "RUTINARIO"];

export default function DossierPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [records, setRecords] = useState<IntelRecord[]>([]);
  const [filter, setFilter] = useState<ThreatLevel | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; sources: { id: string }[] } | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    listRecords().then(setRecords).catch(() => setRecords([]));
  }, []);

  const shown = filter === "ALL" ? records : records.filter((r) => r.amenaza === filter);

  async function ask() {
    if (!q.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      setAnswer(await ragAsk(q.trim(), 6, locale as "es" | "en"));
    } catch (e) {
      setAnswer({ answer: e instanceof Error ? e.message : "RAG error", sources: [] });
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="anim-enter space-y-4">
      <h1 className="font-headline-md">{t("dossier.title")}</h1>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder={t("dossier.search")}
          className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-body-md"
        />
        <button
          onClick={ask}
          disabled={asking}
          className="rounded-xl bg-primary px-4 text-on-primary font-label-md disabled:opacity-50"
        >
          {asking ? "…" : t("dossier.ask")}
        </button>
      </div>

      {answer && (
        <div className="anim-pop rounded-2xl border border-primary/30 bg-primary-container/40 p-4">
          <div className="mb-1 flex items-center gap-1 text-label-md text-primary">
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              auto_awesome
            </span>
            {t("dossier.groundedAnswer")}
          </div>
          <p className="whitespace-pre-wrap text-body-md">{answer.answer}</p>
          {answer.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {answer.sources.map((s) => (
                <Link
                  key={s.id}
                  href={`/${locale}/expediente/${s.id}`}
                  className="rounded-full bg-surface-container px-2 py-0.5 text-caption text-primary"
                >
                  {s.id.slice(0, 8)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-label-md ${
              filter === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
            }`}
          >            {f === "ALL" ? t("dossier.all") : t(`threat.${f}`)}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center text-on-surface-variant">
          {t("common.empty")}
        </p>
      ) : (
        <ul className="space-y-2 stagger">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                href={`/${locale}/expediente/${r.id}`}
                className="block rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <ThreatChip level={r.amenaza} />
                  <span className="text-caption text-on-surface-variant">
                    {r.estado === "CONFIRMADO" ? t("record.confirmed") : t("record.draft")}
                  </span>
                </div>
                <p className="line-clamp-2 text-body-md">{r.resumen}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
