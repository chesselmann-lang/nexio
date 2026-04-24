"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";

function UserRow({ user, selected, onToggle }: { user: User; selected: boolean; onToggle: () => void }) {
  const initials = user.display_name.slice(0, 2).toUpperCase();
  const colors = ["#07c160", "#1677ff", "#ff6b35", "#8b5cf6", "#ef4444"];
  const color = colors[user.display_name.charCodeAt(0) % colors.length];
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b"
      style={{ background: selected ? "var(--nexio-green-light)" : "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="relative flex-none">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ background: color }}>
          {user.avatar_url ? <img src={user.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" /> : initials}
        </div>
        {user.status === "online" && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: "var(--nexio-green)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>{user.display_name}</p>
        <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>@{user.username}</p>
      </div>
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none"
        style={{ borderColor: selected ? "var(--nexio-green)" : "var(--border)", background: selected ? "var(--nexio-green)" : "transparent" }}>
        {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>}
      </div>
    </button>
  );
}

export default function NewChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [tab, setTab] = useState<"contact" | "group">("contact");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? ""));
  }, []);

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .neq("id", currentUserId)
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .limit(20);
      setResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, currentUserId]);

  function toggleUser(user: User) {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  }

  async function startConversation() {
    if (!selected.length || loading) return;
    setLoading(true);

    if (tab === "contact" && selected.length === 1) {
      // Direct conversation
      const target = selected[0];
      // Check if direct conv already exists
      const { data: existing } = await supabase
        .from("conversation_members")
        .select("conversation_id, conversations!inner(type)")
        .eq("user_id", currentUserId)
        .eq("conversations.type", "direct");

      // Find conv where target is also a member
      if (existing?.length) {
        const convIds = existing.map((e) => e.conversation_id);
        const { data: targetMember } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", target.id)
          .in("conversation_id", convIds)
          .single();
        if (targetMember) {
          router.push(`/chats/${targetMember.conversation_id}`);
          return;
        }
      }

      // Create new direct conversation
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ type: "direct", created_by: currentUserId })
        .select()
        .single();

      if (conv) {
        await supabase.from("conversation_members").insert([
          { conversation_id: conv.id, user_id: currentUserId, role: "owner" },
          { conversation_id: conv.id, user_id: target.id, role: "member" },
        ]);
        router.push(`/chats/${conv.id}`);
      }
    } else {
      // Group conversation
      const name = groupName.trim() || selected.map((u) => u.display_name).join(", ");
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ type: "group", name, created_by: currentUserId })
        .select()
        .single();

      if (conv) {
        const members = [
          { conversation_id: conv.id, user_id: currentUserId, role: "owner" as const },
          ...selected.map((u) => ({ conversation_id: conv.id, user_id: u.id, role: "member" as const })),
        ];
        await supabase.from("conversation_members").insert(members);
        // System message
        await supabase.from("messages").insert({
          conversation_id: conv.id,
          sender_id: currentUserId,
          type: "system",
          content: `Gruppe "${name}" wurde erstellt`,
        });
        router.push(`/chats/${conv.id}`);
      }
    }
    setLoading(false);
  }

  const isGroup = tab === "group" || selected.length > 1;

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
        <h1 className="flex-1 text-base font-semibold" style={{ color: "var(--foreground)" }}>
          {isGroup ? "Neue Gruppe" : "Neuer Chat"}
        </h1>
        {selected.length > 0 && (
          <button
            onClick={startConversation}
            disabled={loading || (isGroup && !groupName && selected.length < 2)}
            className="text-sm font-semibold disabled:opacity-40"
            style={{ color: "var(--nexio-green)" }}
          >
            {loading ? "…" : "Weiter"}
          </button>
        )}
      </div>

      {/* Tab: Kontakt / Gruppe */}
      <div className="flex border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {(["contact", "group"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? "var(--nexio-green)" : "var(--foreground-3)",
              borderBottom: tab === t ? "2px solid var(--nexio-green)" : "2px solid transparent",
            }}>
            {t === "contact" ? "Kontakt" : "Gruppe"}
          </button>
        ))}
      </div>

      {/* Group name (when in group mode or multiple selected) */}
      {(tab === "group" || selected.length > 1) && (
        <div className="px-4 py-3 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Gruppenname (optional)"
            className="w-full text-sm bg-transparent focus:outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ background: "var(--surface)" }}>
          {selected.map((u) => (
            <button key={u.id} onClick={() => toggleUser(u)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium flex-none text-white"
              style={{ background: "var(--nexio-green)" }}>
              {u.display_name}
              <span className="opacity-70">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-2.5 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "var(--surface-2)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--foreground-3)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name oder @Benutzername suchen…"
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: "var(--foreground)" }}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--foreground-3)" }}>✕</button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {search.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
              Gib mindestens 2 Zeichen ein um Nutzer zu finden
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
              Keine Nutzer für „{search}" gefunden
            </p>
          </div>
        ) : (
          results.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              selected={!!selected.find((u) => u.id === user.id)}
              onToggle={() => toggleUser(user)}
            />
          ))
        )}
      </div>
    </div>
  );
}
