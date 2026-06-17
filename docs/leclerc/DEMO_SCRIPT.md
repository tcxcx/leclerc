# LeClerc — 2-minute demo script

For the judged video. Target **~2:00**, ~280 spoken words. Record on the PWA at
`http://localhost:7001/es`. Bold = on-screen action; quoted = what you say.

> **One thread to narrate the whole way through:** *"Nothing you see touches a
> server I don't control."*

---

**[0:00 – 0:12] Cold open — prove it's offline.**
**Show the device's airplane-mode toggle turning ON.** Open the LeClerc Console.
> "This is LeClerc — Cleo for spies. Watch the airplane icon. From here on, the
> network is off. Every bit of AI runs locally through Tether QVAC."

**[0:12 – 0:38] Capture → structured intel card.**
**Tap the voice button, speak a field observation in Spanish** (e.g. *"Reunión en
el puerto a las 22:00, alias 'Halcón', vehículo gris"*). **Show live
transcription, then the intel card forming** — subject, entities, location, threat
level. **Tap Confirm.**
> "I dictate an observation. QVAC transcribes it on-device, then extracts a
> structured intel card — subject, entities, threat level. Confirm, and it's
> encrypted into the local dossier. Still offline."

**[0:38 – 1:00] Recall over the dossier (RAG).**
**In the search box, ask "¿qué sabemos sobre Halcón?"** **Show the grounded
answer with clickable record-id citations.**
> "Now I ask, in plain language, what do we know about Halcón. That's QVAC
> embeddings and RAG over the encrypted dossier — a grounded answer, citing the
> exact records. No cloud, no vector database."

**[1:00 – 1:25] Multi-agent analyst desk → brief.**
**Open Analyst desk, run the brief. Show 3+ agents streaming live** (Triage → Geo
→ Pattern → MedPsy). **The one-page IntelBrief renders; tap Export PDF.**
> "The analyst desk spins up multiple agents — triage, geo, pattern, and a MedPsy
> medic agent — with QVAC tool-calling. They produce a cited one-page brief I can
> export to PDF, all on this machine."

**[1:25 – 1:48] P2P — delegate + dead-drop.**
**Turn airplane mode OFF now.** **Delegate a heavy brief from the phone to the
paired laptop station — show it ran on the provider. Then dead-drop the brief to
the handler device.**
> "Only now do I turn the network on — by choice. I delegate a heavier model to my
> own paired laptop over an encrypted Holepunch link, and dead-drop the brief
> peer-to-peer to my handler. No server in the middle."

**[1:48 – 2:00] Pay + panic-wipe.**
**Pay a testnet Lightning invoice — show the confirm modal, then settled. Then tap
Panic-wipe.**
> "I pay an informant privately over Lightning — self-custodial, off-chain. And if
> the device is ever taken: one tap, dossier and seed gone. Local-first, end to
> end. Nothing touched a server I don't control."

---

### Recording notes
- Seed a couple of dossier records beforehand so RAG recall has something to cite.
- Keep airplane mode genuinely ON for beats 1–4 — it's the whole pitch; show the
  status bar.
- If a live model download/stream is slow, pre-warm the models before recording.
- Capture at phone-portrait (≤480px) — the UI is mobile-first.
- Optional B-roll: the QVAC profiler / logging stream to reinforce "on-device".
