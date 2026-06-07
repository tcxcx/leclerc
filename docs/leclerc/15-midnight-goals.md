# 15 · Midnight Goals — finish the entire LeClerc vision (Codex overnight)

> The full expanded backlog. Codex runs this **overnight, autonomously, using
> compute to tackle it all**. It supersedes nothing in [CODEX_OVERNIGHT.md](./CODEX_OVERNIGHT.md)
> (M1–M11) — it **extends** it with the product vision below (W1–W14). Same loop:
> verify SDK shapes against installed `.d.ts`, tsc clean + smoke per milestone,
> commit frequently on `feat/leclerc-scaffold`, capture `artifacts/`, append STATUS
> to `IMPLEMENTATION_NOTES.md`. Never stall: if blocked, document the env/ref and move on.

## The Law (applies to everything below)
**NOTHING HARDCODED.** Missions, gadgets, assets, chains, explorer URLs, copy,
greetings, personas, tool catalogs, balances — all data-driven from typed config /
i18n / stores. UI renders from data. This is a graded midnight goal: a reviewer
must be able to add a mission / asset / gadget / locale by editing data, not JSX.

## The three surfaces & their roles (see [14](./14-surfaces-and-shared-core.md))
- **Desktop (Pear+Electron) = the operations brain.** Issues missions, uploads
  intel for agents, sends notifications. Holds **vector semantic memory**. Connected
  to a central intelligence brain. **Only agents on the P2P network with an assigned,
  mission-matching wallet can pull partial memories on demand.** Globe ops view (cobe).
- **Mobile (Expo+Bare) = the agent app.** A spy receives assigned work, runs
  local QVAC gadgets, carries the wallet, accepts/denies missions, gets notified.
- **PWA = the reference example** we build from (current). Same Cleo UI.

## Design = Ignyte × Arc glass (black · Ignyte yellow · white)
Reference: the Ignyte/Arc "Stablecoins Commerce Stack" challenge. Updated in
[DESIGN.md](./DESIGN.md): **Ignyte yellow `#f5e003` is the hero accent**; every icon
is a **3D glass object** (`.glass-icon` util in `globals.css` + a `GlassIcon`
component to build); the animated background carries a **subtle yellow splash**
(`ignyte` preset, already default). Logo + favicons added (`apps/app/public`).
Cleo warmth + Ignyte glass = the look. **Build a `GlassIcon` component and route
every icon (action bar, gadgets, asset coins, send/receive balls) through it.**

## Design files to fetch + implement (Anthropic artifacts — `LeClerc.html`)
Fetch each, read its readme, implement the relevant aspects (glass icons + layout):
- https://api.anthropic.com/v1/design/h/bLqeYuIpps9q44_dA7xW5Q?open_file=LeClerc.html
- https://api.anthropic.com/v1/design/h/iJe_nnCGU_vOqXRABcs25Q?open_file=LeClerc.html
- https://api.anthropic.com/v1/design/h/rCJNjUZJjGxNf_MTdEGrQQ?open_file=LeClerc.html
Treat these as the visual source of truth alongside DESIGN.md; reconcile to the
Ignyte/Arc glass language. (Claude/Codex can fetch via WebFetch.)

---

## Workstreams (W1–W14)

### W1 · Home shell finishing (Cleo + Ignyte glass)
- Bottom bar: **first icon = a credit card** (was Spend) → opens the card feature (W7).
- The mic is **one large glass ball with two smaller glass balls flanking it** —
  **Send (lower-left) and Receive (lower-right), superimposed on/around the mic**,
  not sitting inside the bar.
- All icons via `GlassIcon`. Yellow active glow. tokens only, no hardcoded styles.

### W2 · Hidden SPY console (triple-tap the mic)
A local-inference console in the Ignyte glass language, with the **10 QVAC gadgets**
(all local-first), each a glass tile, **inputs editable before running**, output
rendered inline:
1. 🎙️ Transcribe — Whisper ASR (`inferTranscribe`)
2. 🧬 Extract — LLM json_schema intel extraction (`inferExtract`)
3. 💬 Chat — field-agent LLM (`chat`)
4. 📚 RAG Ask — answer over the dossier (`ragAsk`)
5. 🔎 RAG Search — semantic hits (`ragSearch`)
6. 🛰️ Intel Brief — multi-agent analyst desk (`runBrief`)
7. 📍 Geo Extract — location/entity tool (`extractLocations`)
8. 🧠 Reasoning Level — Alto (Qwen3-4B) / Medio (Qwen3-1.7B) / Médico (MedPsy-4B)
9. ⚡ Wallet — Lightning + EVM pay/balances (`wallet`)
10. 🌐 Station — DHT peer start/ping (mesh)
Gadget catalog is **data-driven** (id, icon, i18n label, input schema, runner). SPY
console copy in both locales.

### W3 · Missions (data model + UI + bridge)
- **Data model:** ≥3 missions, each with **per-gadget context** (which gadgets +
  preloaded inputs/dossier the mission unlocks). Both locales. Pure data.
