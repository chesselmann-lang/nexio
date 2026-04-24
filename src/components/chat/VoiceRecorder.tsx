"use client";
import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  function startTimer() {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 200);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/ogg;codecs=opus";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
      };

      recorder.start(100);
      setState("recording");
      startTimer();
    } catch (err) {
      console.error("Microphone access denied:", err);
      onCancel();
    }
  }

  function stopRecording() {
    stopTimer();
    mediaRecorderRef.current?.stop();
  }

  function handleSend() {
    if (blobRef.current) {
      onSend(blobRef.current, duration);
    }
  }

  // Waveform visualization bars (animated)
  const BAR_COUNT = 20;

  return (
    <div className="flex items-center gap-3 w-full px-2 py-1">
      {/* Cancel */}
      <button
        onClick={() => { stopRecording(); onCancel(); }}
        className="w-9 h-9 flex items-center justify-center flex-none rounded-full"
        style={{ color: "#ef4444", background: "#fee2e2" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Waveform + Timer */}
      <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2"
        style={{ background: "var(--surface-2)" }}>
        {/* Live waveform */}
        {state === "recording" && (
          <div className="flex items-center gap-0.5 flex-1">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 3,
                  background: "var(--nexio-green)",
                  height: `${8 + Math.sin((Date.now() / 200 + i) * 0.8) * 6 + Math.random() * 8}px`,
                  animation: `voiceBar 0.${4 + (i % 5)}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`,
                  minHeight: 4,
                  maxHeight: 24,
                }}
              />
            ))}
          </div>
        )}

        {/* Audio player when recorded */}
        {state === "recorded" && audioUrl && (
          <audio src={audioUrl} controls className="flex-1 h-8" style={{ width: "100%" }} />
        )}

        {/* Duration */}
        <span className="text-sm font-mono tabular-nums flex-none"
          style={{ color: state === "recording" ? "#ef4444" : "var(--foreground-2)" }}>
          {state === "recording" && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />}
          {formatDuration(duration)}
        </span>
      </div>

      {/* Stop / Send */}
      {state === "recording" ? (
        <button
          onClick={stopRecording}
          className="w-9 h-9 flex items-center justify-center flex-none rounded-full"
          style={{ background: "var(--nexio-green)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleSend}
          className="w-9 h-9 flex items-center justify-center flex-none rounded-full"
          style={{ background: "var(--nexio-green)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      )}

      <style>{`
        @keyframes voiceBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
