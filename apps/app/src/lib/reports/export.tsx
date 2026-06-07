import "server-only";

import React from "react";
import {
  Document as PdfDocument,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import {
  AlignmentType,
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { IntelBrief } from "@/lib/agents/orchestrator";
import type { IntelRecord } from "@/lib/intel/schema";

export type BriefExportFormat = "pdf" | "docx";

export interface BriefExportInput {
  brief: IntelBrief;
  records: IntelRecord[];
  locale: "es" | "en";
}

export async function renderBriefExport(
  input: BriefExportInput,
  format: BriefExportFormat,
): Promise<Buffer> {
  if (format === "pdf") return renderPdf(input);
  return renderDocx(input);
}

export function briefFilename(brief: IntelBrief, format: BriefExportFormat): string {
  const slug = brief.titulo
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .toLowerCase();
  return `leclerc-brief-${slug || "intel"}.${format}`;
}

export function briefMime(format: BriefExportFormat): string {
  return format === "pdf"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: "#14110f",
    color: "#f4efe8",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 32,
  },
  eyebrow: {
    color: "#f29f67",
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8d7a7",
    fontSize: 24,
    marginBottom: 8,
  },
  meta: {
    color: "#89b4c7",
    fontSize: 9,
    marginBottom: 16,
  },
  block: {
    borderColor: "#4a4038",
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  blockTitle: {
    color: "#89b4c7",
    fontSize: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  body: {
    lineHeight: 1.45,
  },
  mono: {
    color: "#f29f67",
    fontSize: 8,
  },
  item: {
    marginBottom: 6,
  },
});

function BriefPdf({ brief, records, locale }: BriefExportInput) {
  const labels = pdfLabels(locale);
  return (
    <PdfDocument title={brief.titulo} author="LeClerc">
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.eyebrow}>LeClerc / {labels.analystDesk}</Text>
        <Text style={pdfStyles.title}>{brief.titulo}</Text>
        <Text style={pdfStyles.meta}>
          {labels.generated}: {new Date(brief.generadoEn).toISOString()} / {labels.threat}:{" "}
          {brief.amenazaGlobal} / {labels.records}: {records.length}
        </Text>

        <PdfBlock title={labels.bluf}>
          <Text style={pdfStyles.body}>{brief.bottomLine}</Text>
        </PdfBlock>

        <PdfBlock title={labels.findings}>
          {brief.hallazgos.map((finding, index) => (
            <View key={`${finding.texto}-${index}`} style={pdfStyles.item}>
              <Text style={pdfStyles.body}>{finding.texto}</Text>
              <Text style={pdfStyles.mono}>{finding.fuentes.join(", ")}</Text>
            </View>
          ))}
        </PdfBlock>

        <PdfBlock title={labels.geo}>
          {brief.geo.map((place) => (
            <Text key={place.lugar} style={pdfStyles.body}>
              {place.lugar}: {place.registros.join(", ")}
            </Text>
          ))}
        </PdfBlock>

        <PdfBlock title={labels.recommendations}>
          {brief.recomendaciones.map((rec, index) => (
            <Text key={`${rec}-${index}`} style={pdfStyles.body}>
              {index + 1}. {rec}
            </Text>
          ))}
        </PdfBlock>

        <PdfBlock title={labels.toolLog}>
          {brief.toolLog.map((event, index) => (
            <Text key={`${event.agent}-${index}`} style={pdfStyles.body}>
              {event.agent} / {event.tool} / {event.status}: {event.note}
            </Text>
          ))}
        </PdfBlock>
      </Page>
    </PdfDocument>
  );
}

function PdfBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={pdfStyles.block}>
      <Text style={pdfStyles.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

async function renderPdf(input: BriefExportInput): Promise<Buffer> {
  const stream = await pdf(<BriefPdf {...input} />).toBuffer();
  return streamToBuffer(stream);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function renderDocx(input: BriefExportInput): Promise<Buffer> {
  const { brief, records, locale } = input;
  const labels = pdfLabels(locale);
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: brief.titulo, bold: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${labels.generated}: ${new Date(brief.generadoEn).toISOString()} / ${labels.threat}: ${brief.amenazaGlobal} / ${labels.records}: ${records.length}`,
          color: "666666",
        }),
      ],
    }),
    heading(labels.bluf),
    text(brief.bottomLine),
    heading(labels.findings),
    ...brief.hallazgos.flatMap((finding, index) => [
      text(`${index + 1}. ${finding.texto}`),
      text(`   ${finding.fuentes.join(", ")}`),
    ]),
    heading(labels.geo),
    ...brief.geo.map((place) => text(`${place.lugar}: ${place.registros.join(", ")}`)),
    heading(labels.recommendations),
    ...brief.recomendaciones.map((rec, index) => text(`${index + 1}. ${rec}`)),
    heading(labels.toolLog),
    ...brief.toolLog.map((event) =>
      text(`${event.agent} / ${event.tool} / ${event.status}: ${event.note}`),
    ),
  ];

  const doc = new DocxDocument({
    creator: "LeClerc",
    title: brief.titulo,
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

function heading(value: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text: value, bold: true })],
  });
}

function text(value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun(value)],
  });
}

function pdfLabels(locale: "es" | "en") {
  if (locale === "en") {
    return {
      analystDesk: "Analyst desk",
      generated: "Generated",
      threat: "Threat",
      records: "Records",
      bluf: "Bottom line",
      findings: "Findings with sources",
      geo: "Geo",
      recommendations: "Recommendations",
      toolLog: "Agent/tool log",
    };
  }
  return {
    analystDesk: "Mesa de analisis",
    generated: "Generado",
    threat: "Amenaza",
    records: "Registros",
    bluf: "Conclusion",
    findings: "Hallazgos con fuentes",
    geo: "Geo",
    recommendations: "Recomendaciones",
    toolLog: "Registro de agentes/herramientas",
  };
}
