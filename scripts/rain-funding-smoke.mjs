import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = path.join(ROOT, "apps", "app");
const APP_ENV = path.join(APP_DIR, ".env.local");
const ARTIFACT_DIR = path.join(ROOT, "artifacts", "wallet");
const DATE = new Date().toISOString().slice(0, 10);
const appRequire = createRequire(path.join(APP_DIR, "package.json"));
const ARC_TESTNET_CHAIN_ID = 5042002;
const TIMEOUT_MS = Number(process.env.LECLERC_RAIN_SMOKE_TIMEOUT_MS ?? 45000);
const ROUTE_URL = process.env.LECLERC_APP_URL ?? "http://localhost:7001";

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return null;
  const index = trimmed.indexOf("=");
  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return key ? [key, value] : null;
}

async function loadAppEnv() {
  if (!existsSync(APP_ENV)) return { loaded: false };
  const text = await readFile(APP_ENV, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return { loaded: true };
}

function serializeError(err) {
  return err instanceof Error ? err.message : String(err);
}

function liveSteps(card, target) {
  return [
    "Set LECLERC_SMOKE_SEED in the runtime environment to the sender wallet seed; do not commit it.",
    `Fund that WDK sender wallet with Arc-testnet ${card.assetId.toUpperCase()} on chainId ${card.chainId}.`,
    `Keep ${target.env} set to the Rain USDC deposit address in apps/app/.env.local.`,
    "Run bun run rain:smoke from the repo root; the script refuses non-Arc-testnet writes.",
  ];
}

async function withTimeout(label, promise) {
  let timeoutId;
  const timer = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timer]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function writeArtifacts(artifact) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const jsonPath = path.join(ARTIFACT_DIR, `rain-funding-smoke-${DATE}.json`);
  const mdPath = path.join(ARTIFACT_DIR, `rain-funding-smoke-${DATE}.md`);
  await writeFile(jsonPath, JSON.stringify(artifact, null, 2));
  await writeFile(
    mdPath,
    [
      "# Rain Funding Smoke",
      "",
      `Created: ${artifact.createdAt}`,
      `Status: ${artifact.status}`,
      "",
      "## Card",
      "",
      `- Card: ${artifact.card.id}`,
      `- Asset: ${artifact.asset.displaySymbol} (${artifact.asset.decimals} decimals)`,
      `- Chain: ${artifact.chain.name} (${artifact.chain.chainId})`,
      `- Deposit configured: ${artifact.funding.configured ? "true" : "false"}`,
      `- Route reports configured: ${artifact.route.configured === true ? "true" : String(artifact.route.configured)}`,
      `- Route check: ${artifact.route.checked ? artifact.route.source : artifact.route.reason}`,
      `- Amount: ${artifact.amount.decimal} ${artifact.asset.displaySymbol} (${artifact.amount.atomic} atomic)`,
      "",
      "## Result",
      "",
      artifact.status === "PASS"
        ? `- Transaction: ${artifact.result.hash}\n- Explorer: ${artifact.result.explorerUrl}`
        : `- Reason: ${artifact.result.reason}`,
      "",
      ...(artifact.result.steps?.length
        ? ["## Live Steps", "", ...artifact.result.steps.map((step) => `- ${step}`), ""]
        : []),
      "## Verification",
      "",
      ...artifact.verification.map((line) => `- ${line}`),
      "",
    ].join("\n"),
  );
  return { jsonPath, mdPath };
}

