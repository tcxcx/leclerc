import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_DIR = path.join(ROOT, "artifacts", "wallet");
const appRequire = createRequire(path.join(ROOT, "apps", "app", "package.json"));
const MAINNET_USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const DEFAULT_EVM_CHAIN_ID = 11155111;
const TIMEOUT_MS = Number(process.env.LECLERC_WALLET_SMOKE_TIMEOUT_MS ?? 30000);

function fail(message) {
  throw new Error(message);
}

function requireTestnetSparkNetwork() {
  const network = (process.env.SPARK_NETWORK ?? "TESTNET").trim().toUpperCase();
  if (network !== "TESTNET") fail("SPARK_NETWORK must be TESTNET for wallet smoke");
  return network;
}

function evmChainId() {
  const chainId = Number(process.env.EVM_CHAIN_ID ?? DEFAULT_EVM_CHAIN_ID);
  if (!Number.isInteger(chainId) || chainId <= 0) fail("EVM_CHAIN_ID must be a positive integer");
  if (chainId === 1) fail("EVM_CHAIN_ID=1 is mainnet; use a testnet chain id");
  return chainId;
}

function configuredTokenAddress() {
  const token = process.env.USDT_ADDRESS?.trim();
  if (!token) return null;
  if (token.toLowerCase() === MAINNET_USDT_ADDRESS.toLowerCase()) {
    fail("USDT_ADDRESS points at Ethereum mainnet USDT; use a testnet token address");
  }
  return token;
}

