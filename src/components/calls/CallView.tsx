"use client";
import { useState, useEffect, useCallback } from "react";

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
  const [token, setToken]         = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [disabled, setDisabled]   = useState(false);
  const [duration, setDuration]   = useState(0);

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
        <p className="text-gray-400 mb-3 text-sm text-center px-8">
          Anrufe sind noch nicht aktiviert.
        </p>
        <div className="bg-gray-800 rounded-2xl px-5 py-4 mb-6 max-w-xs text-xs text-gray-300 space-y-1">
          <p className="font-semibold text-white mb-2">LiveKit einrichten (kostenlos):</p>
          <p>1. <a href="https://cloud.livekit.io" className="text-green-400 underline" target="_blank" rel="noopener noreferrer">cloud.livekit.io</a> → Free Account</p>
          <p>2. Projekt anlegen → API-Keys kopieren</p>
          <p>3. In <code className="bg-gray-700 px-1 rounded">.env.local</code> eintragen:</p>
          <p className="bg-gray-700 rounded px-2 py-1 font-mono mt-1 leading-5">
            LIVEKIT_API_KEY=…<br/>
            LIVEKIT_API_SECRET=…<br/>
            NEXT_PUBLIC_LIVEKIT_URL=wss://…
          </p>
        </div>
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

  // ── Live call ─────────────────────────────────────────────────────────────────
  return (
    <LiveCallRoom
      token={token}
      serverUrl={serverUrl}
      callType={callType}
      conversationName={conversationName}
      duration={duration}
      onLeave={onLeave}
    />
  );
}

// ── LiveCallRoom — loads LiveKit lazily, adds screen-share ──────────────────────
function LiveCallRoom({ token, serverUrl, callType, conversationName, duration, onLeave }: {
  token: string; serverUrl: string; callType: "audio" | "video";
  conversationName: string; duration: number; onLeave: () => void;
}) {
  const [lk, setLk] = useState<any>(null);
  const [lkClient, setLkClient] = useState<any>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(callType === "audio");
  const [sharing, setSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<any>(null);
  const [roomRef, setRoomRef] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import("@livekit/components-react"),
      import("livekit-client"),
    ]).then(([lkComp, lkCli]) => {
      setLk(lkComp);
      setLkClient(lkCli);
    }).catch(() => {/* ignore */});
  }, []);

  const toggleMic = useCallback(async () => {
    if (!roomRef) return;
    const localParticipant = roomRef.localParticipant;
    if (!localParticipant) return;
    const enabled = !micMuted;
    await localParticipant.setMicrophoneEnabled(!enabled);
    setMicMuted(enabled);
  }, [roomRef, micMuted]);

  const toggleCam = useCallback(async () => {
    if (!roomRef || callType === "audio") return;
    const localParticipant = roomRef.localParticipant;
    if (!localParticipant) return;
    const enabled = !camOff;
    await localParticipant.setCameraEnabled(!enabled);
    setCamOff(enabled);
  }, [roomRef, camOff, callType]);

  const toggleScreenShare = useCallback(async () => {
    if (!roomRef || !lkClient) return;
    const localParticipant = roomRef.localParticipant;
    if (!localParticipant) return;

    if (sharing) {
      // Stop screen share
      if (screenTrack) {
        localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        setScreenTrack(null);
      }
      setSharing(false);
    } else {
      try {
        const tracks = await lkClient.createLocalScreenTracks({ audio: true });
        const videoTrack = tracks.find((t: any) => t.kind === "video");
        if (videoTrack) {
          await localParticipant.publishTrack(videoTrack);
          setScreenTrack(videoTrack);
          setSharing(true);
          videoTrack.on("ended", () => {
            localParticipant.unpublishTrack(videoTrack);
            setScreenTrack(null);
            setSharing(false);
          });
        }
      } catch {
        // User denied screen share or not supported
      }
    }
  }, [roomRef, sharing, screenTrack, lkClient]);

  if (!lk) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Lade Anruf…</p>
      </div>
    );
  }

  const { LiveKitRoom: Room, VideoConference, RoomAudioRenderer, useTracks } = lk;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-black/60">
        <div>
          <p className="text-white font-semibold text-sm">{conversationName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-gray-400 text-xs">{formatDuration(duration)}</p>
            {sharing && <span className="text-xs text-blue-400 font-medium">· Bildschirm wird geteilt</span>}
          </div>
        </div>
        <button
          onClick={onLeave}
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm"
        >
          ✕
        </button>
      </div>

      {/* Call content */}
      <div className="flex-1 min-h-0">
        <Room
          token={token}
          serverUrl={serverUrl}
          options={{ adaptiveStream: true, dynacast: true }}
          onDisconnected={onLeave}
          onConnected={(room: any) => setRoomRef(room)}
          style={{ height: "100%" }}
        >
          {callType === "video" ? (
            <VideoConference />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl">
                {micMuted ? "🔇" : "🎤"}
              </div>
              <p className="text-lg font-semibold">{conversationName}</p>
              <p className="text-gray-400 text-sm">{formatDuration(duration)}</p>
            </div>
          )}
          <RoomAudioRenderer />
        </Room>
      </div>

      {/* Custom control bar */}
      <div className="flex-none bg-black/80 px-6 py-4 safe-b">
        <div className="flex items-center justify-center gap-5">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
              style={{ background: micMuted ? "#ef4444" : "rgba(255,255,255,0.15)" }}>
              {micMuted ? "🔇" : "🎤"}
            </div>
            <span className="text-white/60 text-[10px]">{micMuted ? "Stumm" : "Mikro"}</span>
          </button>

          {/* Camera (video only) */}
          {callType === "video" && (
            <button
              onClick={toggleCam}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                style={{ background: camOff ? "#ef4444" : "rgba(255,255,255,0.15)" }}>
                {camOff ? "📵" : "📷"}
              </div>
              <span className="text-white/60 text-[10px]">{camOff ? "Kamera aus" : "Kamera"}</span>
            </button>
          )}

          {/* Screen share */}
          <button
            onClick={toggleScreenShare}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
              style={{ background: sharing ? "#3b82f6" : "rgba(255,255,255,0.15)" }}>
              🖥️
            </div>
            <span className="text-white/60 text-[10px]">{sharing ? "Stop" : "Teilen"}</span>
          </button>

          {/* Hang up */}
          <button
            onClick={onLeave}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-red-500">
              📵
            </div>
            <span className="text-white/60 text-[10px]">Auflegen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
