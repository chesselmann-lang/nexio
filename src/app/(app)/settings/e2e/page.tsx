"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateKeyPair, exportPublicKey, keyFingerprint } from "@/lib/e2e/crypto";
import { saveKeyPair, loadKeyPair, deleteKeyPair } from "@/lib/e2e/keystore";
import { createClient } from "@/lib/supabase/client";

export default function E2ESettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "inactive" | "active">("loading");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      loadKeyPair(data.user.id).then(async (kp) => {
        if (kp) {
          const fp = await keyFingerprint(kp.publicKeyB64);
          setFingerprint(fp);
          setStatus("active");
        } else {
          setStatus("inactive");
        }
      });
    });
  }, []);

  async function setupE2E() {
    if (!userId) return;
    setBusy(true);
    setMsg(null);
    try {
      const kp = await generateKeyPair();
      await saveKeyPair(userId, kp);
      const pub = await exportPublicKey(kp.publicKey);
      const res = await fetch("/api/e2e/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pub }),
      });
      if (!res.ok) throw new Error("Server-Fehler");
      const fp = await keyFingerprint(pub);
      setFingerprint(fp);
      setStatus("active");
      setMsg("✅ Verschlüsselung aktiviert!");
    } catch (e: any) {
      setMsg("❌ Fehler: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetE2E() {
    if (!userId) return;
    if (!confirm("Schlüssel wirklich zurücksetzen? Alte verschlüsselte Nachrichten können dann nicht mehr gelesen werden.")) return;
    setBusy(true);
    await deleteKeyPair(userId);
    await fetch("/api/e2e/keys", { method: "DELETE" });
    setStatus("inactive");
    setFingerprint(null);
    setMsg("🔑 Schlüssel gelöscht. E2E deaktiviert.");
    setBusy(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} className="p-1 rounded-full"
          style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Ende-zu-Ende-Verschlüsselung</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Status card */}
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--surface)" }}>
          {status === "loading" && (
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--border)", borderTopColor: "var(--nexio-green)" }} />
          )}
          {status === "active" && (
            <>
              <div className="text-5xl mb-3">🔒</div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#07c160" }}>E2E aktiv</p>
              <p className="text-xs mb-4" style={{ color: "var(--foreground-3)" }}>
                Dein Gerät hat einen Verschlüsselungsschlüssel.
                <br />Nachrichten an andere E2E-Nutzer werden automatisch verschlüsselt.
              </p>
              {fingerprint && (
                <div className="rounded-xl p-3 text-center" style={{ background: "var(--background)" }}>
                  <p className="text-xs font-mono font-semibold" style={{ color: "var(--foreground)", letterSpacing: "0.08em" }}>
                    {fingerprint}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-3)" }}>Dein Schlüssel-Fingerabdruck</p>
                </div>
              )}
            </>
          )}
          {status === "inactive" && (
            <>
              <div className="text-5xl mb-3">🔓</div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>E2E nicht eingerichtet</p>
              <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
                Richte E2E ein, um Nachrichten an andere E2E-Nutzer verschlüsselt zu senden.
              </p>
            </>
          )}
        </div>

        {/* Info */}
        <div className="rounded-2xl px-4 py-4 space-y-3" style={{ background: "var(--surface)" }}>
          {[
            ["🔑 Schlüssel lokal", "Dein privater Schlüssel verlässt dieses Gerät nie."],
            ["🌐 Öffentlicher Schlüssel", "Nur dein öffentlicher Schlüssel wird auf dem Server gespeichert."],
            ["💬 Automatisch", "Wenn beide Gesprächsteilnehmer E2E eingerichtet haben, werden DMs automatisch verschlüsselt."],
            ["⚠️ Gerätebindung", "Schlüssel sind an dieses Gerät gebunden. Auf anderen Geräten separat einrichten."],
          ].map(([title, desc]) => (
            <div key={title as string} className="flex gap-3">
              <span className="text-base flex-shrink-0">{(title as string).split(" ")[0]}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{(title as string).slice(3)}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>{desc as string}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {msg && (
          <p className="text-xs text-center px-4 py-2 rounded-xl" style={{ background: "var(--surface)", color: "var(--foreground)" }}>{msg}</p>
        )}

        {status === "inactive" && (
          <button onClick={setupE2E} disabled={busy}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: busy ? "#ccc" : "var(--nexio-green)" }}>
            {busy ? "Einrichten…" : "🔒 E2E einrichten"}
          </button>
        )}

        {status === "active" && (
          <button onClick={resetE2E} disabled={busy}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--surface)", color: "#ef4444" }}>
            {busy ? "…" : "🗑 Schlüssel zurücksetzen"}
          </button>
        )}
      </div>
    </div>
  );
}
