"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "welcome" | "profile" | "avatar" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { data, error } = await supabase.storage.from("nexio-media").upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("nexio-media").getPublicUrl(data.path);
      setAvatarUrl(urlData.publicUrl);
    }
    setUploading(false);
  }

  function suggestUsername(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 30);
  }

  async function finish() {
    setError(null);
    if (!displayName.trim()) { setError("Name ist erforderlich"); return; }
    if (username.length < 3) { setError("Username min. 3 Zeichen"); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setError("Username: nur a-z, 0-9, _ erlaubt"); return; }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Check uniqueness
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single();
    if (existing) { setError("Username bereits vergeben — wähle einen anderen"); setSaving(false); return; }

    const { error: updateErr } = await supabase
      .from("users")
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", user.id);

    if (updateErr) { setError(updateErr.message); setSaving(false); return; }

    setStep("done");
    setTimeout(() => router.replace("/chats"), 2000);
  }

  const steps = ["welcome", "profile", "avatar"] as const;
  const stepIndex = steps.indexOf(step as any);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / steps.length) * 100 : 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--background)" }}>

      {step !== "done" && (
        <div className="w-full max-w-sm mb-8">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--nexio-green)" }} />
          </div>
        </div>
      )}

      <div className="w-full max-w-sm">

        {/* Step 1: Welcome */}
        {step === "welcome" && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{ background: "var(--nexio-green)" }}>
              <span className="text-white font-black text-4xl">N</span>
            </div>
            <div>
              <h1 className="text-3xl font-black" style={{ color: "var(--foreground)" }}>Willkommen bei Nexio</h1>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
                Dein neuer Messenger für alles. Richte in 2 Minuten dein Profil ein.
              </p>
            </div>

            <div className="w-full space-y-3 text-left">
              {[
                { icon: "💬", text: "Chatte mit Freunden & Gruppen" },
                { icon: "🔒", text: "Ende-zu-Ende verschlüsselt" },
                { icon: "🧩", text: "Mini-Apps direkt im Chat" },
                { icon: "💸", text: "Zahlungen mit Nexio Pay" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "var(--surface)" }}>
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.text}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setStep("profile")}
              className="w-full py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: "var(--nexio-green)" }}>
              Los geht's →
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === "profile" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Dein Profil</h2>
              <p className="text-sm mt-1" style={{ color: "var(--foreground-3)" }}>Wie sollen Freunde dich finden?</p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
              <div className="px-4 py-3">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>
                  Anzeigename *
                </label>
                <input
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (!username) setUsername(suggestUsername(e.target.value));
                  }}
                  placeholder="Max Mustermann"
                  maxLength={50}
                  className="w-full text-base bg-transparent focus:outline-none"
                  style={{ color: "var(--foreground)" }}
                  autoFocus
                />
              </div>
              <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>
                  Username * (wird zur Nexio-ID)
                </label>
                <div className="flex items-center gap-1">
                  <span style={{ color: "var(--foreground-3)" }}>@</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="maxmustermann"
                    maxLength={30}
                    className="flex-1 text-base bg-transparent focus:outline-none"
                    style={{ color: "var(--foreground)" }}
                  />
                </div>
              </div>
              <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>
                  Bio (optional)
                </label>
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kurze Beschreibung…"
                  maxLength={160}
                  className="w-full text-base bg-transparent focus:outline-none"
                  style={{ color: "var(--foreground)" }}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-center py-2 px-3 rounded-xl"
                style={{ background: "#ef444415", color: "#ef4444" }}>{error}</p>
            )}

            <button
              onClick={() => {
                setError(null);
                if (!displayName.trim()) { setError("Name ist erforderlich"); return; }
                if (username.length < 3) { setError("Username min. 3 Zeichen"); return; }
                if (!/^[a-z0-9_]+$/.test(username)) { setError("Nur a-z, 0-9, _"); return; }
                setStep("avatar");
              }}
              className="w-full py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: "var(--nexio-green)" }}>
              Weiter →
            </button>
            <button onClick={() => setStep("welcome")}
              className="text-sm text-center" style={{ color: "var(--foreground-3)" }}>
              ← Zurück
            </button>
          </div>
        )}

        {/* Step 3: Avatar */}
        {step === "avatar" && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Profilbild</h2>
              <p className="text-sm mt-1" style={{ color: "var(--foreground-3)" }}>
                Optional — du kannst es jederzeit ändern.
              </p>
            </div>

            <button onClick={() => fileRef.current?.click()}
              className="relative w-28 h-28 rounded-full overflow-hidden group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                  style={{ background: "var(--nexio-green)" }}>
                  {displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">Ändern</span>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <div className="flex gap-3 w-full">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                {uploading ? "Lädt…" : "📷 Foto wählen"}
              </button>
            </div>

            {error && (
              <p className="text-xs text-center py-2 px-3 rounded-xl"
                style={{ background: "#ef444415", color: "#ef4444" }}>{error}</p>
            )}

            <button onClick={finish} disabled={saving || uploading}
              className="w-full py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: saving || uploading ? "#9ca3af" : "var(--nexio-green)" }}>
              {saving ? "Speichere…" : "Fertig & loslegen →"}
            </button>
            <button onClick={() => setStep("profile")}
              className="text-sm text-center" style={{ color: "var(--foreground-3)" }}>
              ← Zurück
            </button>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
              style={{ background: "rgba(7,193,96,0.15)" }}>
              ✅
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Alles bereit!</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--foreground-3)" }}>
                Willkommen bei Nexio, @{username}. Du wirst weitergeleitet…
              </p>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--nexio-green)", borderTopColor: "transparent" }} />
          </div>
        )}
      </div>
    </div>
  );
}
