"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);

  async function checkUsername(value: string) {
    setUsername(value);
    if (value.length < 3) { setUsernameAvailable(null); return; }
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("username", value)
      .single();
    setUsernameAvailable(!data);
  }

  async function save() {
    if (!gdprConsent) { setError("Bitte akzeptiere die Datenschutzerklärung."); return; }
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        username: username.toLowerCase().trim(),
        gdpr_consented_at: new Date().toISOString(),
      });

    if (error) setError(error.message);
    else router.replace("/chats");
    setLoading(false);
  }

  const isValid = displayName.length >= 2 && username.length >= 3 && usernameAvailable && gdprConsent;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold"
            style={{ background: "var(--nexio-green)" }}
          >
            N
          </div>
          <h1 className="text-2xl font-bold">Profil einrichten</h1>
          <p className="text-gray-500 text-sm mt-1">Wie sollen dich andere finden?</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dein vollständiger Name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "var(--nexio-green)" } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">@Benutzername</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                value={username}
                onChange={(e) => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                placeholder="deinname"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-10 py-3 text-base focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--nexio-green)" } as React.CSSProperties}
              />
              {usernameAvailable !== null && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameAvailable ? "✅" : "❌"}
                </span>
              )}
            </div>
            {usernameAvailable === false && (
              <p className="text-red-500 text-xs mt-1">Benutzername bereits vergeben</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded"
              style={{ accentColor: "var(--nexio-green)" }}
            />
            <span className="text-sm text-gray-600">
              Ich akzeptiere die{" "}
              <a href="/datenschutz" className="underline" style={{ color: "var(--nexio-green)" }}>
                Datenschutzerklärung
              </a>{" "}
              und willige in die Verarbeitung meiner Daten gemäß DSGVO ein.
            </span>
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={save}
            disabled={!isValid || loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-base disabled:opacity-50"
            style={{ background: "var(--nexio-green)" }}
          >
            {loading ? "Speichern…" : "Weiter zu Nexio"}
          </button>
        </div>
      </div>
    </div>
  );
}
