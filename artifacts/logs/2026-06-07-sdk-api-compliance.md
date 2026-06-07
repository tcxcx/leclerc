# 2026-06-07 SDK API + compliance verification

Milestone: API-shape correction before runtime wiring.

Verified local SDK sources:
- `@qvac/sdk@0.12.2/dist/client/api/{load-model,completion-stream,rag,ocr,translate,provide,heartbeat}.d.ts`
- `@qvac/sdk@0.12.2/dist/schemas/{delegate,provide,model-types,translate}.d.ts`
- `@qvac/sdk@0.12.2/dist/examples/delegated-inference/{provider,consumer,consumer-profiled}.js`
- `@tetherto/wdk-wallet-evm@1.0.0-beta.13/types/src/wallet-account-read-only-evm.d.ts`
- `@tetherto/wdk-wallet-spark@1.0.0-beta.19/types/src/wallet-account-spark.d.ts`

Corrections made:
- OCR model loading now uses QVAC model type `ocr`.
- Translation loading now uses `LECLERC_TRANSLATE_MODEL_TYPE=llm|nmt`, default `nmt`.
- `translateText` now sends NMT params without `to/from`, and LLM params with `to/from`.
- P2P delegation now passes `delegate` to `loadModel`, then runs `completion` on the delegated `modelId`.
- EVM token transfer now uses WDK `recipient` rather than `to`, with amount in base units.
- Literal compliance grep comments were reworded; generated `.next` cache was removed.

Verification:
- `cd apps/app && bunx tsc --noEmit` -> PASS.
- `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services` -> PASS (no matches).
- `cd packages/qvacs && bun run smoke.mjs` -> PASS.
  - Loaded cached `EMBEDDINGGEMMA_300M_Q8_0`.
  - Embedded 3 docs, saved to QVAC RAG, searched `¿dónde se vio a Halcón?`.
  - Top hits included `rec-1` and `rec-3`; round-trip ended with `embed + RAG round-trip OK`.

Known note:
- `cd packages/qvacs && bunx tsc --noEmit` currently fails because the package context cannot resolve the `node` type library directly. The app typecheck covers the workspace import path; package-local type resolution should be normalized later.
