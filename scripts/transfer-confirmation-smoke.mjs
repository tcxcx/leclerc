import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = path.join(ROOT, "apps", "app");
const ARTIFACT_DIR = path.join(ROOT, "artifacts", "wallet");
const DATE = new Date().toISOString().slice(0, 10);
const TRANSFER_MODULE = pathToFileURL(path.join(APP_DIR, "src", "lib", "wallet", "transfer-confirmation.ts")).href;
const RECIPIENT = "0x000000000000000000000000000000000000dEaD";

async function loadTransferModule(label) {
  return import(`${TRANSFER_MODULE}?${label}=${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function serializeError(err) {
  return err instanceof Error ? err.message : String(err);
}

async function main() {
  const firstImport = await loadTransferModule("propose");
  const proposal = firstImport.proposeTransfer({
    seed: process.env.LECLERC_TRANSFER_SMOKE_SEED ?? "transfer-confirmation-smoke-seed-placeholder",
    to: RECIPIENT,
    amount: "5.25",
    assetId: "usdc",
    chainId: 5042002,
    purpose: "wallet-send",
    metadata: { smoke: true },
  });

  assert(firstImport.getPendingTransfer(proposal.confirmId)?.confirmId === proposal.confirmId, "proposal was not pending");

  const secondImport = await loadTransferModule("confirm");
  const confirmed = await secondImport.confirmTransfer(
    proposal.confirmId,
    async (_seed, to, amount, assetId, chainId) => {
      assert(to === RECIPIENT, "executor received the wrong recipient");
      assert(amount === "5250000", "executor received the wrong atomic amount");
      assert(assetId === "usdc", "executor received the wrong asset");
      assert(chainId === 5042002, "executor received a non-testnet chain");
      return { hash: "0xtransferconfirmationsmoke" };
    },
  );
  assert(confirmed.hash === "0xtransferconfirmationsmoke", "confirm did not return executor hash");
  assert(secondImport.getPendingTransfer(proposal.confirmId) === null, "confirmed proposal was not single-use");

  let secondUseError = "";
  try {
    await secondImport.confirmTransfer(proposal.confirmId, async () => ({ hash: "0xshouldnotrun" }));
  } catch (err) {
    secondUseError = serializeError(err);
  }
  assert(secondUseError.includes("not found") || secondUseError.includes("already used"), "second confirm did not fail");

  const tamperProposal = firstImport.proposeTransfer({
    seed: process.env.LECLERC_TRANSFER_SMOKE_SEED ?? "transfer-confirmation-smoke-seed-placeholder",
    to: RECIPIENT,
    amount: "1.00",
    assetId: "usdc",
    chainId: 5042002,
    purpose: "wallet-send",
    metadata: { smoke: true, tamper: true },
  });
  const registry = globalThis.__leclercTransferConfirmations;
  const stored = registry?.transfers?.get(tamperProposal.confirmId);
  assert(stored, "tamper proposal was not stored");
  stored.amountAtomic = "2000000";
  let tamperError = "";
  try {
    await secondImport.confirmTransfer(tamperProposal.confirmId, async () => ({ hash: "0xshouldnotrun" }));
  } catch (err) {
    tamperError = serializeError(err);
  }
  assert(tamperError.includes("integrity"), "tampered transfer did not fail integrity check");

  let readonlyError = "";
  try {
    firstImport.proposeTransfer({
      seed: process.env.LECLERC_TRANSFER_SMOKE_SEED ?? "transfer-confirmation-smoke-seed-placeholder",
      to: RECIPIENT,
      amount: "1.00",
      assetId: "usdc",
      chainId: 42161,
      purpose: "wallet-send",
    });
  } catch (err) {
    readonlyError = serializeError(err);
  }
  assert(readonlyError.includes("read-only"), "read-only chain proposal was not rejected");

  await mkdir(ARTIFACT_DIR, { recursive: true });
  const artifact = {
    createdAt: new Date().toISOString(),
    status: "PASS",
    checks: [
      "proposal remains pending across fresh module import in the same server process",
      "confirm executes through injected testnet-only executor without live network send",
      "confirm is single-use",
      "tampered stored transfer fails HMAC integrity verification",
      "read-only Arbitrum One proposal is rejected before confirm",
    ],
    seedPrinted: false,
    liveTransfer: false,
  };
  await writeFile(
    path.join(ARTIFACT_DIR, `transfer-confirmation-smoke-${DATE}.json`),
    JSON.stringify(artifact, null, 2),
  );
  console.log(JSON.stringify(artifact, null, 2));
}

main().catch((err) => {
  console.error(serializeError(err));
  process.exit(1);
});
