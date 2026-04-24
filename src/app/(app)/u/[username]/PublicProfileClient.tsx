"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function PublicProfileClient({
  profile,
  currentUserId,
  isContact: initialIsContact,
}: {
  profile: Profile;
  currentUserId: string | null;
  isContact: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isContact, setIsContact] = useState(initialIsContact);
  const [loading, setLoading] = useState(false);

  const isSelf = currentUserId === profile.id;
  const initials = profile.display_name.slice(0, 2).toUpperCase();
  const joinYear = new Date(profile.created_at).getFullYear();

  async function addContact() {
    if (!currentUserId || loading) return;
    setLoading(true);
    try {
      await supabase.from("contacts").insert([
        { user_id: currentUserId, contact_id: profile.id },
        { user_id: profile.id, contact_id: currentUserId },
      ]);
      setIsContact(true);
    } catch (_) {}
    setLoading(false);
  }

  async function startChat() {
    if (!currentUserId) { router.push("/login"); return; }
    setLoading(true);
    // Find or create direct conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id, conversation_members!inner(user_id)")
      .eq("type", "direct")
      .eq("conversation_members.user_id", currentUserId);

    let conversationId: string | null = null;

    if (existing) {
      for (const conv of existing) {
        const { data: peer } = await supabase
          .from("conversation_members")
          .select("id")
          .eq("conversation_id", conv.id)
          .eq("user_id", profile.id)
          .single();
        if (peer) { conversationId = conv.id; break; }
      }
    }

    if (!conversationId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ type: "direct" })
        .select("id")
        .single();
      if (newConv) {
        conversationId = newConv.id;
        await supabase.from("conversation_members").insert([
          { conversation_id: conversationId, user_id: currentUserId },
          { conversation_id: conversationId, user_id: profile.id },
        ]);
      }
    }

    setLoading(false);
    if (conversationId) router.push(`/chats/${conversationId}`);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold flex-1 truncate" style={{ color: "var(--foreground)" }}>
          @{profile.username}
        </h1>
      </header>

      {/* Profile Hero */}
      <div className="flex flex-col items-center py-10 px-4 gap-3"
        style={{ background: "var(--surface)" }}>
        <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-white flex-none"
          style={{ background: "var(--nexio-green)" }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{profile.display_name}</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--foreground-3)" }}>@{profile.username}</p>
        </div>
        {profile.bio && (
          <p className="text-sm text-center max-w-xs" style={{ color: "var(--foreground-2)" }}>{profile.bio}</p>
        )}
        <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
          Nexio-Mitglied seit {joinYear}
        </p>
      </div>

      {/* Actions */}
      {!isSelf && currentUserId && (
        <div className="px-4 py-5 flex gap-3">
          <button onClick={startChat} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "var(--nexio-green)", opacity: loading ? 0.6 : 1 }}>
            💬 Nachricht senden
          </button>
          {!isContact && (
            <button onClick={addContact} disabled={loading}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", opacity: loading ? 0.6 : 1 }}>
              ➕ Kontakt hinzufügen
            </button>
          )}
          {isContact && (
            <div className="flex-1 py-3 rounded-2xl text-sm font-semibold text-center"
              style={{ background: "rgba(7,193,96,0.1)", color: "var(--nexio-green)" }}>
              ✓ In Kontakten
            </div>
          )}
        </div>
      )}

      {isSelf && (
        <div className="px-4 py-5">
          <button onClick={() => router.push("/profile/edit")}
            className="w-full py-3 rounded-2xl text-sm font-semibold border"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            ✏️ Profil bearbeiten
          </button>
        </div>
      )}

      {!currentUserId && (
        <div className="px-4 py-5">
          <button onClick={() => router.push("/login")}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "var(--nexio-green)" }}>
            Anmelden um zu schreiben
          </button>
        </div>
      )}

      {/* Nexio ID */}
      <div className="mx-4 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: "var(--surface)" }}>
        <span className="text-xl">🆔</span>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: "var(--foreground-3)" }}>Nexio-ID</p>
          <p className="text-sm font-mono" style={{ color: "var(--foreground)" }}>nexio://add/{profile.username}</p>
        </div>
      </div>
    </div>
  );
}
