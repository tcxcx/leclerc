# M1 Browser Voice Verification

Date: 2026-06-07

## What was proven

- `bun run voice:smoke` passed with cached QVAC models:
  - TTS synthesized the prompt.
  - Whisper/VAD transcribed: `Hola, ¿cuánto gasté esta semana?`
  - Qwen completion returned a spoken-safe answer after `<think>` stripping.
  - TTS synthesized the reply.
- App route `/api/chat` returned a QVAC answer after server-externalizing the native SDK packages:
  - `{"text":"Hola, ¿qué necesitas?"}`
- Browser opened the PWA at `http://localhost:7002/es`.
- Clicking the central voice control reached visible state `Escuchando`.
- Chrome reported active microphone capture.
- `services/voice` log recorded browser WebSocket connect, `transcribe` request start, and disconnect:
  - `client connected`
  - `kind=transcribe ... state=running`
  - `client disconnected`
  - `kind=transcribe ... state=completed durationMs=15143`

## Artifacts

- Voice chain log: `artifacts/voice/voice-smoke-2026-06-07T03-55-00Z.log`
- Live voice service log: `artifacts/voice/voice-server-2026-06-07T03-57-00Z.log`
- Browser listening screenshot: `artifacts/voice/home-listening-2026-06-07T04-00-00Z.png`

## Limitation

The browser pass verified the real WebSocket/microphone/listening path, but it did
not complete a spoken browser turn because no deterministic browser audio fixture
or real operator speech was available through the exposed automation tools. The
same ASR -> LLM -> TTS chain is smoke-proven by `voice:smoke`.
