"use client";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  ParticipantTile,
  GridLayout,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useState, useEffect } from "react";

interface CallViewProps {
  roomName: string;
  callType: "audio" | "video";
  participantName: string;
  conversationName: string;
  onLeave: () => void;
}

export default function CallView({
  roomName,
  callType,
  participantName,
  conversationName,
  onLeave,
}: CallViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetch("/api/calls/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    })
      .then((r) => r.json())
      .then(({ token, url }) => {
        setToken(token);
        setServerUrl(url);
      })
      .catch(() => setError("Verbindung fehlgeschlagen."));
  }, [roomName, participantName]);

  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={onLeave} className="px-6 py-2 bg-red-500 rounded-full text-sm">
          Schließen
        </button>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <div className="w-12 h-12 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Verbinde mit {conversationName}…</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={callType === "video"}
        audio={true}
        onDisconnected={onLeave}
        style={{ height: "100dvh" }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe py-3">
          <div>
            <p className="text-white font-semibold">{conversationName}</p>
            <p className="text-green-400 text-sm font-mono">{formatDuration(duration)}</p>
          </div>
          <div className="flex items-center gap-1 bg-green-500 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-medium">Live</span>
          </div>
        </div>

        {callType === "video" ? (
          <VideoConference />
        ) : (
          /* Audio-only call UI */
          <AudioCall conversationName={conversationName} duration={duration} />
        )}

        <RoomAudioRenderer />
        <ControlBar />
      </LiveKitRoom>
    </div>
  );
}

function AudioCall({ conversationName, duration }: { conversationName: string; duration: number }) {
  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6">
      {/* Avatar */}
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
        style={{ background: "#07c160" }}
      >
        {conversationName.slice(0, 1).toUpperCase()}
      </div>
      <div className="text-center">
        <p className="text-white text-2xl font-semibold">{conversationName}</p>
        <p className="text-green-400 text-lg font-mono mt-1">{formatDuration(duration)}</p>
      </div>
      {/* Animated sound bars */}
      <div className="flex items-end gap-1 h-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-green-400"
            style={{
              animation: `audioBar 1s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.12}s`,
              height: `${20 + Math.sin(i) * 10}px`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes audioBar {
          from { transform: scaleY(0.3); opacity: 0.5; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
