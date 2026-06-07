import { NextResponse } from "next/server";
import { ocrImage, translateText } from "@repo/qvacs";
import { loadOcr, loadTranslate } from "@/lib/qvac/server";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * Document intel (station, Node). The browser owns encrypted persistence; this
 * route only turns an uploaded image into OCR text, optionally translated.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "missing image" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const ocrModel = await loadOcr();
    const ocr = await ocrImage(ocrModel, buffer);

    const to = String(form.get("to") ?? "").trim();
    const from = String(form.get("from") ?? "").trim();
    const shouldTranslate = String(form.get("translate") ?? "false") === "true";
    let translatedText = "";
    if (shouldTranslate && ocr.text.trim()) {
      const translateModel = await loadTranslate();
      translatedText = await translateText(translateModel, ocr.text, {
        to: to || "es",
        from: from || undefined,
        modelType: process.env.LECLERC_TRANSLATE_MODEL_TYPE === "llm" ? "llm" : "nmt",
      });
    }

    return NextResponse.json({
      text: ocr.text,
      translatedText,
      blocks: ocr.blocks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "document intel failed" },
      { status: 500 },
    );
  }
}
