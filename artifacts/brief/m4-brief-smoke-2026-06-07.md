# M4 analyst desk smoke - 2026-06-07

Status: PASS
Title: Análisis de inteligencia - Vector Gris, entrega Darsena 4, herida Sujeto Alfa
Threat: CRITICO
Findings: 3
Geo clusters: 5
Agents: triage -> geo -> pattern -> synth
Tool log: triage/list_records/ok:3 records ranked; geo/extract_locations/ok:5 places clustered; pattern/rag_search/ok:0 RAG hits; synth/completion_json/ok:3 findings synthesized

Artifacts:
- artifacts/brief/m4-brief-smoke-2026-06-07.json
- artifacts/brief/m4-brief-smoke-2026-06-07.pdf
- artifacts/brief/m4-brief-smoke-2026-06-07.docx
- artifacts/brief/m4-analysis-ui-2026-06-07.png

Browser UI:
- `/es/analisis` empty state exposed `Cargar expediente demo`.
- Seeded demo records from the UI and ran the analyst desk.
- Rendered BLUF, cited findings, geo clusters, key entities, recommendations,
  agent/tool log, and PDF/DOCX export buttons.

Gates:
- `cd apps/app && bunx tsc --noEmit` — pass.
- `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services` — pass after removing generated `.next`.
- `git diff --check` — pass.
