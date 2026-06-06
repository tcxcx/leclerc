"use client";

import { useCallback, useRef, useState } from "react";

type Status = "idle" | "recording" | "transcribing" | "error";

export function PushToTalk() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    if (status === "recording" || status === "transcribing") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setStatus("transcribing");
        try {
          const form = new FormData();
          form.append("audio", blob, "speech.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) throw new Error(await res.text());
          const { text } = (await res.json()) as { text: string };
          setTranscript(text);
          setStatus("idle");
        } catch (err) {
          console.error(err);
          setStatus("error");
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [status]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  const label =
    status === "recording"
      ? "Listening… release to transcribe"
      : status === "transcribing"
        ? "Transcribing…"
        : "Hold to talk";

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        disabled={status === "transcribing"}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={() => status === "recording" && stop()}
        className="flex h-32 w-32 select-none items-center justify-center rounded-full bg-foreground text-background text-sm font-medium transition-transform active:scale-95 disabled:opacity-50 data-[recording=true]:scale-110 data-[recording=true]:bg-red-600"
        data-recording={status === "recording"}
      >
        {status === "recording" ? "●" : "🎙"}
      </button>
      <p className="text-sm text-zinc-500">{label}</p>
      {transcript && (
        <p className="max-w-md text-center text-base text-foreground">{transcript}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
