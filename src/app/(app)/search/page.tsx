"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "people" | "channels" | "messages";

interface UserResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface ChannelResult {
  id: string;
  name: string;
  description: string | null;
  subscriber_count: number;
}

interface MessageResult {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  sender_name: string;
}

export default function SearchPage() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("people");
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<UserResult[]>([]);
  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [msgs, setMsgs] = useState<MessageResult[]>([]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) {
      setPeople([]); setChannels([]); setMsgs([]);
      return;
    }
    const timer = setTimeout(() => doSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, tab]);

  async function doSearch(q: string) {
    setLoading(true);
    try {
      if (tab === "people") {
        const { data } = await supabase
          .from("users")
          .select("id, display_name, username, avatar_url, bio")
          .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
          .limit(20);
        setPeople((data as UserResult[]) ?? []);
      } else if (tab === "channels") {
        const { data } = await supabase
          .from("channels")
          .select("id, name, description, subscriber_count")
          .ilike("name", `%${q}%`)
          .limit(20);
        setChannels((data as ChannelResult[]) ?? []);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setMsgs([]); return; }
        // Search own messages
        const { data } = await supabase
          .from("messages")
          .select("id, content, created_at, conversation_id, sender:users(display_name)")
          .eq("sender_id", user.id)
          .eq("type", "text")
          .ilike("content", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(20);
        setMsgs(
          (data ?? []).map((m: any) => ({
            id: m.id,
            content: m.content,
            created_at: m.created_at,
            conversation_id: m.conversation_id,
            sender_name: m.sender?.display_name ?? "Ich",
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "people", label: "Personen" },
    { key: "channels", label: "Kanäle" },
    { key: "messages", label: "Nachrichten" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Search bar header */}
      <header className="sticky top-0 z-10 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={() => router.back()} className="p-1" style={{ color: "var(--foreground-3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "var(--background)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen…"
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: "var(--foreground)" }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ color: "var(--foreground-3)" }}>✕</button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t" style={{ borderColor: "var(--border)" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: tab === t.key ? "var(--nexio-green)" : "var(--foreground-3)",
                borderBottom: tab === t.key ? "2px solid var(--nexio-green)" : "2px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Results */}
      <div className="flex-1">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--nexio-green)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-sm" style={{ color: "var(--foreground-3)" }}>Tippe um zu suchen</p>
          </div>
        )}

        {/* People */}
        {!loading && tab === "people" && people.map((u) => (
          <button key={u.id} onClick={() => router.push(`/u/${u.username}`)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-none"
              style={{ background: "var(--nexio-green)" }}>
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                : u.display_name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{u.display_name}</p>
              <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>@{u.username}</p>
            </div>
          </button>
        ))}

        {!loading && tab === "people" && query && people.length === 0 && (
          <EmptyState label={`Keine Personen für „${query}"`} />
        )}

        {/* Channels */}
        {!loading && tab === "channels" && channels.map((ch) => (
          <button key={ch.id} onClick={() => router.push(`/channels/${ch.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-none"
              style={{ background: "var(--background)" }}>📢</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{ch.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--foreground-3)" }}>
                {ch.subscriber_count ?? 0} Abonnenten
                {ch.description ? ` · ${ch.description}` : ""}
              </p>
            </div>
          </button>
        ))}

        {!loading && tab === "channels" && query && channels.length === 0 && (
          <EmptyState label={`Keine Kanäle für „${query}"`} />
        )}

        {/* Messages */}
        {!loading && tab === "messages" && msgs.map((m) => (
          <button key={m.id} onClick={() => router.push(`/chats/${m.conversation_id}`)}
            className="w-full flex items-start gap-3 px-4 py-3 border-b text-left"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-xl mt-0.5 flex-none">💬</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{m.content}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>
                {new Date(m.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
          </button>
        ))}

        {!loading && tab === "messages" && query && msgs.length === 0 && (
          <EmptyState label={`Keine Nachrichten für „${query}"`} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-16 gap-2">
      <span className="text-3xl">🔍</span>
      <p className="text-sm" style={{ color: "var(--foreground-3)" }}>{label}</p>
    </div>
  );
}
