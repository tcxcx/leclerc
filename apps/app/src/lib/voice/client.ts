"use client";

/**
 * LeClerc browser voice client (docs/leclerc/13-cleo-plan.md §voice).
 *
 * Talks to the station voice service (services/voice/server.mjs) over a
 * WebSocket. We do mic capture + audio playback in the browser; the service
 * runs the ASR → LLM → TTS chain and streams events back.
 *
 *   getUserMedia → PCM 16k f32le  ──WS──▶  transcribeStream (Whisper + VAD)
 *   play TTS audio  ◀──WS── audio frames     → completion (streamed)
 *   render tokens   ◀──WS── token stream     → textToSpeech (Supertonic PCM)
 *
 * Guardrails (required, from the Tether voice-assistant example):
 * - Mic gate during playback: stop sending PCM frames while we play TTS.
 * - Post-playback cooldown (~300ms) before listening resumes (room reverb).
 *
 * Browser-only: nothing touches window/AudioContext until start().
 */

const TARGET_RATE = 16000; // Whisper wants 16 kHz mono
const COOLDOWN_MS = 300; // post-playback cooldown before mic resumes
const LOG = "[voice-client]";

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export interface VoiceClientEvents {
  onState?: (s: VoiceState) => void;
  onTranscript?: (text: string) => void; // user utterance
  onToken?: (text: string) => void; // streamed assistant token
  onAnswer?: (text: string) => void; // full assistant answer
  onError?: (msg: string) => void;
}

export interface VoiceClientOptions extends VoiceClientEvents {
  url?: string; // default NEXT_PUBLIC_VOICE_WS_URL ?? "ws://localhost:7077"
  locale?: "es" | "en";
  speak?: boolean; // default true
}

export interface VoiceClient {
  start(): Promise<void>; // connect WS + start mic
  stop(): Promise<void>; // stop mic + close WS + free audio contexts
  setSpeak(on: boolean): void;
  state: VoiceState;
}

/** Server → client message shapes (services/voice/server.mjs). */
type ServerMessage =
  | { type: "transcript"; text: string }
  | { type: "token"; text: string }
  | { type: "answer"; text: string }
  | { type: "audio"; rate: number; pcm: string }
  | { type: "speaking"; value: boolean }
  | { type: "error"; message: string };

const DEFAULT_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_VOICE_WS_URL) || "ws://localhost:7077";

