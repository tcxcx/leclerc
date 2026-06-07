# 13 · LeClerc as Cleo for spies (voice-first plan)

The product pivot: from 8 utilitarian tabs to **one beautiful conversational home**,
voice-first, with a personality, where you just ask and the app acts. Modeled on
Cleo (meetcleo.com): a single "Ask me anything" surface, four quick actions, money
coaching with attitude. LeClerc adds the spy layer underneath (intel, RAG recall,
brief, dead-drop) and runs it all **locally on QVAC**.

## Locked decisions
- **Voice:** continuous, hands-free (Silero VAD streaming loop). Station-side.
- **Identity:** finance-led shell (looks like Cleo: Spend / Ask / Stash / Request);
  spy gadgets reachable as chips and deep links.
- **Tone + look:** Cleo's sassy money-coach voice, in our **dark field-console** theme.

## Home screen (the only screen that matters)
```
Hola, operativo.                          greeting (time/context aware)
┌───────────────────────────────┐
│ "mis finanzas son un desastre" │        your bubble
└───────────────────────────────┘
Lo dices cada domingo 🙂                   assistant, with bite
Voy a sacar tus gastos y armar un plan.   then it acts
[gastos recientes] [ahorro] [sujeto: Halcón]   RAG/intent chips, tappable
┌───────────────────────────────┐
│ Pregúntame lo que sea…     〰️ │        text + voice (waveform pulses on listen)
└───────────────────────────────┘
  ↗ Spend     ◎ Ask     ↙ Stash     $ Request
```
- Rolling conversation of bubbles; assistant replies sassy, then performs the action.
- One input pill: type or tap the waveform to go hands-free.
- **RAG is visible:** `ragSearch` hits + quick intents render as tappable chips under
  answers (no hidden embeddings). Tapping a chip asks the follow-up.
- Bottom bar: finance-led four. Center "Ask" is the voice/assistant button.
- Long-press "Ask" (or a top-corner shield) opens the **Intel** layer (dossier,
  brief, capture, dead-drop) for the spy face.

## Voice architecture (continuous VAD, station-side)
`@qvac/sdk` voice runs in Node/Bare, never the browser. The PWA does mic capture +
audio playback; a **station voice service** runs the ASR to LLM to TTS loop and
streams over a WebSocket.

```
PWA (browser)                         Station voice service (Node, infra/voice/server.mjs)
  getUserMedia → PCM 16k f32le  ──WS──▶  transcribeStream (Whisper + Silero VAD)
  (gate mic while assistant speaks)        → utterance on VAD pause
  play TTS audio  ◀──WS── audio frames     → completion (Qwen3 / MedPsy, streamed)
  render tokens   ◀──WS── token stream     → textToSpeech (Supertonic, PCM)
```

Model chain (verified against @qvac/sdk@0.12.2 examples):
- **ASR:** `loadModel({ modelSrc: WHISPER_BASE_Q8_0, modelType: "whisper", modelConfig: { vadModelSrc: VAD_SILERO_5_1_2, audio_format: "f32le", language: "es", vad_params } })` then `transcribeStream({ modelId })`.
- **LLM:** `completion({ modelId, history, stream: true })`. Qwen3-1.7B/4B; MedPsy for the medic/health-intel mode.
- **TTS:** `loadModel({ modelSrc: TTS_MULTILINGUAL_SUPERTONIC2_Q8_0, modelType: "tts", modelConfig: { ttsEngine: "supertonic", language: "es", voice: "F1" } })` then `textToSpeech({ modelId, text, inputType: "text" })` to PCM. (Use `TTS_EN_SUPERTONIC_Q8_0` for en.)

Guardrails (from the Tether voice-assistant example, required):
- **Mic gate during playback:** client stops sending PCM frames while `isSpeaking`.
- **Post-playback cooldown** ~300ms before listening resumes (room reverb).
- **VAD params:** `threshold 0.6, min_speech_duration_ms 300, min_silence_duration_ms 700, max_speech_duration_s 15, speech_pad_ms 200`. Raise threshold/silence if it self-hears.
- **Drop phantom transcripts:** empty, `[BLANK_AUDIO]`, sub-3-char (reuse `isMeaningful` from `lib/intel/assemble`).

