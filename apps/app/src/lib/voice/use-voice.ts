"use client";

/**
 * React hook around createVoiceClient (lib/voice/client.ts).
 *
 * Manages React state for the continuous voice loop and cleans up on unmount.
 * The page can render `transcript`/`tokens`/`answer` live, and append finished
 * turns to a message list via the `onTurn` callback (fired once a turn has both
 * the user utterance and the assistant answer).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createVoiceClient, type VoiceClient, type VoiceState } from "./client";

export interface UseVoice {
  state: VoiceState;
  connected: boolean;
  transcript: string; // latest user utterance
  tokens: string; // accumulating assistant tokens for the in-flight turn (reset each turn)
  answer: string; // latest full assistant answer
  error: string | null;
  speak: boolean;
  start: () => void;
  stop: () => void;
  toggleSpeak: () => void;
}

export interface UseVoiceOptions {
  locale?: "es" | "en";
  speak?: boolean;
  startError?: string;
  /** Fired when a full turn completes (transcript + answer). */
  onTurn?: (turn: { user: string; assistant: string }) => void;
}

export function useVoice(opts: UseVoiceOptions = {}): UseVoice {
  const { locale = "es", speak: initialSpeak = true, startError, onTurn } = opts;

  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [tokens, setTokens] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [speak, setSpeak] = useState(initialSpeak);

  const connected = state !== "idle" && state !== "connecting";

  const clientRef = useRef<VoiceClient | null>(null);
  // Pair the in-flight user utterance with its answer to fire onTurn once.
  const pendingUserRef = useRef<string | null>(null);
  const onTurnRef = useRef(onTurn);
  useEffect(() => {
    onTurnRef.current = onTurn;
  }, [onTurn]);

  function ensureClient(): VoiceClient {
    if (clientRef.current) return clientRef.current;
    const client = createVoiceClient({
      locale,
      speak,
      startError,
      onState: (s) => setState(s),
      onError: (msg) => setError(msg),
      onTranscript: (text) => {
        setError(null);
        setTranscript(text);
        setTokens(""); // new turn: reset the streaming buffer
        pendingUserRef.current = text;
      },
      onToken: (text) => setTokens((prev) => prev + text),
      onAnswer: (text) => {
        setAnswer(text);
        const user = pendingUserRef.current;
        if (user != null) {
          pendingUserRef.current = null;
          onTurnRef.current?.({ user, assistant: text });
        }
        setTranscript("");
        setTokens("");
      },
    });
    clientRef.current = client;
    return client;
  }

  const start = useCallback(() => {
    setError(null);
    void ensureClient()
      .start()
      .catch(() => {
        /* surfaced via onError */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    void clientRef.current?.stop();
  }, []);

  const toggleSpeak = useCallback(() => {
    setSpeak((prev) => {
      const next = !prev;
      clientRef.current?.setSpeak(next);
      return next;
    });
  }, []);

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      void clientRef.current?.stop();
      clientRef.current = null;
    };
  }, []);

  return { state, connected, transcript, tokens, answer, error, speak, start, stop, toggleSpeak };
}
