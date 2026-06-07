# 06 · Wallet — Private Payments via Tether WDK

> The "pay an asset" gadget. Self-custodial, multi-chain, with **Lightning (off-chain, not broadcast)** as the private-payment path. Built on the Tether **Wallet Development Kit** — docs: https://docs.wdk.tether.io/

## 1. Packages (npm, `@tetherto` scope)

| Package | Use in LeClerc |
|---|---|
| `@tetherto/wdk-core` | Orchestrator + `getRandomSeedPhrase()` |
| `@tetherto/wdk-wallet-evm` | USDT/USDC on EVM (on-chain payments, balances) |
| `@tetherto/wdk-wallet-spark` | **Bitcoin L2 + Lightning** — the private payment path |
| `@tetherto/wdk-react-native-secure-storage` | Mobile keychain-backed seed storage (Expo) |

Optional later: `@tetherto/wdk-wallet-btc` (on-chain BTC), `@tetherto/wdk-protocol-bridge-usdt0-evm`, `@tetherto/wdk-protocol-swap-velora-evm`. Out of v1 scope.

Runtimes: Node ≥22, React Native/Expo (RN ≥0.81.4), Bare, browser via Bare. **Seed/signing stays local — keys never leave the device.**

## 2. Seed lifecycle (do this exactly)

```ts
import WDK from "@tetherto/wdk-core";

const seedPhrase = WDK.getRandomSeedPhrase(24);   // 24-word for higher security
```
- **Generation:** on first run, generate and show once for backup; never log, never commit, never put a real seed in `.env`.
- **Storage:**
  - Mobile → `@tetherto/wdk-react-native-secure-storage` (Secure Enclave / Keystore, biometric unlock).
  - Web/station → encrypt with the operative passphrase (same AES-GCM envelope as the dossier, [03](./03-data-and-rag.md)); store ciphertext in IndexedDB; decrypt to memory per session.
- **Wipe:** panic-wipe clears the encrypted seed too.

## 3. EVM payments (USDT/USDC)

```ts
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

const account = await new WalletManagerEvm(seedPhrase, {
  provider: process.env.EVM_RPC_URL,   // testnet for the demo
}).getAccount();

const address = await account.getAddress();
const usdt = await account.getTokenBalance({ token: USDT_ADDRESS });

// send USDT (6 decimals)
const { hash } = await account.transfer({ token: USDT_ADDRESS, to: assetAddress, amount: "1000000" }); // 1 USDT
// estimate first:
const quote = await account.quoteSendTransaction({ to: assetAddress, value: "0" });
```

## 4. Lightning private payment (the headline gadget)

> **Network decision (locked): `TESTNET`.** Lightning testnet is a public,
> shared network — faucet-funded, verifiable on a testnet explorer — so the demo
> shows a real self-custodial payment. NOT regtest (a private local chain, only
> worth it to avoid public networks entirely). NEVER mainnet for the demo.

```ts
import WalletManagerSpark from "@tetherto/wdk-wallet-spark";

const spark = await new WalletManagerSpark(seedPhrase, { network: "TESTNET" }).getAccount();
const balance = await spark.getBalance();

// pay an asset off-chain — not broadcast to the base chain
await spark.payLightningInvoice({ invoice: "lnbc..." });   // BOLT11
```
- **Why this is the private path:** Lightning payments settle off-chain; they aren't written to the public ledger, so they don't leave the same on-chain trail as an EVM transfer. Frame the demo around paying an informant over Lightning.
- Receiving (if needed): generate an invoice via the Spark account API (read installed `.d.ts` for the exact method name, e.g. `createInvoice`/`receive`).

## 5. Wallet wrapper (`apps/app/src/lib/wallet/index.ts`, server-only)

```ts
export async function loadWallet(seed: string): Promise<{ evm: EvmAccount; spark: SparkAccount }>;
export async function balances(): Promise<{ usdt: string; sats: string }>;
export async function payLightning(invoice: string): Promise<void>;          // gated
export async function paySableEvm(to: string, token: string, amount: string): Promise<{hash:string}>; // gated
```
Wallet ops are **side-effecting tools** ([04](./04-agents-and-tools.md)): the analyst desk may *propose* `pay_asset`, but execution always requires explicit UI confirmation (amount, recipient, network shown). Never auto-pay.

## 6. Indexer (balances/history without running a node)

```bash
WDK_INDEXER_BASE_URL=https://wdk-api.tether.io
WDK_INDEXER_API_KEY=...
# GET /api/v1/chains → supported chains/tokens; balance & tx-history endpoints
```
Use for balance/history display. It's a Tether-hosted convenience, not a custody dependency (keys stay local). For a strict no-egress demo, query a local node / skip history and show only locally-known state.

## 7. Where it runs

- WDK signing is server-only/Bare. On the station: Node Route Handlers (`runtime="nodejs"`). On mobile: Expo + Bare + secure-storage.
- Do **not** import WDK into Client Components. The browser UI calls a Route Handler that performs the signed action after confirmation.

## 8. Acceptance criteria

- [ ] First-run generates a 24-word seed, shows it once, stores it **encrypted** (web) or in secure storage (mobile); never logged.
- [ ] Displays EVM (USDT) + Lightning (sats) balances via WDK.
- [ ] Executes a **Lightning** payment to a BOLT11 invoice on testnet/regtest (demo evidence in `artifacts/`).
- [ ] Executes a testnet USDT transfer with a pre-send quote.
- [ ] Payment is only ever triggered by explicit confirmation; the agent can propose but not execute.
- [ ] Panic-wipe removes the encrypted seed.
