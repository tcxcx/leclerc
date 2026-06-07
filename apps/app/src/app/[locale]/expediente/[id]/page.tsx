"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { getRecord, updateEstado, deleteRecord } from "@/lib/intel/store-client";
import type { IntelRecord } from "@/lib/intel/schema";
import { ThreatChip } from "@/components/threat-chip";

export default function RecordPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<IntelRecord | null>(null);

  useEffect(() => {
    if (id) getRecord(id).then(setR).catch(() => setR(null));
  }, [id]);

  if (!r) return <p className="py-10 text-center text-on-surface-variant">{t("common.loading")}</p>;

  const list = (label: string, items: string[]) =>
    items.length > 0 && (
      <Section label={label}>
        <ul className="list-inside list-disc text-body-md">
          {items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </Section>
    );

  return (
    <div className="anim-enter space-y-4">
      <div className="flex items-center justify-between">
        <ThreatChip level={r.amenaza} />
        <span className="text-caption text-on-surface-variant">
          {new Date(r.createdAt).toLocaleString(locale)}
        </span>
      </div>

      <Section label={t("record.summary")}>
        <p className="text-body-lg">{r.resumen}</p>
      </Section>

      {(r.datos.sujeto.alias || r.datos.sujeto.descripcion) && (
        <Section label={t("record.subject")}>
          <p className="text-body-md">
            <strong>{r.datos.sujeto.alias}</strong> {r.datos.sujeto.descripcion}
            {r.datos.sujeto.afiliacion && ` · ${r.datos.sujeto.afiliacion}`}
          </p>
        </Section>
      )}

      {(r.datos.ubicacion.lugar || r.datos.ubicacion.coordenadas) && (
        <Section label={t("record.location")}>
          <p className="text-body-md">
            {r.datos.ubicacion.lugar} {r.datos.ubicacion.coordenadas}
          </p>
        </Section>
      )}

      {list(t("record.actions"), r.accionesPendientes)}
      {list(t("record.entities"), [
        ...r.entidades.personas,
        ...r.entidades.organizaciones,
        ...r.entidades.lugares,
      ])}

      {r.datos.narrativa && (
        <Section label="Narrativa">
          <p className="whitespace-pre-wrap text-body-md">{r.datos.narrativa}</p>
        </Section>
      )}

      <Section label={t("record.source")}>
        <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{r.transcripcion}</p>
      </Section>

      <div className="grid grid-cols-2 gap-2 pt-2">
        {r.estado !== "CONFIRMADO" && (
          <button
            onClick={() => updateEstado(r.id, "CONFIRMADO").then((u) => u && setR(u))}
            className="col-span-2 rounded-xl bg-primary py-3 text-on-primary font-label-md"
          >
            {t("record.confirm")}
          </button>
        )}
        <button className="rounded-xl border border-outline-variant py-3 text-label-md">
          {t("record.exportPdf")}
        </button>
        <button className="rounded-xl border border-outline-variant py-3 text-label-md">
          {t("record.deadDrop")}
        </button>
        <button
          onClick={() => deleteRecord(r.id).then(() => router.push(`/${locale}/expediente`))}
          className="col-span-2 rounded-xl py-2 text-label-md text-error"
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
      <h2 className="mb-1 text-caption uppercase tracking-wide text-on-surface-variant">{label}</h2>
      {children}
    </section>
  );
}
