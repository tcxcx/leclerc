/**
 * LeClerc voice service (docs/leclerc/13-cleo-plan.md §voice).
 *
 * Continuous, hands-free voice loop on QVAC, station-side (Node/Bare). The PWA
 * captures mic PCM and plays audio; this service runs the chain and streams
 * over a WebSocket:
 *
 *   mic PCM (16k f32le) ──▶ transcribeStream (Whisper + Silero VAD)
 *                              └─ utterance ─▶ completion (streamed)
 *                                                └─ textToSpeech (Supertonic PCM)
 *
 * One model set, loaded once at boot, shared across connections (serialize for
 * a single operative; multi-user would need per-connection model instances).
 *
 * Run: bun run voice   (downloads ~1.5GB of models on first run, then offline)
 * Env: VOICE_PORT (7077), VOICE_LOCALE (es|en), VOICE_LLM_LEVEL (media|alta)
 */
import { WebSocketServer } from "ws";
import {
  loadModel,
  transcribeStream,
  completion,
  textToSpeech,
  WHISPER_BASE_Q8_0,
  VAD_SILERO_5_1_2,
  QWEN3_1_7B_INST_Q4,
  QWEN3_4B_INST_Q4_K_M,
  TTS_MULTILINGUAL_SUPERTONIC2_Q8_0,
} from "@qvac/sdk";
import { persona } from "@leclerc/core";

const PORT = Number(process.env.VOICE_PORT ?? 7077);
const LOCALE = process.env.VOICE_LOCALE ?? "es";
const TTS_SAMPLE_RATE = 44100; // Supertonic output rate

const PERSONA = persona(LOCALE === "en" ? "en" : "es", { spoken: true });

/** Strip any <think>…</think> reasoning block (safety net alongside /no_think). */
function stripThink(s) {
  return (s ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// VAD tuning from the Tether voice-assistant example (conservative, anti self-hear).
const VAD_PARAMS = {
  threshold: 0.6,
  min_speech_duration_ms: 300,
  min_silence_duration_ms: 700,
  max_speech_duration_s: 15.0,
  speech_pad_ms: 200,
};
const MIN_UTTERANCE_CHARS = 3;

function isMeaningful(text) {
  const t = (text ?? "").trim();
  if (!t) return false;
  if (t.includes("[No speech detected]")) return false;
  if (/^\[[^\]]+\]$/.test(t)) return false;
  return t.replace(/[^\p{L}\p{N}]/gu, "").length >= MIN_UTTERANCE_CHARS;
}

const log = (...a) => console.log("[voice]", ...a);

log(`loading models (locale=${LOCALE})…`);
const asrModelId = await loadModel({
  modelSrc: WHISPER_BASE_Q8_0,
  modelConfig: {
    vadModelSrc: VAD_SILERO_5_1_2,
    audio_format: "f32le",
    strategy: "greedy",
    n_threads: 4,
    language: LOCALE,
    no_timestamps: true,
    suppress_blank: true,
    suppress_nst: true,
    temperature: 0.0,
    vad_params: VAD_PARAMS,
  },
  onProgress: (p) => p?.percentage != null && log(`  asr ${p.percentage.toFixed(0)}%`),
});

const llmSrc = process.env.VOICE_LLM_LEVEL === "alta" ? QWEN3_4B_INST_Q4_K_M : QWEN3_1_7B_INST_Q4;
const llmModelId = await loadModel({
  modelSrc: llmSrc,
  modelType: "llamacpp-completion",
  modelConfig: { ctx_size: 4096 },
  onProgress: (p) => p?.percentage != null && log(`  llm ${p.percentage.toFixed(0)}%`),
});

const ttsModelId = await loadModel({
  modelSrc: TTS_MULTILINGUAL_SUPERTONIC2_Q8_0,
  modelType: "tts-ggml",
  modelConfig: {
    ttsEngine: "supertonic",
    language: LOCALE,
    voice: "F1",
    ttsSpeed: 1.05,
    ttsNumInferenceSteps: 5,
  },
  onProgress: (p) => p?.percentage != null && log(`  tts ${p.percentage.toFixed(0)}%`),
});

log("all models loaded. listening on ws://localhost:" + PORT);

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  log("client connected");
  const history = [{ role: "system", content: PERSONA }];
  let speak = true; // answers as audio + text by default
  let micGated = false; // client raises this while it plays our TTS
  let closed = false;

  const send = (obj) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(obj));

  // Per-connection streaming ASR session.
  let session;
  (async () => {
    session = await transcribeStream({ modelId: asrModelId });

    // Utterance loop: each VAD-committed segment becomes a turn.
    for await (const raw of session) {
      if (closed) break;
      if (!isMeaningful(raw)) continue;
      const userText = raw.trim();
      send({ type: "transcript", text: userText });
      history.push({ role: "user", content: userText });

      // Tell the client to gate its mic + start the "speaking" UI.
      send({ type: "speaking", value: true });
      try {
        const run = completion({ modelId: llmModelId, history, stream: true });
        let answer = "";
        for await (const token of run.tokenStream) {
          answer += token;
          send({ type: "token", text: token });
        }
        const clean = stripThink(answer);
        history.push({ role: "assistant", content: clean });
        send({ type: "answer", text: clean });

        if (speak && clean) {
          const tts = textToSpeech({ modelId: ttsModelId, text: clean, inputType: "text", stream: false });
          const samples = await tts.buffer; // Int16 PCM samples
          send({
            type: "audio",
            rate: TTS_SAMPLE_RATE,
            pcm: Buffer.from(int16ToBytes(samples)).toString("base64"),
          });
        }
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        send({ type: "speaking", value: false });
      }
    }
  })().catch((err) => send({ type: "error", message: String(err) }));

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "config":
        if (typeof msg.speak === "boolean") speak = msg.speak;
        break;
      case "speaking": // client echoes its playback state (mic-gate mirror)
        micGated = !!msg.value;
        break;
      case "audio": {
        // Drop mic frames while our own TTS is playing (anti self-hear).
        if (micGated) break;
        if (!session || !msg.pcm) break;
        try {
          session.write(Buffer.from(msg.pcm, "base64"));
        } catch {
          /* session may be closing */
        }
        break;
      }
    }
  });

  ws.on("close", () => {
    closed = true;
    try {
      session?.end?.();
    } catch {
      /* already closed */
    }
    log("client disconnected");
  });
});

/** Pack an Int16 sample array (or typed array) into little-endian bytes. */
function int16ToBytes(samples) {
  const buf = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    let v = Math.round(samples[i] ?? 0);
    if (v > 32767) v = 32767;
    if (v < -32768) v = -32768;
    buf.writeInt16LE(v, i * 2);
  }
  return buf;
}
