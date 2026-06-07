"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { getRecord, updateEstado, deleteRecord, putRecord } from "@/lib/intel/store-client";
import { documentIntel, ragIngest } from "@/lib/api-client";
import { ragText } from "@/lib/intel/assemble";
import type { IntelRecord } from "@/lib/intel/schema";
import { ThreatChip } from "@/components/threat-chip";

export default function RecordPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<IntelRecord | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [translateDoc, setTranslateDoc] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

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

  async function ingestRecord(record: IntelRecord) {
    await ragIngest([
      {
        id: record.id,
        text: ragText(record),
        meta: {
          amenaza: record.amenaza,
          kind: record.metadatos.kind,
          createdAt: record.createdAt,
        },
      },
    ]);
  }

  async function confirmRecord() {
    if (!r) return;
    setErr("");
    const updated = await updateEstado(r.id, "CONFIRMADO");
    if (!updated) return;
    setR(updated);
    await ingestRecord(updated).catch((e) => setErr(e instanceof Error ? e.message : "RAG error"));
  }

  async function addDocument(file: File | null) {
    if (!r || !file) return;
    setDocBusy(true);
    setErr("");
    setStatus("");
    try {
      const result = await documentIntel(file, {
        translate: translateDoc,
        to: locale === "en" ? "en" : "es",
      });
      const text = [result.text, result.translatedText].filter(Boolean).join("\n\n");
      const updated: IntelRecord = {
        ...r,
        adjuntos: [
          ...(r.adjuntos ?? []),
          {
            kind: "ocr",
            text,
            sha256: `${file.name}:${file.size}:${file.lastModified}`,
          },
        ],
      };
      await putRecord(updated);
      setR(updated);
      if (updated.estado === "CONFIRMADO") {
        await ingestRecord(updated).catch((e) => setErr(e instanceof Error ? e.message : "RAG error"));
      }
      setStatus(t("record.documentAdded"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("record.documentFailed"));
    } finally {
      setDocBusy(false);
    }
  }

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
        <Section label={t("record.narrative")}>
          <p className="whitespace-pre-wrap text-body-md">{r.datos.narrativa}</p>
        </Section>
      )}

      <Section label={t("record.attachments")}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <input
              type="checkbox"
              checked={translateDoc}
              onChange={(e) => setTranslateDoc(e.target.checked)}
            />
            {t("record.translateDocument")}
          </label>
          <label className="block cursor-pointer rounded-xl border border-outline-variant px-4 py-3 text-center text-label-md">
            <input
              type="file"
              accept="image/*"
              disabled={docBusy}
              className="sr-only"
              onChange={(e) => addDocument(e.target.files?.[0] ?? null)}
            />
            {docBusy ? t("common.loading") : t("record.addDocument")}
          </label>
          {r.adjuntos?.length ? (
            <ul className="space-y-2">
              {r.adjuntos.map((attachment, index) => (
                <li key={`${attachment.sha256 ?? "attachment"}-${index}`} className="rounded-lg bg-surface p-2">
                  <div className="mb-1 text-caption uppercase tracking-wide text-on-surface-variant">
                    {attachment.kind}
                  </div>
                  <p className="whitespace-pre-wrap text-body-md">{attachment.text ?? attachment.sha256}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-md text-on-surface-variant">{t("common.empty")}</p>
          )}
        </div>
      </Section>

      <Section label={t("record.source")}>
        <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{r.transcripcion}</p>
      </Section>

      {status && (
        <p className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-label-md text-on-surface-variant">
          {status}
        </p>
      )}
      {err && (
        <p className="rounded-xl bg-error-container px-4 py-3 text-on-error-container text-label-md">{err}</p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        {r.estado !== "CONFIRMADO" && (
          <button
            onClick={confirmRecord}
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
