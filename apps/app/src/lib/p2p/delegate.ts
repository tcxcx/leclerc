import "server-only";

/**
 * QVAC delegated inference over the Holepunch DHT (docs/leclerc/05 §1). The
 * station advertises itself as a provider; thin/mobile clients delegate heavy
 * completion/embed/rag jobs to it.
 *
 * Verified against @qvac/sdk@0.12.2 dist/examples/delegated-inference:
 * startQVACProvider returns a publicKey, and consumers pass delegate options
 * to loadModel so the returned modelId routes later completion calls to the
 * provider.
 */
import {
  startQVACProvider,
  stopQVACProvider,
  heartbeat,
  completion,
  loadModel,
  type CompleteMessage,
} from "@repo/qvacs";

let providerPublicKey: string | null = null;

/** Start (idempotent) the station provider; returns its stable public key. */
export async function startStation(): Promise<{ publicKey: string }> {
  // QVAC_HYPERSWARM_SEED controls a stable identity across restarts.
  const res = await startQVACProvider();
  providerPublicKey = (res as { publicKey?: string }).publicKey ?? null;
  if (!providerPublicKey) throw new Error("startQVACProvider returned no publicKey");
  return { publicKey: providerPublicKey };
}

export async function stopStation(): Promise<void> {
  await stopQVACProvider();
  providerPublicKey = null;
}

export function stationKey(): string | null {
  return providerPublicKey;
}

/** Check a peer provider is alive before delegating. */
export async function peerAlive(peerPublicKey: string, timeout = 5000): Promise<boolean> {
  try {
    await heartbeat({ delegate: { providerPublicKey: peerPublicKey, timeout } });
    return true;
  } catch {
    return false;
  }
}

/** Run a completion delegated to a peer station, returning aggregated text. */
export async function delegateCompletion(
  peerPublicKey: string,
  modelSrc: unknown,
  history: CompleteMessage[],
): Promise<string> {
  const modelId = await loadModel({
    modelSrc,
    modelType: "llamacpp-completion",
    delegate: {
      providerPublicKey: peerPublicKey,
      timeout: 60_000,
      fallbackToLocal: false,
    },
  } as unknown as Parameters<typeof loadModel>[0]);

  const run = completion({
    modelId,
    history,
    stream: true,
  });
  const final = await run.final;
  return (final.contentText ?? "").trim();
}
