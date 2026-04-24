"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string };

export default function PrivacySettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [step, setStep] = useState<"idle" | "scan" | "verify">("idle");

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
  }

  async function startEnroll() {
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Nexio App" });
    if (error || !data) { setMsg({ text: error?.message ?? "Fehler", ok: false }); setLoading(false); return; }
    setQrUrl(data.totp.qr_code);
    setTotpSecret(data.totp.secret);
    setFactorId(data.id);
    // Create challenge
    const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (chalErr || !chal) { setMsg({ text: chalErr?.message ?? "Challenge-Fehler", ok: false }); setLoading(false); return; }
    setChallengeId(chal.id);
    setStep("scan");
    setLoading(false);
  }

  async function verifyEnroll() {
    if (!factorId || !challengeId || code.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) { setMsg({ text: "Falscher Code. Bitte versuche es erneut.", ok: false }); setLoading(false); return; }
    setMsg({ text: "✅ Zwei-Faktor-Authentifizierung aktiviert!", ok: true });
    setStep("idle");
    setQrUrl(null);
    setCode("");
    loadFactors();
    setLoading(false);
  }

  async function unenroll(fid: string) {
    if (!confirm("2FA wirklich deaktivieren?")) return;
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: fid });
    if (error) setMsg({ text: error.message, ok: false });
    else { setMsg({ text: "2FA deaktiviert.", ok: true }); loadFactors(); }
    setLoading(false);
  }

  const has2FA = factors.some((f) => f.status === "verified");

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Datenschutz &amp; Sicherheit
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">

        {/* 2FA Section */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--foreground-3)" }}>Zwei-Faktor-Authentifizierung</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: has2FA ? "#07c16020" : "var(--surface-2)" }}>
                  {has2FA ? "🔒" : "🔓"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Authenticator-App (TOTP)
                  </p>
                  <p className="text-xs" style={{ color: has2FA ? "#07c160" : "var(--foreground-3)" }}>
                    {has2FA ? "Aktiv — dein Konto ist geschützt" : "Deaktiviert"}
                  </p>
                </div>
                {has2FA ? (
                  <button onClick={() => unenroll(factors.find((f) => f.status === "verified")!.id)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-xl text-red-500 font-medium"
                    style={{ background: "#fee2e2" }}>
                    Deakt.
                  </button>
                ) : (
                  <button onClick={startEnroll} disabled={loading || step !== "idle"}
                    className="text-xs px-3 py-1.5 rounded-xl text-white font-medium"
                    style={{ background: "var(--nexio-green)" }}>
                    {loading ? "…" : "Aktivieren"}
                  </button>
                )}
              </div>
            </div>

            {/* Enroll step: scan QR */}
            {step === "scan" && qrUrl && (
              <div className="px-4 py-4 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  1. Scanne diesen QR-Code mit deiner Authenticator-App (z.B. Google Authenticator, Authy)
                </p>
                {/* Display QR image from data URL */}
                <div className="flex justify-center">
                  <img src={qrUrl} alt="TOTP QR Code" className="w-48 h-48 rounded-xl" />
                </div>
                {totpSecret && (
                  <div className="rounded-xl px-3 py-2 text-center" style={{ background: "var(--surface-2)" }}>
                    <p className="text-xs" style={{ color: "var(--foreground-3)" }}>Oder manuell eingeben:</p>
                    <p className="text-sm font-mono font-bold mt-1 tracking-widest" style={{ color: "var(--foreground)" }}>
                      {totpSecret}
                    </p>
                  </div>
                )}
                <button onClick={() => setStep("verify")}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: "var(--nexio-green)" }}>
                  Weiter → Code eingeben
                </button>
              </div>
            )}

            {/* Enroll step: verify code */}
            {step === "verify" && (
              <div className="px-4 py-4 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  2. Gib den 6-stelligen Code aus deiner App ein:
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-2xl px-4 py-3 border focus:outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => { setStep("idle"); setQrUrl(null); setCode(""); }}
                    className="flex-1 py-3 rounded-2xl text-sm font-medium"
                    style={{ background: "var(--surface-2)", color: "var(--foreground-3)" }}>
                    Abbrechen
                  </button>
                  <button onClick={verifyEnroll} disabled={code.length !== 6 || loading}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--nexio-green)" }}>
                    {loading ? "Prüfe…" : "Bestätigen"}
                  </button>
                </div>
              </div>
            )}

            <div className="px-4 py-3">
              <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
                Bei 2FA wird beim Login zusätzlich ein Code aus deiner Authenticator-App abgefragt.
              </p>
            </div>
          </div>
        </section>

        {/* Status message */}
        {msg && (
          <div className="rounded-2xl px-4 py-3 text-sm font-medium text-center"
            style={{ background: msg.ok ? "#07c16020" : "#fee2e2", color: msg.ok ? "#07c160" : "#ef4444" }}>
            {msg.text}
          </div>
        )}

        {/* Privacy settings */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--foreground-3)" }}>Sichtbarkeit</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {[
              { label: "Zuletzt online", hint: "Andere können deinen Online-Status sehen", checked: true },
              { label: "Lesebestätigungen", hint: "Doppelter Haken wird anderen angezeigt", checked: true },
              { label: "Profilbild öffentlich", hint: "Dein Profilbild für alle sichtbar", checked: true },
            ].map((item, i) => (
              <label key={item.label} className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer"
                style={{ borderColor: "var(--border)", ...(i === 2 ? { border: "none" } : {}) }}>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-3)" }}>{item.hint}</p>
                </div>
                <div className="w-12 h-6 rounded-full relative transition-colors"
                  style={{ background: item.checked ? "var(--nexio-green)" : "var(--surface-2)" }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: item.checked ? "translateX(26px)" : "translateX(2px)" }} />
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Blocked users */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--foreground-3)" }}>Blockierte Nutzer</p>
          <button
            onClick={() => router.push("/settings/blocked")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-b text-left"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-xl">🚫</span>
            <span className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Blockierliste verwalten
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: "var(--foreground-3)" }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </section>

      </div>
    </div>
  );
}
