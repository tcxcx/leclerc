# LeClerc — BUIDL Submission (copy-paste ready)

Everything below maps 1:1 to the "Create a new BUIDL" form. Copy each block into
the matching field.

---

## Profile → BUIDL name

```
LeClerc
```

## Profile → BUIDL logo

**Ready to upload:** `docs/leclerc/leclerc-logo-480.png` (480×480 PNG, < 2 MB) —
the navy-disc mark (steel-blue "L" bracket + radar arc + ember dot, field-reporter
motif). Also wired throughout the app (favicons, PWA/Apple icons, manifest,
in-app header). Source: `apps/app/public/leclerc-logo-full.png`. The
[§ Logo generation prompt](#logo-generation-prompt) below is kept as a fallback if
a clean-IP redraw is wanted.

## Profile → Category

Primary track: **General Purpose** (laptop/desktop "station" runs QVAC on a
≤32 GiB machine). Secondary: **Our Psy** (MedPsy field-medic mode). Also tells a
**P2P / Mobile** story (phone → laptop delegation + Hyperswarm dead-drop).
→ Pick **General Purpose** if a single category is required.

## Profile → Is this BUIDL an AI Agent?

**Yes.** *(The form defaults to "No" — change it.)* LeClerc runs a multi-agent
analyst desk: orchestrated agents (Triage → Dedup → Geo → Pattern → MedPsy) with
QVAC grammar-constrained tool-calling produce a cited one-page brief. There is
also a wallet agent with MCP/x402 tool access.

---

## Vision → "Describe the problem which this project solves"

> The people who most need AI in the field — journalists, humanitarian workers,
> investigators, operatives — are exactly the people who cannot send their data to
> someone else's cloud. Every mainstream AI assistant logs prompts, needs
> connectivity, and turns a sensitive observation into a row in someone else's
> database. In a hostile or low-connectivity environment that is not a privacy
> footnote — it is a safety problem. Device seizure, network interception, a
> subpoena to a cloud provider, or payment surveillance can each burn a source.
>
> LeClerc removes the server from the threat model. It is a local-first,
> voice-first field-intelligence station that runs entirely on the operative's own
> device: capture an observation by voice, get a structured intel card, recall
> prior intel in natural language (RAG over an encrypted dossier), read and
> translate photographed documents, run a multi-agent analyst desk to write a
> one-page brief, pay an asset privately over Lightning, and dead-drop the result
> peer-to-peer to a handler — with the network off the whole time. Every piece of
> AI (transcription, completion, embeddings/RAG, OCR, translation, TTS) runs
> through Tether's QVAC SDK on-device, or is delegated to a paired machine the
> operative owns over an encrypted Holepunch link. No third-party model API and no
> external vector database are in the judged path. The design rule for every
> feature is one question: *does this leak to anyone the operative doesn't
> control?* If yes, it is off by default.

---

## Links

| Field | Value |
|---|---|
| GitHub repo | `https://github.com/tcxcx/leclerc` |
| Project website | `https://leclerc-intel.vercel.app` |
| Demo video (required) | *(paste YouTube link after recording — see DEMO_SCRIPT)* |

**Live deployment note (tested with browser QA).** `leclerc-intel.vercel.app` is
the PWA UI plus a live, same-origin `/api/qvac` proxy that forwards to an
operator-controlled QVAC station on Railway — verified end-to-end (the proxy
returns the model list and a real chat completion, no third-party model API). What
to know before demoing on the link:

- **Works on the hosted link:** full UI across all routes, and the `/api/qvac`
  proxy (OpenAI-compatible chat/transcribe) → real QVAC inference.
- **Local-only (by design):** the SDK-backed route handlers (`/api/capture`,
  `/api/rag`, `/api/brief`, `/api/wallet`, …) load the native `@qvac/sdk` *bare*
  binary, which cannot run on Vercel serverless — they return 500 on the hosted
  link. Voice uses a localhost WebSocket. **Run locally per the README to demo
  capture → RAG → brief → pay → dead-drop and the true offline story.** That's the
  local-first point: the real product runs on the operative's machine.

Treat the hosted link as a UI + inference-proxy preview; record the demo video
locally. Mirror aliases: `leclerc-station`, `leclerc-field`, `leclerc-app`
`.vercel.app`.

## Social links (at least one)

| Field | Value |
|---|---|
| Link 1 | `https://x.com/<your-handle>`  ← **fill in** |
| Link 2 | `https://github.com/tcxcx` |
| Link 3 | *(optional)* |

---

## Team → "Team information" (short description)

```
Solo builder (tcxcx). Forked from a local-first voice→structured-report baseline
and rebuilt around Tether QVAC for the hackathon: on-device inference + RAG,
Holepunch P2P delegation/dead-drop, and a self-custodial Tether WDK wallet.
```

---

## Describe your BUIDL (the main markdown box)

Paste everything between the rulers into the rich-text/markdown editor.

---

**LeClerc — "Cleo for spies."** A local-first, voice-first field-intelligence
station. Capture, recall, analyze, pay, and dead-drop intel — *with the network
off*. Every byte of AI runs through **Tether QVAC** on hardware the operative
controls. Nothing touches a server we don't own.

### The problem

The people who most need AI in the field — journalists, humanitarian and aid
workers, investigators, field operatives — are the same people who cannot afford
to send their data to a cloud. Mainstream assistants log prompts, require
connectivity, and convert a sensitive observation into a row in someone else's
database. In the field that is a safety problem, not a privacy footnote.

### What it does

- 🎙️ **Capture** — speak or type a field observation (offline). QVAC `transcribe`
  (Whisper, VAD) + grammar-constrained `completion` extract a structured
  **intel card**: subject, entities, location, threat level, recommended actions.
- 🧠 **Recall (RAG)** — ask "what do we know about \<alias\>?" in natural language.
  QVAC `embed` + `rag*` over an **encrypted on-device dossier** return a grounded
  answer with clickable record-id citations. Still offline.
- 📄 **Document intel** — photograph a foreign document → QVAC `ocr` + `translate`
  on-device → appended as an attachment and ingested into RAG.
- 🕵️ **Analyst desk** — a **multi-agent** pipeline (Triage → Dedup → Geo → Pattern
  → MedPsy) with QVAC tool-calling streams live progress and produces a cited
  one-page **IntelBrief**, exportable to **PDF / DOCX** with an optional spoken
  readout (QVAC `textToSpeech`).
- 💸 **Pay an asset** — self-custodial **Tether WDK** wallet. Private off-chain
  **Lightning/Spark** payments (testnet) and EVM USDT, with an amount/network/
  recipient confirm modal. Seed phrases are runtime-only.
- 🛰️ **P2P delegate + dead-drop** — turn the network on *only when you choose*:
  delegate a heavy `qwen3-4b` brief from a phone to a paired laptop "safehouse"
  station (`startQVACProvider` + `completion({ delegate })` over the Holepunch
  DHT), then **dead-drop** the brief to a handler device over encrypted
  Hyperswarm. No central server, minimal metadata.
- 🧨 **Panic-wipe** — one tap erases the dossier and the seed.

### Why local-first is the entire point (threat model)

| Adversary capability | LeClerc mitigation |
|---|---|
| Network interception / traffic analysis | Default offline; inference + RAG on-device; P2P over encrypted Hyperswarm, no central server |
| Server compromise / subpoena | No server holds intel; dossier is local, encrypted at rest |
| Device seizure | Encryption-at-rest (key derived from passphrase, never stored) + panic-wipe |
| Payment surveillance | Self-custodial wallet; Lightning payments settle off-chain |
| Cloud-AI provider logging | Zero — all inference via QVAC locally or to a peer you control |

### How QVAC is used (mandatory: all AI via QVAC)

`completion` (Zod/grammar-constrained tool-calling) · `transcribe` (Whisper +
VAD) · `embed` + `ragChunk/ragIngest/ragSearch/ragReindex` (HyperDB workspaces) ·
`ocr` · `translate` · `textToSpeech` · `classify` · `startQVACProvider` +
delegated `completion` (Holepunch DHT) · `suspend/resume` · `profiler` /
`loggingStream` / `getLoadedModelInfo` (captured as artifacts). A CI grep gate
keeps `huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone` out
of the judged paths — it returns **no matches**.

### Models (tuned for a ≤32 GiB laptop)

Qwen3 (0.6B–4B) for completion/agents · Whisper for ASR · EmbeddingGemma for
RAG · optional OCR / translation / **MedPsy** (Our Psy track) model sources.
Profiler proof uses the small reproducible Qwen3-600M-Q4 run.

### What's built and proven

One Bun monorepo ships a **Next.js 16 PWA** (the judged surface) plus scaffolded
**desktop** (Pear + Electron) and **mobile** (Expo + Bare) shells over a shared
`@leclerc/core`. Smoke logs, screenshots, profiler/logging exports, and PDF/DOCX
output live under `artifacts/`. Bilingual **EN / ES** via locale middleware.

**Proven:** voice loop, finance cards, capture → encrypted dossier → RAG recall,
multi-agent brief + export, WDK testnet wallet (with a guarded live-payment
smoke), and an encrypted Hyperswarm dead-drop between two clients.
**Partial / wired:** live OCR/translate/MedPsy (need local model sources); P2P
delegated completion (needs a second DHT-reachable provider to fully prove);
native shells compile and smoke to the expected `missing-adapter` state.

### Run it

```bash
bun install
cp apps/app/.env.example apps/app/.env.local
bun run dev:qvac     # terminal 1 — PWA + local QVAC station
bun run voice        # terminal 2 — voice WS service
# open http://localhost:7001/es
```

Repo: `https://github.com/tcxcx/leclerc` · see `SUBMISSION.md` and `artifacts/`
for the full proof set.

---

## Logo generation prompt

Paste into your image model of choice (e.g. an 1:1 / 480×480 request). Two
variants — pick one.

### Variant A — emblem mark (recommended for an app icon)

```
App icon for "LeClerc", a covert local-first field-intelligence station.
Square 1:1, 480x480, centered emblem on a solid near-black field-console
background (#0a0e14, never pure black). The mark: a minimal geometric monogram
"L" constructed from precise hairline strokes that also reads as a radar /
dead-drop sweep — a single thin concentric arc sweeping out from the lower-left
corner of the L, like a covert ping. Two scarce accent colors only: steel-blue
(#5b8cff) for the L strokes and the arc, and a single small ember-amber (#ffb95f)
dot as the "signal" origin point. Subtle, heavily-blurred and dimmed atmospheric
gradient behind the mark drifting from steel-teal into faint ember, very
low-contrast (tenue). Premium, hushed, covert, Linear-grade restraint. Flat
vector, crisp edges, no text, no gloss, no drop shadow, no 3D, no gradients on
the mark itself. Looks sharp at 48px.
```

### Variant B — wordmark lockup (for headers / landing)

```
Minimal logo lockup for "LeClerc". The word "LeClerc" set in an editorial soft
serif (Fraunces-like), warm off-white (#e6ebf5), on a near-black field-console
background (#0a0e14). To the left, a small steel-blue (#5b8cff) emblem: a thin
geometric "L" with a single concentric radar/ping arc and one tiny ember-amber
(#ffb95f) signal dot. One faint, heavily-blurred steel-teal-into-ember gradient
behind everything, dimmed. Covert, premium, hushed. No 3D, no gloss, no shadow,
flat vector, lots of negative space, centered, 1:1 safe.
```

**Brand palette (keep the logo on-brand):** canvas `#0a0e14` · intel/primary
steel-blue `#5b8cff` · money/data ember-amber `#ffb95f` · text `#e6ebf5`. Two
accents, period.
