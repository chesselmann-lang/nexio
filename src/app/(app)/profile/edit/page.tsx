"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, username, bio, avatar_url")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setUsername(profile.username ?? "");
        setBio((profile as any).bio ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
      }
    });
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;
      const { data, error } = await supabase.storage
        .from("nexio-media")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("nexio-media").getPublicUrl(data.path);
      setAvatarUrl(urlData.publicUrl);
    } catch (err: any) {
      setMsg({ text: "Avatar-Upload fehlgeschlagen: " + err.message, ok: false });
    }
    setUploading(false);
  }

  async function save() {
    if (!userId) return;
    if (!displayName.trim()) { setMsg({ text: "Name darf nicht leer sein", ok: false }); return; }
    if (username.length < 3) { setMsg({ text: "Username muss min. 3 Zeichen haben", ok: false }); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setMsg({ text: "Username: nur a-z, 0-9, _ erlaubt", ok: false }); return; }

    setSaving(true);
    setMsg(null);

    // Check username uniqueness
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .single();
    if (existing) { setMsg({ text: "Username bereits vergeben", ok: false }); setSaving(false); return; }

    const { error } = await supabase
      .from("users")
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", userId);

    if (error) {
      setMsg({ text: "Fehler: " + error.message, ok: false });
    } else {
      setMsg({ text: "✅ Profil gespeichert!", ok: true });
      setTimeout(() => router.back(), 1200);
    }
    setSaving(false);
  }

  const avatarDisplay = avatarPreview ?? avatarUrl;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>Profil bearbeiten</h1>
        <button onClick={save} disabled={saving || uploading}
          className="text-sm font-semibold px-4 py-1.5 rounded-full text-white"
          style={{ background: (saving || uploading) ? "#9ca3af" : "var(--nexio-green)" }}>
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <button onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden group">
            {avatarDisplay ? (
              <img src={avatarDisplay} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                style={{ background: "var(--nexio-green)" }}>
                {displayName ? displayName[0].toUpperCase() : "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">Ändern</span>
            </div>
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="text-sm font-semibold" style={{ color: "var(--nexio-green)" }}>
            {uploading ? "Lädt hoch…" : "📷 Foto ändern"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {[
              { label: "Name", value: displayName, set: setDisplayName, placeholder: "Dein Anzeigename", maxLen: 50 },
              { label: "Username", value: username, set: setUsername, placeholder: "benutzername (ohne @)", maxLen: 30 },
            ].map((field, i) => (
              <div key={field.label} className="px-4 py-3"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>
                  {field.label}
                </label>
                <input
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLen}
                  className="w-full text-sm bg-transparent focus:outline-none"
                  style={{ color: "var(--foreground)" }}
                />
              </div>
            ))}
          </div>

          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--surface)" }}>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Kurze Beschreibung über dich…"
              maxLength={160}
              rows={3}
              className="w-full text-sm bg-transparent focus:outline-none resize-none"
              style={{ color: "var(--foreground)" }}
            />
            <p className="text-right text-xs mt-1" style={{ color: "var(--foreground-3)" }}>{bio.length}/160</p>
          </div>
        </div>

        {msg && (
          <p className="text-xs text-center py-2.5 px-4 rounded-xl"
            style={{ background: msg.ok ? "#07c16015" : "#ef444415", color: msg.ok ? "#07c160" : "#ef4444" }}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
