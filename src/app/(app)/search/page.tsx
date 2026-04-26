"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "people" | "channels" | "messages" | "saved";

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
  conversation_name: string | null;
}

interface SavedResult {
  id: string;
  message_id: string;
  saved_at: string;
  conversation_id: string;
  content: string | null;
  type: string;
  sender_name: string;
  conversation_name: string | null;
}

const RECENT_KEY = "nexio-recent-searches";
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(q: string) {
  const recent = getRecentSearches().filter((r) => r !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}

/** Highlight matching substring in bold */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(124,92,252,0.25)", color: "var(--nexio-indigo)", borderRadius: 3, padding: "0 2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const AVATAR_COLORS = ["#7c5cfc", "#07c160", "#1677ff", "#f59e0b", "#ef4444"];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

export default function SearchPage() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tab, setTab] = useState<Tab>("people");
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<UserResult[]>([]);
  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [msgs, setMsgs] = useState<MessageResult[]>([]);
  const [saved, setSaved] = useState<SavedResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setPeople([]); setChannels([]); setMsgs([]); setSaved([]);
      return;
    }
    doSearch(debouncedQuery);
  }, [debouncedQuery, tab]);

  async function doSearch(q: string) {
    setLoading(true);
    try {
      if (tab === "people") {
        const { data } = await supabase
          .from("users")
          .select("id, display_name, username, avatar_url, bio")
          .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
          .limit(25);
        setPeople((data ?? []) as UserResult[]);

      } else if (tab === "channels") {
        const { data } = await supabase
          .from("channels")
          .select("id, name, description, subscriber_count")
          .ilike("name", `%${q}%`)
          .limit(25);
        setChannels((data ?? []) as ChannelResult[]);

      } else if (tab === "messages") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setMsgs([]); return; }

        // Get conversation IDs the user is in
        const { data: memberships } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", user.id);
        const convIds = (memberships ?? []).map((m: any) => m.conversation_id);
        if (!convIds.length) { setMsgs([]); return; }

        const { data } = await supabase
          .from("messages")
          .select(`
            id, content, created_at, conversation_id, type,
            sender:users!messages_sender_id_fkey(display_name),
            conversation:conversations(name, type)
          `)
          .in("conversation_id", convIds)
          .eq("type", "text")
          .eq("is_deleted", false)
          .ilike("content", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(30);

        setMsgs(
          (data ?? []).map((m: any) => ({
            id: m.id,
            content: m.content ?? "",
            created_at: m.created_at,
            conversation_id: m.conversation_id,
            sender_name: m.sender?.display_name ?? "?",
            conversation_name: m.conversation?.name ?? (m.conversation?.type === "direct" ? "Direktnachricht" : "Gruppe"),
          }))
        );

      } else if (tab === "saved") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaved([]); return; }

        const { data } = await supabase
          .from("saved_messages")
          .select(`
            id, saved_at, conversation_id,
            message:messages(id, content, type, created_at, sender:users!messages_sender_id_fkey(display_name)),
            conversation:conversations(name, type)
          `)
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false });

        const filtered = (data ?? []).filter((row: any) =>
          row.message?.content?.toLowerCase().includes(q.toLowerCase())
        );

        setSaved(
          filtered.map((row: any) => ({
            id: row.id,
            message_id: row.message?.id ?? "",
            saved_at: row.saved_at,
            conversation_id: row.conversation_id,
            content: row.message?.content ?? null,
            type: row.message?.type ?? "text",
            sender_name: row.message?.sender?.display_name ?? "?",
            conversation_name: row.conversation?.name ?? "Chat",
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitSearch() {
    if (query.trim()) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
  }

  function applyRecent(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "people", label: "Personen", emoji: "👤" },
    { key: "channels", label: "Kanäle", emoji: "📢" },
    { key: "messages", label: "Nachrichten", emoji: "💬" },
    { key: "saved", label: "Gespeichert", emoji: "🔖" },
  ];

  const showEmpty = !loading && debouncedQuery;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Search header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "var(--background)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--nexio-indigo)",
              padding: "6px",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
          </button>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface-2)",
              borderRadius: 22,
              padding: "8px 14px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              style={{ color: "var(--foreground-3)", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitSearch()}
              placeholder="Suchen…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 15,
                color: "var(--foreground)",
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                style={{
                  background: "var(--foreground-3)",
                  border: "none",
                  borderRadius: 10,
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--background)",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--border)",
            overflowX: "auto",
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  minWidth: 80,
                  padding: "10px 6px",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--nexio-indigo)" : "2px solid transparent",
                  color: active ? "var(--nexio-indigo)" : "var(--foreground-3)",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  transition: "color 0.15s",
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Loading spinner */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                border: "2.5px solid var(--nexio-indigo)",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {/* Empty query — recent searches */}
        {!loading && !debouncedQuery && (
          <div style={{ padding: "12px 16px" }}>
            {recentSearches.length > 0 ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p className="text-xs font-semibold uppercase" style={{ color: "var(--foreground-3)", letterSpacing: "0.8px" }}>
                    Zuletzt gesucht
                  </p>
                  <button
                    onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                    style={{ fontSize: 12, color: "var(--nexio-indigo)", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    Löschen
                  </button>
                </div>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => applyRecent(term)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ color: "var(--foreground-3)", fontSize: 16 }}>🕐</span>
                    <span className="text-sm" style={{ color: "var(--foreground-2)" }}>{term}</span>
                  </button>
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p className="text-sm" style={{ color: "var(--foreground-3)" }}>
                  Suche nach Personen, Kanälen oder Nachrichten
                </p>
              </div>
            )}
          </div>
        )}

        {/* People results */}
        {!loading && debouncedQuery && tab === "people" && (
          <>
            {people.length === 0 ? (
              <EmptyResults query={debouncedQuery} label="Personen" />
            ) : (
              people.map((u) => (
                <button
                  key={u.id}
                  onClick={() => router.push(`/u/${u.username}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      overflow: "hidden",
                      background: avatarColor(u.display_name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} />
                    ) : (
                      u.display_name?.slice(0, 1) ?? "?"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      <Highlight text={u.display_name} query={debouncedQuery} />
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground-3)", marginTop: 2 }}>
                      @<Highlight text={u.username} query={debouncedQuery} />
                      {u.bio && ` · ${u.bio.slice(0, 40)}`}
                    </p>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {/* Channel results */}
        {!loading && debouncedQuery && tab === "channels" && (
          <>
            {channels.length === 0 ? (
              <EmptyResults query={debouncedQuery} label="Kanäle" />
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => router.push(`/channels/${ch.id}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: "rgba(124,92,252,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    📢
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      <Highlight text={ch.name} query={debouncedQuery} />
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground-3)", marginTop: 2 }}>
                      {(ch.subscriber_count ?? 0).toLocaleString("de-DE")} Abonnenten
                      {ch.description ? ` · ${ch.description.slice(0, 50)}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {/* Message results */}
        {!loading && debouncedQuery && tab === "messages" && (
          <>
            {msgs.length === 0 ? (
              <EmptyResults query={debouncedQuery} label="Nachrichten" />
            ) : (
              msgs.map((m) => (
                <button
                  key={m.id}
                  onClick={() => router.push(`/chats/${m.conversation_id}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: "rgba(124,92,252,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    💬
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground-2)" }}>
                        {m.sender_name}
                        {m.conversation_name && (
                          <span style={{ color: "var(--foreground-3)", fontWeight: 400 }}> · {m.conversation_name}</span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
                        {new Date(m.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                      </p>
                    </div>
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--foreground)",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      <Highlight text={m.content} query={debouncedQuery} />
                    </p>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {/* Saved results */}
        {!loading && debouncedQuery && tab === "saved" && (
          <>
            {saved.length === 0 ? (
              <EmptyResults query={debouncedQuery} label="gespeicherten Nachrichten" />
            ) : (
              saved.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/chats/${s.conversation_id}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: "rgba(124,92,252,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    🔖
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground-2)" }}>
                        {s.sender_name}
                        {s.conversation_name && (
                          <span style={{ color: "var(--foreground-3)", fontWeight: 400 }}> · {s.conversation_name}</span>
                        )}
                      </p>
                    </div>
                    {s.content && (
                      <p
                        className="text-sm"
                        style={{
                          color: "var(--foreground)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        <Highlight text={s.content} query={debouncedQuery} />
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>

      {/* Spinning keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyResults({ query, label }: { query: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 10 }}>
      <span style={{ fontSize: 40 }}>🔍</span>
      <p className="text-sm" style={{ color: "var(--foreground-3)", textAlign: "center", padding: "0 32px" }}>
        Keine {label} für „{query}" gefunden
      </p>
    </div>
  );
}