export function createVoiceClient(opts: VoiceClientOptions = {}): VoiceClient {
  const url = opts.url ?? DEFAULT_URL;
  let locale: "es" | "en" = opts.locale ?? "es";
  let speak = opts.speak ?? true;

  let ws: WebSocket | null = null;

  // Capture graph (16 kHz mono Float32 via WebAudio).
  let micCtx: AudioContext | null = null;
  let micStream: MediaStream | null = null;
  let micSource: MediaStreamAudioSourceNode | null = null;
  let micProc: ScriptProcessorNode | null = null;
  let micRate = TARGET_RATE;

  // Playback graph (TTS at the server-supplied rate, e.g. 44100).
  let playCtx: AudioContext | null = null;
  let playChain: Promise<void> = Promise.resolve(); // serialize audio frames
  let playingCount = 0; // active TTS sources

  // Mic gate: true while we play TTS or the server tells us it's speaking.
  let gated = false;
  let serverSpeaking = false;
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

  let state: VoiceState = "idle";
  let stopped = true;

  function setState(s: VoiceState) {
    if (state === s) return;
    state = s;
    api.state = s;
    opts.onState?.(s);
  }

  function send(obj: unknown) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  /** Raise the mic gate: stop sending frames + tell the server we're speaking. */
  function gate() {
    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
    if (!gated) {
      gated = true;
      send({ type: "speaking", value: true });
    }
    setState("speaking");
  }

  /** Lower the gate after the cooldown, once nothing else is keeping it up. */
  function scheduleUngate() {
    if (cooldownTimer) clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(() => {
      cooldownTimer = null;
      if (stopped) return;
      if (playingCount > 0 || serverSpeaking) return; // still busy
      gated = false;
      send({ type: "speaking", value: false });
      setState("listening");
    }, COOLDOWN_MS);
  }

  // ── WebSocket ────────────────────────────────────────────────────────────

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const sock = new WebSocket(url);
      ws = sock;

      sock.onopen = () => {
        send({ type: "config", speak, locale });
        settled = true;
        resolve();
      };
      sock.onerror = () => {
        opts.onError?.("voice socket error");
        if (!settled) {
          settled = true;
          reject(new Error("voice socket error"));
        }
      };
      sock.onclose = () => {
        if (ws === sock) ws = null;
      };
      sock.onmessage = (ev) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(typeof ev.data === "string" ? ev.data : "") as ServerMessage;
        } catch {
          return;
        }
        handleMessage(msg);
      };
    });
  }

  function handleMessage(msg: ServerMessage) {
    switch (msg.type) {
      case "transcript":
        opts.onTranscript?.(msg.text);
        if (!gated) setState("thinking");
        break;
      case "token":
        opts.onToken?.(msg.text);
        break;
      case "answer":
        opts.onAnswer?.(msg.text);
        break;
      case "speaking":
        serverSpeaking = msg.value;
        if (msg.value) gate();
        else if (playingCount === 0) scheduleUngate();
        break;
      case "audio":
        void playAudio(msg.rate, msg.pcm);
        break;
      case "error":
        opts.onError?.(msg.message);
        break;
    }
  }

  // ── Mic capture ──────────────────────────────────────────────────────────

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    micStream = stream;

    const Ctx: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx({ sampleRate: TARGET_RATE });
    micCtx = ctx;
    micRate = ctx.sampleRate;
    console.log(`${LOG} mic AudioContext sampleRate=${ctx.sampleRate}`);

    const source = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = (e) => {
      if (gated || serverSpeaking) return; // mic gate: drop frames while we speak
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const frame = micRate === TARGET_RATE ? new Float32Array(input) : downsample(input, micRate, TARGET_RATE);
      send({ type: "audio", pcm: float32ToBase64(frame) });
    };
    source.connect(proc);
    proc.connect(ctx.destination);
    micSource = source;
    micProc = proc;
  }

  function stopMic() {
    micProc?.disconnect();
    micSource?.disconnect();
    micStream?.getTracks().forEach((t) => t.stop());
    void micCtx?.close();
    micProc = null;
    micSource = null;
    micStream = null;
    micCtx = null;
  }

  // ── Audio playback ─────────────────────────────────────────────────────────

  function playAudio(rate: number, b64: string): Promise<void> {
    if (stopped) return Promise.resolve();
    // Decode now (synchronously) so frames keep their order; play in sequence.
    let buffer: AudioBuffer;
    try {
      const ctx = ensurePlayCtx();
      const int16 = base64ToInt16(b64);
      const f32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) f32[i] = (int16[i] ?? 0) / 32768;
      buffer = ctx.createBuffer(1, f32.length, rate);
      buffer.copyToChannel(f32, 0);
    } catch (err) {
      opts.onError?.(err instanceof Error ? err.message : String(err));
      return Promise.resolve();
    }

    playingCount++;
    gate(); // raise mic gate while TTS plays

    const turn = playChain.then(
      () =>
        new Promise<void>((resolve) => {
          if (stopped || !playCtx) return resolve();
          const src = playCtx.createBufferSource();
          src.buffer = buffer;
          src.connect(playCtx.destination);
          src.onended = () => resolve();
          try {
            src.start();
          } catch {
            resolve();
          }
        }),
    );

    playChain = turn.then(() => {
      playingCount = Math.max(0, playingCount - 1);
      if (playingCount === 0 && !serverSpeaking) scheduleUngate();
    });
    return turn;
  }

  function ensurePlayCtx(): AudioContext {
    if (playCtx) return playCtx;
    const Ctx: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    playCtx = new Ctx();
    return playCtx;
  }

  function stopPlayback() {
    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
    void playCtx?.close();
    playCtx = null;
    playChain = Promise.resolve();
    playingCount = 0;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  const api: VoiceClient = {
    state,

    async start() {
      if (!stopped) return;
      stopped = false;
      gated = false;
      serverSpeaking = false;
      setState("connecting");
      try {
        await connect();
        await startMic();
        setState("listening");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo iniciar la voz";
        console.error(`${LOG} start failed:`, err);
        opts.onError?.(msg);
        await this.stop();
        throw err;
      }
    },

    async stop() {
      stopped = true;
      stopMic();
      stopPlayback();
      if (ws) {
        try {
          ws.close();
        } catch {
          /* already closing */
        }
        ws = null;
      }
      gated = false;
      serverSpeaking = false;
      setState("idle");
    },

    setSpeak(on: boolean) {
      speak = on;
      send({ type: "config", speak, locale });
    },
  };

  return api;
}

// ── base64 <-> typed array helpers (local, no deps) ──────────────────────────

/** Float32Array → base64 of its raw little-endian bytes. */
function float32ToBase64(f32: Float32Array): string {
  return bytesToBase64(new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength));
}

/** base64 → Int16Array (little-endian samples). */
function base64ToInt16(b64: string): Int16Array {
  const bytes = base64ToBytes(b64);
  // Copy into an aligned buffer (base64 decode may not be 2-byte aligned).
  const aligned = new Uint8Array(bytes.length);
  aligned.set(bytes);
  return new Int16Array(aligned.buffer, 0, Math.floor(aligned.byteLength / 2));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000; // avoid arg-count limits on String.fromCharCode
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Mono Float32 downsample by block-averaging (mirrors use-recorder.ts). */
function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return new Float32Array(input);
  const ratio = from / to;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j] ?? 0;
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}
