"use client";
/**
 * Nexio Lookaround — Shake to discover nearby users
 * Uses DeviceMotion API for shake detection + Geolocation API
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface NearbyUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  status: string;
  distance_km: number;
}

function distanceLabel(km: number): string {
  if (km < 0.05) return "< 50 m";
  if (km < 0.5) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function Lookaround() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const lastShake = useRef(0);
  const accelRef = useRef({ x: 0, y: 0, z: 0 });

  // Shake detection
  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;

    function handleMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const { x = 0, y = 0, z = 0 } = a;
      const dx = Math.abs((x ?? 0) - accelRef.current.x);
      const dy = Math.abs((y ?? 0) - accelRef.current.y);
      const dz = Math.abs((z ?? 0) - accelRef.current.z);
      accelRef.current = { x: x ?? 0, y: y ?? 0, z: z ?? 0 };

      if (dx + dy + dz > 30) {
        const now = Date.now();
        if (now - lastShake.current > 1500) {
          lastShake.current = now;
          triggerLookaround();
        }
      }
    }

    // iOS 13+ requires permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      // Will be triggered on button click
      setShakeEnabled(false);
    } else {
      window.addEventListener("devicemotion", handleMotion);
      setShakeEnabled(true);
      return () => window.removeEventListener("devicemotion", handleMotion);
    }
  }, []);

  async function requestMotionPermission() {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      const perm = await (DeviceMotionEvent as any).requestPermission();
      if (perm === "granted") {
        setShakeEnabled(true);
        window.addEventListener("devicemotion", (e) => {
          const a = e.accelerationIncludingGravity;
          if (!a) return;
          const { x = 0, y = 0, z = 0 } = a;
          const dx = Math.abs((x ?? 0) - accelRef.current.x);
          const dy = Math.abs((y ?? 0) - accelRef.current.y);
          const dz = Math.abs((z ?? 0) - accelRef.current.z);
          accelRef.current = { x: x ?? 0, y: y ?? 0, z: z ?? 0 };
          if (dx + dy + dz > 30) {
            const now = Date.now();
            if (now - lastShake.current > 1500) {
              lastShake.current = now;
              triggerLookaround();
            }
          }
        });
      }
    }
  }

  const triggerLookaround = useCallback(() => {
    setOpen(true);
    setScanning(true);
    setUsers([]);
    setError(null);

    if (!navigator.geolocation) {
      setError("Standort nicht verfügbar");
      setScanning(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/lookaround", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          });
          const data = await res.json();
          setUsers(data.users ?? []);
        } catch {
          setError("Verbindungsfehler");
        } finally {
          setScanning(false);
        }
      },
      (err) => {
        setError("Standortzugriff verweigert");
        setScanning(false);
      },
      { timeout: 5000, maximumAge: 30000 }
    );
  }, []);

  if (!open) {
    return (
      <button
        onClick={triggerLookaround}
        className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl active:scale-95 transition-transform"
        style={{ background: "var(--surface)" }}
        title="Lookaround — Nutzer in der Nähe"
      >
        <span className="text-2xl" style={{ animation: shakeEnabled ? "none" : undefined }}>🔍</span>
        <span className="text-xs font-semibold" style={{ color: "var(--foreground-3)" }}>Lookaround</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => setOpen(false)} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>
          Lookaround
        </h2>
        <button onClick={triggerLookaround}
          className="text-xs px-3 py-1.5 rounded-full font-semibold text-white"
          style={{ background: "var(--nexio-green)" }}>
          Aktualisieren
        </button>
      </div>

      {/* Radar animation */}
      <div className="flex items-center justify-center py-8">
        <div className="relative w-48 h-48">
          {/* Rings */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute inset-0 rounded-full border"
              style={{
                borderColor: "var(--nexio-green)",
                opacity: 0.15 + i * 0.15,
                transform: `scale(${0.4 + i * 0.3})`,
                top: "50%", left: "50%",
                marginTop: -((0.4 + i * 0.3) * 96),
                marginLeft: -((0.4 + i * 0.3) * 96),
                width: (0.4 + i * 0.3) * 192,
                height: (0.4 + i * 0.3) * 192,
              }}
            />
          ))}
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "#07c16020" }}>
            📍
          </div>
          {/* Sweep line */}
          {scanning && (
            <div className="absolute top-1/2 left-1/2 w-px origin-bottom"
              style={{
                height: 96,
                background: "linear-gradient(to top, #07c160, transparent)",
                transformOrigin: "bottom center",
                animation: "radarSweep 2s linear infinite",
              }}
            />
          )}
          {/* User dots */}
          {users.slice(0, 6).map((u, i) => {
            const angle = (i / Math.max(users.length, 1)) * 2 * Math.PI - Math.PI / 2;
            const r = 40 + (u.distance_km / 1.0) * 55;
            const x = 96 + Math.cos(angle) * r;
            const y = 96 + Math.sin(angle) * r;
            return (
              <div key={u.id}
                className="absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2"
                style={{
                  left: x - 16, top: y - 16,
                  background: "var(--nexio-green)",
                  borderColor: "var(--background)",
                }}>
                {u.display_name[0].toUpperCase()}
              </div>
            );
          })}
        </div>
        <style>{`
          @keyframes radarSweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Status */}
      {scanning && (
        <p className="text-sm text-center pb-4 animate-pulse" style={{ color: "var(--nexio-green)" }}>
          Suche nach Nutzern in der Nähe…
        </p>
      )}
      {error && (
        <p className="text-sm text-center pb-4 px-8" style={{ color: "#ef4444" }}>{error}</p>
      )}
      {!scanning && !error && users.length === 0 && (
        <p className="text-sm text-center pb-4" style={{ color: "var(--foreground-3)" }}>
          Keine Nutzer in der Nähe (1 km · letzte 5 Min.)
        </p>
      )}

      {/* User list */}
      {users.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--foreground-3)" }}>
            {users.length} Nutzer gefunden
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {users.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: "var(--nexio-green)" }}>
                  {u.display_name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {u.display_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
                    @{u.username} · {distanceLabel(u.distance_km)}
                  </p>
                </div>
                <button
                  onClick={() => { setOpen(false); router.push(`/chats/new?userId=${u.id}`); }}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold text-white"
                  style={{ background: "var(--nexio-green)" }}>
                  Schreiben
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shake hint */}
      {shakeEnabled && (
        <p className="text-xs text-center py-4 pb-safe" style={{ color: "var(--foreground-3)" }}>
          📳 Gerät schütteln zum Aktualisieren
        </p>
      )}
      {!shakeEnabled && (
        <button onClick={requestMotionPermission}
          className="mx-4 mb-4 py-3 rounded-2xl text-xs font-semibold"
          style={{ background: "var(--surface)", color: "var(--foreground-3)" }}>
          📳 Bewegungssensor aktivieren (Schütteln)
        </button>
      )}
    </div>
  );
}
