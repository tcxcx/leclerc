import { NextResponse } from "next/server";
import {
  getModel,
  transcribeOnce,
  loadModel,
  WHISPER_EN_BASE_Q8_0,
} from "@repo/qvacs";

// The QVAC worker uses native addons — it must run in the Node.js runtime,
// never the Edge runtime. Keep this route on a single long-lived instance so
// the loaded model is reused across push-to-talk requests.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const form = await request.formData();
  const audio = form.get("audio");

  if (!(audio instanceof Blob)) {
    return NextResponse.json(
      { error: "Expected multipart form field 'audio' to be a file." },
      { status: 400 },
    );
  }

  try {
    const modelId = await getModel("whisper", () =>
      loadModel({ modelSrc: WHISPER_EN_BASE_Q8_0 }),
    );

    const audioChunk = Buffer.from(await audio.arrayBuffer());
    const text = await transcribeOnce(modelId, audioChunk);

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Transcription failed", err);
    return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
  }
}
