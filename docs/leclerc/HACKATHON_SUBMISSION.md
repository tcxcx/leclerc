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

- **Works on the hosted link:** full UI across all routes; the `/api/qvac` proxy
  (OpenAI-compatible chat/transcribe) → real QVAC inference; and **capture →
  structured intel card** (the capturar page runs extraction client-side through
  the proxy, so it no longer needs the native SDK). On the Railway CPU station
  extraction takes ~60–90s; on a local `qvac serve` it is near-instant.
- **Local-only (by design):** the remaining SDK-backed routes (`/api/rag`,
  `/api/brief`, `/api/wallet`, `/api/drop`) load the native `@qvac/sdk` *bare*
  binary (HyperDB RAG workspaces, Holepunch, WDK) and cannot run on Vercel
  serverless. Voice uses a localhost WebSocket. **Run locally per the README to
  demo RAG recall → multi-agent brief → pay → dead-drop and the true offline
  story.** That's the local-first point: the real product runs on the operative's
  machine.

Treat the hosted link as a UI + inference-proxy preview (capture works, slowly,
on the shared CPU station); record the demo video locally where everything is fast
and fully featured. Mirror aliases: `leclerc-station`, `leclerc-field`,
`leclerc-app` `.vercel.app`.

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
`@leclerc/core`. Smoke logs, screenshots, QVAC profiler + logging-stream exports,
hardware capture, and PDF/DOCX output live under `artifacts/`. Bilingual
**EN / ES** via locale middleware.

**Proven (local run, artifact-backed):** voice loop; finance cards; capture →
structured intel card → encrypted dossier → QVAC RAG recall with citations;
multi-agent analyst brief with PDF/DOCX export; Tether WDK testnet wallet with a
guarded live-payment smoke; encrypted Hyperswarm dead-drop between two clients;
QVAC profiler/logging audit (model load + per-call TTFT/tokens-sec).

**Proven online (hosted link `leclerc-intel.vercel.app`):** full UI across all
routes; QVAC chat, transcription, and **capture → intel card** via the same-origin
`/api/qvac` proxy to an operator-controlled station (no third-party model API).
Extraction is ~60–90s on the shared CPU station, near-instant on a local
`qvac serve`.

**Partial / wired:** OCR, translation, and MedPsy are wired and gated on local
model sources (`LECLERC_OCR_SRC` / `LECLERC_TRANSLATE_SRC` / `LECLERC_MEDPSY_SRC`);
P2P delegated completion is wired and needs a second DHT-reachable provider to
fully prove; desktop/mobile shells compile and smoke to the expected
`missing-adapter` state. These heavy paths use the native `@qvac/sdk` (llama.cpp,
HyperDB RAG, Holepunch, WDK) and run on the operative's machine or a trusted
station — local-first by design, not on Vercel serverless.

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

---

# Judging questions (answers)

## Q1 — Reproducibility instructions + hardware specs for all devices

**Run it (one machine, full feature set, fast):**

```bash
bun install
cp apps/app/.env.example apps/app/.env.local   # fill only the optional vars you want
bun run dev:qvac     # terminal 1 — PWA + local QVAC station (http://localhost:7001/es)
bun run voice        # terminal 2 — voice WS service
```

Gates / proofs:

```bash
cd apps/app && bunx tsc --noEmit                       # typecheck
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services   # QVAC-only: no matches
bun run qvac:artifacts                                 # regenerate the audit log (Q3)
bun run wallet:smoke                                   # WDK testnet (skips live pay unless invoice set)
```

Hosted preview (no install): `https://leclerc-intel.vercel.app` (UI + QVAC chat /
transcribe / capture via the operator-controlled station proxy).

**Devices used in the demo:**

| Device / role | CPU | GPU | RAM | Storage | OS / runtime |
|---|---|---|---|---|---|
| Station laptop (primary inference, artifact capture) | Apple M4 Pro, 14-core (10P+4E) | Apple M4 Pro, 20-core, Metal 3 | 48 GB unified | ~1 TB SSD; model cache `~/.qvac/models` ~4–6 GB | macOS 15.7.1 (Mac16,8), Node v23.11.0, Bun 1.3.10 — `backendDevice: gpu` |
| Cloud QVAC station (powers the hosted link) | Railway Linux x64 container, **CPU-only** (no GPU) | none | container default | container volume model cache | `qvac serve` OpenAI-compatible; ~3.4 tok/s on llama-1b (why hosted extraction is ~60–90s) |
| Demo client (PWA) | _phone used to record the video_ | — | — | — | mobile browser, portrait ≤480px (install as PWA) |

Models (≤32 GiB laptop target): Qwen3 0.6B–1.7B Q4 (LLM/agents), Whisper (ASR),
EmbeddingGemma 300M (RAG); optional OCR / translation / MedPsy model sources.
The reproducible profiler run uses **Qwen3-0.6B-Q4** (`QWEN3_600M_INST_Q4`).
> Fill the phone row with the exact handset (model, chip, RAM) you record on.

## Q2 — Clear structured explanation of all remote APIs?

**Yes.** See [`docs/leclerc/REMOTE_APIS.md`](./REMOTE_APIS.md) — a structured table
of every remote endpoint (QVAC station, Tether WDK indexer + EVM RPC, optional
Circle/Rain, Google Fonts), with base URL, auth, callers, and what is explicitly
NOT used (no third-party LLM API, no external vector DB). Every variable is also
documented in `apps/app/.env.example`.

## Q3 — Structured audit log (model loads/unloads + inference perf: prompt, tokens, TTFT, tokens/sec) for one demo run?

**Yes.** See [`docs/leclerc/AUDIT_LOG.md`](./AUDIT_LOG.md). Captured via QVAC
`profiler` + `loggingStream` + `getLoadedModelInfo` + completion `stats`;
regenerate with `bun run qvac:artifacts`. Demo run (`artifacts/logs/m8-qvac-run-*.json`):

- **Model load** (`artifacts/hardware/m8-loaded-model-info-*.json`):
  `QWEN3_600M_INST_Q4`, `llamacpp-completion`, `loadedAt 2026-06-07T04:48:19.362Z`,
  load TTFB 302.8 ms (profiler).
- **Inference call**: TTFT **28.085 ms**, **246.8 tok/s**, promptTokens **62**,
  generatedTokens **24**, `backendDevice: gpu`, plus per-token deltas.
