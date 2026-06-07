# M7 MedPsy medic-mode smoke - 2026-06-07

Status: PARTIAL
Medic agent log: fallback - LECLERC_MEDPSY_SRC not set (MedPsy medic mode).
Agents: triage -> geo -> pattern -> medic -> synth
Findings: 4

Model note:
- `LECLERC_MEDPSY_SRC` is not configured here, so the medic path is surfaced but blocked from a real MedPsy run.

Artifacts:
- artifacts/medpsy/m7-medpsy-smoke-2026-06-07.json
- artifacts/medpsy/m7-analysis-medic-ui-2026-06-07.png
- artifacts/medpsy/m7-settings-medpsy-ui-2026-06-07.png

UI proof:
- `/es/analisis` exposes `Incluir analista médico (MedPsy)`.
- `/es/ajustes` exposes the `Médico (MedPsy)` model level.

Gates:
- `cd apps/app && bunx tsc --noEmit` — pass.
- `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services` — pass after removing generated `.next`.
- `git diff --check` — pass.
