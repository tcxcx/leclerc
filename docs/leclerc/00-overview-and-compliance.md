# 00 · Overview & Hackathon Compliance

## 1. The product

LeClerc is a **local-first field-intelligence station**. An operative in the field:

1. **Captures** observations by voice or text (offline, airplane mode on).
2. Gets a **structured intel card** (subject, entities, location, threat level, actions) extracted locally.
3. **Recalls** prior intel via natural-language **RAG over the dossier** — fully offline.
4. **Reads/translates** photographed documents (OCR + translate), all on-device.
5. Spins up a **multi-agent analyst desk** (threat / geo / pattern) to produce a one-page brief.
6. **Pays an asset** privately via a self-custodial Lightning wallet (Tether WDK).
7. **Delegates** heavy analysis to a paired "safehouse" laptop and **dead-drops** the brief peer-to-peer — no server, minimal metadata.

The existing halketon-app baseline already provides the spine for steps 1–2 (voice→transcribe→structured-JSON→export). LeClerc re-themes it and adds 3–7.

## 2. Threat model (why local-first is the whole point)

| Adversary capability | LeClerc mitigation |
|---|---|
| Network interception / traffic analysis | Default offline; inference + RAG on-device; P2P over encrypted Hyperswarm, no central server |
| Server compromise / subpoena | No server holds intel; dossier is local, encrypted at rest |
| Device seizure | Encryption-at-rest (key derived from passphrase, not stored); panic-wipe |
| Payment surveillance | Self-custodial wallet; Lightning off-chain payments not broadcast on-chain |
| Cloud AI provider logging | Zero — all inference via QVAC locally or to a peer you control |

**Design rule:** every feature must answer "does this leak to anyone the operative doesn't control?" If yes, it's off by default and gated behind explicit action.

## 3. Mandatory requirements → how we satisfy them

| Mandatory requirement | How LeClerc satisfies it | Doc |
|---|---|---|
| **QVAC SDK for ALL AI inference and RAG** | `completion`, `transcribe`, `ocr`, `translate`, `embed`, `rag*` all via `@qvac/sdk`. transformers.js path removed from judged flows. | [02](./02-qvac-integration.md) |
| **Follow one track's hardware constraints** | Primary **General Purpose** (≤32 GB laptop runs QVAC). Mobile demo client delegates over P2P. | §4 below |
| **Full reproducibility + hardware setup** | `docs/leclerc/11` + repo README; one-command `bun run dev:qvac`; documented model set + hardware. | [11](./11-codex-guide.md) |
| **Complete artifacts (logs, demo video, hardware proof)** | QVAC `loggingStream` + `profiler` exports captured to `artifacts/`; scripted demo; `getLoadedModelInfo` hardware/backend proof. | [11](./11-codex-guide.md) |

## 4. Track strategy — "Both via P2P"

**Primary: General Purpose.** The laptop is the "safehouse station": Node + `@qvac/sdk` runs `completion`/`embed`/`rag*`/`ocr` with MedPsy-4B / Qwen3-4B fully offloaded to GPU. This is closest to the current baseline → fastest to ship.

**Secondary: Mobile.** A native **Expo + Bare** app runs QVAC + voice **on-device** (Mobile track), or the PWA-on-a-phone **delegates** heavy jobs to a desktop/laptop via `startQVACProvider` + `completion({ delegate: { providerPublicKey } })` over the Hyperswarm DHT (Tinkerer / phone→laptop story).

**Bonus track: "Our Psy models".** Use **MedPsy-1.7B/4B** for a field-medic intel mode (assessing an asset's medical state / casualty triage notes). Nearly-free second submission. See [02](./02-qvac-integration.md) §model-selection.

**One Cleo UX, three surfaces from one monorepo** ([14](./14-surfaces-and-shared-core.md)): **PWA** (web, ships first), native **Desktop** (Pear+Electron → General Purpose), native **Mobile** (Expo+Bare → Mobile track). Native shells host QVAC on-device in a Bare worklet (PearPass blueprint, `references/`); the PWA uses the station voice service or P2P delegation.

Measurement note from rules: with multiple inference devices, the most capable one is "the main." Desktop/laptop is the main → General Purpose; the mobile app and PWA delegation are additive surfaces.

## 5. Core criteria → where we earn points

| Criterion | LeClerc evidence |
|---|---|
| Innovation (edge/P2P AI) | QVAC + Holepunch dead-drop; spy threat model native to local-first |
| Capabilities (multi-agent + tools) | Analyst desk: orchestrated agents w/ QVAC tool-calling ([04](./04-agents-and-tools.md)) |
| Artifact quality | Logs/profiler/video pipeline ([11](./11-codex-guide.md)) |
| Performance (P2P load distribution, constrained devices) | Phone→laptop delegation, model-tier selection, suspend/resume on mobile |
| Complexity & UX | Capture→RAG→brief→pay→drop, bilingual, polished re-theme ([08](./08-ux-and-demo.md)) |
| Model usage & coverage | LLM (Qwen3/MedPsy) + Whisper + OCR + translate + embeddings, all QVAC |
| Early-bird bonus | Target submission **before June 17** ([10](./10-build-plan.md)) |
| Build-in-public bonus | Public dev log / posts (optional, see [11](./11-codex-guide.md)) |

## 6. v1 scope (locked)

In scope for the June-17 cut:
- Capture + Dossier RAG (the spine)
- Multi-agent analyst desk → one-page brief (DOCX/PDF)
- Document intel (OCR) + translate
- P2P delegation + Hyperswarm dead-drop
- Tether WDK wallet — private (Lightning) payments with real self-custodial wallets
- Bilingual EN/ES via locale middleware

Out of scope for v1 (stretch): diffusion/video, fine-tuning/LoRA, full multi-peer swarm, on-chain mixing.
