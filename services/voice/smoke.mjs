/**
 * Voice chain smoke test — proves ASR + LLM + TTS run end-to-end with no mic.
 * Strategy: synthesize a question with TTS, resample 44100→16000 f32le, feed it
 * into transcribeStream, read the transcript, run completion, synth the reply.
 *
 * Run: bun run voice:smoke   (downloads ~1.5GB of models on first run)
 */
if (!globalThis.Bun) {
  throw new Error("LeClerc voice smoke is Bun-only; start it with `bun run voice:smoke`.");
}

const {
  loadModel,
  unloadModel,
  transcribeStream,
  completion,
  textToSpeech,
  WHISPER_BASE_Q8_0,
  VAD_SILERO_5_1_2,
  QWEN3_1_7B_INST_Q4,
  TTS_MULTILINGUAL_SUPERTONIC2_Q8_0,
} = await import("@qvac/sdk");
const { persona } = await import("@leclerc/core");

const log = (...a) => console.log("[voice-smoke]", ...a);
const LOCALE = process.env.VOICE_LOCALE ?? "es";
const TTS_RATE = 44100;
const ASR_RATE = 16000;

function stripThink(s) {
  return (s ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

try {
  log("loading tts…");
  const tts = await loadModel({
    modelSrc: TTS_MULTILINGUAL_SUPERTONIC2_Q8_0,
    modelType: "tts-ggml",
    modelConfig: { ttsEngine: "supertonic", language: LOCALE, voice: "F1", ttsNumInferenceSteps: 5 },
    onProgress: (p) => p?.percentage != null && log(`  tts ${p.percentage.toFixed(0)}%`),
  });

  log("loading asr (whisper+vad)…");
  const asr = await loadModel({
    modelSrc: WHISPER_BASE_Q8_0,
    modelConfig: {
      vadModelSrc: VAD_SILERO_5_1_2,
      audio_format: "f32le",
      language: LOCALE,
      no_timestamps: true,
      suppress_blank: true,
      suppress_nst: true,
      temperature: 0.0,
      vad_params: { threshold: 0.5, min_silence_duration_ms: 500, speech_pad_ms: 200 },
    },
    onProgress: (p) => p?.percentage != null && log(`  asr ${p.percentage.toFixed(0)}%`),
  });

  log("loading llm…");
  const llm = await loadModel({
    modelSrc: QWEN3_1_7B_INST_Q4,
    modelType: "llamacpp-completion",
    modelConfig: { ctx_size: 4096 },
    onProgress: (p) => p?.percentage != null && log(`  llm ${p.percentage.toFixed(0)}%`),
  });

  const question = LOCALE === "es" ? "Hola, ¿cuánto gasté esta semana?" : "Hi, how much did I spend this week?";
  log(`synthesizing question: "${question}"`);
  const qTts = textToSpeech({ modelId: tts, text: question, inputType: "text", stream: false });
  const qSamples = await qTts.buffer; // Int16 @ 44100
  log(`  synthesized ${qSamples.length} samples (${(qSamples.length / TTS_RATE).toFixed(1)}s)`);

  // Int16@44100 → Float32@16000, plus ~1s trailing silence so VAD commits the segment.
  const f32 = downsampleToF32(qSamples, TTS_RATE, ASR_RATE);
  const withSilence = new Float32Array(f32.length + ASR_RATE);
  withSilence.set(f32, 0);

  log("feeding audio into transcribeStream…");
  const session = await transcribeStream({ modelId: asr });
  // Write in 320ms frames to mimic streaming mic input.
  const frame = Math.floor(ASR_RATE * 0.32);
  (async () => {
    for (let i = 0; i < withSilence.length; i += frame) {
      session.write(Buffer.from(withSilence.buffer, i * 4, Math.min(frame, withSilence.length - i) * 4));
      await sleep(20);
    }
    await sleep(300);
    session.end();
  })();

  let transcript = "";
  for await (const raw of session) {
    if (raw && raw.trim()) {
      transcript = raw.trim();
      log(`  transcript: "${transcript}"`);
      break; // one utterance is enough for the smoke
    }
  }
  if (!transcript) throw new Error("ASR produced no transcript from synthesized audio");

  log("running completion…");
  const run = completion({
    modelId: llm,
    history: [
      { role: "system", content: persona(LOCALE === "en" ? "en" : "es", { spoken: true }) },
      { role: "user", content: transcript },
    ],
    stream: true,
  });
  let answer = "";
  for await (const t of run.tokenStream) answer += t;
  const cleanAnswer = stripThink(answer);
  log(`  answer: "${cleanAnswer}"`);

  log("synthesizing reply…");
  const rTts = textToSpeech({ modelId: tts, text: cleanAnswer || "Listo.", inputType: "text", stream: false });
  const rSamples = await rTts.buffer;
  log(`  reply audio: ${rSamples.length} samples (${(rSamples.length / TTS_RATE).toFixed(1)}s)`);

  await unloadModel({ modelId: tts }).catch(() => {});
  await unloadModel({ modelId: asr }).catch(() => {});
  await unloadModel({ modelId: llm }).catch(() => {});
  log("✅ ASR → LLM → TTS chain OK");
  process.exit(0);
} catch (err) {
  console.error("[voice-smoke] ❌", err);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Naive linear-interpolation downsample of Int16 samples to Float32 [-1,1]. */
function downsampleToF32(int16, fromRate, toRate) {
  const ratio = fromRate / toRate;
  const outLen = Math.floor(int16.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(int16.length - 1, i0 + 1);
    const frac = src - i0;
    const s = (int16[i0] ?? 0) * (1 - frac) + (int16[i1] ?? 0) * frac;
    out[i] = Math.max(-1, Math.min(1, s / 32768));
  }
  return out;
}
