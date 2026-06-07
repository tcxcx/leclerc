"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { listRecords } from "@/lib/intel/store-client";
import type { IntelRecord } from "@/lib/intel/schema";
import { ThreatChip } from "@/components/threat-chip";

export default function ConsolePage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [records, setRecords] = useState<IntelRecord[]>([]);

  useEffect(() => {
    listRecords().then(setRecords).catch(() => setRecords([]));
  }, []);

  return (
    <div className="anim-enter space-y-5">
      <p className="text-on-surface-variant text-body-md">{t("app.tagline")}</p>

      <Link
        href={`/${locale}/capturar`}
        className="flex items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20 active:scale-[0.99] transition-transform"
      >
        <span className="material-symbols-outlined fill text-[28px]" aria-hidden>
          mic
        </span>
        <div>
          <div className="font-headline-sm">{t("console.quickCapture")}</div>
          <div className="text-label-md opacity-80">{t("capture.title")}</div>
        </div>
      </Link>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-headline-sm">{t("console.recent")}</h2>
          <Link href={`/${locale}/expediente`} className="text-label-md text-primary">
            {t("dossier.title")}
          </Link>
        </div>
        {records.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center text-on-surface-variant">
            {t("common.empty")}
          </p>
        ) : (
          <ul className="space-y-2 stagger">
            {records.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/${locale}/expediente/${r.id}`}
                  className="block rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <ThreatChip level={r.amenaza} />
                    <span className="text-caption text-on-surface-variant">
                      {new Date(r.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-body-md">{r.resumen}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
