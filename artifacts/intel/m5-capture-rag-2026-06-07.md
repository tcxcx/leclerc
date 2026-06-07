# M5 capture/RAG/document smoke - 2026-06-07

Status: PASS
Record id: 202d3e6b-0e89-4c9a-8250-efcd27d814b4
Summary: El operativo observa a Condor Azul entregando una caja Kestrel a Nina, con una reunión prevista en Darsena 4 antes de medianoche, aunque el riesgo está elevado por material cifrado.
Threat: ELEVADO
Recall sources: 202d3e6b-0e89-4c9a-8250-efcd27d814b4
Document probe: LECLERC_OCR_SRC not set (document-intel feature).

Artifacts:
- artifacts/intel/m5-capture-rag-2026-06-07.json
- artifacts/intel/m5-home-intel-layer-2026-06-07.png
- artifacts/intel/m5-record-document-controls-2026-06-07.png

Browser UI:
- Home shield opened the intel layer with Capture, Dossier, Analysis, and Link.
- Record detail rendered attachment section, add-document upload, and optional
  translate toggle.

Document model note:
- OCR route is wired and verified against installed QVAC OCR signatures.
- Live OCR is blocked until `LECLERC_OCR_SRC` is set to a QVAC OCR model.
- Optional translation is wired and requires `LECLERC_TRANSLATE_SRC` when enabled.

Gates:
- `cd apps/app && bunx tsc --noEmit` — pass.
- `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services` — pass after removing generated `.next`.
- `git diff --check` — pass.
