"use client";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { MessageWithSender } from "@/types/database";

interface MessageSearchProps {
  conversationId: string;
  onClose: () => void;
  onJump: (messageId: string) => void;
}

export default function MessageSearch({ conversationId, onClose, onJump }: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*, sender:users!sender_id(id, display_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .eq("type", "text")
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    setResults((data ?? []) as MessageWithSender[]);
    setLoading(false);
  }, [conversationId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    // Debounce
    clearTimeout((handleChange as any)._t);
    (handleChange as any)._t = setTimeout(() => search(val), 300);
  }

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* Search Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <button onClick={onClose} style={{ color: "var(--foreground-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <input
          autoFocus
          value={query}
          onChange={handleChange}
          placeholder="In Nachrichten suchen…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: "var(--foreground)" }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} style={{ color: "var(--foreground-3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--nexio-green)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!loading && results.length === 0 && query.length >= 2 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2"
            style={{ color: "var(--foreground-3)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm">Keine Ergebnisse für „{query}"</p>
          </div>
        )}

        {results.map((msg) => (
          <button
            key={msg.id}
            onClick={() => { onJump(msg.id); onClose(); }}
            className="w-full px-4 py-3 border-b text-left hover:opacity-80"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: "var(--nexio-green)" }}>
                {msg.sender?.display_name}
              </span>
              <span className="text-xs" style={{ color: "var(--foreground-3)" }}>
                {format(new Date(msg.created_at), "d. MMM, HH:mm", { locale: de })}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
              {highlight(msg.content ?? "", query)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#07c16033", color: "inherit", borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
