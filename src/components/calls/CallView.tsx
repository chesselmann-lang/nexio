"use client";
import { useState, useEffect } from "react";

interface CallViewProps {
  roomName: string;
  callType: "audio" | "video";
  participantName: string;
  conversationName: string;
  onLeave: () => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function CallView({
  roomName,
  callType,
  participantName,
  conversationName,
  onLeave,
}: CallViewProps) {
  const [token, setToken]       = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetch("/api/calls/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "calls_disabled") {
          setDisabled(true);
        } else if (data.token) {
          setToken(data.token);
          setServerUrl(data.url);
        } else {
          setError("Verbindung fehlgeschlagen.");
        }
      })
      .catch(() => setError("Verbindung fehlgeschlagen."));
  }, [roomName, participantName]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Disabled state ──────────────────────────────────────────────────────────
  if (disabled) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="text-6xl mb-6">📞</div>
        <h2 className="text-xl font-bold mb-2">{conversationName}</h2>
        <p className="text-gray-400 mb-6 text-sm text-center px-8">
          Anrufe sind noch nicht aktiviert.
          <br />
          LiveKit-Konfiguration ausstehend.
        </p>
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium mb-8">
          Coming soon
        </span>
        <button
          onClick={onLeave}
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-lg"
        >
          ✕
        </button>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-400 mb-6 text-sm">{error}</p>
        <button onClick={onLeave} className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-2xl">✕</button>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!token || !serverUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Verbinde…</p>
      </div>
    );
  }

  // ── Live call — lazy-load LiveKit only when keys are present ─────────────────
  return <LiveCallRoom token={token} serverUrl={serverUrl} callType={callType} conversationName={conversationName} duration={duration} onLeave={onLeave} />;
}

// Separate component so LiveKit bundle is only loaded when actually needed
function LiveCallRoom({ token, serverUrl, callType, conversationName, duration, onLeave }: {
  token: string; serverUrl: string; callType: "audio" | "video";
  conversationName: string; duration: number; onLeave: () => void;
}) {
  const [LiveKitRoom, setLiveKitRoom] = useState<any>(null);

  useEffect(() => {
    import("@livekit/components-react").then((lk) => {
      setLiveKitRoom(() => lk);
    }).catch(() => {/* ignore */});
  }, []);

  if (!LiveKitRoom) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Lade Anruf…</p>
      </div>
    );
  }

  const { LiveKitRoom: Room, VideoConference, RoomAudioRenderer, ControlBar } = LiveKitRoom;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/50">
        <div>
          <p className="text-white font-semibold text-sm">{conversationName}</p>
          <p className="text-gray-400 text-xs">{formatDuration(duration)}</p>
        </div>
        <button
          onClick={onLeave}
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold"
        >
          ✕
        </button>
      </div>
      <Room
        token={token}
        serverUrl={serverUrl}
        options={{ adaptiveStream: true, dynacast: true }}
        onDisconnected={onLeave}
        style={{ height: "100%" }}
      >
        {callType === "video" ? <VideoConference /> : (
          <div className="flex flex-col items-center justify-center h-full text-white gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl">🎤</div>
            <p className="text-lg font-semibold">{conversationName}</p>
            <p className="text-gray-400 text-sm">{formatDuration(duration)}</p>
          </div>
        )}
        <RoomAudioRenderer />
        <ControlBar />
      </Room>
    </div>
  );
}