function serializeError(err) {
  return err instanceof Error ? err.message : String(err);
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

async function main() {
  const [{ default: WDK }, { default: WalletManagerEvm }, { default: WalletManagerSpark }] =
    await Promise.all([
      import(appRequire.resolve("@tetherto/wdk")),
      import(appRequire.resolve("@tetherto/wdk-wallet-evm")),
      import(appRequire.resolve("@tetherto/wdk-wallet-spark")),
    ]);

  await mkdir(ARTIFACT_DIR, { recursive: true });

  const now = new Date().toISOString();
  const artifact = {
    createdAt: now,
    packageVersions: {
      wdk: "1.0.0-beta.10",
      evm: "1.0.0-beta.13",
      spark: "1.0.0-beta.19",
    },
    verifiedApiShapes: [
      "WDK.getRandomSeedPhrase(24)",
      "WalletManagerEvm(...).getAccount().getTokenBalance(token)",
      "WalletManagerEvm(...).getAccount().transfer({ token, recipient, amount })",
      "WalletManagerSpark(...).getAccount().payLightningInvoice({ invoice, maxFeeSats })",
    ],
    network: {
      spark: requireTestnetSparkNetwork(),
      evmChainId: evmChainId(),
      evmRpcConfigured: Boolean(process.env.EVM_RPC_URL),
      tokenConfigured: Boolean(configuredTokenAddress()),
    },
    seed: {
      generated: false,
      wordCount: 0,
      valid: false,
      printed: false,
    },
    checks: {},
  };

  const seed = WDK.getRandomSeedPhrase(24);
  artifact.seed.generated = true;
  artifact.seed.wordCount = seed.trim().split(/\s+/).length;
  artifact.seed.valid = WDK.isValidSeed(seed);

  const evmAccount = await withTimeout(
    "EVM account derivation",
    new WalletManagerEvm(seed, {
      provider: process.env.EVM_RPC_URL || undefined,
      chainId: artifact.network.evmChainId,
    }).getAccount(),
  );

  artifact.checks.evmAddress = {
    status: "PASS",
    address: await withTimeout("EVM address", evmAccount.getAddress()),
  };

  const token = configuredTokenAddress();
  if (!token) {
    artifact.checks.evmTokenBalance = {
      status: "SKIPPED",
      reason: "USDT_ADDRESS not set; configure a testnet token address to exercise token balances/transfers",
      envVar: "USDT_ADDRESS",
    };
  } else if (!process.env.EVM_RPC_URL) {
    artifact.checks.evmTokenBalance = {
      status: "SKIPPED",
      reason: "EVM_RPC_URL not set; configure a testnet RPC to query token balances",
      envVar: "EVM_RPC_URL",
    };
  } else {
    try {
      const balance = await withTimeout("EVM token balance", evmAccount.getTokenBalance(token));
      artifact.checks.evmTokenBalance = { status: "PASS", token, balance: String(balance) };
    } catch (err) {
      artifact.checks.evmTokenBalance = { status: "FAIL", token, error: serializeError(err) };
    }
  }

  const invoice = process.env.LECLERC_TESTNET_LIGHTNING_INVOICE?.trim();
  const liveSparkSmoke = Boolean(invoice) || process.env.LECLERC_ENABLE_LIVE_SPARK_SMOKE === "1";
  let sparkAccount = null;

  if (!liveSparkSmoke) {
    artifact.checks.sparkAddress = {
      status: "SKIPPED",
      reason:
        "live Spark testnet auth was not requested; set LECLERC_ENABLE_LIVE_SPARK_SMOKE=1 to exercise address/balance",
      envVar: "LECLERC_ENABLE_LIVE_SPARK_SMOKE",
    };
    artifact.checks.sparkBalance = {
      status: "SKIPPED",
      reason:
        "live Spark testnet auth was not requested; set LECLERC_ENABLE_LIVE_SPARK_SMOKE=1 to exercise address/balance",
      envVar: "LECLERC_ENABLE_LIVE_SPARK_SMOKE",
    };
  } else {
    try {
      sparkAccount = await withTimeout(
        "Spark account derivation",
        new WalletManagerSpark(seed, {
          network: artifact.network.spark,
          syncAndRetry: true,
        }).getAccount(),
      );
      artifact.checks.sparkAddress = {
        status: "PASS",
        address: await withTimeout("Spark address", sparkAccount.getAddress()),
      };
    } catch (err) {
      artifact.checks.sparkAddress = { status: "FAIL", error: serializeError(err) };
    }

    if (sparkAccount) {
      try {
        const sats = await withTimeout("Spark balance", sparkAccount.getBalance());
        artifact.checks.sparkBalance = { status: "PASS", sats: String(sats) };
      } catch (err) {
        artifact.checks.sparkBalance = { status: "FAIL", error: serializeError(err) };
      }
    } else {
      artifact.checks.sparkBalance = {
        status: "SKIPPED",
        reason: "Spark account was unavailable",
      };
    }
  }

  if (!invoice) {
    artifact.checks.lightningPayment = {
      status: "SKIPPED",
      reason: "LECLERC_TESTNET_LIGHTNING_INVOICE not set; provide a funded testnet BOLT11 invoice to exercise payment",
      envVar: "LECLERC_TESTNET_LIGHTNING_INVOICE",
    };
  } else if (!sparkAccount) {
    artifact.checks.lightningPayment = {
      status: "FAIL",
      error: "Spark account was unavailable; cannot pay invoice",
    };
  } else {
    try {
      const result = await withTimeout(
        "Lightning payment",
        sparkAccount.payLightningInvoice({
          invoice,
          maxFeeSats: Number(process.env.LN_MAX_FEE_SATS ?? 50),
        }),
      );
      artifact.checks.lightningPayment = { status: "PASS", resultType: typeof result };
    } catch (err) {
      artifact.checks.lightningPayment = { status: "FAIL", error: serializeError(err) };
    }
  }

  await sparkAccount?.cleanupConnections?.();
  evmAccount.dispose?.();
  sparkAccount?.dispose?.();

  const baseName = `wdk-smoke-${now.replace(/[:.]/g, "-")}`;
  const jsonPath = path.join(ARTIFACT_DIR, `${baseName}.json`);
  const mdPath = path.join(ARTIFACT_DIR, `${baseName}.md`);
  await writeFile(jsonPath, JSON.stringify(artifact, null, 2));
  await writeFile(
    mdPath,
    [
      "# WDK Wallet Smoke",
      "",
      `Created: ${now}`,
      "",
      `Spark network: ${artifact.network.spark}`,
      `EVM chain id: ${artifact.network.evmChainId}`,
      `Seed generated: ${artifact.seed.generated ? "yes" : "no"} (${artifact.seed.wordCount} words, not printed)`,
      "",
      "## Checks",
      "",
      ...Object.entries(artifact.checks).map(([name, check]) => {
        const detail = check.reason ?? check.error ?? check.address ?? check.balance ?? check.sats ?? "";
        return `- ${name}: ${check.status}${detail ? ` - ${detail}` : ""}`;
      }),
      "",
    ].join("\n"),
  );

  console.log(`wallet smoke artifact: ${path.relative(ROOT, jsonPath)}`);
  console.log(`wallet smoke summary: ${path.relative(ROOT, mdPath)}`);

  const hardFailures = Object.entries(artifact.checks).filter(([, check]) => check.status === "FAIL");
  if (hardFailures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const now = new Date().toISOString();
  const jsonPath = path.join(ARTIFACT_DIR, `wdk-smoke-${now.replace(/[:.]/g, "-")}-failed.json`);
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
  console.error(serializeError(err));
  console.error(`wallet smoke failure artifact: ${path.relative(ROOT, jsonPath)}`);
  process.exit(1);
});
