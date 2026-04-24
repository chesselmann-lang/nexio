"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+49" + digits.slice(1);
    if (!digits.startsWith("49") && !digits.startsWith("+")) return "+49" + digits;
    return "+" + digits.replace(/^\+/, "");
  };

  async function sendOtp() {
    setLoading(true);
    setError("");
    const formatted = formatPhone(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (error) setError(error.message);
    else setStep("otp");
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: otp,
      type: "sms",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Check if profile exists
    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("id, username")
        .eq("id", data.user.id)
        .single();
      if (!profile?.username || profile.username.startsWith("user_")) {
        router.replace("/onboarding");
      } else {
        router.replace("/chats");
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
          style={{ background: "var(--nexio-green)" }}
        >
          N
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Nexio</h1>
        <p className="text-gray-500 text-sm mt-1">Dein europäischer Super-App</p>
      </div>

      {step === "phone" ? (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handynummer
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendOtp()}
              placeholder="0151 23456789"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "var(--nexio-green)" } as React.CSSProperties}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">
              Du erhältst eine SMS mit einem Bestätigungscode.
            </p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={sendOtp}
            disabled={!phone || loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-base disabled:opacity-50 transition-opacity"
            style={{ background: "var(--nexio-green)" }}
          >
            {loading ? "Wird gesendet…" : "Code senden"}
          </button>
          <p className="text-xs text-center text-gray-400">
            Mit der Anmeldung akzeptierst du unsere{" "}
            <a href="/agb" className="underline">AGB</a> und{" "}
            <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <button
              onClick={() => setStep("phone")}
              className="text-sm text-gray-500 flex items-center gap-1 mb-4"
            >
              ← Zurück
            </button>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              6-stelliger Code für {formatPhone(phone)}
            </label>
            <input
              type="number"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              placeholder="123456"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl text-center tracking-widest focus:ring-2 focus:border-transparent"
              autoFocus
              maxLength={6}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={verifyOtp}
            disabled={otp.length < 6 || loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-base disabled:opacity-50"
            style={{ background: "var(--nexio-green)" }}
          >
            {loading ? "Überprüfe…" : "Bestätigen"}
          </button>
          <button
            onClick={sendOtp}
            className="w-full text-sm text-center"
            style={{ color: "var(--nexio-green)" }}
          >
            Code erneut senden
          </button>
        </div>
      )}
    </div>
  );
}
