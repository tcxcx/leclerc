import "server-only";

/**
 * QVAC delegated inference over the Holepunch DHT (docs/leclerc/05 §1). The
 * station advertises itself as a provider; thin/mobile clients delegate heavy
 * completion/embed/rag jobs to it.
 *
 * TODO(codex): verify the exact `delegate` option shape and ProvideParams in
 * the installed @qvac/sdk .d.ts. The pattern (startQVACProvider → publicKey;
 * consumers pass providerPublicKey) is from the public API reference.
 */
import {
  startQVACProvider,
  stopQVACProvider,
  heartbeat,
  completion,
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
  modelId: string,
  history: CompleteMessage[],
): Promise<string> {
  const run = completion({
    modelId,
    history,
    stream: true,
    // TODO(codex): confirm delegate option name/shape in @qvac/sdk RPCOptions.
    delegate: { providerPublicKey: peerPublicKey },
  } as Parameters<typeof completion>[0]);
  const final = await run.final;
  return (final.contentText ?? "").trim();
}
