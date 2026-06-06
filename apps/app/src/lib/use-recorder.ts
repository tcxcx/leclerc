"use client";

import { useEffect, useRef, useState } from "react";

export interface RecordingResult {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

/**
 * Microphone recorder for push-to-talk. Captures via MediaRecorder and stops
 * automatically at `maxMs` (the backend also caps at 60s, but stopping here
 * keeps the UX honest and the upload small). The client-known duration is sent
 * to the server since webm/opus duration isn't derivable from the header.
 *
 * Plain functions (no useCallback) — the React Compiler memoizes them.
 */
export function useRecorder(maxMs = 60_000) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    tickRef.current = null;
    autoStopRef.current = null;
  }

  function stop(): Promise<RecordingResult | null> {
    const recorder = recorderRef.current;
    if (!recorder) return Promise.resolve(null);
    clearTimers();

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const durationMs = Math.min(Date.now() - startedAtRef.current, maxMs);
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        streamRef.current = null;
        setRecording(false);
        resolve(blob.size > 0 ? { blob, durationMs, mimeType } : null);
      };
      recorder.stop();
    });
  }

  async function start() {
    if (recorderRef.current) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setElapsedMs(0);

      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 200);
      autoStopRef.current = setTimeout(() => void stop(), maxMs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo acceder al micrófono");
    }
  }

  // Tear down on unmount (refs only — stable, so empty deps are correct).
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { recording, elapsedMs, error, start, stop };
}
