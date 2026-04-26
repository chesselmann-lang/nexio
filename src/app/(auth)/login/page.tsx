"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Step   = "phone" | "otp";
type Method = "phone" | "email";

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  color: "var(--foreground)",
  width: "100%",
  padding: "12px 16px",
  fontSize: 16,
};

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [method,   setMethod]   = useState<Method>("email");
  const [step,     setStep]     = useState<Step>("phone");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.startsWith("0")) return "+49" + d.slice(1);
    if (!d.startsWith("49") && !d.startsWith("+")) return "+49" + d;
    return "+" + d.replace(/^\+/, "");
  };

  async function sendOtp() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) });
    if (error) setError(error.message); else setStep("otp");
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone), token: otp, type: "sms",
    });
    if (error) { setError(error.message); setLoading(false); return; }
    await redirect(data.user?.id);
    setLoading(false);
  }

  async function signInWithEmail() {
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    await redirect(data.user?.id);
    setLoading(false);
  }

  async function redirect(uid?: string) {
    if (!uid) return;
    const { data: profile } = await supabase.from("users").select("username").eq("id", uid).single();
    if (!profile?.username || profile.username.startsWith("user_")) router.replace("/onboarding");
    else router.replace("/chats");
  }

  const btnStyle: React.CSSProperties = {
    background: "var(--nexio-indigo)",
    color: "#fff",
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--nexio-indigo) 0%, var(--nexio-green) 100%)" }}
        >
          N
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Nexio</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-3)" }}>Dein europäischer Super-App</p>
      </div>

      {/* Method toggle */}
      <div
        className="w-full max-w-sm mb-6 flex rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {(["email", "phone"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMethod(m); setError(""); setStep("phone"); }}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={method === m
              ? { background: "var(--nexio-indigo)", color: "#fff" }
              : { color: "var(--foreground-3)", background: "transparent" }}
          >
            {m === "email" ? "E-Mail" : "Telefon"}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-4">
        {method === "email" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-2)" }}>E-Mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signInWithEmail()}
                placeholder="deine@email.de" autoFocus style={INPUT_STYLE} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-2)" }}>Passwort</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signInWithEmail()}
                placeholder="••••••••" style={INPUT_STYLE} />
            </div>
            {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
            <button onClick={signInWithEmail} disabled={!email || !password || loading}
              style={{ ...btnStyle, opacity: (!email || !password || loading) ? 0.5 : 1 }}>
              {loading ? "Anmelden…" : "Anmelden"}
            </button>
          </>
        ) : step === "phone" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-2)" }}>Handynummer</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="0151 23456789" autoFocus style={INPUT_STYLE} />
              <p className="text-xs mt-2" style={{ color: "var(--foreground-3)" }}>
                Du erhältst eine SMS mit einem Bestätigungscode.
              </p>
            </div>
            {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
            <button onClick={sendOtp} disabled={!phone || loading}
              style={{ ...btnStyle, opacity: (!phone || loading) ? 0.5 : 1 }}>
              {loading ? "Wird gesendet…" : "Code senden"}
            </button>
          </>
        ) : (
          <>
            <div>
              <button onClick={() => setStep("phone")}
                className="text-sm flex items-center gap-1 mb-4"
                style={{ color: "var(--foreground-3)", background: "none", border: "none", cursor: "pointer" }}>
                ← Zurück
              </button>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-2)" }}>
                6-stelliger Code für {formatPhone(phone)}
              </label>
              <input type="number" value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                placeholder="123456" autoFocus maxLength={6}
                style={{ ...INPUT_STYLE, fontSize: 24, textAlign: "center", letterSpacing: "0.3em" }} />
            </div>
            {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
            <button onClick={verifyOtp} disabled={otp.length < 6 || loading}
              style={{ ...btnStyle, opacity: (otp.length < 6 || loading) ? 0.5 : 1 }}>
              {loading ? "Überprüfe…" : "Bestätigen"}
            </button>
            <button onClick={sendOtp} className="w-full text-sm text-center py-2"
              style={{ color: "var(--nexio-indigo)", background: "none", border: "none", cursor: "pointer" }}>
              Code erneut senden
            </button>
          </>
        )}

        {/* Footer links */}
        <p className="text-xs text-center pt-2" style={{ color: "var(--foreground-3)" }}>
          <Link href="/agb" className="underline">AGB</Link>
          {" · "}
          <Link href="/datenschutz" className="underline">Datenschutz</Link>
          {" · "}
          <Link href="/impressum" className="underline">Impressum</Link>
        </p>
      </div>
    </div>
  );
}
