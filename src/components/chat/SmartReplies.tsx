"use client";
import { useState, useEffect } from "react";

interface SmartRepliesProps {
  /** Last few messages for context */
  messages: { sender: string; content: string }[];
  onSelect: (reply: string) => void;
}

export default function SmartReplies({ messages, onSelect }: SmartRepliesProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last?.content) return;

    // Only fetch if last message was from someone else
    setLoading(true);
    setSuggestions([]);

    fetch("/api/ai/smart-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, lang: "de" }),
    })
      .then((r) => r.json())
      .then(({ suggestions }) => setSuggestions(suggestions ?? []))
      .catch(() => setSuggestions(["👍", "Danke!", "Ok!"]))
      .finally(() => setLoading(false));
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex gap-2 px-3 py-1 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-none h-7 w-20 rounded-full animate-pulse"
            style={{ background: "var(--surface-2)" }}
          />
        ))}
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="flex gap-2 px-3 py-1 overflow-x-auto">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="flex-none px-3 py-1.5 rounded-full text-xs font-medium border transition-colors active:opacity-70"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--foreground-2)",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
