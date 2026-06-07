# 08 · UX, Screens & Demo Script

> The baseline already has the recording→processing→report→export flow (`apps/app/src/app/{,grabar,informe/[id],registro}`). Re-theme it and add the new surfaces. Design language: dark, terminal-adjacent, "field console". Keep the existing accessible fonts.

## 1. Screen map (under `[locale]/`)

| Route | Was (halketon) | LeClerc |
|---|---|---|
| `/` | record-type selector | **Console** — quick capture, recent dossier, station/peer status, mode badge (ondevice/delegate/station) |
| `/capturar` | `/grabar` | **Capture** — record/dictate or type; live transcribe (VAD); shows extraction forming |
| `/expediente` | (new) | **Dossier** — list of `IntelRecord`s, threat filter, search box (RAG) |
| `/expediente/[id]` | `/informe/[id]` | **Record** — full card, attachments (OCR), edit, confirm, export, dead-drop |
| `/analisis` | (new) | **Analyst desk** — pick focus/records → run agents (live progress) → `IntelBrief` → export/TTS/drop |
| `/billetera` | (new) | **Wallet** — balances (USDT, sats), pay (confirm modal), receive invoice |
| `/enlace` | (new) | **Link/Pairing** — show station `publicKey` QR; join a drop topic; peer status |
| `/ajustes` | (new) | **Settings** — locale, model level (media/alta/medico=MedPsy), passphrase lock, **panic-wipe** |

## 2. Key flows

**Capture → record.** Mic or text → `transcribe`/typed → `completion` (grammar-constrained `IntelExtraction`) → editable card → Confirm → encrypt + `putRecord` + `ragIngestDocs`. Mode badge shows where inference ran.

**Recall (RAG).** Dossier search box → `ragQuery` → grounded `completion` answer with clickable record-id citations.

**Document intel.** On a record, "Add document" → photo → `ocr` (+ `translate` if foreign) → appended as attachment, ingested into RAG.

**Analyst desk.** `/analisis` → choose focus → live agent progress (Triage→Dedup→Geo→Pattern→[Medic]) → `IntelBrief` → DOCX/PDF + optional spoken readout (`textToSpeech`) + "Dead-drop to handler".

**Pay an asset.** From a record or wallet → enter invoice/recipient → **confirm modal** (amount/network/recipient) → `payLightning`/`paySableEvm` → receipt saved locally.

**Pair & drop.** `/enlace` shows station QR; another device scans → delegation enabled. Share a mission drop-topic → send brief P2P.

## 3. Re-theme via i18n (no separate copy file)
All labels live in `messages/{es,en}.json`. EN = overt spy theme; ES = field-intel. Threat enum labels: `CRITICO/ELEVADO/RUTINARIO` ↔ `CRITICAL/ELEVATED/ROUTINE`.

## 4. The judged demo script (≈3 min, record it — artifact)

1. **Airplane mode ON** (show it — this is the whole pitch). Open Console.
2. **Capture** a spoken field observation (ES). Watch local transcription + structured card form. Confirm → saved.
3. **Photograph a document** (foreign language). OCR + translate on-device. Attach.
4. **Recall:** ask "¿qué sabemos sobre <alias>?" → grounded answer citing records. Still offline.
5. **Analyst desk:** run the brief. Show 3+ agents + tool calls in a live log. Show the **MedPsy medic agent** on a medical record (Psy track). Export PDF. Play TTS readout.
6. **P2P:** turn airplane mode off only now; **delegate** a heavy `qwen3-4b` brief from the phone to the laptop station (show it ran on the provider). **Dead-drop** the brief to the handler device.
7. **Pay an asset:** Lightning payment to an informant (testnet) — confirm modal → settled off-chain.
8. **Panic-wipe:** one tap, dossier + seed gone.

Narrate the threat model: *nothing touched a server we don't control.*

## 5. Polish bar
- Mode/peer/threat badges always visible (judges reward the P2P + performance story being legible).
- Every long op streams progress (transcribe tokens, agent steps, model download).
- Empty/error states in both locales.