async function checkRainRoute(cardId, fallbackConfigured) {
  try {
    const res = await withTimeout(
      "Rain cards route list",
      fetch(`${ROUTE_URL.replace(/\/$/, "")}/api/rain-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      }),
    );
    if (!res.ok) {
      return {
        checked: false,
        configured: fallbackConfigured,
        source: "direct config fallback",
        reason: `HTTP ${res.status} from ${ROUTE_URL}/api/rain-cards`,
      };
    }
    const body = await res.json();
    const entry = Array.isArray(body.funding) ? body.funding.find((item) => item.cardId === cardId) : null;
    return {
      checked: true,
      configured: Boolean(entry?.configured),
      source: `${ROUTE_URL}/api/rain-cards`,
      reason: "",
    };
  } catch (err) {
    return {
      checked: false,
      configured: fallbackConfigured,
      source: "direct config fallback",
      reason: `route not reachable at ${ROUTE_URL}: ${serializeError(err)}`,
    };
  }
}

async function main() {
  const env = await loadAppEnv();
  const cards = await import(appRequire.resolve("@leclerc/cards"));
  const transferCore = await import(appRequire.resolve("@leclerc/transfer-core"));
  const transferUtils = await import(appRequire.resolve("@leclerc/transfer-utils"));
  const WDK = (await import(appRequire.resolve("@tetherto/wdk"))).default;
  const wallet = await import(appRequire.resolve("@leclerc/wallet"));

  const card = cards.listRainAgentCards()[0];
  const chain = transferCore.getLeclercChain(card.chainId === ARC_TESTNET_CHAIN_ID ? "arc-testnet" : "arbitrum-one");
  const asset = transferCore.getLeclercAsset(card.assetId);
  const target = cards.rainFundingTarget(card.id, process.env);
  const amountAtomic = cards.rainFundingAmountToAtomic(card, card.defaultFundingAmount);
  const token = transferCore.tokenAddress(card.assetId, card.chainId);
  const explorerPreview = chain ? `${chain.explorerBaseUrl}/${chain.explorerTxPath}/<tx-hash>` : null;
  const routeCheck = await checkRainRoute(card.id, Boolean(target?.configured));

  const artifact = {
    createdAt: new Date().toISOString(),
    status: "SKIPPED",
    env: {
      appEnvLoaded: env.loaded,
      smokeSeedProvided: Boolean(process.env.LECLERC_SMOKE_SEED?.trim()),
      seedPrinted: false,
    },
    card: {
      id: card.id,
      codename: card.codename,
      defaultFundingAmount: card.defaultFundingAmount,
    },
    asset: {
      id: asset.id,
      displaySymbol: asset.displaySymbol,
      decimals: asset.decimals,
      token,
    },
    chain: {
      name: chain.name,
      chainId: chain.chainId,
      explorerBaseUrl: chain.explorerBaseUrl,
    },
    funding: {
      configured: Boolean(target?.configured),
      env: target?.env ?? card.fundingDepositEnv,
      depositAddress: target?.depositAddress ?? null,
    },
    route: {
      checked: routeCheck.checked,
      configured: routeCheck.configured,
      source: routeCheck.source,
      reason: routeCheck.reason,
    },
    amount: {
      decimal: transferUtils.fromAtomic(amountAtomic, asset.decimals).decimal,
      atomic: amountAtomic,
    },
    sender: {
      address: null,
      balanceAtomic: null,
      balanceDecimal: null,
    },
    result: {
      reason: "",
      steps: [],
    },
    verification: [
      "@tetherto/wdk-wallet-evm d.ts: transfer({ token, recipient, amount }) accepts amount in base units.",
      "@tetherto/wdk-wallet-evm d.ts: getTokenBalance(tokenAddress) returns token balance in base units.",
      "LeClerc catalog: Arc Testnet chainId is 5042002.",
      `LeClerc catalog: ${asset.displaySymbol} decimals are ${asset.decimals}; default funding amount converts to ${amountAtomic} atomic units.`,
      `Explorer URL shape: ${explorerPreview}`,
    ],
  };

  if (card.chainId !== ARC_TESTNET_CHAIN_ID || chain.network !== "testnet") {
    artifact.status = "FAIL";
    artifact.result = { reason: `refusing non-Arc-testnet write: chainId ${card.chainId}`, steps: [] };
    const paths = await writeArtifacts(artifact);
    console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
    process.exitCode = 1;
    return;
  }

  if (!target?.configured || !target.depositAddress) {
    artifact.result = {
      reason: `${card.fundingDepositEnv} is not configured`,
      steps: liveSteps(card, { env: card.fundingDepositEnv }),
    };
    const paths = await writeArtifacts(artifact);
    console.log(`rain funding smoke skipped: ${artifact.result.reason}`);
    console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
    return;
  }

  const seed = process.env.LECLERC_SMOKE_SEED?.trim();
  if (!seed) {
    artifact.result = {
      reason: "LECLERC_SMOKE_SEED is absent",
      steps: liveSteps(card, target),
    };
    const paths = await writeArtifacts(artifact);
    console.log(`rain funding smoke skipped: ${artifact.result.reason}`);
    console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
    return;
  }

  if (!WDK.isValidSeed(seed)) {
    artifact.result = {
      reason: "LECLERC_SMOKE_SEED is not a valid WDK seed phrase",
      steps: liveSteps(card, target),
    };
    const paths = await writeArtifacts(artifact);
    console.log(`rain funding smoke skipped: ${artifact.result.reason}`);
    console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
    return;
  }

  let balance;
  try {
    balance = await withTimeout(
      "Arc-testnet USDC balance",
      wallet.catalogTokenBalanceEvm(seed, card.assetId, card.chainId),
    );
  } catch (err) {
    artifact.result = {
      reason: `could not read Arc-testnet ${asset.displaySymbol} balance: ${serializeError(err)}`,
      steps: liveSteps(card, target),
    };
    const paths = await writeArtifacts(artifact);
    console.log(`rain funding smoke skipped: ${artifact.result.reason}`);
    console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
    return;
  }

  artifact.sender.address = balance.address;
  artifact.sender.balanceAtomic = balance.balance.toString();
  artifact.sender.balanceDecimal = transferUtils.fromAtomic(balance.balance, asset.decimals).decimal;

  const required = BigInt(amountAtomic);
  if (balance.balance < required) {
    artifact.result = {
      reason: `sender has ${artifact.sender.balanceDecimal} ${asset.displaySymbol}; needs ${artifact.amount.decimal} ${asset.displaySymbol}`,
      steps: liveSteps(card, target),
    };
    const paths = await writeArtifacts(artifact);
    console.log(`rain funding smoke skipped: ${artifact.result.reason}`);
    console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
    return;
  }

  try {
    const result = await withTimeout(
      "Rain card USDC funding transfer",
      wallet.payCatalogTokenEvm(seed, target.depositAddress, amountAtomic, card.assetId, card.chainId),
    );
    const explorerUrl = transferUtils.explorerTxUrl(chain, result.hash);
    artifact.status = "PASS";
    artifact.result = {
      hash: result.hash,
      explorerUrl,
      reason: "",
      steps: [],
    };
  } catch (err) {
    artifact.status = "FAIL";
    artifact.result = {
      reason: `transfer failed: ${serializeError(err)}`,
      steps: [],
    };
  }

  const paths = await writeArtifacts(artifact);
  console.log(
    artifact.status === "PASS"
      ? `rain funding smoke passed: ${artifact.result.hash}`
      : `rain funding smoke failed: ${artifact.result.reason}`,
  );
  console.log(`rain funding smoke artifact: ${path.relative(ROOT, paths.jsonPath)}`);
  if (artifact.status === "FAIL") process.exitCode = 1;
}

main().catch(async (err) => {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const now = new Date().toISOString();
  const jsonPath = path.join(ARTIFACT_DIR, `rain-funding-smoke-${DATE}-failed.json`);
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        createdAt: now,
        status: "FAIL",
        error: serializeError(err),
        seedPrinted: false,
      },
      null,
      2,
    ),
  );
  console.error(`rain funding smoke failed: ${serializeError(err)}`);
  console.error(`rain funding smoke artifact: ${path.relative(ROOT, jsonPath)}`);
  process.exitCode = 1;
});