WS protocol (one JSON line per event):
- client→server: `{type:"audio", pcm:<base64 f32le>}`, `{type:"speaking", value:bool}`, `{type:"config", locale, speak:bool}`
- server→client: `{type:"transcript", text}`, `{type:"token", text}`, `{type:"answer", text}`, `{type:"audio", pcm:<base64 s16le>, rate}`, `{type:"chips", items:[{label,intent,recordId?}]}`

Transport: a standalone Node WS service (`infra/voice/server.mjs`, `ws` package),
launched alongside `bun run qvac`. Next.js route handlers don't do raw WS, so the
voice service is its own process; the rest of the app keeps using `/api/*` + `:11434`.
"Answers as audio or text" is the `config.speak` flag (TTS optional; text always).

## The brain (one assistant, two domains)
A single system prompt sets the voice (concise, funny, a little savage, never markdown
when spoken) and routes every ask through QVAC tool-calling:
- **Finance (the face):** spend breakdown + roast over **local** transactions, budgets,
  save goals, request/pay over Lightning (WDK). All on-device, private.
- **Spy (underneath):** recall (RAG), capture intel, brief (analyst desk), doc intel
  (OCR), dead-drop (P2P). All already built.

Personality prompt lives in `lib/agents/persona.ts`; the four bottom actions and the
chips are tools the model can name. Side-effecting tools (pay, dead-drop, wipe) still
require explicit confirm.

## Bottom bar (finance-led)
- **Spend** → breakdown + roast of local tx.
- **Ask** (center) → hands-free voice / chat.
- **Stash** → save goals, move to vault.
- **Request** → request or send funds (Lightning).
Intel/Recon is one tap away (long-press Ask or the shield), keeping the finance face
Cleo-clean while the spy layer stays reachable.

## Finance data (local-first)
No bank API for v1. Sources: WDK balances/history (testnet) + a local `transactions`
store (IndexedDB, same encrypted envelope as the dossier) the user/agent can add to.
Spend insights are computed locally; the LLM narrates them with attitude. Real bank
linking (Plaid-style) is post-hackathon.

## Build phases (toward this)
1. **Shell:** replace the tab nav with the Cleo conversational home + 4-action bar;
   demote `expediente/analisis/billetera/enlace` to deep links (long-press Ask / shield).
2. **Voice service:** `infra/voice/server.mjs` (Whisper+VAD → completion → Supertonic)
   + WS; PWA mic capture (streaming variant of `use-recorder`) + audio playback + the
   speak/text toggle + mic-gate.
3. **Chat surface:** message bubbles, streamed tokens, RAG chips component.
4. **Finance brain:** local `transactions` store + Spend/Stash/Request backed by WDK +
   tool-calling, persona prompt.
5. **Polish:** dark Cleo motion, waveform listen states, es/en, empty states, the demo.

## File-level changes
- New: `apps/app/src/app/[locale]/page.tsx` becomes the conversational home;
  `components/{chat-bubble,chips,voice-button,action-bar}.tsx`;
  `lib/voice/client.ts` (WS + mic + playback); `lib/agents/persona.ts`;
  `lib/finance/{store-client,insights}.ts`; `infra/voice/server.mjs`; voice launch
  script + `bun run voice`.
- Keep + reuse: all of `lib/{qvac,rag,agents,wallet,intel,p2p}`, i18n, crypto, theme.
- Demote (still reachable): the standalone `expediente/analisis/billetera/enlace` screens.

## Open verification for build time
- `TTS_MULTILINGUAL_SUPERTONIC2_Q8_0` + `language:"es"` voice quality; fall back to
  `TTS_EN_SUPERTONIC_Q8_0` if es is weak.
- Confirm `transcribeStream` async-iterator shape and `textToSpeech` PCM rate (44100
  for Supertonic) against the installed `.d.ts` before wiring the WS service.
- Browser mic → station latency budget; chunk size for f32le frames.
