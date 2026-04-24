"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Nachrichten", "Unterhaltung", "Sport", "Technologie", "Musik",
  "Gaming", "Bildung", "Lifestyle", "Politik", "Sonstiges",
];

export default function NewChannelPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sonstiges");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) { setError("Name ist erforderlich"); return; }
    if (name.trim().length < 3) { setError("Name min. 3 Zeichen"); return; }

    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Check name uniqueness
    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .ilike("name", name.trim())
      .single();
    if (existing) { setError("Kanalname bereits vergeben"); setSaving(false); return; }

    const { data: channel, error: createErr } = await supabase
      .from("channels")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        category,
        owner_id: user.id,
        is_active: true,
        is_public: isPublic,
        subscriber_count: 1,
      })
      .select("id")
      .single();

    if (createErr || !channel) {
      setError(createErr?.message ?? "Fehler beim Erstellen");
      setSaving(false);
      return;
    }

    // Auto-subscribe owner
    await supabase.from("channel_members").insert({
      channel_id: channel.id,
      user_id: user.id,
      role: "owner",
    });

    router.replace(`/channels/${channel.id}`);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "var(--foreground)" }}>Neuer Kanal</h1>
        <button onClick={create} disabled={saving || !name.trim()}
          className="text-sm font-semibold px-4 py-1.5 rounded-full text-white"
          style={{ background: saving || !name.trim() ? "#9ca3af" : "var(--nexio-green)" }}>
          {saving ? "Erstelle…" : "Erstellen"}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Channel name */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
          <div className="px-4 py-3">
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>
              Kanalname *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mein Kanal"
              maxLength={60}
              className="w-full text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--foreground)" }}
            />
          </div>
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-3)" }}>
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in deinem Kanal?"
              maxLength={200}
              rows={3}
              className="w-full text-sm bg-transparent focus:outline-none resize-none"
              style={{ color: "var(--foreground)" }}
            />
            <p className="text-right text-xs mt-1" style={{ color: "var(--foreground-3)" }}>
              {description.length}/200
            </p>
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--foreground-3)" }}>Kategorie</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: category === cat ? "var(--nexio-green)" : "var(--surface)",
                  color: category === cat ? "#fff" : "var(--foreground-2)",
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Öffentlicher Kanal</p>
              <p className="text-xs" style={{ color: "var(--foreground-3)" }}>Für alle Nutzer sichtbar und durchsuchbar</p>
            </div>
            <button onClick={() => setIsPublic(!isPublic)}
              className="w-12 h-6 rounded-full transition-colors flex-none relative"
              style={{ background: isPublic ? "var(--nexio-green)" : "var(--border)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: isPublic ? "translateX(26px)" : "translateX(2px)" }} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-center py-2.5 px-4 rounded-xl"
            style={{ background: "#ef444415", color: "#ef4444" }}>
            {error}
          </p>
        )}

        {/* Info */}
        <p className="text-xs text-center px-4" style={{ color: "var(--foreground-3)" }}>
          Du wirst automatisch Administrator deines Kanals.
        </p>
      </div>
    </div>
  );
}