- **UI:** an **ACCEPT / DENY** mission card, a mission **selector**, and an
  **in-chat tool-call renderer** (shows the gadget the AI invoked + its result).
- **Wiring:** mission state + a **`callTool` bridge** in the app root; mission/level
  state, derivations, handlers.
- **Per-mission dossier view** the RAG tools read from (RAG scoped to the mission).
- **Auto-invoke:** the in-chat AI **auto-runs a tool when a question matches**
  (e.g. "who funds Raven?" → `ragAsk()` inline). Gadget inputs stay editable.

### W4 · Wallet onboarding + multi-asset (WDK)
Real flow, no tether.me names: **create wallet → claim handle → Face ID → recovery
phrase**. Then **Send** (recipient → amount/asset → review → submitted), **Receive**
(QR + handle), **Transactions** list. Reference screens: the WDK/tether.me-style
shots provided (Receive QR, Send numeric pad, Review/Submitted sheet, Recovery phrase,
Claim handle, Face ID). Use the **`wdk` skill** (`~/.claude/skills/wdk/SKILL.md`).

### W5 · Multi-asset balances + chains (from defi-web-app)
Assets: **USD₮ · BTC · XAU₮ · USDC · EURC · MXNB · QCAD · AUDF · JPYC · cirBTC**.
**Fetch token contracts + icons + chain configs + explorer URLs from `defi-web-app`**
(reuse its address book, RPC, block-explorer URL helpers, asset icons). Support
**Arc-testnet (testnet) AND Arbitrum mainnet**. All asset/chain data is config, not
hardcoded in components. Learn other helpers from defi-web-app (tx URLs, formatting).

### W6 · Local AI manages the wallet (WDK MCP + x402)
- Add `@tetherto/wdk-mcp-toolkit` + `@modelcontextprotocol/sdk`; wire so the local
  AI inference can **manage the user's wallet locally** (balances, send, swap) as
  tools through the agent/tool registry.
- Reference **`SemanticPay/wdk-wallet-evm-x402-facilitator`** for x402 facilitator
  patterns (agent-pays-per-call rails). Add to monorepo as a reference/integration.

### W7 · Credit card feature (Rain, from desk-v1)
`/investigate` the **desk-v1 Rain implementation** (mobile + web) — the code is ready;
**copy it** and **wire funding to our WDK wallet** for **USDC-based agent cards**.
The bottom-bar first icon (W1) opens this. Data-driven card config.

### W8 · Operator → agent mission funding + notifications
The **operator funds a mission** (desktop) → an **agent notification** lands in the
app (the bridge between desktop and app). Wire the notification surface + the
fund→notify event over the P2P network.

### W9 · Desktop ops brain + vector memory + globe
- Vector **semantic memory** of operations; **mission-gated partial-memory access**
  (only assigned, on-network wallets, on demand). Central-brain connection.
- **cobe globe** (`cobe@latest`, https://cobe.vercel.app) — the desktop **global
  operations** view over the P2P network. `Add cobe@latest to my app.`

### W10 · Landing page
Advertise: **log in to create your operation room and power your spy network**, or
**download as a censorship-resistant PWA** or an **Expo app**. Marketing + the two
download paths + the operator login → operation room.

### W11 · Native shells (Desktop Pear + Expo) — from [14](./14-surfaces-and-shared-core.md)
Extract `@leclerc/core` + the Bare worklet; scaffold `apps/desktop` (Pear+Electron)
and `apps/mobile` (Expo+Bare) per the PearPass blueprints (`references/`). On-device
QVAC + voice + WDK in the worklet.

### W12 · Wire the live flows (from CODEX_OVERNIGHT M1–M9)
Voice E2E, RAG/brief, OCR/translate, P2P delegate+dead-drop, MedPsy, artifacts,
quality/build. The PWA is the must-ship.

### W13 · i18n completeness
Every new surface (SPY console, missions, wallet, card, landing) has **es + en**
strings in `messages/*.json`. No hardcoded copy anywhere.

### W14 · Monorepo additions (install/reference)
- `@tetherto/wdk-mcp-toolkit`, `@modelcontextprotocol/sdk` (W6).
- `cobe` (W9).
- `references/` (or a `references.md` pointer): `SemanticPay/wdk-wallet-evm-x402-facilitator`,
  `tetherto/wdk-docs` skill (installed at `~/.claude/skills/wdk/`).
- Reuse code/icons/configs from `defi-web-app` and `desk-v1` (W5, W7).

---

## Acceptance (the expanded Definition of Done)
On top of CODEX_OVERNIGHT's DoD: the home shows glass icons (credit card + mic with
send/receive balls); triple-tap opens the SPY console with 10 working gadgets;
missions accept/deny + scope RAG + auto-invoke tools; the wallet onboards and shows
multi-asset balances across Arc-testnet + Arbitrum with Send/Receive/Transactions;
the AI can move funds locally via WDK MCP; agent USDC cards fund from the wallet; a
landing page ships; desktop runs the ops brain + cobe globe; nothing is hardcoded.
Partial-but-scaffolded is acceptable per workstream if the PWA core (M1–M9) shipped.
