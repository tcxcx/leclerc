# 09 · Reuse Map (port, don't rebuild)

Exact assets to lift from sibling repos in `~/coding-dojo/`. Copy patterns/files into LeClerc; do not add cross-repo dependencies.

## From `halketon-app` (this repo — the baseline, already here)
| Asset | Path | Action |
|---|---|---|
| QVAC SDK wrapper | `packages/qvacs/src/index.ts` | Keep; extend (embed/rag/ocr/translate) per [02](./02-qvac-integration.md) |
| OpenAI-compat client | `apps/app/src/lib/qvac/client.ts` | Keep as-is |
| Inference routing | `apps/app/src/lib/inference/{index,mode}.ts` | Re-map backends; **delete** `offline-engine.ts` |
| Report schema/store | `apps/app/src/lib/reports/{schema,store-client,assemble}.ts` | Re-theme → `intel/` ([03](./03-data-and-rag.md)) |
| DOCX/PDF export | `apps/app/src/lib/reports/export/*` | Re-theme → brief renderer ([04](./04-agents-and-tools.md)) |
| Model level switch | `apps/app/src/lib/llm-level.ts` | Extend with `medico`=MedPsy |
| QVAC server config + launchers | `infra/qvac/*`, `scripts/dev-qvac.sh` | Add MedPsy/embeddings/OCR models |

## From `sendero` (vertical-AI-agent template — richest source)
| Asset | Path | Use for |
|---|---|---|
| Agent turn engine | `packages/agent/src/run.ts` | Reference for orchestrator structure ([04](./04-agents-and-tools.md)) |
| Tool registry (single source → MCP/OpenAPI) | `packages/tools/src/index.ts`, `pricing.ts` | Pattern for `apps/app/src/lib/agents/tools.ts` |
| Scoped-key / confirmation gating | `packages/auth/src/dispatch-auth.ts` | Side-effecting-tool confirmation gate |
| Encryption (per-tenant DEK, HKDF, pgcrypto AES-256) | `packages/encryption/*` | Dossier + seed encryption-at-rest ([03](./03-data-and-rag.md)) |
| OCR / passport vault / offline MRZ | `packages/{ocr,vault}/*` | Reference; **replace Gemini OCR with QVAC `ocr`** (compliance) |
| Channel-render union + adapters | `apps/app/lib/channel-render/*`, `channel-send/*` | Pattern for rendering a brief to UI vs dead-drop payload |

> ⚠️ sendero's OCR uses Gemini and its agent uses AI Gateway/Gemini/Anthropic. **Those violate the QVAC-only rule.** Reuse the *structure*, swap the *inference* to `@qvac/sdk`.

## From `defi-web-app` (BUFX)
| Asset | Path | Use for |
|---|---|---|
| **i18n middleware + locales** | `apps/web/proxy.ts`, `apps/web/locales/{client,server}.ts`, `apps/web/messages/*.json` | Blueprint for [07](./07-i18n.md) |
| Locale switcher | `apps/web/components/locale-switcher/index.tsx` | Port directly |
| Supported-locales/flags | `packages/location/src/{supported-locales,locale-flags}.ts` | Pattern for `lib/i18n/*` |
| Privacy-pool concepts (Ghost Mode) | `apps/hyper-mcp/src/routes/ghost.ts` | **Reference only** — v1 uses WDK Lightning for privacy, not ZK pools |

## From `fx-telarana`
| Asset | Path | Use for |
|---|---|---|
| Privacy hook / shielded withdrawal | `contracts/src/hub/FxPrivacy*.sol`, `packages/sdk/src/privacy/*` | **Reference only** — post-v1 stretch if on-chain privacy is wanted beyond Lightning |

## From `references/` (Tether PearPass — vendored benchmark)
The richest reference for the net-new P2P/Bare/encryption work. Full concern→file map in [12 · reference-apps](./12-reference-apps.md).
| Asset | Path | Use for |
|---|---|---|
| Bare worklet host (RN) | `references/pearpass-mobile/src/worklet/index.js` | How to run `@qvac/sdk`/WDK in Bare on mobile ([05](./05-p2p.md)) |
| Electron ↔ worklet bridge | `references/pearpass-desktop/src/electron/vaultClientProxy.js`, `src/services/createOrGetPearpassClient.js` | Desktop client-proxy pattern |
| Identity / session / crypto | `references/pearpass-desktop/src/services/security/{appIdentity,sessionManager}.js` | Seed/dossier at rest, lock/unlock ([03](./03-data-and-rag.md), [06](./06-wallet.md)) |
| QR pairing + import | `references/pearpass-mobile/src/hooks/useQRScanner.js`, `.../screens/ImportItems` | Dead-drop pairing ([05](./05-p2p.md)) |
| Offline job queue | `references/pearpass-mobile/src/jobQueue/*` | Deferred sends when offline |

> ⚠️ PearPass's P2P/CRDT engine is in its dep `@tetherto/pearpass-lib-vault-core` (Bare worklet), not these shells. The shells are the bridge benchmark.

**Invitation to build (the native surfaces — see [14](./14-surfaces-and-shared-core.md), Codex M10/M11):**
PearPass is the canonical example of the exact two shells LeClerc still owes —
a **Pear+Electron desktop** app and an **Expo+Bare mobile** app, each hosting a
Bare worklet on-device. Build `apps/desktop` against `references/pearpass-desktop`
(Pear build config in its `package.json`, the renderer↔worklet bridge in
`src/services/createOrGetPearpassClient.js` + `src/electron/vaultClientProxy.js`)
and `apps/mobile` against `references/pearpass-mobile` (`src/worklet/index.js`,
the `bundle:ios|android` `bare-pack` scripts, `src/native-modules/`, `src/jobQueue/`).
Our worklet payload is QVAC + WDK + Hyperswarm (not PearPass's vault-core); the
references show *how to host and bridge* it.

## From `desk-v1`
| Asset | Path | Use for |
|---|---|---|
| Simpler next-international setup | `apps/web/src/locales/{client,server}.ts` | Secondary i18n reference (defi-web-app preferred) |

## Net build vs reuse
- **Reused/re-themed:** capture pipeline, schema/store, export, QVAC wrapper, i18n, agent+tool patterns, encryption.
- **Net-new:** QVAC RAG wiring, multi-agent orchestrator, Hyperswarm dead-drop, WDK wallet, P2P delegation glue, re-theme, (stretch) Expo client.
